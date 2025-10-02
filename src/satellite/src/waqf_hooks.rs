use crate::{
    lib::{admin_utils, waqf_utils},
    waqf_types::{WaqfDoc, WaqfStatus},
};
use junobuild_satellite::{on_set_doc, Result, OnSetDocContext};
use junobuild_macros::{assert_set_doc, assert_delete_doc};
use serde::{Serialize, Deserialize};
use std::fmt;

const WAQF_COLLECTION: &str = "waqfs";
const WAQF_AUDIT_COLLECTION: &str = "waqf_audit";

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

#[assert_set_doc(collection = WAQF_COLLECTION)]
pub fn validate_waqf(ctx: &OnSetDocContext) -> Result<()> {
    let waqf: WaqfDoc = ctx.decode_doc()?;
    
    match waqf_utils::validate_waqf_complete(&waqf) {
        WaqfValidationResult { valid: true, .. } => {},
        WaqfValidationResult { errors: Some(errors), .. } => {
            return Err(errors.into_iter()
                .map(|e| e.to_string())
                .collect::<Vec<_>>()
                .join(", ")
                .into());
        },
        _ => unreachable!(),
    }

    let is_admin = admin_utils::is_admin(&ctx.caller)?;
    waqf_utils::validate_waqf_update_permissions(&waqf, &ctx.caller.to_string(), is_admin)
        .map_err(|e| e.to_string().into())
}

#[assert_delete_doc(collection = WAQF_COLLECTION)]
pub fn validate_waqf_deletion(ctx: &OnSetDocContext) -> Result<()> {
    let waqf: WaqfDoc = ctx.decode_doc()?;
    
    if matches!(waqf.data.status, WaqfStatus::Active) {
        return Err("Cannot delete active waqf - pause or complete first".into());
    }
    
    if waqf.data.created_by != ctx.caller.to_string() {
        return Err("Only waqf creator can delete".into());
    }
    
    Ok(())
}

#[on_set_doc(collection = WAQF_COLLECTION)]
pub fn on_waqf_change(ctx: OnSetDocContext) -> Result<()> {
    let waqf: WaqfDoc = ctx.decode_doc()?;
    let action = match (ctx.is_create(), &waqf.data.status) {
        (true, _) => WaqfAction::Create,
        (_, WaqfStatus::Paused) => WaqfAction::Pause,
        (_, WaqfStatus::Completed) => WaqfAction::Complete,
        _ => WaqfAction::Update,
    };

    waqf_utils::log_waqf_audit(
        &waqf.data.id,
        action,
        &ctx.caller.to_string(),
        Some(format!("Status: {:?}", waqf.data.status)),
    )
}

#[on_set_doc(collection = WAQF_AUDIT_COLLECTION)] 
pub fn process_waqf_audit(ctx: OnSetDocContext) -> Result<()> {
    let audit: WaqfAudit = ctx.decode_doc()?;
    
    if matches!(audit.action, WaqfAction::Pause | WaqfAction::Complete) {
        waqf_utils::notify_critical_waqf_action(&audit)?;
    }
    
    Ok(())
}