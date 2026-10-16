use crate::models::CongregationSettings;
use rusqlite::Connection;

/// Reads the singleton congregation settings row.
///
/// The row is seeded by the database migration, so it always exists.
pub fn get_settings(conn: &Connection) -> Result<CongregationSettings, String> {
    conn.query_row(
        "SELECT has_auxiliary_room FROM congregation_settings WHERE id = 1",
        [],
        |row| {
            Ok(CongregationSettings {
                has_auxiliary_room: row.get::<_, i32>(0)? != 0,
            })
        },
    )
    .map_err(|e| format!("failed to read congregation settings: {e}"))
}

/// Updates the auxiliary-room setting and returns the persisted settings.
///
/// The stored data of the auxiliary room is never touched: this flag only
/// gates what the UI shows.
pub fn update_has_auxiliary_room(
    conn: &Connection,
    has_auxiliary_room: bool,
) -> Result<CongregationSettings, String> {
    conn.execute(
        "UPDATE congregation_settings SET has_auxiliary_room = ?1 WHERE id = 1",
        rusqlite::params![has_auxiliary_room],
    )
    .map_err(|e| format!("failed to update congregation settings: {e}"))?;

    get_settings(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;
    use std::path::PathBuf;

    /// Temporary SQLite file used to exercise migrations and reopening.
    struct TempDb {
        path: PathBuf,
    }

    impl TempDb {
        fn new(label: &str) -> Self {
            let unique = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            Self {
                path: std::env::temp_dir().join(format!(
                    "escuela_test_{}_{}_{}.db",
                    label,
                    std::process::id(),
                    unique
                )),
            }
        }

        fn open(&self) -> Database {
            Database::open(self.path.clone()).expect("failed to open database")
        }
    }

    impl Drop for TempDb {
        fn drop(&mut self) {
            for suffix in ["", "-wal", "-shm"] {
                let _ = std::fs::remove_file(PathBuf::from(format!(
                    "{}{}",
                    self.path.display(),
                    suffix
                )));
            }
        }
    }

    #[test]
    fn new_database_defaults_to_has_auxiliary_room() {
        let temp = TempDb::new("default");
        let db = temp.open();

        let settings = get_settings(&db.conn.lock().unwrap()).unwrap();

        assert!(
            settings.has_auxiliary_room,
            "default must be 'has auxiliary room' to preserve current behavior"
        );
    }

    #[test]
    fn update_then_get_returns_the_new_value() {
        let temp = TempDb::new("update");
        let db = temp.open();
        let conn = db.conn.lock().unwrap();

        update_has_auxiliary_room(&conn, false).unwrap();
        assert!(!get_settings(&conn).unwrap().has_auxiliary_room);

        update_has_auxiliary_room(&conn, true).unwrap();
        assert!(get_settings(&conn).unwrap().has_auxiliary_room);
    }

    #[test]
    fn setting_survives_reopening_the_database() {
        let temp = TempDb::new("reopen");

        {
            let db = temp.open();
            let conn = db.conn.lock().unwrap();
            update_has_auxiliary_room(&conn, false).unwrap();
        }

        let db = temp.open();
        let settings = get_settings(&db.conn.lock().unwrap()).unwrap();

        assert!(
            !settings.has_auxiliary_room,
            "reopening must not reset the stored setting"
        );
    }

    #[test]
    fn existing_database_without_settings_table_migrates_to_the_default() {
        let temp = TempDb::new("legacy");
        {
            let conn = Connection::open(&temp.path).unwrap();
            conn.execute_batch(
                "CREATE TABLE hermanos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL
                );
                INSERT INTO hermanos (nombre) VALUES ('Rene Garcia');",
            )
            .unwrap();
        }

        let db = temp.open();
        let conn = db.conn.lock().unwrap();

        let settings = get_settings(&conn).unwrap();
        assert!(
            settings.has_auxiliary_room,
            "an existing database must migrate to 'has auxiliary room'"
        );

        let brothers: i64 = conn
            .query_row("SELECT COUNT(*) FROM hermanos", [], |row| row.get(0))
            .unwrap();
        assert_eq!(brothers, 1, "migration must preserve existing data");
    }

    #[test]
    fn reopening_the_database_keeps_a_single_settings_row() {
        let temp = TempDb::new("idempotent");

        // Reopen several times: migrations must be idempotent.
        for _ in 0..3 {
            let db = temp.open();
            assert!(get_settings(&db.conn.lock().unwrap()).is_ok());
        }

        let db = temp.open();
        let conn = db.conn.lock().unwrap();
        let rows: i64 = conn
            .query_row("SELECT COUNT(*) FROM congregation_settings", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert_eq!(
            rows, 1,
            "the settings table is a singleton: exactly one row"
        );
    }
}
