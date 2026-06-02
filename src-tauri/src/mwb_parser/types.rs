use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedWeek {
    pub fecha_inicio: String,
    pub fecha_fin: String,
    pub libro_biblico: String,
    pub cancion_apertura: u8,
    pub cancion_intermedia: u8,
    pub cancion_cierre: u8,
    pub tipo_especial: TipoEspecial,
    pub partes: Vec<ParsedPart>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedPart {
    pub numero_orden: u8,
    pub seccion: String,
    pub tipo_asignacion: String,
    pub titulo: String,
    pub duracion_minutos: u8,
    pub requiere_sala_auxiliar: bool,
    pub requiere_ayudante: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TipoEspecial {
    Normal,
    Asamblea,
    Conmemoracion,
    VisitaSuperintendente,
    SinReunion,
}
