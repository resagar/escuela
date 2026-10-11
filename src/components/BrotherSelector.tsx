import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { BrotherWithHistory, Hermano } from "../types";
import { ASIGNACION_LABELS } from "../types";
import BrotherPickerModal from "./BrotherPickerModal";

const ROL_ABBREV: Record<string, string> = {
	anciano: "Anc",
	siervo_ministerial: "SiM",
	publicador: "Pub",
	estudiante_biblia: "Est",
};

const MARCO_ROLE_TITLES: Record<string, string> = {
	presidente: "Presidente de la reunión",
	consejero_sala: "Consejero de sala auxiliar",
	oracion: "Oración",
};

const HISTORY_MONTHS = 4;

function pickerTitle(tipoAsignacion: string, rol: string): string {
	const marco = MARCO_ROLE_TITLES[rol];
	if (marco) return `Seleccionar — ${marco}`;
	const label =
		ASIGNACION_LABELS[tipoAsignacion as keyof typeof ASIGNACION_LABELS];
	return `Seleccionar — ${label ?? tipoAsignacion}`;
}

interface BrotherSelectorProps {
	tipoAsignacion: string;
	rol: string;
	ambito: string;
	sexoEstudiante?: string | null;
	estudianteId?: number | null;
	value: number | null;
	onChange: (id: number | null) => void;
	stats?: Map<number, number>;
}

export default function BrotherSelector({
	tipoAsignacion,
	rol,
	ambito,
	sexoEstudiante,
	estudianteId,
	value,
	onChange,
	stats,
}: BrotherSelectorProps) {
	const [brothers, setBrothers] = useState<BrotherWithHistory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [fallbackName, setFallbackName] = useState<string | null>(null);

	useEffect(() => {
		loadEligible();
	}, [tipoAsignacion, rol, ambito, sexoEstudiante, estudianteId]);

	const loadEligible = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await invoke<BrotherWithHistory[]>(
				"get_eligible_brothers_with_history",
				{
					tipoAsignacion,
					rol,
					ambito,
					sexoEstudiante: sexoEstudiante ?? null,
					estudianteId: estudianteId ?? null,
					months: HISTORY_MONTHS,
				},
			);
			setBrothers(data);
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (value == null) {
			setFallbackName(null);
			return;
		}
		if (brothers.some((b) => b.hermano.id === value)) {
			setFallbackName(null);
			return;
		}
		invoke<Hermano>("get_hermano", { id: value })
			.then((h) => setFallbackName(h.nombre))
			.catch(() => setFallbackName(null));
	}, [value, brothers]);

	const selected =
		value != null ? brothers.find((b) => b.hermano.id === value) : undefined;
	const count = value != null ? stats?.get(value) : undefined;
	const displayName = selected
		? `${selected.hermano.nombre} (${
				ROL_ABBREV[selected.hermano.rol] ?? selected.hermano.rol
			})`
		: fallbackName;
	const label = loading ? "Cargando..." : (displayName ?? "-- Sin asignar --");

	return (
		<div className="relative">
			<button
				type="button"
				disabled={loading}
				aria-haspopup="dialog"
				onClick={() => setModalOpen(true)}
				className={`w-full border rounded px-2 py-1 text-xs text-left flex items-center justify-between gap-2 ${
					error
						? "border-red-300 bg-red-50 text-red-700"
						: "border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
				} ${loading ? "cursor-wait" : ""}`}
			>
				<span className="truncate">
					{label}
					{count !== undefined && count > 0 ? ` [${count}x]` : ""}
				</span>
				<span className="text-gray-400 text-[10px] shrink-0">▾</span>
			</button>
			<BrotherPickerModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				title={pickerTitle(tipoAsignacion, rol)}
				brothers={brothers}
				loading={loading}
				error={error}
				onSelect={(id) => {
					onChange(id);
					setModalOpen(false);
				}}
			/>
		</div>
	);
}
