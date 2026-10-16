import { describe, expect, it } from "vitest";
import type { ParsedPart, ParsedWeek } from "../types";
import { buildImportPayload } from "./importPlanner";

function makePart(overrides: Partial<ParsedPart> = {}): ParsedPart {
	return {
		numero_orden: 1,
		seccion: "tesoros",
		tipo_asignacion: "discurso_no_estudiante",
		titulo: "Discurso de ejemplo",
		duracion_minutos: 10,
		requiere_sala_auxiliar: false,
		requiere_ayudante: false,
		...overrides,
	};
}

function makeWeek(index: number, parteOverrides: Partial<ParsedPart> = {}): ParsedWeek {
	return {
		fecha_inicio: `2026-03-${String(index + 1).padStart(2, "0")}`,
		fecha_fin: `2026-03-${String(index + 7).padStart(2, "0")}`,
		libro_biblico: `LIBRO ${index + 1}`,
		cancion_apertura: 1,
		cancion_intermedia: 2,
		cancion_cierre: 3,
		tipo_especial: "Normal",
		partes: [makePart(parteOverrides)],
	};
}

describe("buildImportPayload", () => {
	it("imports only the selected weeks", () => {
		const weeks = [makeWeek(0), makeWeek(1), makeWeek(2)];

		const payload = buildImportPayload(weeks, new Set([0, 2]), {});

		expect(payload.map((w) => w.libro_biblico)).toEqual(["LIBRO 1", "LIBRO 3"]);
	});

	it("returns the selected weeks in ascending index order", () => {
		const weeks = [makeWeek(0), makeWeek(1), makeWeek(2)];

		const payload = buildImportPayload(weeks, new Set([2, 0, 1]), {});

		expect(payload.map((w) => w.libro_biblico)).toEqual(["LIBRO 1", "LIBRO 2", "LIBRO 3"]);
	});

	it("preserves all selected weeks when there are more than ten", () => {
		const weeks = Array.from({ length: 13 }, (_, i) => makeWeek(i));

		const payload = buildImportPayload(
			weeks,
			new Set(weeks.map((_, i) => i)),
			{},
		);

		expect(payload.map((w) => w.libro_biblico)).toEqual(weeks.map((w) => w.libro_biblico));
	});

	it("applies part edits to the matching week and part", () => {
		const weeks = [makeWeek(0), makeWeek(1)];

		const payload = buildImportPayload(weeks, new Set([1]), {
			"1-0": {
				titulo: "Título editado",
				tipo_asignacion: "lectura_biblia",
				duracion_minutos: 4,
				requiere_sala_auxiliar: true,
				requiere_ayudante: true,
			},
		});

		expect(payload[0].partes[0]).toMatchObject({
			titulo: "Título editado",
			tipo_asignacion: "lectura_biblia",
			duracion_minutos: 4,
			requiere_sala_auxiliar: true,
			requiere_ayudante: true,
		});
	});

	it("does not apply the edits of one week to another", () => {
		const weeks = [makeWeek(0), makeWeek(1)];

		const payload = buildImportPayload(weeks, new Set([0, 1]), {
			"0-0": { titulo: "Solo semana 0" },
		});

		expect(payload[0].partes[0].titulo).toBe("Solo semana 0");
		expect(payload[1].partes[0].titulo).toBe("Discurso de ejemplo");
	});

	it("keeps the fields without edits untouched", () => {
		const weeks = [makeWeek(0)];

		const payload = buildImportPayload(weeks, new Set([0]), {
			"0-0": { titulo: "Solo título" },
		});

		expect(payload[0].partes[0]).toMatchObject({
			numero_orden: 1,
			seccion: "tesoros",
			tipo_asignacion: "discurso_no_estudiante",
			duracion_minutos: 10,
			requiere_sala_auxiliar: false,
			requiere_ayudante: false,
		});
	});

	it("does not mutate the parsed weeks", () => {
		const weeks = [makeWeek(0)];
		const before = JSON.stringify(weeks);

		buildImportPayload(weeks, new Set([0]), { "0-0": { titulo: "Editado" } });

		expect(JSON.stringify(weeks)).toBe(before);
	});
});
