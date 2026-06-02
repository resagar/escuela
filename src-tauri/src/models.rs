use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TipoAsignacion {
    DiscursoNoEstudiante,
    BusquemosPerlas,
    LecturaBiblia,
    EmpieceConversaciones,
    HagaRevisitas,
    HagaDiscipulos,
    ExpliqueCreenciasDiscurso,
    ExpliqueCreenciasEscenificacion,
    DiscursoEstudiante,
    AnalisisAuditorio,
    NecesidadesCongregacion,
    EstudioBiblico,
    Oracion,
    Cancion,
    Introduccion,
    Conclusion,
}

impl TipoAsignacion {
    pub fn seccion(&self) -> &'static str {
        match self {
            Self::DiscursoNoEstudiante | Self::BusquemosPerlas | Self::LecturaBiblia => "tesoros",
            Self::EmpieceConversaciones | Self::HagaRevisitas | Self::HagaDiscipulos
            | Self::ExpliqueCreenciasDiscurso | Self::ExpliqueCreenciasEscenificacion
            | Self::DiscursoEstudiante => "mejores_maestros",
            Self::AnalisisAuditorio | Self::NecesidadesCongregacion | Self::EstudioBiblico => "vida_cristiana",
            Self::Oracion | Self::Cancion | Self::Introduccion | Self::Conclusion => "marco",
        }
    }

    pub fn requiere_sala_auxiliar(&self) -> bool {
        matches!(
            self,
            Self::LecturaBiblia
                | Self::EmpieceConversaciones
                | Self::HagaRevisitas
                | Self::HagaDiscipulos
                | Self::ExpliqueCreenciasDiscurso
                | Self::ExpliqueCreenciasEscenificacion
                | Self::DiscursoEstudiante
        )
    }

    pub fn requiere_ayudante(&self) -> bool {
        matches!(
            self,
            Self::EmpieceConversaciones
                | Self::HagaRevisitas
                | Self::HagaDiscipulos
                | Self::ExpliqueCreenciasEscenificacion
        )
    }

    pub fn solo_varones(&self) -> bool {
        matches!(
            self,
            Self::LecturaBiblia | Self::ExpliqueCreenciasDiscurso | Self::DiscursoEstudiante
        )
    }

    pub fn solo_no_estudiante(&self) -> bool {
        matches!(
            self,
            Self::DiscursoNoEstudiante
                | Self::BusquemosPerlas
                | Self::AnalisisAuditorio
                | Self::NecesidadesCongregacion
                | Self::EstudioBiblico
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hermano {
    pub id: i64,
    pub nombre: String,
    pub sexo: String, // "masculino" / "femenino"
    pub rol: String,  // "anciano" / "siervo_ministerial" / "publicador" / "estudiante_biblia"
    pub puede_presidir: bool,
    pub puede_conducir_estudio: bool,
    pub puede_ser_consejero_sala: bool,
    pub activo: bool,
    pub notas: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Semana {
    pub id: i64,
    pub fecha_inicio: String, // ISO 8601 "YYYY-MM-DD"
    pub fecha_fin: String,
    pub libro_biblico: Option<String>,
    pub cancion_apertura: Option<i32>,
    pub cancion_intermedia: Option<i32>,
    pub cancion_cierre: Option<i32>,
    pub tipo_especial: String, // "normal" / "asamblea" / "conmemoracion" / "visita_superintendente"
    pub presidente_id: Option<i64>,
    pub consejero_sala_id: Option<i64>,
    pub orador_oracion_apertura_id: Option<i64>,
    pub orador_oracion_intermedia_id: Option<i64>,
    pub orador_oracion_cierre_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parte {
    pub id: i64,
    pub semana_id: i64,
    pub numero_orden: i32,
    pub seccion: String, // "tesoros" / "mejores_maestros" / "vida_cristiana"
    pub tipo_asignacion: String, // ver catálogo
    pub titulo: Option<String>,
    pub duracion_minutos: Option<i32>,
    pub requiere_sala_auxiliar: bool,
    pub requiere_ayudante: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asignacion {
    pub id: i64,
    pub parte_id: i64,
    pub ambito: String, // "auditorio_principal" / "sala_auxiliar"
    pub rol: String,    // "estudiante" / "ayudante" / "conductor" / "lector"
    pub hermano_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AsignacionDetail {
    pub id: i64,
    pub parte_id: i64,
    pub ambito: String,
    pub rol: String,
    pub hermano_id: i64,
    pub hermano_nombre: String,
    pub hermano_rol: String,
    pub hermano_sexo: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Familia {
    pub id: i64,
    pub nombre: String,
    pub notas: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FamiliaWithMembers {
    pub id: i64,
    pub nombre: String,
    pub notas: Option<String>,
    pub miembros: Vec<Hermano>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FamiliaWithCount {
    pub id: i64,
    pub nombre: String,
    pub notas: Option<String>,
    pub miembros_count: i64,
}
