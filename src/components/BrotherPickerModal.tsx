import { useMemo, useState } from "react";
import type { AssignmentHistory, BrotherWithHistory } from "../types";
import Modal from "./Modal";

const ROLE_LABELS: Record<string, string> = {
	estudiante: "Estudiante",
	ayudante: "Ayudante",
	conductor: "Conductor",
	lector: "Lector",
	presidente: "Presidente",
	consejero_sala: "Consejero sala",
	oracion: "Oración",
};

const AMBITO_LABELS: Record<string, string> = {
	auditorio_principal: "Auditorio",
	sala_auxiliar: "Sala auxiliar",
};

function formatDate(iso: string): string {
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}

function normalize(text: string): string {
	return text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
}

interface BrotherPickerModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	brothers: BrotherWithHistory[];
	loading: boolean;
	error: string | null;
	onSelect: (id: number | null) => void;
}

export default function BrotherPickerModal({
	open,
	onClose,
	title,
	brothers,
	loading,
	error,
	onSelect,
}: BrotherPickerModalProps) {
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [query, setQuery] = useState("");

	const filteredBrothers = useMemo(() => {
		const q = normalize(query.trim());
		if (!q) return brothers;
		return brothers.filter(({ hermano }) =>
			normalize(hermano.nombre).includes(q),
		);
	}, [brothers, query]);

	const searching = query.trim() !== "";

	return (
		<Modal open={open} onClose={onClose} title={title}>
			<div className="sticky top-0 z-10 bg-white pb-2">
				<input
					type="text"
					autoFocus
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar hermano(a)..."
					aria-label="Buscar hermano(a)"
					className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
				/>
			</div>
			{loading && (
				<p className="text-gray-500 text-sm py-4 text-center">Cargando...</p>
			)}
			{error && (
				<p className="text-red-500 text-sm py-4 text-center">{error}</p>
			)}
			{!loading && !error && brothers.length === 0 && (
				<p className="text-gray-500 text-sm py-4 text-center">
					No hay hermanos elegibles para esta asignación.
				</p>
			)}
			{!loading && !error && searching && brothers.length > 0 && filteredBrothers.length === 0 && (
				<p className="text-gray-500 text-sm py-4 text-center">
					Sin resultados.
				</p>
			)}
			<div className="space-y-2">
				<button
					type="button"
					className="w-full border border-gray-200 rounded px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
					onClick={() => onSelect(null)}
				>
					-- Sin asignar --
				</button>
				{filteredBrothers.map(({ hermano, historial }) => {
					const expanded = expandedId === hermano.id;
					const ultima = historial[0];
					return (
						<div key={hermano.id} className="border border-gray-200 rounded">
							<div className="flex items-center justify-between px-3 py-2 gap-2">
								<button
									type="button"
									className="flex-1 text-left min-w-0"
									onClick={() =>
										setExpandedId(expanded ? null : hermano.id)
									}
									aria-expanded={expanded}
								>
									<span className="text-sm text-gray-800 font-medium block truncate">
										{hermano.nombre}
									</span>
									<span className="text-xs text-gray-500 block">
										{historial.length} participaciones
										{ultima
											? ` · última: ${formatDate(
													ultima.semana_fecha_inicio,
												)} (${ROLE_LABELS[ultima.rol] ?? ultima.rol})`
											: " · sin participaciones en el período"}
									</span>
								</button>
								<button
									type="button"
									className="text-xs bg-slate-700 text-white rounded px-2 py-1 hover:bg-slate-800 shrink-0"
									onClick={() => onSelect(hermano.id)}
								>
									Seleccionar
								</button>
							</div>
							{expanded && (
								<div className="border-t border-gray-100 px-3 py-2">
									{historial.length === 0 ? (
										<p className="text-xs text-gray-400">
											Sin participaciones en los últimos meses.
										</p>
									) : (
										<table className="w-full text-xs">
											<thead>
												<tr className="text-left text-gray-500 border-b border-gray-100">
													<th className="py-1 pr-2 font-semibold">Semana</th>
													<th className="py-1 pr-2 font-semibold">Parte</th>
													<th className="py-1 pr-2 font-semibold">Rol</th>
													<th className="py-1 font-semibold">Sala</th>
												</tr>
											</thead>
											<tbody>
												{historial.map(
													(h: AssignmentHistory, i: number) => (
														<tr
															key={i}
															className="border-b border-gray-50"
														>
															<td className="py-1 pr-2 whitespace-nowrap">
																{formatDate(h.semana_fecha_inicio)}
															</td>
															<td className="py-1 pr-2">
																{h.parte_titulo}
															</td>
															<td className="py-1 pr-2">
																{ROLE_LABELS[h.rol] ?? h.rol}
															</td>
															<td className="py-1">
																{AMBITO_LABELS[h.ambito] ?? h.ambito}
															</td>
														</tr>
													),
												)}
											</tbody>
										</table>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</Modal>
	);
}
