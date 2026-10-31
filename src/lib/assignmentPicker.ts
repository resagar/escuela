import type { AssignmentHistory, BrotherWithHistory, RecentAssignmentParticipation } from "../types";

export interface RecentParticipant {
	hermano_id: number;
	nombre: string;
	historial: AssignmentHistory[];
	eligibleBrother?: BrotherWithHistory;
}

function normalize(text: string): string {
	return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** History informs selection; only the existing eligibility result grants selection. */
export function buildPickerSections(
	brothers: BrotherWithHistory[],
	participations: RecentAssignmentParticipation[],
	query = "",
): { recent: RecentParticipant[]; remaining: BrotherWithHistory[] } {
	const eligibleById = new Map(brothers.map((brother) => [brother.hermano.id, brother]));
	const byId = new Map<number, RecentParticipant>();
	for (const { hermano_id, nombre, participacion } of participations) {
		let participant = byId.get(hermano_id);
		if (!participant) {
			participant = { hermano_id, nombre, historial: [], eligibleBrother: eligibleById.get(hermano_id) };
			byId.set(hermano_id, participant);
		}
		participant.historial.push(participacion);
	}
	for (const participant of byId.values()) {
		participant.historial.sort((a, b) => b.semana_fecha_inicio.localeCompare(a.semana_fecha_inicio));
	}
	const search = normalize(query.trim());
	const matches = (name: string) => normalize(name).includes(search);
	const recent = [...byId.values()]
		.filter((p) => matches(p.nombre))
		.sort((a, b) => b.historial[0].semana_fecha_inicio.localeCompare(a.historial[0].semana_fecha_inicio)
			|| a.nombre.localeCompare(b.nombre, "es") || a.hermano_id - b.hermano_id);
	const remaining = brothers.filter(({ hermano }) => !byId.has(hermano.id) && matches(hermano.nombre));
	return { recent, remaining };
}
