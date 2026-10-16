import type { ParsedPart, ParsedWeek } from "../types";

/** Edits made in the import preview, keyed by `<weekIndex>-<partIndex>`. */
export type PartEdits = Record<string, Partial<ParsedPart>>;

/**
 * Builds the list of weeks to send to `import_parsed_weeks`: the selected
 * weeks, in ascending index order, with the part edits of the preview applied.
 * The parsed weeks are never mutated.
 */
export function buildImportPayload(
	weeks: ParsedWeek[],
	selectedIndices: Set<number>,
	partEdits: PartEdits,
): ParsedWeek[] {
	return Array.from(selectedIndices)
		.sort((a, b) => a - b)
		.map((weekIdx) => {
			const week = weeks[weekIdx];
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
			return { ...week, partes };
		});
}
