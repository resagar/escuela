use crate::models::Hermano;
use rusqlite::Connection;

/// Returns eligible brothers for a given assignment type and role.
///
/// `sexo_estudiante` — sex of the already-assigned student (required for helper roles).
/// `estudiante_id` — ID of the already-assigned student (used for family check in helper roles).
pub fn get_eligible_brothers(
    conn: &Connection,
    tipo_asignacion: &str,
    rol: &str,
    _ambito: &str,
    sexo_estudiante: Option<&str>,
    estudiante_id: Option<i64>,
) -> Result<Vec<Hermano>, String> {
    let family_subquery = "id IN (
        SELECT fm.hermano_id FROM familia_miembros fm
        WHERE fm.familia_id IN (
            SELECT familia_id FROM familia_miembros WHERE hermano_id = ?1
        )
    )";

    let (sql, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = match (tipo_asignacion, rol)
    {
        // === TESOROS: partos no-estudiante ===
        ("discurso_no_estudiante", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND rol IN ('anciano', 'siervo_ministerial')
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("busquemos_perlas", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND rol IN ('anciano', 'siervo_ministerial')
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("lectura_biblia", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND sexo = 'masculino'
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        // === MEJORES MAESTROS: partes de estudiante con variantes ===
        ("empiece_conversaciones", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("empiece_conversaciones", "ayudante") => {
            if let Some(eid) = estudiante_id {
                if let Some(sex) = sexo_estudiante {
                    (
                        format!(
                            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                    puede_ser_consejero_sala, activo, notas
                             FROM hermanos
                             WHERE activo = 1
                               AND (sexo = ?2 OR {})
                             ORDER BY nombre",
                            family_subquery
                        ),
                        vec![
                            Box::new(eid) as Box<dyn rusqlite::types::ToSql>,
                            Box::new(sex.to_string()),
                        ],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            } else {
                if let Some(sex) = sexo_estudiante {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1 AND sexo = ?1
                         ORDER BY nombre"
                            .into(),
                        vec![Box::new(sex.to_string())],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            }
        }

        ("haga_revisitas", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("haga_revisitas", "ayudante") => {
            if let Some(eid) = estudiante_id {
                if let Some(sex) = sexo_estudiante {
                    (
                        format!(
                            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                    puede_ser_consejero_sala, activo, notas
                             FROM hermanos
                             WHERE activo = 1
                               AND (sexo = ?2 OR {})
                             ORDER BY nombre",
                            family_subquery
                        ),
                        vec![
                            Box::new(eid) as Box<dyn rusqlite::types::ToSql>,
                            Box::new(sex.to_string()),
                        ],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            } else {
                if let Some(sex) = sexo_estudiante {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1 AND sexo = ?1
                         ORDER BY nombre"
                            .into(),
                        vec![Box::new(sex.to_string())],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            }
        }

        ("haga_discipulos", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("haga_discipulos", "ayudante") => {
            if let Some(eid) = estudiante_id {
                if let Some(sex) = sexo_estudiante {
                    (
                        format!(
                            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                    puede_ser_consejero_sala, activo, notas
                             FROM hermanos
                             WHERE activo = 1
                               AND (sexo = ?2 OR {})
                             ORDER BY nombre",
                            family_subquery
                        ),
                        vec![
                            Box::new(eid) as Box<dyn rusqlite::types::ToSql>,
                            Box::new(sex.to_string()),
                        ],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            } else {
                if let Some(sex) = sexo_estudiante {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1 AND sexo = ?1
                         ORDER BY nombre"
                            .into(),
                        vec![Box::new(sex.to_string())],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            }
        }

        ("explique_creencias_discurso", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND sexo = 'masculino'
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("explique_creencias_escenificacion", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("explique_creencias_escenificacion", "ayudante") => {
            if let Some(eid) = estudiante_id {
                if let Some(sex) = sexo_estudiante {
                    (
                        format!(
                            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                    puede_ser_consejero_sala, activo, notas
                             FROM hermanos
                             WHERE activo = 1
                               AND (sexo = ?2 OR {})
                             ORDER BY nombre",
                            family_subquery
                        ),
                        vec![
                            Box::new(eid) as Box<dyn rusqlite::types::ToSql>,
                            Box::new(sex.to_string()),
                        ],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            } else {
                if let Some(sex) = sexo_estudiante {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1 AND sexo = ?1
                         ORDER BY nombre"
                            .into(),
                        vec![Box::new(sex.to_string())],
                    )
                } else {
                    (
                        "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                                puede_ser_consejero_sala, activo, notas
                         FROM hermanos
                         WHERE activo = 1
                         ORDER BY nombre"
                            .into(),
                        vec![],
                    )
                }
            }
        }

        ("discurso_estudiante", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND sexo = 'masculino'
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        // === VIDA CRISTIANA: partes del cuerpo de ancianos y conductor ===
        ("analisis_auditorio", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND rol IN ('anciano', 'siervo_ministerial')
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("necesidades_congregacion", "estudiante") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND rol = 'anciano'
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("estudio_biblico", "conductor") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND puede_conducir_estudio = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        ("estudio_biblico", "lector") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        // === ROLES ESPECIALES (se asignan en tabla semanas) ===
        (_, "presidente") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND puede_presidir = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        (_, "consejero_sala") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1 AND puede_ser_consejero_sala = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        (_, "oracion") => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),

        // === Default: todos los activos ===
        _ => (
            "SELECT id, nombre, sexo, rol, puede_presidir, puede_conducir_estudio,
                    puede_ser_consejero_sala, activo, notas
             FROM hermanos
             WHERE activo = 1
             ORDER BY nombre"
                .into(),
            vec![],
        ),
    };

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let hermanos = stmt
        .query_map(params_refs.as_slice(), |row| {
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
