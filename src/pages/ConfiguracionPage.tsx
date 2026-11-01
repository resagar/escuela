import { useState } from "react";
import { useCongregationSettings } from "../hooks/useCongregationSettings";
import { useTheme } from "../hooks/useTheme";

export default function ConfiguracionPage() {
	const { theme, setTheme, storageError } = useTheme();
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
		return <p className="text-ui-muted text-center py-8">Cargando...</p>;
	}

	return (
		<div>
			<div className="mb-4">
				<h1 className="text-xl font-bold text-ui-text">Configuración</h1>
				<p className="text-sm text-ui-muted mt-1">
					Apariencia de esta instalación y ajustes de la congregación.
				</p>
			</div>

			<section className="bg-ui-surface border border-ui-divider rounded-lg p-4 max-w-2xl mb-4" aria-labelledby="appearance-title">
				<h2 id="appearance-title" className="text-sm font-semibold text-ui-text">Apariencia</h2>
				<p className="text-xs text-ui-muted mt-1 mb-3">Solo cambia la interfaz de esta instalación. Los formularios S-140 y S-89 conservan sus colores.</p>
				<label htmlFor="interface-theme" className="text-sm text-ui-text mr-3">Tema de la interfaz</label>
				<select id="interface-theme" value={theme} onChange={(event) => setTheme(event.target.value === "dark" ? "dark" : "light")} className="border border-ui-border rounded px-2 py-1 text-sm">
					<option value="light">Claro</option>
					<option value="dark">Oscuro</option>
				</select>
				{storageError && <p role="status" className="text-xs text-ui-danger mt-2">El tema se aplicó, pero no se pudo guardar. Se perderá al reiniciar la aplicación.</p>}
			</section>
			<div className="bg-ui-surface border border-ui-divider rounded-lg p-4 max-w-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-sm font-semibold text-ui-text">Sala auxiliar</h2>
						<p className="text-xs text-ui-muted mt-1">
							Indica si la congregación tiene sala auxiliar. Al desactivarla, la app no
							permite marcar «Sala aux.» en ningún editor, no pide asignaciones de ese
							ámbito y el S-140 se imprime sin la fila del consejero.
						</p>
						<p className="text-xs text-ui-muted mt-1">
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
							hasAuxiliaryRoom ? "bg-slate-700" : "bg-ui-disabled"
						} ${saving ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
								hasAuxiliaryRoom ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</button>
				</div>

				<p className="text-xs text-ui-secondary mt-4 pt-3 border-t border-ui-divider">
					Estado actual:{" "}
					<span className="font-semibold">
						{hasAuxiliaryRoom
							? "La congregación tiene sala auxiliar"
							: "La congregación no tiene sala auxiliar"}
					</span>
					{saving && <span className="text-ui-muted"> · Guardando…</span>}
				</p>
				{error && <p className="text-xs text-ui-danger mt-2">{error}</p>}
			</div>
		</div>
	);
}
