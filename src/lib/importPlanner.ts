import type { ParsedPart, ParsedWeek, WeekType } from "../types";

/** Edits made in the import preview, keyed by `<weekIndex>-<partIndex>`. */
export type PartEdits = Record<string, Partial<ParsedPart>>;

/** Week type edits made in the import preview, keyed by week index. */
export type WeekTypeEdits = Record<number, WeekType>;

/**
 * Maps a stored or parsed week type (snake_case from the database or the
 * parser enum) to the enum value the `import_parsed_weeks` command expects.
 */
export function normalizeWeekType(raw: string): WeekType {
	switch (raw.toLowerCase()) {
		case "asamblea":
			return "Asamblea";
		case "conmemoracion":
		case "conmemoración":
			return "Conmemoracion";
		case "visitasuperintendente":
		case "visita_superintendente":
			return "VisitaSuperintendente";
		default:
			return "Normal";
	}
}

/**
 * Builds the list of weeks to send to `import_parsed_weeks`: the selected
 * weeks, in ascending index order, with the week type and part edits of the
 * preview applied. Weeks marked (or detected) as Asamblea or Conmemoracion
 * are excluded, because there is no meeting that week. The parsed weeks are
 * never mutated.
 */
export function buildImportPayload(
	weeks: ParsedWeek[],
	selectedIndices: Set<number>,
	partEdits: PartEdits,
	weekTypeEdits: WeekTypeEdits = {},
): ParsedWeek[] {
	const payload: ParsedWeek[] = [];

	for (const weekIdx of Array.from(selectedIndices).sort((a, b) => a - b)) {
		const week = weeks[weekIdx];
		const tipo = normalizeWeekType(weekTypeEdits[weekIdx] ?? week.tipo_especial);

		if (tipo === "Asamblea" || tipo === "Conmemoracion") {
			continue;
		}

		const partes = week.partes.map((p, pIdx) => {
			const edits = partEdits[`${weekIdx}-${pIdx}`] || {};
			return {
				...p,
				...(edits.titulo !== undefined && { titulo: edits.titulo }),
				...(edits.tipo_asignacion !== undefined && {
					tipo_asignacion: edits.tipo_asignacion,
				}),
				...(edits.duracion_minutos !== undefined && {
					duracion_minutos: Number(edits.duracion_minutos),
				}),
				...(edits.requiere_sala_auxiliar !== undefined && {
					requiere_sala_auxiliar: Boolean(edits.requiere_sala_auxiliar),
				}),
				...(edits.requiere_ayudante !== undefined && {
					requiere_ayudante: Boolean(edits.requiere_ayudante),
				}),
			};
		});

		payload.push({ ...week, tipo_especial: tipo, partes });
	}

	return payload;
}
