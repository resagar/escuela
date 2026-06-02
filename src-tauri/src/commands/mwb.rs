use crate::mwb_parser;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub fn parse_mwb_pdf(path: String) -> Result<Vec<mwb_parser::ParsedWeek>, String> {
    mwb_parser::parse_mwb_pdf(&path)
}

#[tauri::command]
pub fn pick_mwb_file(app: AppHandle) -> Result<Option<String>, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("PDF", &["pdf"])
        .blocking_pick_file();

    Ok(file.map(|p| p.to_string()))
}
