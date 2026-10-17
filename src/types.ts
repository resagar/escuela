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
export type WeekType = "Normal" | "Asamblea" | "Conmemoracion" | "VisitaSuperintendente";

/** Single source of the week types: parser enum value, stored value and label. */
const WEEK_TYPES: Array<{ value: WeekType; stored: string; label: string }> = [
	{ value: "Normal", stored: "normal", label: "Normal" },
	{ value: "Asamblea", stored: "asamblea", label: "Asamblea" },
	{ value: "Conmemoracion", stored: "conmemoracion", label: "Conmemoración" },
	{
		value: "VisitaSuperintendente",
		stored: "visita_superintendente",
		label: "Visita del Superintendente",
	},
];

/** Options for selectors that work with the parser enum (import preview). */
export const WEEK_TYPE_OPTIONS: Array<{ value: WeekType; label: string }> =
	WEEK_TYPES.map(({ value, label }) => ({ value, label }));

/** Labels keyed by the value stored in the database, for week lists and badges. */
export const TIPO_ESPECIAL_LABELS: Record<string, string> = Object.fromEntries(
	WEEK_TYPES.map(({ stored, label }) => [stored, label]),
);

/** Badge colors keyed by the value stored in the database. */
export const TIPO_ESPECIAL_COLORS: Record<string, string> = {
	normal: "bg-gray-100 text-gray-700",
	asamblea: "bg-red-100 text-red-700",
	conmemoracion: "bg-purple-100 text-purple-700",
	visita_superintendente: "bg-yellow-100 text-yellow-700",
};

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

export interface AdjacentWeeks {
	anterior: Semana | null;
	siguiente: Semana | null;
}

export interface Parte {
	id: number;
	semana_id: number;
	numero_orden: number;
	seccion: string;
	tipo_asignacion: string;
	titulo: string | null;
	duracion_minutos: number | null;
	requiere_sala_auxiliar: boolean;
	requiere_ayudante: boolean;
}

export interface Asignacion {
	id: number;
	parte_id: number;
	ambito: string;
	rol: string;
	hermano_id: number;
}

export interface AsignacionDetail {
	id: number;
	parte_id: number;
	ambito: string;
	rol: string;
	hermano_id: number;
	hermano_nombre: string;
	hermano_rol: string;
	hermano_sexo: string;
}

export interface Familia {
	id: number;
	nombre: string;
	notas: string | null;
}

export interface CongregationSettings {
	has_auxiliary_room: boolean;
}

export interface FamiliaWithMembers extends Familia {
	miembros: Hermano[];
}

export interface FamiliaWithCount extends Familia {
	miembros_count: number;
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
	que_dirias: "¿Qué dirías?",
	analisis_auditorio: "Análisis con el auditorio",
	necesidades_congregacion: "Necesidades de la congregación",
	estudio_biblico: "Estudio bíblico",
	introduccion: "Palabras de introducción",
	conclusion: "Palabras de conclusión",
};

export interface AssignmentHistory {
	semana_fecha_inicio: string;
	semana_fecha_fin: string;
	parte_titulo: string;
	parte_tipo: string;
	ambito: string;
	rol: string;
}

export interface BrotherWithHistory {
	hermano: Hermano;
	historial: AssignmentHistory[];
}

export interface S89Card {
	parte_id: number;
	estudiante_nombre: string;
	ayudante_nombre: string | null;
	fecha_inicio: string;
	numero_orden: number;
	parte_titulo: string | null;
	ambito: string;
}
