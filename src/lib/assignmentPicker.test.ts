import { describe, expect, it } from "vitest";
import type { BrotherWithHistory, RecentAssignmentParticipation } from "../types";
import { buildPickerSections } from "./assignmentPicker";

function eligible(id: number, nombre: string): BrotherWithHistory {
	return {
		hermano: {
			id, nombre, sexo: "masculino", rol: "publicador", activo: true,
			puede_presidir: false, puede_conducir_estudio: false,
			puede_ser_consejero_sala: false, notas: null,
		},
		historial: [],
	};
}

function event(id: number, nombre: string, date: string, rol = "estudiante"): RecentAssignmentParticipation {
	return {
		hermano_id: id, nombre,
		participacion: {
			semana_fecha_inicio: date, semana_fecha_fin: date,
			parte_titulo: "Example", parte_tipo: "haga_revisitas",
			ambito: "auditorio_principal", rol,
		},
	};
}

describe("buildPickerSections", () => {
	it("groups every recent role while preserving eligibility and distinct identities", () => {
		const brothers = [eligible(1, "Ana"), eligible(3, "Luis")];
		const result = buildPickerSections(brothers, [
			event(1, "Ana", "2026-10-05"),
			event(2, "Ana", "2026-10-19", "ayudante"),
			event(1, "Ana", "2026-10-19", "ayudante"),
		]);
		expect(result.recent.map((r) => [r.hermano_id, Boolean(r.eligibleBrother)])).toEqual([[1, true], [2, false]]);
		expect(result.recent[0].historial.map((h) => [h.semana_fecha_inicio, h.rol])).toEqual([
			["2026-10-19", "ayudante"], ["2026-10-05", "estudiante"],
		]);
		expect(result.remaining).toEqual([brothers[1]]);
		expect(brothers.map((b) => b.hermano.id)).toEqual([1, 3]);
	});

	it("searches both sections ignoring case, accents and surrounding whitespace", () => {
		const brothers = [eligible(1, "José"), eligible(3, "Josefina"), eligible(4, "Luis")];
		const result = buildPickerSections(brothers, [event(1, "José", "2026-10-19"), event(2, "JOSÉ", "2026-10-12")], "  josé ");
		expect(result.recent.map((p) => p.hermano_id)).toEqual([1, 2]);
		expect(result.remaining.map((b) => b.hermano.id)).toEqual([3]);
		expect(buildPickerSections(brothers, [], "Nobody")).toEqual({ recent: [], remaining: [] });
	});

	it("orders by most recent event then name and identity without changing inputs", () => {
		const events = [event(4, "Zoe", "2026-10-19"), event(3, "Ana", "2026-10-19"), event(2, "Ana", "2026-10-19"), event(1, "Bea", "2026-10-12")];
		expect(buildPickerSections([], events).recent.map((p) => p.hermano_id)).toEqual([2, 3, 4, 1]);
		expect(events.map((p) => p.hermano_id)).toEqual([4, 3, 2, 1]);
	});

	it("keeps the full eligible list available when history is empty or unavailable", () => {
		const brothers = [eligible(1, "Ana"), eligible(2, "Luis")];
		expect(buildPickerSections(brothers, [])).toEqual({ recent: [], remaining: brothers });
	});
});
