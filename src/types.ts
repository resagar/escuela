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
