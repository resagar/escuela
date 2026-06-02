import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Semana } from "../types";

const TIPO_ESPECIAL_LABELS: Record<string, string> = {
	normal: "Normal",
	asamblea: "Asamblea",
	conmemoracion: "Conmemoración",
	visita_superintendente: "Visita del Superintendente",
};

const TIPO_ESPECIAL_COLORS: Record<string, string> = {
	normal: "bg-gray-100 text-gray-700",
	asamblea: "bg-red-100 text-red-700",
	conmemoracion: "bg-purple-100 text-purple-700",
	visita_superintendente: "bg-yellow-100 text-yellow-700",
};

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
		return <p className="text-gray-500 text-center py-8">Cargando...</p>;
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-gray-800">Semanas</h1>
				<div className="flex gap-2">
					<Link
						to="/semanas/importar"
						className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
					>
						Importar mwb
					</Link>
					<Link
						to="/semanas/nuevo"
						className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded hover:bg-slate-50 transition-colors text-sm"
					>
						+ Nueva Semana
					</Link>
				</div>
			</div>

			{error && (
				<p className="text-red-500 bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm">
					{error}
				</p>
			)}

			{semanas.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 mb-4">
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
					<table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
						<thead className="bg-slate-100 text-left">
							<tr>
								<th className="px-3 py-2 font-semibold">Semana</th>
								<th className="px-3 py-2 font-semibold">Libro</th>
								<th className="px-3 py-2 font-semibold">Tipo</th>
								<th className="px-3 py-2 font-semibold">Canciones</th>
								<th className="px-3 py-2 font-semibold">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{semanas.map((s) => (
								<tr
									key={s.id}
									className="hover:bg-gray-50 transition-colors"
								>
									<td className="px-3 py-2 whitespace-nowrap">
										{formatDateRange(s.fecha_inicio, s.fecha_fin)}
									</td>
									<td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">
										{s.libro_biblico ?? "-"}
									</td>
									<td className="px-3 py-2">
										<span
											className={`inline-block text-xs px-2 py-0.5 rounded-full ${
												TIPO_ESPECIAL_COLORS[s.tipo_especial] ??
												"bg-gray-100 text-gray-700"
											}`}
										>
											{TIPO_ESPECIAL_LABELS[s.tipo_especial] ??
												s.tipo_especial}
										</span>
									</td>
									<td className="px-3 py-2 text-xs text-gray-500">
										{s.cancion_apertura && s.cancion_intermedia && s.cancion_cierre
											? `${s.cancion_apertura} · ${s.cancion_intermedia} · ${s.cancion_cierre}`
											: "-"}
									</td>
									<td className="px-3 py-2 flex gap-2">
										<Link
											to={`/semanas/${s.id}`}
											className="text-slate-600 hover:text-slate-800 underline text-xs"
										>
											Ver
										</Link>
										<Link
											to={`/semanas/${s.id}/editar`}
											className="text-slate-600 hover:text-slate-800 underline text-xs"
										>
											Editar
										</Link>
										<button
											onClick={() =>
												handleDelete(s.id, s.fecha_inicio)
											}
											className="text-red-500 hover:text-red-700 underline text-xs"
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
