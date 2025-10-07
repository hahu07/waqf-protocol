use crate::{
    waqf_utils,
    waqf_types::{WaqfData},
};
use junobuild_satellite::{OnSetDocContext, AssertSetDocContext, AssertDeleteDocContext};
use junobuild_utils::{decode_doc_data};
use serde::{Serialize, Deserialize};
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
pub enum WaqfAction {
    Create,
    Update,
    Pause,
    Complete,
    AllocationChange,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WaqfAudit {
    pub waqf_id: String,
    pub action: WaqfAction,
    pub performed_by: String,
    pub timestamp: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum WaqfValidationError {
    InvalidDonorInfo(String),
    InvalidAllocation(String),
    IllegalStatusTransition(String),
    FinancialError(String),
    PermissionDenied(String),
}

impl fmt::Display for WaqfValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidDonorInfo(msg) => write!(f, "Donor info: {}", msg),
            Self::InvalidAllocation(msg) => write!(f, "Allocation: {}", msg),
            Self::IllegalStatusTransition(msg) => write!(f, "Status: {}", msg),
            Self::FinancialError(msg) => write!(f, "Finance: {}", msg),
            Self::PermissionDenied(msg) => write!(f, "Permission: {}", msg),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WaqfValidationResult {
    pub valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<WaqfValidationError>>,
}

// Validate that waqf creators can only update specific fields
fn validate_creator_field_restrictions(
    previous: &WaqfData, 
    updated: &WaqfData, 
    caller: &str
) -> std::result::Result<(), String> {
    // Check if the caller is the original creator
    if previous.created_by == caller {
        // Define fields that creators are allowed to update
        let allowed_updates = [
            ("name", &previous.name != &updated.name),
            ("description", &previous.description != &updated.description),
            ("donor.name", &previous.donor.name != &updated.donor.name),
            ("donor.email", &previous.donor.email != &updated.donor.email),
            ("donor.phone", &previous.donor.phone != &updated.donor.phone),
            ("donor.address", &previous.donor.address != &updated.donor.address),
        ];
        
        // Check for unauthorized field changes
        let mut unauthorized_changes = Vec::new();
        
        // Check restricted fields
        if previous.initial_capital != updated.initial_capital {
            unauthorized_changes.push("initial_capital");
        }
        if previous.selected_causes != updated.selected_causes {
            unauthorized_changes.push("selected_causes");
        }
        if previous.status != updated.status {
            unauthorized_changes.push("status");
        }
        if previous.is_donated != updated.is_donated {
            unauthorized_changes.push("is_donated");
        }
        if previous.notifications.contribution_reminders != updated.notifications.contribution_reminders ||
           previous.notifications.impact_reports != updated.notifications.impact_reports ||
           previous.notifications.financial_updates != updated.notifications.financial_updates {
            unauthorized_changes.push("notifications");
        }
        if previous.reporting_preferences.frequency != updated.reporting_preferences.frequency ||
           previous.reporting_preferences.report_types != updated.reporting_preferences.report_types ||
           previous.reporting_preferences.delivery_method != updated.reporting_preferences.delivery_method {
            unauthorized_changes.push("reporting_preferences");
        }
        if previous.financial.total_donations != updated.financial.total_donations ||
           previous.financial.total_distributed != updated.financial.total_distributed ||
           previous.financial.current_balance != updated.financial.current_balance ||
           previous.financial.investment_returns != updated.financial.investment_returns ||
           previous.financial.total_investment_return != updated.financial.total_investment_return ||
           previous.financial.growth_rate != updated.financial.growth_rate {
            unauthorized_changes.push("financial");
        }
        if previous.created_by != updated.created_by {
            unauthorized_changes.push("created_by");
        }
        if previous.created_at != updated.created_at {
            unauthorized_changes.push("created_at");
        }
        if previous.last_contribution_date != updated.last_contribution_date {
            unauthorized_changes.push("last_contribution_date");
        }
        if previous.next_contribution_date != updated.next_contribution_date {
            unauthorized_changes.push("next_contribution_date");
        }
        if previous.next_report_date != updated.next_report_date {
            unauthorized_changes.push("next_report_date");
        }
        
        // If there are unauthorized changes, reject the update
        if !unauthorized_changes.is_empty() {
            let error_msg = format!(
                "Waqf creators can only update name, description, and donor fields. Unauthorized changes detected in: {}",
                unauthorized_changes.join(", ")
            );
            
            ic_cdk::println!(
                "SECURITY: Creator {} attempted to modify restricted fields: {} for waqf: {}",
                caller, unauthorized_changes.join(", "), updated.id
            );
            
            return Err(error_msg);
        }
        
        // Log successful creator update
        let changed_fields: Vec<&str> = allowed_updates.iter()
            .filter(|(_, changed)| *changed)
            .map(|(field, _)| *field)
            .collect();
        
        if !changed_fields.is_empty() {
            ic_cdk::println!(
                "INFO: Creator {} updated allowed fields: {} for waqf: {}",
                caller, changed_fields.join(", "), updated.id
            );
        }
    }
    // If caller is not the creator, allow the update (admin operations)
    // Note: Proper admin validation should be handled separately
    
    Ok(())
}

// Validate minimum initial capital for new waqf creation
fn validate_minimum_initial_capital(waqf: &WaqfData) -> std::result::Result<(), String> {
    const MIN_WAQF_AMOUNT: f64 = 100.0; // Minimum $100 for meaningful waqf
    
    if waqf.initial_capital < MIN_WAQF_AMOUNT {
        let error_msg = format!(
            "Minimum initial capital required: ${:.2}. Provided: ${:.2}. A waqf requires a meaningful contribution to create lasting impact.",
            MIN_WAQF_AMOUNT,
            waqf.initial_capital
        );
        
        ic_cdk::println!(
            "VALIDATION: Waqf creation rejected - insufficient initial capital: ${:.2} for waqf: {} by creator: {}",
            waqf.initial_capital, waqf.name, waqf.created_by
        );
        
        return Err(error_msg);
    }
    
    ic_cdk::println!(
        "INFO: Waqf creation accepted - initial capital: ${:.2} for waqf: {} by creator: {}",
        waqf.initial_capital, waqf.name, waqf.created_by
    );
    
    Ok(())
}

// Main assertion function for waqf operations
pub fn assert_waqf_operations(context: AssertSetDocContext) -> std::result::Result<(), String> {
    // Decode waqf data with proper error handling
    let waqf: WaqfData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid waqf data structure: {}", e))?;
    
    // Validate the waqf data structure
    waqf_utils::validate_waqf_data(&waqf)?;
    
    // Additional validation for waqf creation
    if context.data.data.current.is_none() {
        // This is a new waqf creation - enforce minimum capital
        validate_minimum_initial_capital(&waqf)?;
    }
    
    // Log the validation attempt
    ic_cdk::println!(
        "Waqf validation passed: {} - Status: {}, Initial Capital: {}", 
        waqf.name, waqf.status, waqf.initial_capital
    );
    
    Ok(())
}

// Deletion assertion for waqfs
pub fn assert_waqf_deletion(context: AssertDeleteDocContext) -> std::result::Result<(), String> {
    // Get the waqf being deleted  
    let current_doc = context.data.data.current.as_ref()
        .ok_or("No current document found for deletion")?;
    let waqf_to_delete: WaqfData = decode_doc_data(&current_doc.data)
        .map_err(|e| format!("Cannot decode waqf data for deletion: {}", e))?;
    
    // Prevent deletion of active waqfs
    if waqf_to_delete.status == "active" {
        return Err("Cannot delete active waqf - change status first".into());
    }
    
    // Log deletion attempt
    ic_cdk::println!(
        "Waqf deletion: {} - Status: {}, Initial Capital: {}", 
        waqf_to_delete.name, waqf_to_delete.status, waqf_to_delete.initial_capital
    );
    
    Ok(())
}

// Handle waqf changes (logging, notifications, etc.)
pub fn handle_waqf_changes(context: OnSetDocContext) -> std::result::Result<(), String> {
    let waqf_data: WaqfData = decode_doc_data(&context.data.data.after.data)
        .map_err(|e| format!("Cannot decode waqf data: {}", e))?;
    
    // Determine if this is a creation or update
    let operation_type = if context.data.data.before.is_none() {
        "CREATE"
    } else {
        "UPDATE"
    };
    
    // Validate creator permissions for updates
    if operation_type == "UPDATE" {
        if let Some(before_doc) = &context.data.data.before {
            let previous_waqf: WaqfData = decode_doc_data(&before_doc.data)
                .map_err(|e| format!("Cannot decode previous waqf data: {}", e))?;
            
            validate_creator_field_restrictions(&previous_waqf, &waqf_data, &context.caller.to_string())?;
        }
    }
    
    // Enhanced logging for audit purposes
    ic_cdk::println!(
        "Waqf {}: {} - Name: {}, Status: {}, Donor: {}, Initial Capital: {}", 
        operation_type,
        context.data.key,
        waqf_data.name,
        waqf_data.status,
        waqf_data.donor.name,
        waqf_data.initial_capital
    );
    
    // Log status-specific information
    match waqf_data.status.as_str() {
        "active" => {
            ic_cdk::println!(
                "IMPORTANT: Waqf activated - {} for {} (Initial Capital: {})", 
                waqf_data.name, waqf_data.donor.name, waqf_data.initial_capital
            );
        },
        "completed" => {
            ic_cdk::println!(
                "INFO: Waqf completed - {} for {}", 
                waqf_data.name, waqf_data.donor.name
            );
        },
        "archived" => {
            ic_cdk::println!(
                "NOTICE: Waqf archived - {} for {}", 
                waqf_data.name, waqf_data.donor.name
            );
        },
        _ => {}
    }
    
    Ok(())
}
