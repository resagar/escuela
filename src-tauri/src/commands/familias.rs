use crate::db::Database;
use crate::models::{Familia, FamiliaWithMembers, Hermano};
use tauri::State;

#[tauri::command]
pub fn create_familia(
    db: State<'_, Database>,
    nombre: String,
    notas: Option<String>,
) -> Result<Familia, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO familias (nombre, notas) VALUES (?1, ?2)",
        rusqlite::params![nombre, notas],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Familia { id, nombre, notas })
}

#[tauri::command]
pub fn list_familias(db: State<'_, Database>) -> Result<Vec<Familia>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, nombre, notas FROM familias ORDER BY nombre")
        .map_err(|e| e.to_string())?;

    let familias = stmt
        .query_map([], |row| {
            Ok(Familia {
                id: row.get(0)?,
                nombre: row.get(1)?,
                notas: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(familias)
}

#[tauri::command]
pub fn get_familia(db: State<'_, Database>, id: i64) -> Result<FamiliaWithMembers, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let familia = conn
        .query_row(
            "SELECT id, nombre, notas FROM familias WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok(Familia {
                    id: row.get(0)?,
                    nombre: row.get(1)?,
                    notas: row.get(2)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT h.id, h.nombre, h.sexo, h.rol, h.puede_presidir,
                    h.puede_conducir_estudio, h.puede_ser_consejero_sala,
                    h.activo, h.notas
             FROM hermanos h
             INNER JOIN familia_miembros fm ON h.id = fm.hermano_id
             WHERE fm.familia_id = ?1
             ORDER BY h.nombre",
        )
        .map_err(|e| e.to_string())?;

    let miembros = stmt
        .query_map(rusqlite::params![id], |row| {
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

    Ok(FamiliaWithMembers {
        id: familia.id,
        nombre: familia.nombre,
        notas: familia.notas,
        miembros,
    })
}

#[tauri::command]
pub fn delete_familia(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM familias WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_familia_member(
    db: State<'_, Database>,
    familia_id: i64,
    hermano_id: i64,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO familia_miembros (familia_id, hermano_id) VALUES (?1, ?2)",
        rusqlite::params![familia_id, hermano_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn remove_familia_member(
    db: State<'_, Database>,
    familia_id: i64,
    hermano_id: i64,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM familia_miembros WHERE familia_id = ?1 AND hermano_id = ?2",
        rusqlite::params![familia_id, hermano_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
