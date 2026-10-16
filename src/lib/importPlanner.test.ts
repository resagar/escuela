import { describe, expect, it } from "vitest";
import type { ParsedPart, ParsedWeek } from "../types";
import {
	applyVisitaAdjustments,
	buildImportPayload,
	normalizeWeekType,
} from "./importPlanner";

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

function makeWeek(
	index: number,
	parteOverrides: Partial<ParsedPart> = {},
	weekOverrides: Partial<ParsedWeek> = {},
): ParsedWeek {
	return {
		fecha_inicio: `2026-03-${String(index + 1).padStart(2, "0")}`,
		fecha_fin: `2026-03-${String(index + 7).padStart(2, "0")}`,
		libro_biblico: `LIBRO ${index + 1}`,
		cancion_apertura: 1,
		cancion_intermedia: 2,
		cancion_cierre: 3,
		tipo_especial: "Normal",
		...weekOverrides,
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

describe("buildImportPayload with week type edits", () => {
	it("excludes the weeks marked as Asamblea or Conmemoracion", () => {
		const weeks = [makeWeek(0), makeWeek(1), makeWeek(2)];

		const payload = buildImportPayload(
			weeks,
			new Set([0, 1, 2]),
			{},
			{ 1: "Asamblea", 2: "Conmemoracion" },
		);

		expect(payload.map((w) => w.libro_biblico)).toEqual(["LIBRO 1"]);
	});

	it("imports a week again when it is marked back as Normal", () => {
		const weeks = [makeWeek(0)];

		const payload = buildImportPayload(weeks, new Set([0]), {}, { 0: "Normal" });

		expect(payload).toHaveLength(1);
		expect(payload[0].tipo_especial).toBe("Normal");
	});

	it("excludes a week that the parser already detected as special", () => {
		const weeks = [makeWeek(0, {}, { tipo_especial: "Conmemoracion" })];

		const payload = buildImportPayload(weeks, new Set([0]), {}, {});

		expect(payload).toHaveLength(0);
	});

	it("sends the week type in the enum format the backend expects", () => {
		const weeks = [makeWeek(0)];

		const payload = buildImportPayload(weeks, new Set([0]), {}, {});

		expect(payload[0].tipo_especial).toBe("Normal");
	});

	it("normalizes a stored week type back to the parser enum", () => {
		const weeks = [makeWeek(0, {}, { tipo_especial: "normal" })];

		const payload = buildImportPayload(weeks, new Set([0]), {}, {});

		expect(payload[0].tipo_especial).toBe("Normal");
	});
});

describe("normalizeWeekType", () => {
	it.each([
		["Normal", "Normal"],
		["normal", "Normal"],
		["Asamblea", "Asamblea"],
		["asamblea", "Asamblea"],
		["Conmemoracion", "Conmemoracion"],
		["conmemoracion", "Conmemoracion"],
		["Conmemoración", "Conmemoracion"],
		["VisitaSuperintendente", "VisitaSuperintendente"],
		["visita_superintendente", "VisitaSuperintendente"],
	] as const)("normalizes %s to %s", (raw, expected) => {
		expect(normalizeWeekType(raw)).toBe(expected);
	});
});

describe("applyVisitaAdjustments", () => {
	it("removes the bible study", () => {
		const partes = [
			makePart({ tipo_asignacion: "estudio_biblico" }),
			makePart({ tipo_asignacion: "haga_revisitas" }),
		];

		const result = applyVisitaAdjustments(partes);

		expect(result.map((p) => p.tipo_asignacion)).toEqual(["haga_revisitas"]);
	});

	it("clears the auxiliary classroom flag of every part", () => {
		const partes = [
			makePart({ tipo_asignacion: "haga_revisitas", requiere_sala_auxiliar: true }),
			makePart({ tipo_asignacion: "haga_discipulos", requiere_sala_auxiliar: true }),
		];

		const result = applyVisitaAdjustments(partes);

		expect(result.every((p) => p.requiere_sala_auxiliar === false)).toBe(true);
	});

	it("does not mutate the input parts", () => {
		const partes = [
			makePart({ requiere_sala_auxiliar: true }),
			makePart({ tipo_asignacion: "estudio_biblico" }),
		];
		const before = JSON.stringify(partes);

		applyVisitaAdjustments(partes);

		expect(JSON.stringify(partes)).toBe(before);
	});

	it("works with saved part shapes that carry more fields", () => {
		const partes = [
			{ id: 7, tipo_asignacion: "estudio_biblico", requiere_sala_auxiliar: false, titulo: "Estudio bíblico" },
			{ id: 8, tipo_asignacion: "haga_revisitas", requiere_sala_auxiliar: true, titulo: "Revisitas" },
		];

		const result = applyVisitaAdjustments(partes);

		expect(result).toEqual([
			{ id: 8, tipo_asignacion: "haga_revisitas", requiere_sala_auxiliar: false, titulo: "Revisitas" },
		]);
	});
});

describe("buildImportPayload with a circuit overseer visit", () => {
	function makeVisitaWeek(): ParsedWeek {
		return {
			...makeWeek(0),
			partes: [
				makePart({ numero_orden: 1, tipo_asignacion: "discurso_no_estudiante" }),
				makePart({
					numero_orden: 2,
					tipo_asignacion: "estudio_biblico",
					requiere_ayudante: true,
				}),
				makePart({
					numero_orden: 3,
					tipo_asignacion: "haga_revisitas",
					requiere_sala_auxiliar: true,
					requiere_ayudante: true,
				}),
			],
		};
	}

	it("sends the visit week without the bible study and without auxiliary classroom", () => {
		const payload = buildImportPayload(
			[makeVisitaWeek()],
			new Set([0]),
			{},
			{ 0: "VisitaSuperintendente" },
		);

		expect(payload).toHaveLength(1);
		expect(payload[0].tipo_especial).toBe("VisitaSuperintendente");
		expect(payload[0].partes.map((p) => p.tipo_asignacion)).toEqual([
			"discurso_no_estudiante",
			"haga_revisitas",
		]);
		expect(payload[0].partes.every((p) => p.requiere_sala_auxiliar === false)).toBe(
			true,
		);
	});

	it("adjusts a week that the parser already detected as a visit", () => {
		const week = { ...makeVisitaWeek(), tipo_especial: "VisitaSuperintendente" };

		const payload = buildImportPayload([week], new Set([0]), {}, {});

		expect(payload[0].partes.some((p) => p.tipo_asignacion === "estudio_biblico")).toBe(
			false,
		);
	});

	it("keeps the part edits applied on top of the adjustments", () => {
		const payload = buildImportPayload(
			[makeVisitaWeek()],
			new Set([0]),
			{ "0-2": { titulo: "Revisitas editadas" } },
			{ 0: "VisitaSuperintendente" },
		);

		expect(payload[0].partes).toHaveLength(2);
		expect(payload[0].partes[1].titulo).toBe("Revisitas editadas");
	});

	it("does not touch the auxiliary classroom of normal weeks", () => {
		const weeks = [
			makeWeek(0, { tipo_asignacion: "haga_revisitas", requiere_sala_auxiliar: true }),
		];

		const payload = buildImportPayload(weeks, new Set([0]), {}, {});

		expect(payload[0].partes[0].requiere_sala_auxiliar).toBe(true);
	});
});
