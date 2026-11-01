import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { TIPO_ESPECIAL_COLORS, TIPO_ESPECIAL_LABELS } from "../types";
import type { Semana } from "../types";

function formatDateRange(inicio: string, fin: string) {
	const fmt = (d: string) => {
		const [y, m, day] = d.split("-");
		return `${day}/${m}/${y}`;
	};
	return `${fmt(inicio)} - ${fmt(fin)}`;
}

export default function SemanasListPage() {
	const [semanas, setSemanas] = useState<Semana[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadSemanas = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await invoke<Semana[]>("list_semanas");
			setSemanas(data);
		} catch (err) {
			console.error("Error loading semanas:", err);
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSemanas();
	}, []);

	const handleDelete = async (id: number, fecha: string) => {
		if (!confirm(`¿Eliminar la semana del ${fecha}?`)) return;
		try {
			await invoke("delete_semana", { id });
			loadSemanas();
		} catch (err) {
			console.error("Error deleting semana:", err);
		}
	};

	if (loading) {
		return <p className="text-ui-muted text-center py-8">Cargando...</p>;
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-ui-text">Semanas</h1>
				<div className="flex gap-2">
					<Link
						to="/semanas/importar"
						className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
					>
						Importar mwb
					</Link>
					<Link
						to="/semanas/nuevo"
						className="bg-ui-surface text-ui-link border border-ui-border px-4 py-2 rounded hover:bg-ui-hover transition-colors text-sm"
					>
						+ Nueva Semana
					</Link>
				</div>
			</div>

			{error && (
				<p className="text-ui-danger bg-ui-danger-surface border border-ui-danger-border rounded p-3 mb-4 text-sm">
					{error}
				</p>
			)}

			{semanas.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-ui-muted mb-4">
						No hay semanas. ¡Importa el primer mwb!
					</p>
					<Link
						to="/semanas/importar"
						className="bg-slate-700 text-white px-6 py-2 rounded hover:bg-slate-800 transition-colors"
					>
						Importar mwb
					</Link>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm border border-ui-divider rounded-lg overflow-hidden">
						<thead className="bg-ui-subtle text-left">
							<tr>
								<th className="px-3 py-2 font-semibold">Semana</th>
								<th className="px-3 py-2 font-semibold">Libro</th>
								<th className="px-3 py-2 font-semibold">Tipo</th>
								<th className="px-3 py-2 font-semibold">Canciones</th>
								<th className="px-3 py-2 font-semibold">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-ui-divider">
							{semanas.map((s) => (
								<tr
									key={s.id}
									className="hover:bg-ui-canvas transition-colors"
								>
									<td className="px-3 py-2 whitespace-nowrap">
										{formatDateRange(s.fecha_inicio, s.fecha_fin)}
									</td>
									<td className="px-3 py-2 text-ui-secondary max-w-[200px] truncate">
										{s.libro_biblico ?? "-"}
									</td>
									<td className="px-3 py-2">
										<span
											className={`inline-block text-xs px-2 py-0.5 rounded-full ${
												TIPO_ESPECIAL_COLORS[s.tipo_especial] ??
												"bg-ui-subtle text-ui-text"
											}`}
										>
											{TIPO_ESPECIAL_LABELS[s.tipo_especial] ??
												s.tipo_especial}
										</span>
									</td>
									<td className="px-3 py-2 text-xs text-ui-muted">
										{s.cancion_apertura && s.cancion_intermedia && s.cancion_cierre
											? `${s.cancion_apertura} · ${s.cancion_intermedia} · ${s.cancion_cierre}`
											: "-"}
									</td>
									<td className="px-3 py-2 flex gap-2">
										<Link
											to={`/semanas/${s.id}`}
											className="text-ui-link hover:text-ui-link underline text-xs"
										>
											Ver
										</Link>
										<Link
											to={`/semanas/${s.id}/editar`}
											className="text-ui-link hover:text-ui-link underline text-xs"
										>
											Editar
										</Link>
										<Link
											to={`/semanas/${s.id}/s89`}
											className="text-ui-link hover:text-ui-link underline text-xs"
										>
											S-89
										</Link>
										<button
											onClick={() =>
												handleDelete(s.id, s.fecha_inicio)
											}
											className="text-ui-danger hover:text-ui-danger underline text-xs"
										>
											Eliminar
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
