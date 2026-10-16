use crate::congregation::settings;
use crate::db::Database;
use crate::models::CongregationSettings;
use tauri::State;

#[tauri::command]
pub fn get_congregation_settings(db: State<'_, Database>) -> Result<CongregationSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    settings::get_settings(&conn)
}

#[tauri::command]
pub fn update_congregation_settings(
    db: State<'_, Database>,
    has_auxiliary_room: bool,
) -> Result<CongregationSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    settings::update_has_auxiliary_room(&conn, has_auxiliary_room)
}
