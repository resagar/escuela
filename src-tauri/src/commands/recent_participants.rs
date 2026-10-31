use crate::db::Database;
use crate::models::{AssignmentHistory, RecentAssignmentParticipation};
use rusqlite::{params, Connection};

/// Historical visibility is independent of current eligibility, including active status.
pub fn fetch_recent_participants(
    conn: &Connection,
    tipo_asignacion: &str,
    rol: &str,
    fecha_referencia: &str,
) -> Result<Vec<RecentAssignmentParticipation>, String> {
    let valid_date: bool = conn
        .query_row(
            "SELECT COALESCE(date(?1) = ?1, 0)",
            [fecha_referencia],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    if !valid_date {
        return Err("Reference date must be a valid ISO calendar date".into());
    }
    let mut stmt = conn
        .prepare(
            "
        WITH recent_weeks AS (
            SELECT * FROM semanas
            WHERE fecha_inicio >= date(?2, '-21 days') AND fecha_inicio < ?2
        ), framework_roles(slot, title, role, room) AS (
            VALUES
                ('president', 'Presidente de la reunión', 'presidente', 'auditorio_principal'),
                ('counselor', 'Consejero de sala auxiliar', 'consejero_sala', 'sala_auxiliar'),
                ('opening', 'Oración de apertura', 'oracion', 'auditorio_principal'),
                ('middle', 'Oración intermedia', 'oracion', 'auditorio_principal'),
                ('closing', 'Oración de cierre', 'oracion', 'auditorio_principal')
        ), events AS (
            SELECT a.hermano_id, s.fecha_inicio, s.fecha_fin,
                   COALESCE(p.titulo, p.tipo_asignacion) AS title,
                   p.tipo_asignacion AS type, a.ambito AS room, a.rol AS role
            FROM recent_weeks s
            JOIN partes p ON p.semana_id = s.id
            JOIN asignaciones a ON a.parte_id = p.id
            WHERE p.tipo_asignacion = ?1
              AND ?3 NOT IN ('presidente', 'consejero_sala', 'oracion')
            UNION ALL
            SELECT CASE f.slot
                       WHEN 'president' THEN s.presidente_id
                       WHEN 'counselor' THEN s.consejero_sala_id
                       WHEN 'opening' THEN s.orador_oracion_apertura_id
                       WHEN 'middle' THEN s.orador_oracion_intermedia_id
                       WHEN 'closing' THEN s.orador_oracion_cierre_id
                   END,
                   s.fecha_inicio, s.fecha_fin, f.title, 'marco', f.room, f.role
            FROM recent_weeks s CROSS JOIN framework_roles f
            WHERE f.role = ?3
        )
        SELECT h.id, h.nombre, e.fecha_inicio, e.fecha_fin, e.title, e.type, e.room, e.role
        FROM events e JOIN hermanos h ON h.id = e.hermano_id
        ORDER BY e.fecha_inicio DESC, h.id, e.role, e.room, e.title
    ",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![tipo_asignacion, fecha_referencia, rol], |row| {
            Ok(RecentAssignmentParticipation {
                hermano_id: row.get(0)?,
                nombre: row.get(1)?,
                participacion: AssignmentHistory {
                    semana_fecha_inicio: row.get(2)?,
                    semana_fecha_fin: row.get(3)?,
                    parte_titulo: row.get(4)?,
                    parte_tipo: row.get(5)?,
                    ambito: row.get(6)?,
                    rol: row.get(7)?,
                },
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_recent_assignment_participants(
    db: tauri::State<'_, Database>,
    tipo_asignacion: String,
    rol: String,
    fecha_referencia: String,
) -> Result<Vec<RecentAssignmentParticipation>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    fetch_recent_participants(&conn, &tipo_asignacion, &rol, &fecha_referencia)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn fixture() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("
            CREATE TABLE hermanos (id INTEGER PRIMARY KEY, nombre TEXT, activo INTEGER);
            CREATE TABLE semanas (
                id INTEGER PRIMARY KEY, fecha_inicio TEXT, fecha_fin TEXT,
                presidente_id INTEGER, consejero_sala_id INTEGER,
                orador_oracion_apertura_id INTEGER, orador_oracion_intermedia_id INTEGER,
                orador_oracion_cierre_id INTEGER
            );
            CREATE TABLE partes (id INTEGER PRIMARY KEY, semana_id INTEGER, tipo_asignacion TEXT, titulo TEXT);
            CREATE TABLE asignaciones (parte_id INTEGER, hermano_id INTEGER, ambito TEXT, rol TEXT);
            INSERT INTO hermanos VALUES (1, 'Ana', 1), (2, 'Ana', 0), (3, 'Luis', 1);
            INSERT INTO semanas (id, fecha_inicio, fecha_fin) VALUES
                (1, '2026-09-28', '2026-10-04'),
                (2, '2026-10-05', '2026-10-11'),
                (3, '2026-10-19', '2026-10-25'),
                (4, '2026-10-26', '2026-11-01'),
                (5, '2026-11-02', '2026-11-08');
            INSERT INTO partes VALUES
                (1, 1, 'haga_revisitas', 'Older'),
                (2, 2, 'haga_revisitas', 'Earlier title'),
                (3, 3, 'haga_revisitas', 'New title'),
                (4, 4, 'haga_revisitas', 'Selected week'),
                (5, 5, 'haga_revisitas', 'Future week'),
                (6, 3, 'lectura_biblia', 'Other type');
            INSERT INTO asignaciones VALUES
                (1, 3, 'auditorio_principal', 'estudiante'),
                (2, 1, 'auditorio_principal', 'estudiante'),
                (2, 2, 'auditorio_principal', 'ayudante'),
                (3, 1, 'sala_auxiliar', 'ayudante'),
                (4, 3, 'auditorio_principal', 'estudiante'),
                (5, 3, 'auditorio_principal', 'estudiante'),
                (6, 3, 'auditorio_principal', 'estudiante');
        ").unwrap();
        conn
    }

    #[test]
    fn includes_all_recent_roles_and_inactive_brothers_without_extending_missing_weeks() {
        let conn = fixture();
        let result =
            fetch_recent_participants(&conn, "haga_revisitas", "estudiante", "2026-10-26").unwrap();
        let events: Vec<_> = result
            .iter()
            .map(|r| {
                (
                    r.hermano_id,
                    r.nombre.as_str(),
                    r.participacion.semana_fecha_inicio.as_str(),
                    r.participacion.rol.as_str(),
                    r.participacion.ambito.as_str(),
                )
            })
            .collect();
        assert_eq!(
            events,
            vec![
                (1, "Ana", "2026-10-19", "ayudante", "sala_auxiliar"),
                (1, "Ana", "2026-10-05", "estudiante", "auditorio_principal"),
                (2, "Ana", "2026-10-05", "ayudante", "auditorio_principal"),
            ]
        );
    }

    #[test]
    fn matches_framework_roles_and_groups_all_prayer_positions() {
        let conn = fixture();
        conn.execute_batch(
            "
            UPDATE semanas SET presidente_id = 1, consejero_sala_id = 2,
                orador_oracion_apertura_id = 2, orador_oracion_intermedia_id = 1,
                orador_oracion_cierre_id = 3 WHERE id = 3;
            UPDATE semanas SET presidente_id = 3, orador_oracion_apertura_id = 3
                WHERE id IN (1, 4, 5);
        ",
        )
        .unwrap();
        let president =
            fetch_recent_participants(&conn, "normal", "presidente", "2026-10-26").unwrap();
        assert_eq!(
            president
                .iter()
                .map(|r| (r.hermano_id, r.participacion.rol.as_str()))
                .collect::<Vec<_>>(),
            vec![(1, "presidente")]
        );
        let counselor =
            fetch_recent_participants(&conn, "normal", "consejero_sala", "2026-10-26").unwrap();
        assert_eq!(counselor.len(), 1);
        assert_eq!(counselor[0].hermano_id, 2);
        assert_eq!(counselor[0].participacion.ambito, "sala_auxiliar");
        let prayers = fetch_recent_participants(&conn, "oracion", "oracion", "2026-10-26").unwrap();
        let mut titles: Vec<_> = prayers
            .iter()
            .map(|r| r.participacion.parte_titulo.as_str())
            .collect();
        titles.sort();
        assert_eq!(
            titles,
            vec![
                "Oración de apertura",
                "Oración de cierre",
                "Oración intermedia"
            ]
        );
        assert!(prayers
            .iter()
            .all(|r| r.participacion.parte_tipo == "marco" && r.participacion.rol == "oracion"));
    }

    #[test]
    fn anchors_history_to_the_selected_week_instead_of_today() {
        let conn = fixture();
        let past =
            fetch_recent_participants(&conn, "haga_revisitas", "ayudante", "2026-10-12").unwrap();
        assert_eq!(past.len(), 3);
        assert!(past
            .iter()
            .all(|r| r.participacion.semana_fecha_inicio.as_str() < "2026-10-12"));
        let future =
            fetch_recent_participants(&conn, "haga_revisitas", "estudiante", "2026-11-09").unwrap();
        assert_eq!(
            future
                .iter()
                .map(|r| r.participacion.semana_fecha_inicio.as_str())
                .collect::<Vec<_>>(),
            vec!["2026-11-02", "2026-10-26", "2026-10-19"]
        );
        assert!(
            fetch_recent_participants(&conn, "missing_type", "estudiante", "2026-10-26")
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn includes_conductor_and_lector_for_the_same_type() {
        let conn = fixture();
        conn.execute_batch(
            "
            INSERT INTO partes VALUES (7, 3, 'estudio_biblico', NULL);
            INSERT INTO asignaciones VALUES
                (7, 1, 'auditorio_principal', 'conductor'),
                (7, 3, 'auditorio_principal', 'lector');
        ",
        )
        .unwrap();
        for role in ["conductor", "lector"] {
            let result =
                fetch_recent_participants(&conn, "estudio_biblico", role, "2026-10-26").unwrap();
            assert_eq!(
                result
                    .iter()
                    .map(|r| r.participacion.rol.as_str())
                    .collect::<Vec<_>>(),
                vec!["conductor", "lector"]
            );
            assert!(result
                .iter()
                .all(|r| r.participacion.parte_titulo == "estudio_biblico"));
        }
    }

    #[test]
    fn rejects_invalid_reference_dates_without_interpreting_sql_input() {
        let conn = fixture();
        for date in ["not-a-date", "2026-02-30", "2026-10-26' OR 1=1 --"] {
            assert!(
                fetch_recent_participants(&conn, "haga_revisitas", "estudiante", date).is_err()
            );
        }
        assert!(
            fetch_recent_participants(&conn, "' OR 1=1 --", "estudiante", "2026-10-26")
                .unwrap()
                .is_empty()
        );
    }
}
