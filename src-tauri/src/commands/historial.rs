use crate::db::Database;
use crate::models::{AssignmentHistory, BrotherStats};

#[tauri::command]
pub fn get_brother_history(db: tauri::State<'_, Database>, hermano_id: i64) -> Result<Vec<AssignmentHistory>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT 
                s.fecha_inicio,
                s.fecha_fin,
                COALESCE(p.titulo, p.tipo_asignacion) as parte_titulo,
                p.tipo_asignacion as parte_tipo,
                a.ambito,
                a.rol
             FROM asignaciones a
             JOIN partes p ON a.parte_id = p.id
             JOIN semanas s ON p.semana_id = s.id
             WHERE a.hermano_id = ?1
             ORDER BY s.fecha_inicio DESC
             LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![hermano_id], |row| {
            Ok(AssignmentHistory {
                semana_fecha_inicio: row.get(0)?,
                semana_fecha_fin: row.get(1)?,
                parte_titulo: row.get(2)?,
                parte_tipo: row.get(3)?,
                ambito: row.get(4)?,
                rol: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub fn get_bimonthly_stats(db: tauri::State<'_, Database>) -> Result<Vec<BrotherStats>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT 
                a.hermano_id,
                h.nombre as hermano_nombre,
                COUNT(*) as total_participaciones
             FROM asignaciones a
             JOIN hermanos h ON a.hermano_id = h.id
             JOIN partes p ON a.parte_id = p.id
             JOIN semanas s ON p.semana_id = s.id
             WHERE s.fecha_inicio >= date('now', '-2 months')
             GROUP BY a.hermano_id, h.nombre
             ORDER BY total_participaciones DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(BrotherStats {
                hermano_id: row.get(0)?,
                hermano_nombre: row.get(1)?,
                total_participaciones: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}
