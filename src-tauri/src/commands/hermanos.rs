use crate::db::Database;
use crate::models::Hermano;
use rusqlite::Connection;
use serde::Deserialize;
use tauri::State;

#[derive(Debug, Deserialize)]
pub struct BatchHermanoInput {
    pub nombre: String,
    pub sexo: String,
    pub rol: String,
    pub puede_presidir: bool,
    pub puede_conducir_estudio: bool,
    pub puede_ser_consejero_sala: bool,
}

#[tauri::command]
pub fn list_hermanos(
    db: State<'_, Database>,
    solo_activos: Option<bool>,
) -> Result<Vec<Hermano>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let query = if solo_activos.unwrap_or(true) {
        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                puede_ser_consejero_sala, activo, notas
         FROM hermanos WHERE activo = 1 ORDER BY nombre"
    } else {
        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                puede_ser_consejero_sala, activo, notas
         FROM hermanos ORDER BY nombre"
    };

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
    let hermanos = stmt
        .query_map([], |row| {
            Ok(Hermano {
                id: row.get(0)?,
                nombre: row.get(1)?,
                sexo: row.get(2)?,
                rol: row.get(3)?,
                puede_presidir: row.get::<_, i32>(4)? != 0,
                puede_conducir_estudio: row.get::<_, i32>(5)? != 0,
                puede_ser_consejero_sala: row.get::<_, i32>(6)? != 0,
                activo: row.get::<_, i32>(7)? != 0,
                notas: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(hermanos)
}

#[tauri::command]
pub fn create_hermano(
    db: State<'_, Database>,
    nombre: String,
    sexo: String,
    rol: String,
    puede_presidir: bool,
    puede_conducir_estudio: bool,
    puede_ser_consejero_sala: bool,
) -> Result<Hermano, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO hermanos (nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
         puede_ser_consejero_sala, activo)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)",
        rusqlite::params![
            nombre,
            sexo,
            rol,
            puede_presidir as i32,
            puede_conducir_estudio as i32,
            puede_ser_consejero_sala as i32,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Hermano {
        id,
        nombre,
        sexo,
        rol,
        puede_presidir,
        puede_conducir_estudio,
        puede_ser_consejero_sala,
        activo: true,
        notas: None,
    })
}

#[tauri::command]
pub fn update_hermano(
    db: State<'_, Database>,
    id: i64,
    nombre: String,
    sexo: String,
    rol: String,
    puede_presidir: bool,
    puede_conducir_estudio: bool,
    puede_ser_consejero_sala: bool,
    notas: Option<String>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE hermanos SET nombre=?1, sexo=?2, rol=?3,
         puede_presidir=?4, puede_conducir_estudio=?5,
         puede_ser_consejero_sala=?6, notas=?7
         WHERE id=?8",
        rusqlite::params![
            nombre,
            sexo,
            rol,
            puede_presidir as i32,
            puede_conducir_estudio as i32,
            puede_ser_consejero_sala as i32,
            notas,
            id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Sets the `activo` flag of a brother. Shared by deactivation and
/// reactivation; unknown ids are a safe no-op because the UPDATE simply
/// affects no rows.
fn set_hermano_activo(conn: &Connection, id: i64, activo: bool) -> Result<(), String> {
    conn.execute(
        "UPDATE hermanos SET activo=?1 WHERE id=?2",
        rusqlite::params![activo as i32, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn deactivate_hermano(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    set_hermano_activo(&conn, id, false)
}

#[tauri::command]
pub fn reactivate_hermano(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    set_hermano_activo(&conn, id, true)
}

#[tauri::command]
pub fn create_hermanos_batch(
    db: State<'_, Database>,
    hermanos: Vec<BatchHermanoInput>,
) -> Result<Vec<Hermano>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut results = Vec::new();

    conn.execute("BEGIN", []).map_err(|e| e.to_string())?;

    let result = (|| -> Result<Vec<Hermano>, String> {
        let mut stmt = conn
            .prepare(
                "INSERT INTO hermanos (nombre, sexo, rol, puede_presidir,
                 puede_conducir_estudio, puede_ser_consejero_sala, activo)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)",
            )
            .map_err(|e| e.to_string())?;

        for h in &hermanos {
            stmt.execute(rusqlite::params![
                h.nombre,
                h.sexo,
                h.rol,
                h.puede_presidir as i32,
                h.puede_conducir_estudio as i32,
                h.puede_ser_consejero_sala as i32,
            ])
            .map_err(|e| e.to_string())?;

            let id = conn.last_insert_rowid();
            results.push(Hermano {
                id,
                nombre: h.nombre.clone(),
                sexo: h.sexo.clone(),
                rol: h.rol.clone(),
                puede_presidir: h.puede_presidir,
                puede_conducir_estudio: h.puede_conducir_estudio,
                puede_ser_consejero_sala: h.puede_ser_consejero_sala,
                activo: true,
                notas: None,
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

#[tauri::command]
pub fn get_hermano(
    db: State<'_, Database>,
    id: i64,
) -> Result<Hermano, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                puede_ser_consejero_sala, activo, notas
         FROM hermanos WHERE id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(Hermano {
                id: row.get(0)?,
                nombre: row.get(1)?,
                sexo: row.get(2)?,
                rol: row.get(3)?,
                puede_presidir: row.get::<_, i32>(4)? != 0,
                puede_conducir_estudio: row.get::<_, i32>(5)? != 0,
                puede_ser_consejero_sala: row.get::<_, i32>(6)? != 0,
                activo: row.get::<_, i32>(7)? != 0,
                notas: row.get(8)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// In-memory DB with only the `hermanos` table, replicating the production
    /// DDL in `db.rs`, plus one active brother with notes.
    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE hermanos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                sexo TEXT NOT NULL CHECK(sexo IN ('masculino', 'femenino')),
                rol TEXT NOT NULL CHECK(rol IN ('anciano', 'siervo_ministerial',
                    'publicador', 'estudiante_biblia')),
                puede_presidir INTEGER NOT NULL DEFAULT 0,
                puede_conducir_estudio INTEGER NOT NULL DEFAULT 0,
                puede_ser_consejero_sala INTEGER NOT NULL DEFAULT 0,
                activo INTEGER NOT NULL DEFAULT 1,
                notas TEXT
            );
            INSERT INTO hermanos (id, nombre, sexo, rol, notas)
            VALUES (1, 'Rene Garcia', 'masculino', 'anciano', 'circunstancias especiales');",
        )
        .unwrap();
        conn
    }

    fn activo(conn: &Connection, id: i64) -> bool {
        conn.query_row("SELECT activo FROM hermanos WHERE id = ?1", [id], |row| {
            row.get::<_, i32>(0)
        })
        .map(|value| value != 0)
        .unwrap()
    }

    fn nombre(conn: &Connection, id: i64) -> String {
        conn.query_row("SELECT nombre FROM hermanos WHERE id = ?1", [id], |row| {
            row.get(0)
        })
        .unwrap()
    }

    fn notas(conn: &Connection, id: i64) -> Option<String> {
        conn.query_row("SELECT notas FROM hermanos WHERE id = ?1", [id], |row| {
            row.get(0)
        })
        .unwrap()
    }

    fn row_count(conn: &Connection) -> i64 {
        conn.query_row("SELECT COUNT(*) FROM hermanos", [], |row| row.get(0))
            .unwrap()
    }

    #[test]
    fn deactivate_then_reactivate_sets_activo_and_preserves_other_fields() {
        let conn = setup();

        set_hermano_activo(&conn, 1, false).unwrap();
        assert!(!activo(&conn, 1), "deactivation must set activo = 0");

        set_hermano_activo(&conn, 1, true).unwrap();
        assert!(activo(&conn, 1), "reactivation must set activo = 1");
        assert_eq!(nombre(&conn, 1), "Rene Garcia");
        assert_eq!(
            notas(&conn, 1).as_deref(),
            Some("circunstancias especiales")
        );
    }

    #[test]
    fn reactivating_an_already_active_brother_is_a_safe_noop() {
        let conn = setup();

        set_hermano_activo(&conn, 1, true).unwrap();

        assert!(
            activo(&conn, 1),
            "reactivating an active brother must leave it active"
        );
        assert_eq!(row_count(&conn), 1);
    }

    #[test]
    fn changing_state_of_an_unknown_id_is_a_safe_noop() {
        let conn = setup();

        set_hermano_activo(&conn, 999, false).unwrap();
        set_hermano_activo(&conn, 999, true).unwrap();

        assert_eq!(row_count(&conn), 1, "unknown ids must not insert or delete rows");
    }
}
