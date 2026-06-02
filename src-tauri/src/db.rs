use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    /// Open (or create) the SQLite database at the given path and run migrations.
    pub fn open(db_path: PathBuf) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        let db = Database {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    fn run_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS hermanos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                sexo TEXT NOT NULL CHECK(sexo IN ('masculino', 'femenino')),
                rol TEXT NOT NULL CHECK(rol IN ('anciano', 'siervo_ministerial', 'publicador', 'estudiante_biblia')),
                puede_presidir INTEGER NOT NULL DEFAULT 0,
                puede_conducir_estudio INTEGER NOT NULL DEFAULT 0,
                puede_ser_consejero_sala INTEGER NOT NULL DEFAULT 0,
                activo INTEGER NOT NULL DEFAULT 1,
                notas TEXT
            );

            CREATE TABLE IF NOT EXISTS semanas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha_inicio TEXT NOT NULL,
                fecha_fin TEXT NOT NULL,
                libro_biblico TEXT,
                cancion_apertura INTEGER,
                cancion_intermedia INTEGER,
                cancion_cierre INTEGER,
                tipo_especial TEXT NOT NULL DEFAULT 'normal'
                    CHECK(tipo_especial IN ('normal', 'asamblea', 'conmemoracion', 'visita_superintendente')),
                presidente_id INTEGER REFERENCES hermanos(id),
                consejero_sala_id INTEGER REFERENCES hermanos(id),
                orador_oracion_apertura_id INTEGER REFERENCES hermanos(id),
                orador_oracion_intermedia_id INTEGER REFERENCES hermanos(id),
                orador_oracion_cierre_id INTEGER REFERENCES hermanos(id)
            );

            CREATE TABLE IF NOT EXISTS partes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                semana_id INTEGER NOT NULL REFERENCES semanas(id) ON DELETE CASCADE,
                numero_orden INTEGER NOT NULL,
                seccion TEXT NOT NULL
                    CHECK(seccion IN ('tesoros', 'mejores_maestros', 'vida_cristiana', 'marco')),
                tipo_asignacion TEXT NOT NULL,
                titulo TEXT,
                duracion_minutos INTEGER,
                requiere_sala_auxiliar INTEGER NOT NULL DEFAULT 0,
                requiere_ayudante INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS asignaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parte_id INTEGER NOT NULL REFERENCES partes(id) ON DELETE CASCADE,
                ambito TEXT NOT NULL
                    CHECK(ambito IN ('auditorio_principal', 'sala_auxiliar')),
                rol TEXT NOT NULL
                    CHECK(rol IN ('estudiante', 'ayudante', 'conductor', 'lector')),
                hermano_id INTEGER NOT NULL REFERENCES hermanos(id)
            );

            CREATE TABLE IF NOT EXISTS familias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                notas TEXT
            );

            CREATE TABLE IF NOT EXISTS familia_miembros (
                familia_id INTEGER NOT NULL REFERENCES familias(id) ON DELETE CASCADE,
                hermano_id INTEGER NOT NULL REFERENCES hermanos(id) ON DELETE CASCADE,
                PRIMARY KEY (familia_id, hermano_id)
            );",
        )?;

        Ok(())
    }
}
