import { useMemo, useState } from "react";
import type { BrotherWithHistory, RecentAssignmentParticipation } from "../types";
import { buildPickerSections } from "../lib/assignmentPicker";
import BrotherPickerRow from "./BrotherPickerRow";
import Modal from "./Modal";

interface BrotherPickerModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	brothers: BrotherWithHistory[];
	recentParticipations: RecentAssignmentParticipation[];
	recentLoading: boolean;
	recentError: string | null;
	loading: boolean;
	error: string | null;
	onSelect: (id: number | null) => void;
}

export default function BrotherPickerModal({
	open, onClose, title, brothers, recentParticipations, recentLoading, recentError,
	loading, error, onSelect,
}: BrotherPickerModalProps) {
	const [query, setQuery] = useState("");
	const { recent, remaining } = useMemo(() => buildPickerSections(
		loading || error ? [] : brothers,
		recentLoading || recentError ? [] : recentParticipations,
		query,
	), [brothers, recentParticipations, recentLoading, recentError, loading, error, query]);
	const searching = query.trim() !== "";

	return (
		<Modal open={open} onClose={onClose} title={title}>
			<div className="sticky top-0 z-10 bg-white pb-2">
				<input type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar hermano(a)..." aria-label="Buscar hermano(a)"
					className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
			</div>
			<section aria-label="Participantes recientes" className="mb-4">
				<h3 className="text-sm font-semibold text-gray-800">Participaron en esta asignación en las 3 semanas anteriores</h3>
				<p className="text-xs text-gray-600 mt-1 mb-2">Solo información: participar recientemente no impide volver a ser asignado.</p>
				{recentLoading ? <p role="status" className="text-sm text-gray-600 py-2">Cargando participaciones recientes...</p>
					: recentError ? <p role="alert" className="text-sm text-red-700 py-2">No se pudieron cargar las participaciones recientes. Cierre y vuelva a abrir el selector para reintentar.</p>
						: recent.length === 0 ? <p className="text-sm text-gray-600 py-2">{searching ? "Sin participantes recientes que coincidan con la búsqueda." : "No hay participaciones registradas para esta asignación en las 3 semanas anteriores."}</p>
							: <div className="space-y-2">{recent.map((participant) => (
								<BrotherPickerRow key={participant.hermano_id} name={participant.nombre} history={participant.historial} recent
									fullHistory={participant.eligibleBrother?.historial}
									onSelect={participant.eligibleBrother ? () => onSelect(participant.hermano_id) : undefined} />
							))}</div>}
			</section>
			<section aria-label="Hermanos elegibles">
				<h3 className="text-sm font-semibold text-gray-800 mb-2">Hermanos elegibles</h3>
				{loading && <p role="status" className="text-gray-600 text-sm py-2">Cargando...</p>}
				{error && <p role="alert" className="text-red-700 text-sm py-2">{error}</p>}
				{!loading && !error && brothers.length === 0 && <p className="text-gray-600 text-sm py-2">No hay hermanos elegibles para esta asignación.</p>}
				{!loading && !error && searching && recent.every((p) => !p.eligibleBrother) && remaining.length === 0 && brothers.length > 0 && <p className="text-gray-600 text-sm py-2">Sin hermanos elegibles que coincidan con la búsqueda.</p>}
				<div className="space-y-2">
					<button type="button" className="w-full border border-gray-200 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50" onClick={() => onSelect(null)}>-- Sin asignar --</button>
					{remaining.map(({ hermano, historial }) => (
						<BrotherPickerRow key={hermano.id} name={hermano.nombre} history={historial} onSelect={() => onSelect(hermano.id)} />
					))}
				</div>
			</section>
		</Modal>
	);
}
