use crate::db::Database;
use crate::models::AsignacionDetail;
use tauri::State;

#[tauri::command]
pub fn assign_brother(
    db: State<'_, Database>,
    parte_id: i64,
    ambito: String,
    rol: String,
    hermano_id: i64,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO asignaciones (parte_id, ambito, rol, hermano_id)
         VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![parte_id, ambito, rol, hermano_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn remove_assignment(
    db: State<'_, Database>,
    parte_id: i64,
    ambito: String,
    rol: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM asignaciones WHERE parte_id = ?1 AND ambito = ?2 AND rol = ?3",
        rusqlite::params![parte_id, ambito, rol],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_assignments_for_week(
    db: State<'_, Database>,
    semana_id: i64,
) -> Result<Vec<AsignacionDetail>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT a.id, a.parte_id, a.ambito, a.rol, a.hermano_id,
                    h.nombre, h.rol, h.sexo
             FROM asignaciones a
             INNER JOIN hermanos h ON a.hermano_id = h.id
             INNER JOIN partes p ON a.parte_id = p.id
             WHERE p.semana_id = ?1
             ORDER BY p.numero_orden, a.ambito, a.rol",
        )
        .map_err(|e| e.to_string())?;

    let asignaciones = stmt
        .query_map(rusqlite::params![semana_id], |row| {
            Ok(AsignacionDetail {
                id: row.get(0)?,
                parte_id: row.get(1)?,
                ambito: row.get(2)?,
                rol: row.get(3)?,
                hermano_id: row.get(4)?,
                hermano_nombre: row.get(5)?,
                hermano_rol: row.get(6)?,
                hermano_sexo: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(asignaciones)
}

#[tauri::command]
pub fn update_semana_roles(
    db: State<'_, Database>,
    semana_id: i64,
    presidente_id: Option<i64>,
    consejero_sala_id: Option<i64>,
    orador_oracion_apertura_id: Option<i64>,
    orador_oracion_cierre_id: Option<i64>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if let Some(val) = presidente_id {
        conn.execute(
            "UPDATE semanas SET presidente_id = ?1 WHERE id = ?2",
            rusqlite::params![val, semana_id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = consejero_sala_id {
        conn.execute(
            "UPDATE semanas SET consejero_sala_id = ?1 WHERE id = ?2",
            rusqlite::params![val, semana_id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = orador_oracion_apertura_id {
        conn.execute(
            "UPDATE semanas SET orador_oracion_apertura_id = ?1 WHERE id = ?2",
            rusqlite::params![val, semana_id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = orador_oracion_cierre_id {
        conn.execute(
            "UPDATE semanas SET orador_oracion_cierre_id = ?1 WHERE id = ?2",
            rusqlite::params![val, semana_id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}
