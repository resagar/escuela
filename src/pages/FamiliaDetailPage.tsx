import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { FamiliaWithMembers, Hermano } from "../types";
import { ROL_LABELS } from "../types";

export default function FamiliaDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [familia, setFamilia] = useState<FamiliaWithMembers | null>(null);
	const [allHermanos, setAllHermanos] = useState<Hermano[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedHermanoId, setSelectedHermanoId] = useState<number | null>(null);
	const [adding, setAdding] = useState(false);

	const loadData = async () => {
		if (!id) return;
		try {
			setLoading(true);
			setError(null);
			const [fam, hermanos] = await Promise.all([
				invoke<FamiliaWithMembers>("get_familia", { id: Number(id) }),
				invoke<Hermano[]>("list_hermanos", { soloActivos: true }),
			]);
			setFamilia(fam);
			setAllHermanos(hermanos);
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, [id]);

	const availableHermanos = allHermanos.filter(
		(h) => !familia?.miembros.some((m) => m.id === h.id),
	);

	const handleAddMember = async () => {
		if (!id || selectedHermanoId === null) return;
		try {
			setAdding(true);
			await invoke("add_familia_member", {
				familiaId: Number(id),
				hermanoId: selectedHermanoId,
			});
			setSelectedHermanoId(null);
			loadData();
		} catch (err) {
			console.error("Error adding member:", err);
		} finally {
			setAdding(false);
		}
	};

	const handleRemoveMember = async (hermanoId: number, nombre: string) => {
		if (!id) return;
		if (!confirm(`¿Quitar a ${nombre} de esta familia?`)) return;
		try {
			await invoke("remove_familia_member", {
				familiaId: Number(id),
				hermanoId,
			});
			loadData();
		} catch (err) {
			console.error("Error removing member:", err);
		}
	};

	const handleDeleteFamily = async () => {
		if (!familia) return;
		if (!confirm(`¿Eliminar la familia "${familia.nombre}" permanentemente?`)) return;
		try {
			await invoke("delete_familia", { id: Number(id) });
			navigate("/familias");
		} catch (err) {
			console.error("Error deleting familia:", err);
		}
	};

	if (loading) {
		return <p className="text-gray-500 text-center py-8">Cargando...</p>;
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-red-500 mb-4">{error}</p>
				<Link to="/familias" className="text-slate-600 hover:text-slate-800 underline text-sm">
					Volver a familias
				</Link>
			</div>
		);
	}

	if (!familia) return null;

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-xl font-bold text-gray-800">{familia.nombre}</h1>
					{familia.notas && (
						<p className="text-sm text-gray-500 mt-1">{familia.notas}</p>
					)}
				</div>
				<div className="flex gap-2">
					<button
						onClick={handleDeleteFamily}
						className="px-4 py-1.5 rounded text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
					>
						Eliminar familia
					</button>
					<Link to="/familias" className="text-slate-600 hover:text-slate-800 underline text-sm">
						← Volver
					</Link>
				</div>
			</div>

			<div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
				<h2 className="text-sm font-semibold text-gray-700 mb-3">
					Miembros ({familia.miembros.length})
				</h2>

				{familia.miembros.length === 0 ? (
					<p className="text-gray-400 italic text-sm">
						Esta familia no tiene miembros asignados.
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
								{familia.miembros.map((h) => (
									<tr key={h.id} className="hover:bg-gray-50 transition-colors">
										<td className="px-3 py-2">{h.nombre}</td>
										<td className="px-3 py-2 capitalize">{h.sexo}</td>
										<td className="px-3 py-2 text-xs">
											{ROL_LABELS[h.rol] ?? h.rol}
										</td>
										<td className="px-3 py-2">
											<button
												onClick={() => handleRemoveMember(h.id, h.nombre)}
												className="text-red-500 hover:text-red-700 underline text-xs"
											>
												Quitar
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div className="bg-white border border-gray-200 rounded-lg p-4">
				<h2 className="text-sm font-semibold text-gray-700 mb-3">Agregar miembro</h2>
				{availableHermanos.length === 0 ? (
					<p className="text-gray-400 italic text-sm">
						Todos los hermanos activos ya están en esta familia.
					</p>
				) : (
					<div className="flex gap-2 items-end">
						<div className="flex-1">
							<select
								value={selectedHermanoId ?? ""}
								onChange={(e) => setSelectedHermanoId(e.target.value ? Number(e.target.value) : null)}
								className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
							>
								<option value="">Seleccionar hermano...</option>
								{availableHermanos.map((h) => (
									<option key={h.id} value={h.id}>
										{h.nombre} ({ROL_LABELS[h.rol] ?? h.rol})
									</option>
								))}
							</select>
						</div>
						<button
							onClick={handleAddMember}
							disabled={adding || selectedHermanoId === null}
							className={`px-4 py-2 rounded text-sm transition-colors ${
								adding || selectedHermanoId === null
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: "bg-slate-700 text-white hover:bg-slate-800"
							}`}
						>
							{adding ? "Agregando..." : "Agregar"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
