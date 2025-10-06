use serde::{Deserialize, Serialize};
use junobuild_satellite::{AssertSetDocContext, AssertDeleteDocContext, OnSetDocContext};
use junobuild_utils::decode_doc_data;

// Cause status enum - should match frontend
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Clone)]
pub enum CauseStatus {
    #[serde(rename = "draft")]
    Draft,
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "approved")]
    Approved,
    #[serde(rename = "rejected")]
    Rejected,
    #[serde(rename = "paused")]
    Paused,
    #[serde(rename = "completed")]
    Completed,
}

// Cause priority enum
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Clone)]
pub enum CausePriority {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "urgent")]
    Urgent,
}

// Simplified Cause structure for validation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Cause {
    pub id: String,
    pub title: String,
    pub description: String,
    pub category: String,
    #[serde(rename = "goalAmount")]
    pub goal_amount: f64,
    #[serde(rename = "raisedAmount")]
    pub raised_amount: Option<f64>,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    pub status: CauseStatus,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    pub priority: Option<CausePriority>,
    #[serde(rename = "createdBy")]
    pub created_by: String,
    #[serde(rename = "createdAt")]
    pub created_at: Option<u64>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<u64>,
    #[serde(rename = "updatedBy")]
    pub updated_by: Option<String>,
    #[serde(rename = "approvedBy")]
    pub approved_by: Option<String>,
    #[serde(rename = "approvedAt")]
    pub approved_at: Option<u64>,
    pub deleted: Option<bool>,
    #[serde(rename = "deletedAt")]
    pub deleted_at: Option<u64>,
    #[serde(rename = "deletedBy")]
    pub deleted_by: Option<String>,
}

// Cause validation function
fn validate_cause_data(cause: &Cause) -> std::result::Result<(), String> {
    // 1. Basic required fields validation
    if cause.id.trim().is_empty() {
        return Err("Cause ID is required".into());
    }
    
    if cause.title.trim().is_empty() {
        return Err("Cause title is required".into());
    }
    
    if cause.title.len() > 200 {
        return Err("Cause title must be 200 characters or less".into());
    }
    
    if cause.description.trim().is_empty() {
        return Err("Cause description is required".into());
    }
    
    if cause.description.len() > 5000 {
        return Err("Cause description must be 5000 characters or less".into());
    }
    
    if cause.category.trim().is_empty() {
        return Err("Cause category is required".into());
    }
    
    // 2. Financial validation
    if cause.goal_amount <= 0.0 {
        return Err("Goal amount must be positive".into());
    }
    
    if cause.goal_amount > 10_000_000.0 {
        return Err("Goal amount cannot exceed 10 million".into());
    }
    
    if let Some(raised) = cause.raised_amount {
        if raised < 0.0 {
            return Err("Raised amount cannot be negative".into());
        }
        
        if raised > cause.goal_amount * 1.5 {
            return Err("Raised amount cannot exceed 150% of goal amount".into());
        }
    }
    
    // 3. Status validation
    validate_cause_status_transition(cause)?;
    
    // 4. Image URL validation
    if let Some(ref url) = cause.image_url {
        if !url.is_empty() && !is_valid_image_url(url) {
            return Err("Invalid image URL format".into());
        }
    }
    
    // 5. Created by validation
    if cause.created_by.trim().is_empty() {
        return Err("Created by field is required".into());
    }
    
    Ok(())
}

// Validate cause status transitions
fn validate_cause_status_transition(cause: &Cause) -> std::result::Result<(), String> {
    // Business logic for status transitions
    match cause.status {
        CauseStatus::Draft => {
            // Draft causes should not be active
            if cause.is_active {
                return Err("Draft causes cannot be active".into());
            }
        },
        CauseStatus::Pending => {
            // Pending causes should not be active
            if cause.is_active {
                return Err("Pending causes cannot be active".into());
            }
        },
        CauseStatus::Approved => {
            // Approved causes can be active
            // Should have approval metadata
            if cause.approved_by.is_none() || cause.approved_at.is_none() {
                return Err("Approved causes must have approval metadata".into());
            }
        },
        CauseStatus::Rejected => {
            // Rejected causes should not be active
            if cause.is_active {
                return Err("Rejected causes cannot be active".into());
            }
        },
        CauseStatus::Paused => {
            // Paused causes should not be active
            if cause.is_active {
                return Err("Paused causes cannot be active".into());
            }
        },
        CauseStatus::Completed => {
            // Completed causes should not be active
            if cause.is_active {
                return Err("Completed causes cannot be active".into());
            }
            
            // Should have reached or be close to goal
            if let Some(raised) = cause.raised_amount {
                if raised < cause.goal_amount * 0.8 {
                    return Err("Completed causes should have raised at least 80% of goal".into());
                }
            }
        },
    }
    
    Ok(())
}

// Basic image URL validation
fn is_valid_image_url(url: &str) -> bool {
    if url.len() > 2048 {
        return false;
    }
    
    // Must be HTTP/HTTPS
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return false;
    }
    
    // Should have image extension or be from known image services
    let lower_url = url.to_lowercase();
    let image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    let image_services = ["imgur.com", "cloudinary.com", "amazonaws.com", "googleusercontent.com"];
    
    image_extensions.iter().any(|ext| lower_url.ends_with(ext)) ||
    image_services.iter().any(|service| lower_url.contains(service))
}

// Business rules validation for causes
fn validate_cause_business_rules(cause: &Cause, context: &AssertSetDocContext) -> std::result::Result<(), String> {
    // 1. Permission validation
    validate_cause_permissions(cause, context)?;
    
    // 2. Rate limiting validation
    validate_cause_rate_limits(context)?;
    
    // 3. Category validation
    validate_cause_category(&cause.category)?;
    
    Ok(())
}

// Validate cause permissions based on status
fn validate_cause_permissions(cause: &Cause, _context: &AssertSetDocContext) -> std::result::Result<(), String> {
    // For now, we'll allow all operations during testing
    // In production, you would check caller permissions based on status changes
    
    match cause.status {
        CauseStatus::Approved => {
            // Only users with cause_approval permission should be able to approve
            // let caller_permissions = get_caller_permissions(&context.caller).await?;
            // if !caller_permissions.contains(&"cause_approval".to_string()) {
            //     return Err("Only authorized users can approve causes".into());
            // }
        },
        CauseStatus::Rejected => {
            // Only users with cause_approval permission should be able to reject
            // Similar check as above
        },
        _ => {
            // Other status changes might have different permission requirements
        }
    }
    
    Ok(())
}

// Validate cause creation rate limits
fn validate_cause_rate_limits(_context: &AssertSetDocContext) -> std::result::Result<(), String> {
    // For testing, we'll skip rate limiting
    // In production, you would check:
    // - How many causes the user has created recently
    // - Overall system limits
    // - IP-based limits
    
    // let recent_causes = count_recent_causes_by_user(&context.caller, 3600).await?;
    // if recent_causes >= 5 {
    //     return Err("Too many causes created recently. Please wait before creating more.".into());
    // }
    
    Ok(())
}

// Validate cause category
fn validate_cause_category(category: &str) -> std::result::Result<(), String> {
    let valid_categories = [
        "education",
        "healthcare", 
        "poverty_alleviation",
        "disaster_relief",
        "environmental",
        "community_development",
        "orphan_care",
        "elder_care",
        "humanitarian_aid",
        "religious_services",
        "other"
    ];
    
    if !valid_categories.contains(&category.to_lowercase().as_str()) {
        return Err(format!(
            "Invalid category '{}'. Valid categories: {}", 
            category,
            valid_categories.join(", ")
        ));
    }
    
    Ok(())
}

// Main assertion function for cause operations
pub fn assert_cause_operations(context: AssertSetDocContext) -> std::result::Result<(), String> {
    // Decode cause data with proper error handling
    let cause: Cause = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid cause data structure: {}", e))?;
    
    // Validate the cause data structure
    validate_cause_data(&cause)?;
    
    // Business logic validation
    validate_cause_business_rules(&cause, &context)?;
    
    // Log the validation attempt
    ic_cdk::println!("Cause validation passed: {} - Status: {:?}, Active: {}", 
                    cause.title, cause.status, cause.is_active);
    
    Ok(())
}

// Deletion assertion for causes
pub fn assert_cause_deletion(context: AssertDeleteDocContext) -> std::result::Result<(), String> {
    // Get the cause being deleted
    let current_doc = context.data.data.current.as_ref()
        .ok_or("No current document found for deletion")?;
    let cause_to_delete: Cause = decode_doc_data(&current_doc.data)
        .map_err(|e| format!("Cannot decode cause data for deletion: {}", e))?;
    
    // Prevent deletion of active causes with donations
    if cause_to_delete.is_active {
        return Err("Cannot delete active causes. Pause or complete the cause first.".into());
    }
    
    if let Some(raised) = cause_to_delete.raised_amount {
        if raised > 0.0 {
            return Err("Cannot delete causes that have received donations.".into());
        }
    }
    
    // Log critical deletion attempt
    ic_cdk::println!("Cause deletion attempt: {} - Status: {:?}, Raised: {:?}", 
                    cause_to_delete.title, cause_to_delete.status, cause_to_delete.raised_amount);
    
    Ok(())
}

// Handle cause changes (logging, notifications, etc.)
pub fn handle_cause_changes(context: OnSetDocContext) -> std::result::Result<(), String> {
    let cause_data: Cause = decode_doc_data(&context.data.data.after.data)?;
    
    // Determine if this is a creation or update
    let operation_type = if context.data.data.before.is_none() {
        "CREATE"
    } else {
        "UPDATE"
    };
    
    // Enhanced logging for audit purposes
    ic_cdk::println!(
        "Cause {}: {} - Title: '{}', Status: {:?}, Active: {}, Goal: ${}, Raised: ${:?}", 
        operation_type,
        context.data.key,
        cause_data.title,
        cause_data.status,
        cause_data.is_active,
        cause_data.goal_amount,
        cause_data.raised_amount
    );
    
    // Log status-specific information
    match cause_data.status {
        CauseStatus::Approved => {
            ic_cdk::println!("IMPORTANT: Cause approved - '{}' by {:?}", 
                           cause_data.title, cause_data.approved_by);
        },
        CauseStatus::Completed => {
            ic_cdk::println!("SUCCESS: Cause completed - '{}' raised ${:?}", 
                           cause_data.title, cause_data.raised_amount);
        },
        _ => {}
    }
    
    // Additional processing for production:
    // - Send notifications to stakeholders
    // - Update related waqfs or donations
    // - Trigger compliance workflows
    // - Send status update emails
    
    Ok(())
}