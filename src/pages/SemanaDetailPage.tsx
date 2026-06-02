import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ASIGNACION_LABELS } from "../types";
import type { Semana } from "../types";

interface Parte {
	id: number;
	semana_id: number;
	numero_orden: number;
	seccion: string;
	tipo_asignacion: string;
	titulo: string | null;
	duracion_minutos: number | null;
	requiere_sala_auxiliar: boolean;
	requiere_ayudante: boolean;
}

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

const SECCION_COLORS: Record<string, string> = {
	tesoros: "bg-blue-100 text-blue-700",
	mejores_maestros: "bg-green-100 text-green-700",
	vida_cristiana: "bg-orange-100 text-orange-700",
	marco: "bg-gray-100 text-gray-500",
};

const SECCION_LABELS: Record<string, string> = {
	tesoros: "Tesoros",
	mejores_maestros: "Mejores Maestros",
	vida_cristiana: "Vida Cristiana",
	marco: "Marco",
};

function formatDateRange(inicio: string, fin: string) {
	const fmt = (d: string) => {
		const [y, m, day] = d.split("-");
		return `${day}/${m}/${y}`;
	};
	return `${fmt(inicio)} - ${fmt(fin)}`;
}

export default function SemanaDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [semana, setSemana] = useState<Semana | null>(null);
	const [partes, setPartes] = useState<Parte[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!id) return;
		loadData(Number(id));
	}, [id]);

	const loadData = async (semanaId: number) => {
		try {
			setLoading(true);
			setError(null);
			const [sem, pts] = await Promise.all([
				invoke<Semana>("get_semana", { id: semanaId }),
				invoke<Parte[]>("list_partes", { semanaId }),
			]);
			setSemana(sem);
			setPartes(pts);
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!semana) return;
		if (!confirm(`¿Eliminar la semana del ${formatDateRange(semana.fecha_inicio, semana.fecha_fin)}?`))
			return;
		try {
			setDeleting(true);
			await invoke("delete_semana", { id: semana.id });
			navigate("/semanas");
		} catch (err) {
			setError(String(err));
			setDeleting(false);
		}
	};

	const handleAssign = () => {
		alert("La página de asignaciones estará disponible próximamente (Sprint 5).");
	};

	if (loading) {
		return <p className="text-gray-500 text-center py-8">Cargando...</p>;
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-red-500 mb-4">{error}</p>
				<Link
					to="/semanas"
					className="text-slate-600 hover:text-slate-800 underline text-sm"
				>
					Volver a semanas
				</Link>
			</div>
		);
	}

	if (!semana) return null;

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-gray-800">
					Semana {formatDateRange(semana.fecha_inicio, semana.fecha_fin)}
				</h1>
				<Link
					to="/semanas"
					className="text-slate-600 hover:text-slate-800 underline text-sm"
				>
					← Volver
				</Link>
			</div>

			<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
				<div className="flex items-center gap-3 flex-wrap">
					<span
						className={`inline-block text-xs px-2 py-0.5 rounded-full ${
							TIPO_ESPECIAL_COLORS[semana.tipo_especial] ??
							"bg-gray-100 text-gray-700"
						}`}
					>
						{TIPO_ESPECIAL_LABELS[semana.tipo_especial] ?? semana.tipo_especial}
					</span>
					{semana.libro_biblico && (
						<span className="text-sm text-gray-600">
							{semana.libro_biblico}
						</span>
					)}
				</div>

				<div className="text-xs text-gray-500">
					<strong>Canciones:</strong>{" "}
					{[semana.cancion_apertura, semana.cancion_intermedia, semana.cancion_cierre]
						.filter(Boolean)
						.join(" · ") || "—"}
				</div>

				<div className="flex gap-2 pt-1">
					<Link
						to={`/semanas/${semana.id}/editar`}
						className="px-4 py-1.5 rounded text-sm bg-slate-700 text-white hover:bg-slate-800 transition-colors"
					>
						Editar
					</Link>
					<button
						onClick={handleAssign}
						className="px-4 py-1.5 rounded text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
					>
						Asignar hermanos
					</button>
					<button
						onClick={handleDelete}
						disabled={deleting}
						className={`px-4 py-1.5 rounded text-sm transition-colors ${
							deleting
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-red-500 text-white hover:bg-red-600"
						}`}
					>
						{deleting ? "Eliminando..." : "Eliminar"}
					</button>
				</div>
			</div>

			<h2 className="text-sm font-semibold text-gray-700 mb-2">
				Partes ({partes.length})
			</h2>

			{partes.length === 0 ? (
				<div className="text-center py-8">
					<p className="text-gray-400 italic text-sm">
						Esta semana no tiene partes.
					</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
						<thead className="bg-slate-100 text-left">
							<tr>
								<th className="px-3 py-2 font-semibold w-10">#</th>
								<th className="px-3 py-2 font-semibold">Título</th>
								<th className="px-3 py-2 font-semibold">Sección</th>
								<th className="px-3 py-2 font-semibold">Tipo</th>
								<th className="px-3 py-2 font-semibold w-16">Dur.</th>
								<th className="px-3 py-2 font-semibold w-24">Flags</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{partes.map((p) => (
								<tr key={p.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-3 py-2 text-gray-500 text-xs">
										{p.numero_orden}
									</td>
									<td className="px-3 py-2">{p.titulo ?? "—"}</td>
									<td className="px-3 py-2">
										<span
											className={`inline-block text-xs px-2 py-0.5 rounded-full ${
												SECCION_COLORS[p.seccion] ??
												"bg-gray-100 text-gray-500"
											}`}
										>
											{SECCION_LABELS[p.seccion] ?? p.seccion}
										</span>
									</td>
									<td className="px-3 py-2 text-gray-600 text-xs">
										{ASIGNACION_LABELS[p.tipo_asignacion] ?? p.tipo_asignacion}
									</td>
									<td className="px-3 py-2 text-gray-600">
										{p.duracion_minutos != null
											? `${p.duracion_minutos}'`
											: "—"}
									</td>
									<td className="px-3 py-2 text-xs text-gray-500">
										{p.requiere_sala_auxiliar && (
											<span className="inline-block bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-1">
												Sala aux.
											</span>
										)}
										{p.requiere_ayudante && (
											<span className="inline-block bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">
												Ayud.
											</span>
										)}
										{!p.requiere_sala_auxiliar && !p.requiere_ayudante && (
											<span className="text-gray-300">—</span>
										)}
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
