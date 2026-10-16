import type { ParsedPart, ParsedWeek } from "../types";

/**
 * Builds the payload sent to `import_parsed_weeks` from the parsed weeks and the
 * per-part edits made in the import preview.
 *
 * The auxiliary-room mark comes from the parser or from an explicit edit: the
 * congregation setting is deliberately absent here, so the lock can never force
 * that flag to `false`. The imported mark is kept as is and simply stays inactive
 * while the congregation has no auxiliary room (requirements §5.1).
 */
export function buildImportData(
	parsedWeeks: ParsedWeek[],
	selectedIndices: Set<number>,
	editingParts: Record<string, Partial<ParsedPart>>,
): ParsedWeek[] {
	return Array.from(selectedIndices)
		.sort()
		.map((weekIdx) => {
			const original = parsedWeeks[weekIdx];
			const partes = original.partes.map((p, pIdx) => {
				const key = `${weekIdx}-${pIdx}`;
				const edits = editingParts[key] || {};
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
			return { ...original, partes };
		});
}
