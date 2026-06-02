import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Hermano } from "../types";
import { ROL_LABELS } from "../types";

export default function HermanosListPage() {
	const [hermanos, setHermanos] = useState<Hermano[]>([]);
	const [loading, setLoading] = useState(true);

	const loadHermanos = async () => {
		try {
			const data = await invoke<Hermano[]>("list_hermanos", {
				soloActivos: true,
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

	if (loading) {
		return <p className="text-gray-500 text-center py-8">Cargando...</p>;
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-gray-800">Hermanos</h1>
				<Link
					to="/hermanos/nuevo"
					className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
				>
					+ Nuevo Hermano
				</Link>
			</div>

			{hermanos.length === 0 ? (
				<p className="text-gray-500 text-center py-8">
					No hay hermanos registrados. ¡Agrega el primero!
				</p>
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
							{hermanos.map((h) => (
								<tr key={h.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-3 py-2">{h.nombre}</td>
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
										<button
											onClick={() => handleDeactivate(h.id, h.nombre)}
											className="text-red-500 hover:text-red-700 underline text-xs"
										>
											Desactivar
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
