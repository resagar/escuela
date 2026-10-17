import { useState } from "react";
import { useCongregationSettings } from "../hooks/useCongregationSettings";

export default function ConfiguracionPage() {
	const { hasAuxiliaryRoom, loading, updateHasAuxiliaryRoom } = useCongregationSettings();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleToggle = async () => {
		setSaving(true);
		setError(null);
		try {
			await updateHasAuxiliaryRoom(!hasAuxiliaryRoom);
		} catch (err) {
			console.error("Error updating congregation settings:", err);
			setError("No se pudo guardar el ajuste. Inténtalo de nuevo.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <p className="text-gray-500 text-center py-8">Cargando...</p>;
	}

	return (
		<div>
			<div className="mb-4">
				<h1 className="text-xl font-bold text-gray-800">Configuración</h1>
				<p className="text-sm text-gray-500 mt-1">
					Ajustes de la congregación que aplican a toda la app.
				</p>
			</div>

			<div className="bg-white border border-gray-200 rounded-lg p-4 max-w-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-sm font-semibold text-gray-800">Sala auxiliar</h2>
						<p className="text-xs text-gray-500 mt-1">
							Indica si la congregación tiene sala auxiliar. Al desactivarla, la app no
							permite marcar «Sala aux.» en ningún editor, no pide asignaciones de ese
							ámbito y el S-140 se imprime sin la fila del consejero.
						</p>
						<p className="text-xs text-gray-500 mt-1">
							Lo ya guardado no se borra: si vuelves a activarla, todo reaparece tal cual.
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={hasAuxiliaryRoom}
						aria-label="La congregación tiene sala auxiliar"
						disabled={saving}
						onClick={handleToggle}
						className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
							hasAuxiliaryRoom ? "bg-slate-700" : "bg-gray-300"
						} ${saving ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
								hasAuxiliaryRoom ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</button>
				</div>

				<p className="text-xs text-gray-600 mt-4 pt-3 border-t border-gray-100">
					Estado actual:{" "}
					<span className="font-semibold">
						{hasAuxiliaryRoom
							? "La congregación tiene sala auxiliar"
							: "La congregación no tiene sala auxiliar"}
					</span>
					{saving && <span className="text-gray-400"> · Guardando…</span>}
				</p>
				{error && <p className="text-xs text-red-600 mt-2">{error}</p>}
			</div>
		</div>
	);
}
