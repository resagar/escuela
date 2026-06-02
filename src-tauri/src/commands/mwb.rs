use crate::mwb_parser;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub fn parse_mwb_pdf(path: String) -> Result<Vec<mwb_parser::ParsedWeek>, String> {
    mwb_parser::parse_mwb_pdf(&path)
}

#[tauri::command]
pub async fn pick_mwb_file(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = tokio::sync::oneshot::channel::<Option<PathBuf>>();

    app.dialog()
        .file()
        .add_filter("PDF", &["pdf"])
        .pick_file(move |file_path| {
            let _ = tx.send(file_path.and_then(|p| p.into_path().ok()));
        });

    let file = rx.await.map_err(|e| format!("Dialog cancelled: {}", e))?;
    Ok(file.map(|p| p.to_string_lossy().to_string()))
}
