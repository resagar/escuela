use crate::commands::historial::fetch_history;
use crate::db::Database;
use crate::eligibility::rules;
use crate::models::{BrotherWithHistory, Hermano};
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

/// Eligible brothers for a given assignment, each one with their participation
/// history for the last `months` months (default 4). One round-trip for the
/// frontend: avoids N+1 queries when opening the picker modal.
#[tauri::command]
pub fn get_eligible_brothers_with_history(
    db: State<'_, Database>,
    tipo_asignacion: String,
    rol: String,
    ambito: String,
    sexo_estudiante: Option<String>,
    estudiante_id: Option<i64>,
    months: Option<i64>,
) -> Result<Vec<BrotherWithHistory>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let hermanos = rules::get_eligible_brothers(
        &conn,
        &tipo_asignacion,
        &rol,
        &ambito,
        sexo_estudiante.as_deref(),
        estudiante_id,
    )?;
    let months = months.unwrap_or(4).max(1);
    let date_modifier = format!("-{} months", months);
    let mut result = Vec::with_capacity(hermanos.len());
    for hermano in hermanos {
        let historial = fetch_history(&conn, hermano.id, &date_modifier)?;
        result.push(BrotherWithHistory {
            hermano,
            historial,
        });
    }
    Ok(result)
}
