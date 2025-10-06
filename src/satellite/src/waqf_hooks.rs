use crate::{
    lib::waqf_utils,
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

// Main assertion function for waqf operations
pub fn assert_waqf_operations(context: AssertSetDocContext) -> std::result::Result<(), String> {
    // Decode waqf data with proper error handling
    let waqf: WaqfData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid waqf data structure: {}", e))?;
    
    // Validate the waqf data structure
    waqf_utils::validate_waqf_data(&waqf)?;
    
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
