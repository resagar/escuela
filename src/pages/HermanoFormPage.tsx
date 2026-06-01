import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface Hermano {
	id: number;
	nombre: string;
	sexo: string;
	rol: string;
	puede_presidir: boolean;
	puede_conducir_estudio: boolean;
	puede_ser_consejero_sala: boolean;
	activo: boolean;
	notas: string | null;
}

const emptyForm = {
	nombre: "",
	sexo: "masculino",
	rol: "publicador",
	puede_presidir: false,
	puede_conducir_estudio: false,
	puede_ser_consejero_sala: false,
	notas: "",
};

export default function HermanoFormPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditing = !!id;

	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isEditing) {
			loadHermano(Number(id));
		}
	}, [id]);

	const loadHermano = async (hermanoId: number) => {
		try {
			const hermanos = await invoke<Hermano[]>("list_hermanos", {
				soloActivos: false,
			});
			const found = hermanos.find((h) => h.id === hermanoId);
			if (found) {
				setForm({
					nombre: found.nombre,
					sexo: found.sexo,
					rol: found.rol,
					puede_presidir: found.puede_presidir,
					puede_conducir_estudio: found.puede_conducir_estudio,
					puede_ser_consejero_sala: found.puede_ser_consejero_sala,
					notas: found.notas ?? "",
				});
			}
		} catch (err) {
			console.error("Error loading hermano:", err);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const target = e.target;
		const value =
			target.type === "checkbox"
				? (target as HTMLInputElement).checked
				: target.value;
		setForm({ ...form, [target.name]: value });
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (isEditing) {
				await invoke("update_hermano", {
					id: Number(id),
					...form,
					puedePresidir: form.puede_presidir,
					puedeConducirEstudio: form.puede_conducir_estudio,
					puedeSerConsejeroSala: form.puede_ser_consejero_sala,
				});
			} else {
				await invoke("create_hermano", {
					nombre: form.nombre,
					sexo: form.sexo,
					rol: form.rol,
					puedePresidir: form.puede_presidir,
					puedeConducirEstudio: form.puede_conducir_estudio,
					puedeSerConsejeroSala: form.puede_ser_consejero_sala,
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

	return (
		<div className="max-w-lg mx-auto">
			<h1 className="text-xl font-bold text-gray-800 mb-4">
				{isEditing ? "Editar Hermano" : "Nuevo Hermano"}
			</h1>
			<form
				onSubmit={handleSubmit}
				className="bg-white rounded-lg shadow p-6 space-y-4"
			>
				{/* Nombre */}
				<label className="block">
					<span className="text-sm font-medium text-gray-700">
						Nombre completo
					</span>
					<input
						name="nombre"
						type="text"
						required
						value={form.nombre}
						onChange={handleChange}
						className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					/>
				</label>

				{/* Sexo */}
				<label className="block">
					<span className="text-sm font-medium text-gray-700">Sexo</span>
					<select
						name="sexo"
						value={form.sexo}
						onChange={handleChange}
						className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					>
						<option value="masculino">Masculino</option>
						<option value="femenino">Femenino</option>
					</select>
				</label>

				{/* Rol */}
				<label className="block">
					<span className="text-sm font-medium text-gray-700">Rol</span>
					<select
						name="rol"
						value={form.rol}
						onChange={handleChange}
						className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					>
						<option value="anciano">Anciano</option>
						<option value="siervo_ministerial">Siervo Ministerial</option>
						<option value="publicador">Publicador</option>
						<option value="estudiante_biblia">Estudiante de la Biblia</option>
					</select>
				</label>

				{/* Permisos */}
				<fieldset className="border border-gray-200 rounded-lg p-3">
					<legend className="text-sm font-medium text-gray-700 px-1">
						Permisos
					</legend>
					<div className="space-y-2 mt-1">
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="puede_presidir"
								checked={form.puede_presidir}
								onChange={handleChange}
								className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
							/>
							Puede presidir la reunión
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="puede_conducir_estudio"
								checked={form.puede_conducir_estudio}
								onChange={handleChange}
								className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
							/>
							Puede conducir el estudio bíblico
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name="puede_ser_consejero_sala"
								checked={form.puede_ser_consejero_sala}
								onChange={handleChange}
								className="rounded border-gray-300 text-slate-700 focus:ring-slate-500"
							/>
							Puede ser consejero de sala auxiliar
						</label>
					</div>
				</fieldset>

				{/* Notas */}
				<label className="block">
					<span className="text-sm font-medium text-gray-700">
						Notas (opcional)
					</span>
					<textarea
						name="notas"
						value={form.notas}
						onChange={handleChange}
						rows={2}
						className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					/>
				</label>

				{/* Buttons */}
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
