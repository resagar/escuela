import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Hermano } from "../types";

const ROL_ABBREV: Record<string, string> = {
	anciano: "Anc",
	siervo_ministerial: "SiM",
	publicador: "Pub",
	estudiante_biblia: "Est",
};

interface BrotherSelectorProps {
	tipoAsignacion: string;
	rol: string;
	ambito: string;
	sexoEstudiante?: string | null;
	estudianteId?: number | null;
	value: number | null;
	onChange: (id: number | null) => void;
}

export default function BrotherSelector({
	tipoAsignacion,
	rol,
	ambito,
	sexoEstudiante,
	estudianteId,
	value,
	onChange,
}: BrotherSelectorProps) {
	const [hermanos, setHermanos] = useState<Hermano[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadEligible();
	}, [tipoAsignacion, rol, ambito, sexoEstudiante, estudianteId]);

	const loadEligible = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await invoke<Hermano[]>("get_eligible_brothers", {
				tipoAsignacion,
				rol,
				ambito,
				sexoEstudiante: sexoEstudiante ?? null,
				estudianteId: estudianteId ?? null,
			});
			setHermanos(data);
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<select
				disabled
				className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-gray-50"
			>
				<option>Cargando...</option>
			</select>
		);
	}

	if (error) {
		return (
			<select disabled className="w-full border border-red-300 rounded px-2 py-1 text-xs bg-red-50">
				<option>Error al cargar</option>
			</select>
		);
	}

	return (
		<select
			value={value ?? ""}
			onChange={(e) => {
				const val = e.target.value;
				onChange(val ? Number(val) : null);
			}}
			className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
		>
			<option value="">-- Sin asignar --</option>
			{hermanos.map((h) => (
				<option key={h.id} value={h.id}>
					{h.nombre} ({ROL_ABBREV[h.rol] ?? h.rol})
				</option>
			))}
		</select>
	);
}
