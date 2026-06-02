use crate::db::Database;
use crate::models::Semana;
use crate::mwb_parser;
use tauri::State;

#[tauri::command]
pub fn create_semana(
    db: State<'_, Database>,
    fecha_inicio: String,
    fecha_fin: String,
    libro_biblico: Option<String>,
    cancion_apertura: Option<i32>,
    cancion_intermedia: Option<i32>,
    cancion_cierre: Option<i32>,
    tipo_especial: String,
) -> Result<Semana, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO semanas (fecha_inicio, fecha_fin, libro_biblico,
         cancion_apertura, cancion_intermedia, cancion_cierre, tipo_especial)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            fecha_inicio,
            fecha_fin,
            libro_biblico,
            cancion_apertura,
            cancion_intermedia,
            cancion_cierre,
            tipo_especial,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Semana {
        id,
        fecha_inicio,
        fecha_fin,
        libro_biblico,
        cancion_apertura,
        cancion_intermedia,
        cancion_cierre,
        tipo_especial,
        presidente_id: None,
        consejero_sala_id: None,
        orador_oracion_apertura_id: None,
        orador_oracion_intermedia_id: None,
        orador_oracion_cierre_id: None,
    })
}

#[tauri::command]
pub fn list_semanas(db: State<'_, Database>) -> Result<Vec<Semana>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, fecha_inicio, fecha_fin, libro_biblico,
             cancion_apertura, cancion_intermedia, cancion_cierre,
             tipo_especial, presidente_id, consejero_sala_id,
             orador_oracion_apertura_id, orador_oracion_intermedia_id,
             orador_oracion_cierre_id
             FROM semanas ORDER BY fecha_inicio ASC",
        )
        .map_err(|e| e.to_string())?;

    let semanas = stmt
        .query_map([], |row| {
            Ok(Semana {
                id: row.get(0)?,
                fecha_inicio: row.get(1)?,
                fecha_fin: row.get(2)?,
                libro_biblico: row.get(3)?,
                cancion_apertura: row.get(4)?,
                cancion_intermedia: row.get(5)?,
                cancion_cierre: row.get(6)?,
                tipo_especial: row.get(7)?,
                presidente_id: row.get(8)?,
                consejero_sala_id: row.get(9)?,
                orador_oracion_apertura_id: row.get(10)?,
                orador_oracion_intermedia_id: row.get(11)?,
                orador_oracion_cierre_id: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(semanas)
}

#[tauri::command]
pub fn get_semana(db: State<'_, Database>, id: i64) -> Result<Semana, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, fecha_inicio, fecha_fin, libro_biblico,
         cancion_apertura, cancion_intermedia, cancion_cierre,
         tipo_especial, presidente_id, consejero_sala_id,
         orador_oracion_apertura_id, orador_oracion_intermedia_id,
         orador_oracion_cierre_id
         FROM semanas WHERE id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(Semana {
                id: row.get(0)?,
                fecha_inicio: row.get(1)?,
                fecha_fin: row.get(2)?,
                libro_biblico: row.get(3)?,
                cancion_apertura: row.get(4)?,
                cancion_intermedia: row.get(5)?,
                cancion_cierre: row.get(6)?,
                tipo_especial: row.get(7)?,
                presidente_id: row.get(8)?,
                consejero_sala_id: row.get(9)?,
                orador_oracion_apertura_id: row.get(10)?,
                orador_oracion_intermedia_id: row.get(11)?,
                orador_oracion_cierre_id: row.get(12)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_semana(
    db: State<'_, Database>,
    id: i64,
    fecha_inicio: Option<String>,
    fecha_fin: Option<String>,
    libro_biblico: Option<String>,
    cancion_apertura: Option<i32>,
    cancion_intermedia: Option<i32>,
    cancion_cierre: Option<i32>,
    tipo_especial: Option<String>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if let Some(val) = fecha_inicio {
        conn.execute(
            "UPDATE semanas SET fecha_inicio = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = fecha_fin {
        conn.execute(
            "UPDATE semanas SET fecha_fin = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = libro_biblico {
        conn.execute(
            "UPDATE semanas SET libro_biblico = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = cancion_apertura {
        conn.execute(
            "UPDATE semanas SET cancion_apertura = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = cancion_intermedia {
        conn.execute(
            "UPDATE semanas SET cancion_intermedia = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = cancion_cierre {
        conn.execute(
            "UPDATE semanas SET cancion_cierre = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = tipo_especial {
        conn.execute(
            "UPDATE semanas SET tipo_especial = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_semana(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM semanas WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn import_parsed_weeks(
    db: State<'_, Database>,
    parsed_weeks: Vec<mwb_parser::ParsedWeek>,
) -> Result<Vec<Semana>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut results = Vec::new();

    conn.execute("BEGIN", []).map_err(|e| e.to_string())?;

    let result = (|| -> Result<Vec<Semana>, String> {
        for pw in &parsed_weeks {
            let tipo_str = match pw.tipo_especial {
                mwb_parser::TipoEspecial::Normal => "normal",
                mwb_parser::TipoEspecial::Asamblea => "asamblea",
                mwb_parser::TipoEspecial::Conmemoracion => "conmemoracion",
                mwb_parser::TipoEspecial::VisitaSuperintendente => "visita_superintendente",
                mwb_parser::TipoEspecial::SinReunion => "asamblea",
            };

            conn.execute(
                "INSERT INTO semanas (fecha_inicio, fecha_fin, libro_biblico,
                 cancion_apertura, cancion_intermedia, cancion_cierre, tipo_especial)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                rusqlite::params![
                    pw.fecha_inicio,
                    pw.fecha_fin,
                    pw.libro_biblico,
                    pw.cancion_apertura,
                    pw.cancion_intermedia,
                    pw.cancion_cierre,
                    tipo_str,
                ],
            )
            .map_err(|e| e.to_string())?;

            let semana_id = conn.last_insert_rowid();

            for pp in &pw.partes {
                conn.execute(
                    "INSERT INTO partes (semana_id, numero_orden, seccion,
                     tipo_asignacion, titulo, duracion_minutos,
                     requiere_sala_auxiliar, requiere_ayudante)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    rusqlite::params![
                        semana_id,
                        pp.numero_orden,
                        pp.seccion,
                        pp.tipo_asignacion,
                        pp.titulo,
                        pp.duracion_minutos,
                        pp.requiere_sala_auxiliar as i32,
                        pp.requiere_ayudante as i32,
                    ],
                )
                .map_err(|e| e.to_string())?;
            }

            results.push(Semana {
                id: semana_id,
                fecha_inicio: pw.fecha_inicio.clone(),
                fecha_fin: pw.fecha_fin.clone(),
                libro_biblico: Some(pw.libro_biblico.clone()),
                cancion_apertura: Some(pw.cancion_apertura as i32),
                cancion_intermedia: Some(pw.cancion_intermedia as i32),
                cancion_cierre: Some(pw.cancion_cierre as i32),
                tipo_especial: tipo_str.to_string(),
                presidente_id: None,
                consejero_sala_id: None,
                orador_oracion_apertura_id: None,
                orador_oracion_intermedia_id: None,
                orador_oracion_cierre_id: None,
            });
        }
        Ok(results)
    })();

    match result {
        Ok(r) => {
            conn.execute("COMMIT", []).map_err(|e| e.to_string())?;
            Ok(r)
        }
        Err(e) => {
            conn.execute("ROLLBACK", []).ok();
            Err(e)
        }
    }
}
