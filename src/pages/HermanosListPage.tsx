import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Hermano } from "../types";
import { ROL_LABELS } from "../types";

type StatusFilter = "active" | "inactive";

export default function HermanosListPage() {
	const [hermanos, setHermanos] = useState<Hermano[]>([]);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
	const [loading, setLoading] = useState(true);

	const loadHermanos = async () => {
		try {
			const data = await invoke<Hermano[]>("list_hermanos", {
				soloActivos: false,
			});
			setHermanos(data);
		} catch (err) {
			console.error("Error loading hermanos:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadHermanos();
	}, []);

	const handleDeactivate = async (id: number, nombre: string) => {
		if (!confirm(`¿Desactivar a ${nombre}?`)) return;
		try {
			await invoke("deactivate_hermano", { id });
			loadHermanos();
		} catch (err) {
			console.error("Error deactivating hermano:", err);
		}
	};

	const handleReactivate = async (id: number, nombre: string) => {
		if (!confirm(`¿Reactivar a ${nombre}?`)) return;
		try {
			await invoke("reactivate_hermano", { id });
			loadHermanos();
		} catch (err) {
			console.error("Error reactivating hermano:", err);
		}
	};

	if (loading) {
		return <p className="text-gray-500 text-center py-8">Cargando...</p>;
	}

	const visibleHermanos = hermanos.filter((h) =>
		statusFilter === "active" ? h.activo : !h.activo,
	);

	const emptyMessage =
		hermanos.length === 0
			? "No hay hermanos registrados. ¡Agrega el primero!"
			: statusFilter === "active"
				? "No hay hermanos activos."
				: "No hay hermanos inactivos.";

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-gray-800">Hermanos</h1>
				<div className="flex items-center gap-3">
					<span className="text-xs text-gray-500">Mostrar:</span>
					<div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
						<button
							type="button"
							onClick={() => setStatusFilter("active")}
							className={`px-3 py-1.5 transition-colors ${
								statusFilter === "active"
									? "bg-slate-700 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							Activos
						</button>
						<button
							type="button"
							onClick={() => setStatusFilter("inactive")}
							className={`px-3 py-1.5 transition-colors ${
								statusFilter === "inactive"
									? "bg-slate-700 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							Inactivos
						</button>
					</div>
					<Link
						to="/hermanos/nuevo"
						className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
					>
						+ Nuevo Hermano
					</Link>
				</div>
			</div>

			{visibleHermanos.length === 0 ? (
				<p className="text-gray-500 text-center py-8">{emptyMessage}</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
						<thead className="bg-slate-100 text-left">
							<tr>
								<th className="px-3 py-2 font-semibold">Nombre</th>
								<th className="px-3 py-2 font-semibold">Sexo</th>
								<th className="px-3 py-2 font-semibold">Rol</th>
								<th className="px-3 py-2 font-semibold">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{visibleHermanos.map((h) => (
								<tr key={h.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-3 py-2">
										{h.nombre}
										{!h.activo && (
											<span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
												Inactivo
											</span>
										)}
									</td>
									<td className="px-3 py-2 capitalize">{h.sexo}</td>
									<td className="px-3 py-2 text-xs">
										{ROL_LABELS[h.rol] ?? h.rol}
									</td>
									<td className="px-3 py-2 flex gap-2">
										<Link
											to={`/hermanos/${h.id}/editar`}
											className="text-slate-600 hover:text-slate-800 underline text-xs"
										>
											Editar
										</Link>
										{h.activo ? (
											<button
												onClick={() => handleDeactivate(h.id, h.nombre)}
												className="text-red-500 hover:text-red-700 underline text-xs"
											>
												Desactivar
											</button>
										) : (
											<button
												onClick={() => handleReactivate(h.id, h.nombre)}
												className="text-emerald-600 hover:text-emerald-800 underline text-xs"
											>
												Reactivar
											</button>
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
