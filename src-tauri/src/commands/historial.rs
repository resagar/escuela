use crate::db::Database;
use crate::models::{AssignmentHistory, BrotherStats};

/// Participation history of one brother within a date window.
///
/// Combines part assignments (`asignaciones` -> `partes` -> `semanas`) with the
/// general-framework roles stored directly in `semanas` (president, auxiliary
/// counselor, prayers) via UNION ALL. Rows from `semanas` are normalized to the
/// `AssignmentHistory` shape with fixed titles and `parte_tipo` "marco".
const HISTORY_SQL: &str = "
    SELECT
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
      AND s.fecha_inicio >= date(?3, ?2)
      AND s.fecha_inicio < ?3
    UNION ALL
    SELECT
        s.fecha_inicio,
        s.fecha_fin,
        'Presidente de la reunión',
        'marco',
        'auditorio_principal',
        'presidente'
    FROM semanas s
    WHERE s.presidente_id = ?1
      AND s.fecha_inicio >= date(?3, ?2)
      AND s.fecha_inicio < ?3
    UNION ALL
    SELECT
        s.fecha_inicio,
        s.fecha_fin,
        'Consejero de sala auxiliar',
        'marco',
        'sala_auxiliar',
        'consejero_sala'
    FROM semanas s
    WHERE s.consejero_sala_id = ?1
      AND s.fecha_inicio >= date(?3, ?2)
      AND s.fecha_inicio < ?3
    UNION ALL
    SELECT
        s.fecha_inicio,
        s.fecha_fin,
        'Oración de apertura',
        'marco',
        'auditorio_principal',
        'oracion'
    FROM semanas s
    WHERE s.orador_oracion_apertura_id = ?1
      AND s.fecha_inicio >= date(?3, ?2)
      AND s.fecha_inicio < ?3
    UNION ALL
    SELECT
        s.fecha_inicio,
        s.fecha_fin,
        'Oración intermedia',
        'marco',
        'auditorio_principal',
        'oracion'
    FROM semanas s
    WHERE s.orador_oracion_intermedia_id = ?1
      AND s.fecha_inicio >= date(?3, ?2)
      AND s.fecha_inicio < ?3
    UNION ALL
    SELECT
        s.fecha_inicio,
        s.fecha_fin,
        'Oración de cierre',
        'marco',
        'auditorio_principal',
        'oracion'
    FROM semanas s
    WHERE s.orador_oracion_cierre_id = ?1
      AND s.fecha_inicio >= date(?3, ?2)
      AND s.fecha_inicio < ?3
    ORDER BY 1 DESC
";

/// Shared history query used by `get_brother_history` and the bulk
/// eligibility-with-history command. `date_modifier` is a SQLite date
/// modifier string, e.g. "-4 months". `fecha_referencia` is the ISO
/// date of the week being assigned; only participations before it
/// count as previous.
pub fn fetch_history(
    conn: &rusqlite::Connection,
    hermano_id: i64,
    date_modifier: &str,
    fecha_referencia: &str,
) -> Result<Vec<AssignmentHistory>, String> {
    let mut stmt = conn.prepare(HISTORY_SQL).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![hermano_id, date_modifier, fecha_referencia], |row| {
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
pub fn get_brother_history(
    db: tauri::State<'_, Database>,
    hermano_id: i64,
    months: Option<i64>,
    fecha_referencia: String,
) -> Result<Vec<AssignmentHistory>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let months = months.unwrap_or(4).max(1);
    let date_modifier = format!("-{} months", months);
    fetch_history(&conn, hermano_id, &date_modifier, &fecha_referencia)
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
