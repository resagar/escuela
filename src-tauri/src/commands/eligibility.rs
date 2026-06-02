use crate::db::Database;
use crate::eligibility::rules;
use crate::models::Hermano;
use tauri::State;

#[tauri::command]
pub fn get_eligible_brothers(
    db: State<'_, Database>,
    tipo_asignacion: String,
    rol: String,
    ambito: String,
    sexo_estudiante: Option<String>,
    estudiante_id: Option<i64>,
) -> Result<Vec<Hermano>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    rules::get_eligible_brothers(
        &conn,
        &tipo_asignacion,
        &rol,
        &ambito,
        sexo_estudiante.as_deref(),
        estudiante_id,
    )
}
