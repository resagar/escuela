import { useState } from "react";
import type { AssignmentHistory } from "../types";

const ROLE_LABELS: Record<string, string> = {
	estudiante: "Estudiante", ayudante: "Ayudante", conductor: "Conductor",
	lector: "Lector", presidente: "Presidente", consejero_sala: "Consejero sala", oracion: "Oración",
};
const AMBITO_LABELS: Record<string, string> = {
	auditorio_principal: "Auditorio", sala_auxiliar: "Sala auxiliar",
};

function formatDate(iso: string): string {
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}

function HistoryTable({ history }: { history: AssignmentHistory[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-xs">
				<thead>
					<tr className="text-left text-ui-secondary border-b border-ui-divider">
						{["Semana", "Parte", "Rol", "Sala"].map((label) => (
							<th key={label} scope="col" className="py-1 pr-2 font-semibold">{label}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{history.map((h, i) => (
						<tr key={i} className="border-b border-ui-divider text-ui-text">
							<td className="py-1 pr-2 whitespace-nowrap">{formatDate(h.semana_fecha_inicio)}</td>
							<td className="py-1 pr-2">{h.parte_titulo}</td>
							<td className="py-1 pr-2">{ROLE_LABELS[h.rol] ?? h.rol}</td>
							<td className="py-1">{AMBITO_LABELS[h.ambito] ?? h.ambito}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

interface BrotherPickerRowProps {
	name: string;
	history: AssignmentHistory[];
	recent?: boolean;
	fullHistory?: AssignmentHistory[];
	onSelect?: () => void;
}

export default function BrotherPickerRow({ name, history, recent = false, fullHistory, onSelect }: BrotherPickerRowProps) {
	const [expanded, setExpanded] = useState(false);
	const latest = history[0];
	return (
		<div className="border border-ui-divider rounded">
			<div className="flex flex-wrap items-center justify-between px-3 py-2 gap-2">
				<div className="w-full sm:w-auto sm:flex-1 min-w-0">
					<span className="text-sm text-ui-text font-medium block break-words">{name}</span>
					{!recent && (
						<span className="text-xs text-ui-secondary block">
							{history.length} participaciones
							{latest ? ` · última: ${formatDate(latest.semana_fecha_inicio)} (${ROLE_LABELS[latest.rol] ?? latest.rol})` : " · sin participaciones en el período"}
						</span>
					)}
					{onSelect && (
						<button type="button" className="text-xs text-ui-link underline" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
							{expanded ? "Ocultar historial" : "Ver historial completo"}
						</button>
					)}
				</div>
				{onSelect ? (
					<button type="button" className="text-xs bg-slate-700 text-white rounded px-2 py-1 hover:bg-slate-800 shrink-0" onClick={onSelect} aria-label={`Seleccionar a ${name}`}>
						Seleccionar
					</button>
				) : <span className="text-xs text-ui-secondary">No elegible · solo información</span>}
			</div>
			{recent && <div className="border-t border-ui-divider px-3 py-2"><HistoryTable history={history} /></div>}
			{expanded && (
				<div className="border-t border-ui-divider px-3 py-2">
					{(fullHistory ?? history).length > 0 ? <HistoryTable history={fullHistory ?? history} /> : (
						<p className="text-xs text-ui-secondary">Sin participaciones en los últimos meses.</p>
					)}
				</div>
			)}
		</div>
	);
}
