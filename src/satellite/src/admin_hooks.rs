use serde::{Deserialize, Serialize};
use crate::lib::admin_utils::AdminUser;

use junobuild_macros::{assert_set_doc, assert_delete_doc};
use junobuild_satellite::{AssertSetDocContext, AssertDeleteDocContext, OnSetDocContext, Result};
use junobuild_utils::decode_doc_data;
use ic_cdk::api::time;

const ADMIN_COLLECTION: &str = "admins";
const AUDIT_COLLECTION: &str = "admin_audit";

#[derive(Serialize, Deserialize)]
pub enum AdminRole {
    Viewer,
    Editor,
    Manager,
    SuperAdmin,
}

const ROLE_PERMISSIONS: [(AdminRole, &[&str]); 4] = [
    (AdminRole::Viewer, &["content"]),
    (AdminRole::Editor, &["content", "users"]),
    (AdminRole::Manager, &["content", "users", "settings"]),
    (AdminRole::SuperAdmin, &["content", "users", "settings", "super"]),
];

const VALID_ACTIONS: &[&str] = &[
    "create_admin", "update_admin", "delete_admin",
    "permission_change", "role_change",
    "activate_admin", "deactivate_admin"  // Add these
];

#[derive(Serialize, Deserialize)]
struct Approval {
    target_admin: String,
    approved_by: String,
    timestamp: u64,
}

#[derive(Serialize, Deserialize)]
pub struct AdminUser {
    pub email: String,
    pub role: AdminRole,
    pub permissions: Vec<String>,
    pub created_by: String,
    pub active: bool,
}

fn validate_role_permissions(admin: &AdminUser) -> Result<(), String> {
    let allowed_perms = ROLE_PERMISSIONS
        .iter()
        .find(|(role, _)| role == &admin.role)
        .map(|(_, perms)| perms)
        .ok_or_else(|| format!("Invalid role: {:?}", admin.role))?;
    
    for perm in &admin.permissions {
        if !allowed_perms.contains(&perm.as_str()) {
            return Err(format!(
                "Permission {} not allowed for role {:?}", 
                perm, admin.role
            ));
        }
    }
    
    // Special case: super admin must have all permissions
    if admin.role == AdminRole::SuperAdmin {
        let all_perms = ROLE_PERMISSIONS.values().flatten().collect::<Vec<_>>();
        if admin.permissions.len() != all_perms.len() {
            return Err("Super admin must have all permissions".into());
        }
    }
    
    Ok(())
}

async fn notify_critical_action(audit_data: &AuditData) -> Result<()> {
    // Implement notification logic
    Ok(())
}

async fn log_critical_alert(message: &str) -> Result<()> {
    // In production, this would connect to Slack/PagerDuty/etc
    ic_cdk::print(message);
    Ok(())
}

#[on_set_doc(collections = ["admins"])]
async fn handle_admin_changes(context: OnSetDocContext) -> Result<()> {
    let admin_data: AdminUser = decode_doc_data(&context.data.data.after.data)?;
    
    // Validate role-permission consistency
    validate_role_permissions(&admin_data)?;
    
    // Prevent privilege escalation
    if admin_data.role == AdminRole::SuperAdmin && context.caller != admin_data.created_by {
        return Err("Only creator can assign super_admin role".into());
    }
    
    Ok(())
}

#[on_set_doc(collections = ["admin_audit"])]
async fn process_audit_logs(context: OnSetDocContext) -> Result<()> {
    let audit: AuditData = decode_doc_data(&context.data.data.after.data)
        .map_err(|e| format!("Failed to decode audit: {}", e))?;

    // 1. Validate action type
    const VALID_ACTIONS: &[&str] = &[
        "create_admin", "update_admin", "delete_admin",
        "permission_change", "role_change"
    ];
    
    if !VALID_ACTIONS.contains(&audit.action.as_str()) {
        return Err(format!("Invalid audit action: {}", audit.action));
    }

    // 2. Critical action alerts
    if ["role_change", "permission_change"].contains(&audit.action.as_str()) {
        let alert = format!(
            "CRITICAL: {} performed by {} on {}",
            audit.action, audit.performed_by, audit.target_user_id
        );
        log_critical_alert(&alert).await?;
    }

    // 3. Rate limit checks
    let recent_actions = count_recent_audits(&audit.performed_by, 60).await?;
    if recent_actions > 30 {
        return Err("Too many audit actions - possible abuse".into());
    }

    Ok(())
}

async fn count_recent_audits(admin_id: &str, minutes: u64) -> Result<usize> {
    let now = time() / 1_000_000;
    let cutoff = now - (minutes * 60);
    
    let params = ListParams {
        matcher: Some(ListMatcher {
            description: Some(format!("performed_by={};timestamp>={}", admin_id, cutoff)),
            ..Default::default()
        }),
        ..Default::default()
    };
    
    let audits = list_docs(AUDIT_COLLECTION, params).await?;
    Ok(audits.items.len())
}

#[on_set_doc]
async fn satellite_on_set_doc(context: OnSetDocContext) -> Result<()> {
    handle_admin_changes(context.clone()).await?;
    handle_admin_activation(context.clone()).await?;
    process_audit_logs(context).await?;
    Ok(())
}

async fn is_super_admin(user_id: &str) -> Result<bool> {
    let admin_doc = get_doc_store("admins", user_id).await?;
    let admin: AdminUser = decode_doc_data(&admin_doc.data)?;
    
    Ok(admin.permissions.contains(&"super".to_string()))
}

async fn can_modify_admin(
    caller_id: &str, 
    target_id: &str
) -> Result<bool> {
    if caller_id == target_id {
        return Ok(true);
    }
    
    let caller_is_super = is_super_admin(caller_id).await?;
    let target_is_super = is_super_admin(target_id).await?;
    
    // Only super admins can modify other super admins
    Ok(caller_is_super && (!target_is_super || caller_id == target_id))
}

#[assert_set_doc(collections = ["admins"])]
async fn assert_admin_operations(context: AssertSetDocContext) -> Result<(), String> {
    // Decode with proper error context
    let admin: AdminUser = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid admin data: {}", e))?;

    // 1. Validate email format
    if !is_valid_email(&admin.email) {
        return Err("Invalid admin email format".into());
    }

    // 2. Check email uniqueness
    let email_pattern = format!("email={};", admin.email.to_lowercase());
    let existing = list_docs(
        ADMIN_COLLECTION,
        ListParams {
            matcher: Some(ListMatcher {
                description: Some(email_pattern),
                ..Default::default()
            }),
            ..Default::default()
        },
    );

    let is_update = context.data.data.before.is_some();
    for (doc_key, _) in existing.items {
        if !is_update || doc_key != context.data.key {
            return Err(format!("Email {} already exists", admin.email));
        }
    }

    // 3. Validate role-permission consistency
    validate_role_permissions(&admin)?;

    // 4. Time-based restrictions (business hours)
    let now_utc = (time() / 1_000_000) % 86400;
    if !(32400..=61200).contains(&now_utc) {
        return Err("Admin changes only allowed 9AM-5PM UTC".into());
    }

        // 5. Validate role counts stay between 2-3
    match admin.role {
        AdminRole::SuperAdmin | AdminRole::Manager | AdminRole::Editor => {
            let current_count = count_role_admins(admin.role).await?;
            let is_new_role = context.data.data.before.is_none() || 
                decode_doc_data::<AdminUser>(&context.data.data.before.as_ref().unwrap().data)?
                    .role != admin.role;
                    
            if is_new_role && current_count >= 3 {
                return Err(format!(
                    "Maximum of 3 {}s allowed",
                    match admin.role {
                        AdminRole::SuperAdmin => "super admins",
                        AdminRole::Manager => "managers",
                        AdminRole::Editor => "editors",
                        _ => unreachable!()
                    }
                ).into());
            }
        },
        _ => {}
    }

    Ok(())
}

async fn validate_time_restrictions() -> Result<()> {
    let now_utc = (time() / 1_000_000) % 86400; // Seconds since midnight UTC
    
    // Only allow changes between 9AM-5PM UTC
    if !(32400..=61200).contains(&now_utc) { // 9AM = 32400 sec, 5PM = 61200 sec
        return Err("Admin changes only allowed between 9AM-5PM UTC".into());
    }
    
    Ok(())
}

async fn validate_device(context: &AssertSetDocContext) -> Result<()> {
    let user_agent = context
        .headers
        .get("user-agent")
        .ok_or("Missing user-agent header")?;
    
    if user_agent.contains("Mobile") {
        return Err("Admin changes not allowed from mobile devices".into());
    }
    
    Ok(())
}

async fn validate_action(
    context: &AssertSetDocContext,
    admin: &AdminUser
) -> Result<()> {
    match context.data.data.proposed.data.get("role") {
        Some(new_role) if new_role != admin.role => {
            // Role changes require additional approval
            if !admin.permissions.contains("role_approval") {
                return Err("Missing permission for role changes".into());
            }
        },
        _ => {}
    }
    
    Ok(())
}

async fn count_super_admins() -> Result<u32> {
    let admins = list_docs_store("admins", None, None).await?;
    let mut count = 0;
    
    for doc in admins.items {
        let admin: AdminUser = decode_doc_data(&doc.data)?;
        if admin.permissions.contains(&"super".to_string()) {
            count += 1;
        }
    }
    
    Ok(count)
}

async fn get_admin_device_history(user_id: &str) -> Result<Vec<String>> {
    let audits = list_docs_store("admin_audit", None, None).await?;
    let mut devices = Vec::new();
    
    for doc in audits.items {
        let audit: AuditData = decode_doc_data(&doc.data)?;
        if audit.performed_by == user_id {
            if let Some(ua) = audit.user_agent {
                devices.push(ua);
            }
        }
    }
    
    Ok(devices)
}

#[derive(Serialize, Deserialize)]
struct AuditData {
    action: String,
    performed_by: String,
    target_user_id: String,
}

fn is_valid_email(email: &str) -> bool {
    // Production-grade email regex would go here
    email.contains('@') && email.len() <= 254
}

#[assert_delete_doc(collections = ["admins"])]
async fn assert_admin_deletion(context: AssertDeleteDocContext) -> Result<(), String> {
    validate_time_restrictions().await?;
    
    let caller_is_super = is_super_admin(&context.caller.to_string()).await?;
    let is_self_delete = context.data.key == context.caller.to_string();
    
    // Get the admin being deleted
    let admin_to_delete = decode_doc_data::<AdminUser>(&context.data.data.before.data)?;
    
    // Check role-specific constraints
    match admin_to_delete.role {
        AdminRole::SuperAdmin | AdminRole::Manager | AdminRole::Editor => {
            let role_count = count_role_admins(admin_to_delete.role).await?;
            if role_count <= 2 {
                return Err(format!(
                    "Cannot delete {} - minimum of 2 required",
                    match admin_to_delete.role {
                        AdminRole::SuperAdmin => "super admin",
                        AdminRole::Manager => "manager",
                        AdminRole::Editor => "editor",
                        _ => unreachable!()
                    }
                ).into());
            }
        },
        _ => {} // No minimum for Viewers
    }
    
    if !caller_is_super && !is_self_delete {
        return Err("Only super admins can delete other admins".into());
    }
    
    Ok(())
}

async fn count_role_admins(role: AdminRole) -> Result<u32> {
    let admins = list_docs_store("admins", None, None).await?;
    let mut count = 0;
    
    for doc in admins.items {
        let admin: AdminUser = decode_doc_data(&doc.data)?;
        if admin.role == role {
            count += 1;
        }
    }
    
    Ok(count)
}

#[on_set_doc(collections = ["admins"])]
async fn handle_admin_activation(context: OnSetDocContext) -> Result<()> {
    let Some(before) = &context.data.data.before else {
        return Ok(()); // New admin creation doesn't need activation check
    };
    
    let prev_admin = decode_doc_data::<AdminUser>(&before.data)?;
    let new_admin = decode_doc_data::<AdminUser>(&context.data.data.after.data)?;
    
    // Only process activation state changes
    if prev_admin.active == new_admin.active {
        return Ok(());
    }
    
    let action = if new_admin.active { "activate_admin" } else { "deactivate_admin" };
    
    // Verify at least 2 super admins approved this
    let approvals = count_super_admin_approvals(&context.data.key).await?;
    if approvals < 2 {
        return Err(format!(
            "{} requires approval from at least 2 super admins", 
            if new_admin.active { "Activation" } else { "Deactivation" }
        ).into());
    }
    
    // Log the action
    log_admin_action(
        action,
        &context.caller.to_string(),
        &context.data.key
    ).await?;
    
    Ok(())
}

async fn count_super_admin_approvals(admin_id: &str) -> Result<u32> {
    let approvals = list_docs_store("admin_approvals", None, None).await?;
    let mut count = 0;
    
    for doc in approvals.items {
        let approval: Approval = decode_doc_data(&doc.data)?;
        if approval.target_admin == admin_id && is_super_admin(&approval.approved_by).await? {
            count += 1;
        }
    }
    
    Ok(count)
}
