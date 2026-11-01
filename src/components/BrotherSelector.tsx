import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { BrotherWithHistory, Hermano, RecentAssignmentParticipation } from "../types";
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
	fechaReferencia: string;
	sexoEstudiante?: string | null;
	estudianteId?: number | null;
	value: number | null;
	onChange: (id: number | null) => void;
}

export default function BrotherSelector(props: BrotherSelectorProps) {
	const contextKey = JSON.stringify([
		props.tipoAsignacion, props.rol, props.ambito, props.fechaReferencia,
		props.sexoEstudiante, props.estudianteId,
	]);
	return <AssignmentSelector key={contextKey} {...props} />;
}

function AssignmentSelector({
	tipoAsignacion,
	rol,
	ambito,
	fechaReferencia,
	sexoEstudiante,
	estudianteId,
	value,
	onChange,
}: BrotherSelectorProps) {
	const [brothers, setBrothers] = useState<BrotherWithHistory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [fallbackName, setFallbackName] = useState<string | null>(null);
	const [recentParticipations, setRecentParticipations] = useState<RecentAssignmentParticipation[]>([]);
	const [recentLoading, setRecentLoading] = useState(true);
	const [recentError, setRecentError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		invoke<BrotherWithHistory[]>(
				"get_eligible_brothers_with_history",
				{
					tipoAsignacion,
					rol,
					ambito,
					sexoEstudiante: sexoEstudiante ?? null,
					estudianteId: estudianteId ?? null,
					months: HISTORY_MONTHS,
					fechaReferencia,
				},
			).then((data) => {
				if (!cancelled) setBrothers(data);
			}).catch((err) => {
				if (!cancelled) setError(String(err));
			}).finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => { cancelled = true; };
	}, [tipoAsignacion, rol, ambito, sexoEstudiante, estudianteId, fechaReferencia]);

	useEffect(() => {
		if (!modalOpen) return;
		let cancelled = false;
		invoke<RecentAssignmentParticipation[]>("get_recent_assignment_participants", {
			tipoAsignacion, rol, fechaReferencia,
		}).then((data) => {
			if (!cancelled) setRecentParticipations(data);
		}).catch((err) => {
			if (!cancelled) setRecentError(String(err));
		}).finally(() => {
			if (!cancelled) setRecentLoading(false);
		});
		return () => { cancelled = true; };
	}, [modalOpen, tipoAsignacion, rol, fechaReferencia]);

	useEffect(() => {
		if (value == null) {
			setFallbackName(null);
			return;
		}
		if (brothers.some((b) => b.hermano.id === value)) {
			setFallbackName(null);
			return;
		}
		let cancelled = false;
		setFallbackName(null);
		invoke<Hermano>("get_hermano", { id: value })
			.then((h) => { if (!cancelled) setFallbackName(h.nombre); })
			.catch(() => { if (!cancelled) setFallbackName(null); });
		return () => { cancelled = true; };
	}, [value, brothers]);

	const selected =
		value != null ? brothers.find((b) => b.hermano.id === value) : undefined;
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
				onClick={() => {
					setRecentLoading(true);
					setRecentError(null);
					setRecentParticipations([]);
					setModalOpen(true);
				}}
				className={`w-full border rounded px-2 py-1 text-xs text-left flex items-center justify-between gap-2 ${
					error
						? "border-ui-danger-border bg-ui-danger-surface text-ui-danger"
						: "border-ui-border bg-ui-surface hover:bg-ui-canvas text-ui-text"
				} ${loading ? "cursor-wait" : ""}`}
			>
				<span className="truncate">
					{label}
				</span>
				<span className="text-ui-muted text-[10px] shrink-0">▾</span>
			</button>
			<BrotherPickerModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				title={pickerTitle(tipoAsignacion, rol)}
				brothers={brothers}
				recentParticipations={recentParticipations}
				recentLoading={recentLoading}
				recentError={recentError}
				loading={loading}
				error={error}
				onSelect={(id) => {
					if (id !== null && (loading || error || !brothers.some((b) => b.hermano.id === id))) return;
					onChange(id);
					setModalOpen(false);
				}}
			/>
		</div>
	);
}
