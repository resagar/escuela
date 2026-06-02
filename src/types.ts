export interface Hermano {
	id: number;
	nombre: string;
	sexo: string;
	rol: string;
	puede_presidir: boolean;
	puede_conducir_estudio: boolean;
	puede_ser_consejero_sala: boolean;
	activo: boolean;
	notas: string | null;
}

export interface BatchHermanoInput {
	nombre: string;
	sexo: string;
	rol: string;
	puede_presidir: boolean;
	puede_conducir_estudio: boolean;
	puede_ser_consejero_sala: boolean;
}

export const ROL_LABELS: Record<string, string> = {
	anciano: "Anciano",
	siervo_ministerial: "Siervo Ministerial",
	publicador: "Publicador",
	estudiante_biblia: "Estudiante de la Biblia",
};

export type Sexo = "masculino" | "femenino";
export type Rol = "anciano" | "siervo_ministerial" | "publicador" | "estudiante_biblia";

export interface Semana {
	id: number;
	fecha_inicio: string;
	fecha_fin: string;
	libro_biblico: string | null;
	cancion_apertura: number | null;
	cancion_intermedia: number | null;
	cancion_cierre: number | null;
	tipo_especial: string;
	presidente_id: number | null;
	consejero_sala_id: number | null;
	orador_oracion_apertura_id: number | null;
	orador_oracion_intermedia_id: number | null;
	orador_oracion_cierre_id: number | null;
}

export interface ParsedPart {
	numero_orden: number;
	seccion: string;
	tipo_asignacion: string;
	titulo: string;
	duracion_minutos: number;
	requiere_sala_auxiliar: boolean;
	requiere_ayudante: boolean;
}

export interface ParsedWeek {
	fecha_inicio: string;
	fecha_fin: string;
	libro_biblico: string;
	cancion_apertura: number;
	cancion_intermedia: number;
	cancion_cierre: number;
	tipo_especial: string;
	partes: ParsedPart[];
}

export const ASIGNACION_LABELS: Record<string, string> = {
	discurso_no_estudiante: "Discurso (no estudiante)",
	busquemos_perlas: "Busquemos perlas escondidas",
	lectura_biblia: "Lectura de la Biblia",
	empiece_conversaciones: "Empiece conversaciones",
	haga_revisitas: "Haga revisitas",
	haga_discipulos: "Haga discípulos",
	explique_creencias_discurso: "Explique sus creencias (discurso)",
	explique_creencias_escenificacion: "Explique sus creencias (escenificación)",
	discurso_estudiante: "Discurso (estudiante)",
	analisis_auditorio: "Análisis con el auditorio",
	necesidades_congregacion: "Necesidades de la congregación",
	estudio_biblico: "Estudio bíblico",
	introduccion: "Palabras de introducción",
	conclusion: "Palabras de conclusión",
};
