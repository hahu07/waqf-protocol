use super::waqf_types::*;
use junobuild_satellite::{set_doc, OnSetDocContext, Result};
use regex::Regex;
use ic_cdk::api;
use lazy_static::lazy_static;

lazy_static! {
    static ref EMAIL_REGEX: Regex = Regex::new(r"^[^@\s]+@[^@\s]+\.[^@\s]+$").unwrap();
}

// src/satellite/src/waqf_utils.rs
pub fn validate_waqf(waqf: &WaqfDoc) -> Result<()> {
    // Required fields
    if waqf.data.description.is_empty() {
        return Err("Description is required".into());
    }

    // Donor validation
    if waqf.data.donor.name.is_empty() || waqf.data.donor.email.is_empty() {
        return Err("Donor name and email are required".into());
    }

    // Cause allocation validation
    let total_allocation: f64 = waqf.data.cause_allocation.values().sum();
    if (total_allocation - 100.0).abs() > 0.01 {
        return Err("Cause allocations must sum to 100%".into());
    }

    // Financial validation
    if waqf.data.financial.total_distributed > waqf.data.financial.total_donations {
        return Err("Distributed amount cannot exceed donations".into());
    }

    Ok(())
}

pub fn check_permissions(
    waqf: &WaqfDoc,
    caller: &str,
    is_admin: bool,
) -> Result<()> {
    // Donors can only update specific fields
    if waqf.data.created_by == caller {
        let protected_fields = [
            "financial",
            "status",
            "waqfAssets",
            "supportedCauses",
        ];
        
        // Check if trying to modify protected fields
        if protected_fields.iter().any(|field| {
            field_changed(field, waqf)
        }) {
            return Err("Donors can't modify protected fields".into());
        }
        return Ok(());
    }

    // Admins have full access except for completed waqfs
    if is_admin && !matches!(waqf.data.status, WaqfStatus::Completed) {
        return Ok(());
    }

    Err("Permission denied".into())
}

fn validate_donor_info(donor: &DonorProfile) -> std::result::Result<String, String> {
    if donor.name.is_empty() {
        return Err("Name is required".into());
    }
    
    if !EMAIL_REGEX.is_match(&donor.email) {
        return Err("Invalid email format".into());
    }
    
    Ok("Valid".into())
}

fn validate_cause_allocations(allocations: &HashMap<String, f64>) -> std::result::Result<String, String> {
    const TOLERANCE: f64 = 0.01;
    let total: f64 = allocations.values().sum();
    
    if (total - 100.0).abs() > TOLERANCE {
        return Err(format!("Allocations sum to {:.2}% (must be 100%)", total));
    }
    
    for (cause_id, percentage) in allocations {
        if !(0.0..=100.0).contains(percentage) {
            return Err(format!(
                "Invalid percentage {:.2}% for cause {}",
                percentage, cause_id
            ));
        }
    }
    
    Ok("Valid".into())
}

fn validate_status_transition(from: &WaqfStatus, to: &WaqfStatus) -> std::result::Result<String, String> {
    match (from, to) {
        (WaqfStatus::Completed, _) => Err("Cannot modify completed waqf".into()),
        (_, WaqfStatus::Completed) if !matches!(from, WaqfStatus::Active | WaqfStatus::Paused) => {
            Err("Can only complete from active/paused".into())
        },
        _ => Ok("Valid".into()),
    }
}

fn validate_financial_metrics(metrics: &FinancialMetrics) -> std::result::Result<String, String> {
    let checks = [
        (metrics.total_donations >= 0.0, "Negative donations"),
        (metrics.total_distributed >= 0.0, "Negative distribution"),
        (metrics.current_balance >= 0.0, "Negative balance"),
        (metrics.total_distributed <= metrics.total_donations, "Over-distribution"),
        (metrics.growth_rate >= -100.0, "Growth < -100%"),
        (metrics.growth_rate <= 1000.0, "Growth > 1000%"),
    ];

    for (valid, error) in checks {
        if !valid {
            return Err(error.into());
        }
    }
    
    Ok("Valid".into())
}

pub fn log_waqf_audit(
    waqf_id: &str,
    action: WaqfAction,
    performed_by: &str,
    notes: Option<String>,
) -> Result<()> {
    set_doc(WAQF_AUDIT_COLLECTION, WaqfAudit {
        waqf_id: waqf_id.to_string(),
        action,
        performed_by: performed_by.to_string(),
        timestamp: api::time(),
        notes,
    })
}

pub fn notify_critical_waqf_action(audit: &WaqfAudit) -> Result<()> {
    let message = format!(
        "Critical Waqf Action: {:?} on {} by {}",
        audit.action, audit.waqf_id, audit.performed_by
    );
    ic_cdk::print(message);
    Ok(())
}