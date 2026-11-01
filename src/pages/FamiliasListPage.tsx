import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { FamiliaWithCount } from "../types";

export default function FamiliasListPage() {
	const [familias, setFamilias] = useState<FamiliaWithCount[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [newNombre, setNewNombre] = useState("");
	const [newNotas, setNewNotas] = useState("");
	const [creating, setCreating] = useState(false);

	const loadFamilias = async () => {
		try {
			const data = await invoke<FamiliaWithCount[]>("list_familias_with_count");
			setFamilias(data);
		} catch (err) {
			console.error("Error loading familias:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadFamilias();
	}, []);

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newNombre.trim()) return;
		try {
			setCreating(true);
			await invoke("create_familia", {
				nombre: newNombre.trim(),
				notas: newNotas.trim() || null,
			});
			setNewNombre("");
			setNewNotas("");
			setShowCreate(false);
			loadFamilias();
		} catch (err) {
			console.error("Error creating familia:", err);
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (id: number, nombre: string) => {
		if (!confirm(`¿Eliminar la familia "${nombre}"? Se eliminarán todas las relaciones de membresía.`)) return;
		try {
			await invoke("delete_familia", { id });
			loadFamilias();
		} catch (err) {
			console.error("Error deleting familia:", err);
		}
	};

	if (loading) {
		return <p className="text-ui-muted text-center py-8">Cargando...</p>;
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-ui-text">Familias</h1>
				<button
					onClick={() => setShowCreate(!showCreate)}
					className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
				>
					{showCreate ? "Cancelar" : "+ Nueva Familia"}
				</button>
			</div>

			{showCreate && (
				<form onSubmit={handleCreate} className="bg-ui-surface border border-ui-divider rounded-lg p-4 mb-4 space-y-3">
					<div>
						<label className="block text-sm font-medium text-ui-text mb-1">Nombre *</label>
						<input
							type="text"
							value={newNombre}
							onChange={(e) => setNewNombre(e.target.value)}
							placeholder="Ej: Familia Pérez"
							required
							className="w-full border border-ui-border rounded px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-ui-text mb-1">Notas</label>
						<input
							type="text"
							value={newNotas}
							onChange={(e) => setNewNotas(e.target.value)}
							placeholder="Opcional"
							className="w-full border border-ui-border rounded px-3 py-2 text-sm"
						/>
					</div>
					<button
						type="submit"
						disabled={creating || !newNombre.trim()}
						className={`px-4 py-2 rounded text-sm transition-colors ${
							creating || !newNombre.trim()
								? "bg-ui-disabled text-ui-muted cursor-not-allowed"
								: "bg-slate-700 text-white hover:bg-slate-800"
						}`}
					>
						{creating ? "Creando..." : "Crear Familia"}
					</button>
				</form>
			)}

			{familias.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-ui-muted mb-4">No hay familias registradas. ¡Crea la primera!</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm border border-ui-divider rounded-lg overflow-hidden">
						<thead className="bg-ui-subtle text-left">
							<tr>
								<th className="px-3 py-2 font-semibold">Nombre</th>
								<th className="px-3 py-2 font-semibold">Miembros</th>
								<th className="px-3 py-2 font-semibold">Notas</th>
								<th className="px-3 py-2 font-semibold">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-ui-divider">
							{familias.map((f) => (
								<tr key={f.id} className="hover:bg-ui-canvas transition-colors">
									<td className="px-3 py-2 font-medium">{f.nombre}</td>
									<td className="px-3 py-2 text-ui-secondary">{f.miembros_count}</td>
									<td className="px-3 py-2 text-ui-muted text-xs max-w-[200px] truncate">
										{f.notas ?? "—"}
									</td>
									<td className="px-3 py-2 flex gap-2">
										<Link
											to={`/familias/${f.id}`}
											className="text-ui-link hover:text-ui-link underline text-xs"
										>
											Ver
										</Link>
										<button
											onClick={() => handleDelete(f.id, f.nombre)}
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
