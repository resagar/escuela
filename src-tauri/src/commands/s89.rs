use crate::db::Database;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct S89Card {
    pub parte_id: i64,
    pub estudiante_nombre: String,
    pub ayudante_nombre: Option<String>,
    pub fecha_inicio: String,
    pub numero_orden: i32,
    pub parte_titulo: Option<String>,
    pub ambito: String,
}

#[tauri::command]
pub fn get_s89_cards_for_week(
    db: State<'_, Database>,
    semana_id: i64,
) -> Result<Vec<S89Card>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT a.parte_id, h_est.nombre, h_ayu.nombre, s.fecha_inicio,
                    p.numero_orden, p.titulo, a.ambito
             FROM asignaciones a
             INNER JOIN hermanos h_est ON a.hermano_id = h_est.id
             INNER JOIN partes p ON a.parte_id = p.id
             INNER JOIN semanas s ON p.semana_id = s.id
             LEFT JOIN asignaciones a_ayu
                 ON a_ayu.parte_id = a.parte_id
                 AND a_ayu.ambito = a.ambito
                 AND a_ayu.rol = 'ayudante'
             LEFT JOIN hermanos h_ayu ON a_ayu.hermano_id = h_ayu.id
              WHERE a.rol = 'estudiante'
                  AND p.semana_id = ?1
                  AND p.tipo_asignacion IN (
                      'lectura_biblia',
                      'empiece_conversaciones',
                      'haga_revisitas',
                      'haga_discipulos',
                      'explique_creencias_discurso',
                      'explique_creencias_escenificacion',
                      'discurso_estudiante'
                  )
                  AND (p.requiere_sala_auxiliar = 1 OR a.ambito = 'auditorio_principal')
             ORDER BY p.numero_orden,
               CASE a.ambito
                 WHEN 'sala_auxiliar' THEN 0
                 ELSE 1
               END",
        )
        .map_err(|e| e.to_string())?;

    let cards = stmt
        .query_map(rusqlite::params![semana_id], |row| {
            Ok(S89Card {
                parte_id: row.get(0)?,
                estudiante_nombre: row.get(1)?,
                ayudante_nombre: row.get(2)?,
                fecha_inicio: row.get(3)?,
                numero_orden: row.get(4)?,
                parte_titulo: row.get(5)?,
                ambito: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(cards)
}
