use crate::db::Database;
use crate::models::Parte;
use tauri::State;

#[tauri::command]
pub fn create_parte(
    db: State<'_, Database>,
    semana_id: i64,
    numero_orden: i32,
    seccion: String,
    tipo_asignacion: String,
    titulo: Option<String>,
    duracion_minutos: Option<i32>,
    requiere_sala_auxiliar: bool,
    requiere_ayudante: bool,
) -> Result<Parte, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO partes (semana_id, numero_orden, seccion,
         tipo_asignacion, titulo, duracion_minutos,
         requiere_sala_auxiliar, requiere_ayudante)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            semana_id,
            numero_orden,
            seccion,
            tipo_asignacion,
            titulo,
            duracion_minutos,
            requiere_sala_auxiliar as i32,
            requiere_ayudante as i32,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Parte {
        id,
        semana_id,
        numero_orden,
        seccion,
        tipo_asignacion,
        titulo,
        duracion_minutos,
        requiere_sala_auxiliar,
        requiere_ayudante,
    })
}

#[tauri::command]
pub fn list_partes(
    db: State<'_, Database>,
    semana_id: i64,
) -> Result<Vec<Parte>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, semana_id, numero_orden, seccion, tipo_asignacion,
             titulo, duracion_minutos, requiere_sala_auxiliar, requiere_ayudante
             FROM partes WHERE semana_id = ?1 ORDER BY numero_orden ASC",
        )
        .map_err(|e| e.to_string())?;

    let partes = stmt
        .query_map(rusqlite::params![semana_id], |row| {
            Ok(Parte {
                id: row.get(0)?,
                semana_id: row.get(1)?,
                numero_orden: row.get(2)?,
                seccion: row.get(3)?,
                tipo_asignacion: row.get(4)?,
                titulo: row.get(5)?,
                duracion_minutos: row.get(6)?,
                requiere_sala_auxiliar: row.get(7)?,
                requiere_ayudante: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(partes)
}

#[tauri::command]
pub fn update_parte(
    db: State<'_, Database>,
    id: i64,
    seccion: Option<String>,
    titulo: Option<String>,
    tipo_asignacion: Option<String>,
    duracion_minutos: Option<i32>,
    requiere_sala_auxiliar: Option<bool>,
    requiere_ayudante: Option<bool>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if let Some(val) = seccion {
        conn.execute(
            "UPDATE partes SET seccion = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = titulo {
        conn.execute(
            "UPDATE partes SET titulo = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = tipo_asignacion {
        conn.execute(
            "UPDATE partes SET tipo_asignacion = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = duracion_minutos {
        conn.execute(
            "UPDATE partes SET duracion_minutos = ?1 WHERE id = ?2",
            rusqlite::params![val, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(val) = requiere_sala_auxiliar {
        conn.execute(
            "UPDATE partes SET requiere_sala_auxiliar = ?1 WHERE id = ?2",
            rusqlite::params![val as i32, id],
        )
        .map_err(|e| e.to_string())?;
        if !val {
            conn.execute(
                "DELETE FROM asignaciones WHERE parte_id = ?1 AND ambito = 'sala_auxiliar'",
                rusqlite::params![id],
            )
            .map_err(|e| e.to_string())?;
        }
    }
    if let Some(val) = requiere_ayudante {
        conn.execute(
            "UPDATE partes SET requiere_ayudante = ?1 WHERE id = ?2",
            rusqlite::params![val as i32, id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_parte(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM partes WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
