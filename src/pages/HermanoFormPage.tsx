import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Hermano, BatchHermanoInput } from "../types";

type FormMode = "single" | "batch";

const makeEmptyRow = (): BatchHermanoInput => ({
	nombre: "",
	sexo: "masculino",
	rol: "publicador",
	puede_presidir: false,
	puede_conducir_estudio: false,
	puede_ser_consejero_sala: false,
});

export default function HermanoFormPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditing = !!id;

	// --- single mode state ---
	const [single, setSingle] = useState(makeEmptyRow());
	// --- batch mode state ---
	const [mode, setMode] = useState<FormMode>("single");
	const [batch, setBatch] = useState<BatchHermanoInput[]>([makeEmptyRow()]);

	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isEditing) {
			loadHermano(Number(id));
		}
	}, [id]);

	const loadHermano = async (hermanoId: number) => {
		try {
			const found = await invoke<Hermano>("get_hermano", { id: hermanoId });
			setSingle({
				nombre: found.nombre,
				sexo: found.sexo,
				rol: found.rol,
				puede_presidir: found.puede_presidir,
				puede_conducir_estudio: found.puede_conducir_estudio,
				puede_ser_consejero_sala: found.puede_ser_consejero_sala,
			});
		} catch (err) {
			console.error("Error loading hermano:", err);
			navigate("/hermanos");
		}
	};

	// --- single field handlers ---
	const handleSingleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const target = e.target;
		const value =
			target.type === "checkbox"
				? (target as HTMLInputElement).checked
				: target.value;
		setSingle({ ...single, [target.name]: value });
	};

	const handleSingleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (isEditing) {
				await invoke("update_hermano", {
					id: Number(id),
					nombre: single.nombre,
					sexo: single.sexo,
					rol: single.rol,
					puedePresidir: single.puede_presidir,
					puedeConducirEstudio: single.puede_conducir_estudio,
					puedeSerConsejeroSala: single.puede_ser_consejero_sala,
					notas: null,
				});
			} else {
				await invoke("create_hermano", {
					nombre: single.nombre,
					sexo: single.sexo,
					rol: single.rol,
					puedePresidir: single.puede_presidir,
					puedeConducirEstudio: single.puede_conducir_estudio,
					puedeSerConsejeroSala: single.puede_ser_consejero_sala,
				});
			}
			navigate("/hermanos");
		} catch (err) {
			console.error("Error saving hermano:", err);
			alert("Error al guardar: " + err);
		} finally {
			setLoading(false);
		}
	};

	// --- batch field handlers ---
	const handleBatchChange = (
		index: number,
		field: keyof BatchHermanoInput,
		value: string | boolean,
	) => {
		const updated = [...batch];
		updated[index] = { ...updated[index], [field]: value };
		setBatch(updated);
	};

	const addBatchRow = () => {
		setBatch([...batch, makeEmptyRow()]);
	};

	const removeBatchRow = (index: number) => {
		if (batch.length === 1) return;
		setBatch(batch.filter((_, i) => i !== index));
	};

	const handleBatchSubmit = async (e: FormEvent) => {
		e.preventDefault();
		// Filter out rows with empty names
		const valid = batch.filter((r) => r.nombre.trim() !== "");
		if (valid.length === 0) return;
		setLoading(true);
		try {
			await invoke("create_hermanos_batch", { hermanos: valid });
			navigate("/hermanos");
		} catch (err) {
			console.error("Error batch saving:", err);
			alert("Error al guardar: " + err);
		} finally {
			setLoading(false);
		}
	};

	// --- shared field renderers (used by both modes) ---
	const renderSingleFields = (
		data: BatchHermanoInput,
		onChange: (
			e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
		) => void,
	) => (
		<>
			<label className="block">
				<span className="text-sm font-medium text-gray-700">
					Nombre completo
				</span>
				<input
					name="nombre"
					type="text"
					required
					value={data.nombre}
					onChange={onChange}
					className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
				/>
			</label>

			<div className="flex gap-4">
				<label className="flex-1">
					<span className="text-sm font-medium text-gray-700">Sexo</span>
					<select
						name="sexo"
						value={data.sexo}
						onChange={onChange}
						className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					>
						<option value="masculino">Masculino</option>
						<option value="femenino">Femenino</option>
					</select>
				</label>
				<label className="flex-1">
					<span className="text-sm font-medium text-gray-700">Rol</span>
					<select
						name="rol"
						value={data.rol}
						onChange={onChange}
						className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					>
						<option value="anciano">Anciano</option>
						<option value="siervo_ministerial">Siervo Ministerial</option>
						<option value="publicador">Publicador</option>
						<option value="estudiante_biblia">Estudiante de la Biblia</option>
					</select>
				</label>
			</div>

			<fieldset className="border border-gray-200 rounded-lg p-3">
				<legend className="text-sm font-medium text-gray-700 px-1">
					Permisos
				</legend>
				<div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							name="puede_presidir"
							checked={data.puede_presidir}
							onChange={onChange}
							className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
						/>
						Presidir
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							name="puede_conducir_estudio"
							checked={data.puede_conducir_estudio}
							onChange={onChange}
							className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
						/>
						Conducir estudio
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							name="puede_ser_consejero_sala"
							checked={data.puede_ser_consejero_sala}
							onChange={onChange}
							className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
						/>
						Consejero sala
					</label>
				</div>
			</fieldset>
		</>
	);

	// ============================================================
	// RENDER
	// ============================================================

	// Editing mode: only single form is shown
	if (isEditing) {
		return (
			<div className="max-w-lg mx-auto">
				<h1 className="text-xl font-bold text-gray-800 mb-4">Editar Hermano</h1>
				<form
					onSubmit={handleSingleSubmit}
					className="bg-white rounded-lg shadow p-6 space-y-4"
				>
					{renderSingleFields(single, handleSingleChange)}
					<div className="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={loading}
							className="bg-slate-700 text-white px-6 py-2 rounded hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
						>
							{loading ? "Guardando..." : "Guardar"}
						</button>
						<button
							type="button"
							onClick={() => navigate("/hermanos")}
							className="border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-100 transition-colors text-sm"
						>
							Cancelar
						</button>
					</div>
				</form>
			</div>
		);
	}

	// Creation mode: show toggle + single or batch form
	return (
		<div className="max-w-2xl mx-auto">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-xl font-bold text-gray-800">Nuevo Hermano</h1>
				<div className="flex items-center gap-3">
					<span className="text-xs text-gray-500">Modo:</span>
					<div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
						<button
							type="button"
							onClick={() => setMode("single")}
							className={`px-3 py-1.5 transition-colors ${
								mode === "single"
									? "bg-slate-700 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							Individual
						</button>
						<button
							type="button"
							onClick={() => setMode("batch")}
							className={`px-3 py-1.5 transition-colors ${
								mode === "batch"
									? "bg-slate-700 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							Por lotes
						</button>
					</div>
				</div>
			</div>

			{/* --- SINGLE MODE --- */}
			{mode === "single" && (
				<form
					onSubmit={handleSingleSubmit}
					className="bg-white rounded-lg shadow p-6 space-y-4"
				>
					{renderSingleFields(single, handleSingleChange)}
					<div className="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={loading}
							className="bg-slate-700 text-white px-6 py-2 rounded hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
						>
							{loading ? "Guardando..." : "Guardar"}
						</button>
						<button
							type="button"
							onClick={() => navigate("/hermanos")}
							className="border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-100 transition-colors text-sm"
						>
							Cancelar
						</button>
					</div>
				</form>
			)}

			{/* --- BATCH MODE --- */}
			{mode === "batch" && (
				<form onSubmit={handleBatchSubmit} className="space-y-4">
					{batch.map((row, index) => (
						<div
							key={index}
							className="bg-white rounded-lg shadow p-5 space-y-3 relative border-l-4 border-slate-400"
						>
							{/* Row header */}
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
									Hermano #{index + 1}
								</span>
								{batch.length > 1 && (
									<button
										type="button"
										onClick={() => removeBatchRow(index)}
										className="text-red-500 hover:text-red-700 text-xs underline"
									>
										Eliminar fila
									</button>
								)}
							</div>

							{renderSingleFields(row, (e) => {
								const target = e.target;
								const value =
									target.type === "checkbox"
										? (target as HTMLInputElement).checked
										: target.value;
								handleBatchChange(
									index,
									target.name as keyof BatchHermanoInput,
									value,
								);
							})}
						</div>
					))}

					{/* Add row button */}
					<button
						type="button"
						onClick={addBatchRow}
						className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-slate-500 hover:text-slate-700 transition-colors"
					>
						+ Agregar otro hermano
					</button>

					{/* Submit */}
					<div className="flex gap-3 pt-2">
						<button
							type="submit"
							disabled={loading}
							className="bg-slate-700 text-white px-6 py-2 rounded hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
						>
							{loading ? "Guardando..." : `Guardar ${batch.length} hermano(s)`}
						</button>
						<button
							type="button"
							onClick={() => navigate("/hermanos")}
							className="border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-100 transition-colors text-sm"
						>
							Cancelar
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
