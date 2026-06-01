use crate::db::Database;
use crate::models::Hermano;
use tauri::State;

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

#[tauri::command]
pub fn deactivate_hermano(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE hermanos SET activo=0 WHERE id=?1",
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
