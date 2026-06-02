mod commands;
mod db;
mod eligibility;
mod models;
pub mod mwb_parser;

use db::Database;
use std::path::PathBuf;
use tauri::Manager;

/// Returns the path to the SQLite database file in the app's data directory.
fn get_db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let mut path = app_handle
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    path.push("escuela.db");
    path
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::hermanos::list_hermanos,
            commands::hermanos::get_hermano,
            commands::hermanos::create_hermano,
            commands::hermanos::create_hermanos_batch,
            commands::hermanos::update_hermano,
            commands::hermanos::deactivate_hermano,
            commands::mwb::parse_mwb_pdf,
            commands::mwb::pick_mwb_file,
            commands::semanas::create_semana,
            commands::semanas::list_semanas,
            commands::semanas::get_semana,
            commands::semanas::update_semana,
            commands::semanas::delete_semana,
            commands::semanas::import_parsed_weeks,
            commands::partes::create_parte,
            commands::partes::list_partes,
            commands::partes::update_parte,
            commands::partes::delete_parte,
            commands::familias::create_familia,
            commands::familias::list_familias,
            commands::familias::get_familia,
            commands::familias::delete_familia,
            commands::familias::add_familia_member,
            commands::familias::remove_familia_member,
            commands::familias::list_familias_with_count,
            commands::eligibility::get_eligible_brothers,
            commands::asignaciones::assign_brother,
            commands::asignaciones::remove_assignment,
            commands::asignaciones::get_assignments_for_week,
            commands::asignaciones::update_semana_roles,
        ])
        .setup(|app| {
            let db_path = get_db_path(app.handle());
            let database = Database::open(db_path).expect("failed to open database");
            app.manage(database);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
