use junobuild_macros::{
    assert_delete_asset, assert_delete_doc, assert_set_doc, assert_upload_asset,
    on_delete_asset, on_delete_doc, on_delete_filtered_assets, on_delete_filtered_docs,
    on_delete_many_assets, on_delete_many_docs, on_set_doc, on_set_many_docs, on_upload_asset
};
use junobuild_satellite::{
    include_satellite, AssertDeleteAssetContext, AssertDeleteDocContext, AssertSetDocContext,
    AssertUploadAssetContext, OnDeleteAssetContext, OnDeleteDocContext,
    OnDeleteFilteredAssetsContext, OnDeleteFilteredDocsContext, OnDeleteManyAssetsContext,
    OnDeleteManyDocsContext, OnSetDocContext, OnSetManyDocsContext, OnUploadAssetContext, Result
};

mod admin_hooks;
pub mod waqf_types;
pub mod waqf_hooks;

mod lib {
    pub mod waqf_utils;
}

// Update imports (~line 9)
use crate::admin_hooks::{
    assert_admin_operations,
    assert_admin_deletion,
    handle_admin_changes,
    process_audit_logs,
    handle_admin_activation  // Add this import
};

// Update main on_set_doc handler (~line 19)
#[on_set_doc]
async fn on_set_doc(context: OnSetDocContext) -> Result<()> {
    // Chain all admin handlers
    handle_admin_changes(context.clone()).await?;
    handle_admin_activation(context.clone()).await?;  // Add this line
    process_audit_logs(context).await?;
    
    Ok(())
}

#[assert_set_doc]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    // Route to appropriate assertion handler
    if context.collection == "admins" {
        assert_admin_operations(context)
    } else {
        Ok(())
    }
}

#[assert_delete_doc]
fn assert_delete_doc(context: AssertDeleteDocContext) -> Result<(), String> {
    if context.collection == "admins" {
        assert_admin_deletion(context)
    } else {
        Ok(())
    }
}

// Default implementations for other hooks
#[on_set_many_docs]
async fn on_set_many_docs(_context: OnSetManyDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_asset]
async fn on_delete_asset(_context: OnDeleteAssetContext) -> Result<()> {
    Ok(())
}

#[on_delete_doc]
async fn on_delete_doc(_context: OnDeleteDocContext) -> Result<()> {
    Ok(())
}

#[on_delete_filtered_assets]
async fn on_delete_filtered_assets(_context: OnDeleteFilteredAssetsContext) -> Result<()> {
    Ok(())
}

#[on_delete_filtered_docs]
async fn on_delete_filtered_docs(_context: OnDeleteFilteredDocsContext) -> Result<()> {
    Ok(())
}

#[on_delete_many_assets]
async fn on_delete_many_assets(_context: OnDeleteManyAssetsContext) -> Result<()> {
    Ok(())
}

#[on_delete_many_docs]
async fn on_delete_many_docs(_context: OnDeleteManyDocsContext) -> Result<()> {
    Ok(())
}

#[on_upload_asset]
async fn on_upload_asset(_context: OnUploadAssetContext) -> Result<()> {
    Ok(())
}

include_satellite!();
