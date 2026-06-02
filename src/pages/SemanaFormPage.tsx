import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ASIGNACION_LABELS } from "../types";

interface PartForm {
	numero_orden: number;
	seccion: string;
	tipo_asignacion: string;
	titulo: string;
	duracion_minutos: number;
	requiere_sala_auxiliar: boolean;
	requiere_ayudante: boolean;
}

const SECCIONES = [
	{ value: "tesoros", label: "Tesoros de la Biblia" },
	{ value: "mejores_maestros", label: "Seamos Mejores Maestros" },
	{ value: "vida_cristiana", label: "Nuestra Vida Cristiana" },
];

function emptyPart(): PartForm {
	return {
		numero_orden: 1,
		seccion: "tesoros",
		tipo_asignacion: "discurso_no_estudiante",
		titulo: "",
		duracion_minutos: 5,
		requiere_sala_auxiliar: false,
		requiere_ayudante: false,
	};
}

export default function SemanaFormPage() {
	const navigate = useNavigate();
	const [fechaInicio, setFechaInicio] = useState("");
	const [fechaFin, setFechaFin] = useState("");
	const [libroBiblico, setLibroBiblico] = useState("");
	const [cancionApertura, setCancionApertura] = useState("");
	const [cancionIntermedia, setCancionIntermedia] = useState("");
	const [cancionCierre, setCancionCierre] = useState("");
	const [tipoEspecial, setTipoEspecial] = useState("normal");
	const [partes, setPartes] = useState<PartForm[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addParte = () => {
		setPartes((prev) => [
			...prev,
			{ ...emptyPart(), numero_orden: prev.length + 1 },
		]);
	};

	const removeParte = (index: number) => {
		setPartes((prev) =>
			prev
				.filter((_, i) => i !== index)
				.map((p, i) => ({ ...p, numero_orden: i + 1 })),
		);
	};

	const updateParte = (index: number, field: string, value: unknown) => {
		setPartes((prev) =>
			prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setSaving(true);
			setError(null);

			const semana = await invoke("create_semana", {
				fechaInicio,
				fechaFin,
				libroBiblico: libroBiblico || null,
				cancionApertura: cancionApertura
					? Number(cancionApertura)
					: null,
				cancionIntermedia: cancionIntermedia
					? Number(cancionIntermedia)
					: null,
				cancionCierre: cancionCierre ? Number(cancionCierre) : null,
				tipoEspecial,
			});

			for (const p of partes) {
				await invoke("create_parte", {
					semanaId: (semana as { id: number }).id,
					numeroOrden: p.numero_orden,
					seccion: p.seccion,
					tipoAsignacion: p.tipo_asignacion,
					titulo: p.titulo || null,
					duracionMinutos: p.duracion_minutos,
					requiereSalaAuxiliar: p.requiere_sala_auxiliar,
					requiereAyudante: p.requiere_ayudante,
				});
			}

			navigate("/semanas");
		} catch (err) {
			console.error("Error creating semana:", err);
			setError(String(err));
		} finally {
			setSaving(false);
		}
	};

	return (
		<div>
			<h1 className="text-xl font-bold text-gray-800 mb-4">
				Nueva Semana
			</h1>

			{error && (
				<p className="text-red-500 bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm">
					{error}
				</p>
			)}

			<form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Fecha inicio
						</label>
						<input
							type="date"
							value={fechaInicio}
							onChange={(e) => setFechaInicio(e.target.value)}
							required
							className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Fecha fin
						</label>
						<input
							type="date"
							value={fechaFin}
							onChange={(e) => setFechaFin(e.target.value)}
							required
							className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Libro bíblico
					</label>
					<input
						type="text"
						value={libroBiblico}
						onChange={(e) => setLibroBiblico(e.target.value)}
						placeholder="Ej: Isaías 41, 42"
						className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
					/>
				</div>

				<div className="grid grid-cols-3 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Canción apertura
						</label>
						<input
							type="number"
							value={cancionApertura}
							onChange={(e) => setCancionApertura(e.target.value)}
							min={1}
							max={160}
							className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Canción intermedia
						</label>
						<input
							type="number"
							value={cancionIntermedia}
							onChange={(e) => setCancionIntermedia(e.target.value)}
							min={1}
							max={160}
							className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Canción cierre
						</label>
						<input
							type="number"
							value={cancionCierre}
							onChange={(e) => setCancionCierre(e.target.value)}
							min={1}
							max={160}
							className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Tipo de semana
					</label>
					<select
						value={tipoEspecial}
						onChange={(e) => setTipoEspecial(e.target.value)}
						className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
					>
						<option value="normal">Normal</option>
						<option value="asamblea">Asamblea</option>
						<option value="conmemoracion">Conmemoración</option>
						<option value="visita_superintendente">
							Visita del Superintendente
						</option>
					</select>
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-sm font-semibold text-gray-700">
							Partes
						</h2>
						<button
							type="button"
							onClick={addParte}
							className="text-xs text-slate-600 hover:text-slate-800 underline"
						>
							+ Agregar parte
						</button>
					</div>

					{partes.length === 0 && (
						<p className="text-xs text-gray-400 italic">
							Sin partes. Haz clic en "+ Agregar parte" para añadir.
						</p>
					)}

					{partes.map((parte, i) => (
						<div
							key={i}
							className="border border-gray-200 rounded p-3 mb-2 space-y-2"
						>
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-gray-600">
									Parte #{parte.numero_orden}
								</span>
								<button
									type="button"
									onClick={() => removeParte(i)}
									className="text-xs text-red-500 hover:text-red-700 underline"
								>
									Eliminar
								</button>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="block text-xs text-gray-500">
										Sección
									</label>
									<select
										value={parte.seccion}
										onChange={(e) =>
											updateParte(i, "seccion", e.target.value)
										}
										className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
									>
										{SECCIONES.map((s) => (
											<option key={s.value} value={s.value}>
												{s.label}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-xs text-gray-500">
										Tipo de asignación
									</label>
									<select
										value={parte.tipo_asignacion}
										onChange={(e) =>
											updateParte(
												i,
												"tipo_asignacion",
												e.target.value,
											)
										}
										className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
									>
										{Object.entries(ASIGNACION_LABELS).map(
											([key, label]) => (
												<option key={key} value={key}>
													{label}
												</option>
											),
										)}
									</select>
								</div>
							</div>

							<div>
								<label className="block text-xs text-gray-500">
									Título
								</label>
								<input
									type="text"
									value={parte.titulo}
									onChange={(e) =>
										updateParte(i, "titulo", e.target.value)
									}
									placeholder="Título de la parte"
									className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
								/>
							</div>

							<div className="grid grid-cols-3 gap-2 items-end">
								<div>
									<label className="block text-xs text-gray-500">
										Duración (min)
									</label>
									<input
										type="number"
										value={parte.duracion_minutos}
										onChange={(e) =>
											updateParte(
												i,
												"duracion_minutos",
												Number(e.target.value),
											)
										}
										min={1}
										className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
									/>
								</div>
								<label className="flex items-center gap-1 text-xs text-gray-600">
									<input
										type="checkbox"
										checked={parte.requiere_sala_auxiliar}
										onChange={(e) =>
											updateParte(
												i,
												"requiere_sala_auxiliar",
												e.target.checked,
											)
										}
									/>
									Sala aux.
								</label>
								<label className="flex items-center gap-1 text-xs text-gray-600">
									<input
										type="checkbox"
										checked={parte.requiere_ayudante}
										onChange={(e) =>
											updateParte(
												i,
												"requiere_ayudante",
												e.target.checked,
											)
										}
									/>
									Ayudante
								</label>
							</div>
						</div>
					))}
				</div>

				<div className="flex gap-2 pt-2">
					<button
						type="submit"
						disabled={saving}
						className={`px-6 py-2 rounded text-sm transition-colors ${
							saving
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-slate-700 text-white hover:bg-slate-800"
						}`}
					>
						{saving ? "Guardando..." : "Guardar Semana"}
					</button>
					<button
						type="button"
						onClick={() => navigate("/semanas")}
						className="px-6 py-2 rounded text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
				</div>
			</form>
		</div>
	);
}
