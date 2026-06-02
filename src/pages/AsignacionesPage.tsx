import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Semana, Parte, AsignacionDetail } from "../types";
import { ASIGNACION_LABELS } from "../types";
import BrotherSelector from "../components/BrotherSelector";

const SECCION_COLORS: Record<string, string> = {
	tesoros: "bg-slate-700",
	mejores_maestros: "bg-yellow-600",
	vida_cristiana: "bg-red-800",
	marco: "bg-gray-600",
};

const TIPO_ESPECIAL_LABELS: Record<string, string> = {
	normal: "Normal",
	asamblea: "Asamblea",
	conmemoracion: "Conmemoración",
	visita_superintendente: "Visita del Superintendente",
};

function formatDateRange(inicio: string, fin: string) {
	const fmt = (d: string) => {
		const [y, m, day] = d.split("-");
		return `${day}/${m}/${y}`;
	};
	return `${fmt(inicio)} - ${fmt(fin)}`;
}

interface AssignmentKey {
	parte_id: number;
	ambito: string;
	rol: string;
}

function assignmentKey(parte_id: number, ambito: string, rol: string): string {
	return `${parte_id}|${ambito}|${rol}`;
}

export default function AsignacionesPage() {
	const { id } = useParams();
	const semanaId = Number(id);

	const [semana, setSemana] = useState<Semana | null>(null);
	const [partes, setPartes] = useState<Parte[]>([]);
	const [assignments, setAssignments] = useState<AsignacionDetail[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const [sem, pts, asgs] = await Promise.all([
				invoke<Semana>("get_semana", { id: semanaId }),
				invoke<Parte[]>("list_partes", { semanaId }),
				invoke<AsignacionDetail[]>("get_assignments_for_week", { semanaId }),
			]);
			setSemana(sem);
			setPartes(pts);
			setAssignments(asgs);
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	}, [semanaId]);

	useEffect(() => {
		if (semanaId) loadData();
	}, [semanaId]);

	const getAssignment = (key: AssignmentKey): number | null => {
		const found = assignments.find(
			(a) =>
				a.parte_id === key.parte_id &&
				a.ambito === key.ambito &&
				a.rol === key.rol,
		);
		return found ? found.hermano_id : null;
	};

	const showSaved = () => {
		setSavedFeedback("Guardado ✓");
		setTimeout(() => setSavedFeedback(null), 2000);
	};

	const handlePartAssignmentChange = async (
		parte_id: number,
		ambito: string,
		rol: string,
		hermano_id: number | null,
	) => {
		try {
			if (hermano_id !== null) {
				await invoke("assign_brother", {
					parteId: parte_id,
					ambito,
					rol,
					hermanoId: hermano_id,
				});
			} else {
				await invoke("remove_assignment", {
					parteId: parte_id,
					ambito,
					rol,
				});
			}
			setAssignments((prev) => {
				const key = assignmentKey(parte_id, ambito, rol);
				if (hermano_id === null) {
					return prev.filter(
						(a) => assignmentKey(a.parte_id, a.ambito, a.rol) !== key,
					);
				}
				const existing = prev.find(
					(a) => assignmentKey(a.parte_id, a.ambito, a.rol) === key,
				);
				if (existing) {
					return prev.map((a) =>
						assignmentKey(a.parte_id, a.ambito, a.rol) === key
							? { ...a, hermano_id, hermano_nombre: "", hermano_sexo: "" }
							: a,
					);
				}
				return [...prev, { id: 0, parte_id, ambito, rol, hermano_id, hermano_nombre: "", hermano_rol: "", hermano_sexo: "" }];
			});
			showSaved();
		} catch (err) {
			console.error("Error saving assignment:", err);
		}
	};

	const handleRoleChange = async (
		field: "presidente_id" | "consejero_sala_id" | "orador_oracion_apertura_id" | "orador_oracion_cierre_id",
		value: number | null,
	) => {
		if (!semana) return;
		try {
			await invoke("update_semana_roles", {
				semanaId: semana.id,
				presidenteId: field === "presidente_id" ? value : semana.presidente_id,
				consejeroSalaId: field === "consejero_sala_id" ? value : semana.consejero_sala_id,
				oradorOracionAperturaId: field === "orador_oracion_apertura_id" ? value : semana.orador_oracion_apertura_id,
				oradorOracionCierreId: field === "orador_oracion_cierre_id" ? value : semana.orador_oracion_cierre_id,
			});
			setSemana((prev) => (prev ? { ...prev, [field]: value } : prev));
			showSaved();
		} catch (err) {
			console.error("Error saving role:", err);
		}
	};

	const renderSelectorsForPart = (parte: Parte) => {
		const tipo = parte.tipo_asignacion;
		const needsSalaAux = parte.requiere_sala_auxiliar;
		const needsAyudante = parte.requiere_ayudante;
		const isEstudioBiblico = tipo === "estudio_biblico";
		const isNoStudent = [
			"discurso_no_estudiante",
			"busquemos_perlas",
			"analisis_auditorio",
			"necesidades_congregacion",
		].includes(tipo);

		if (isEstudioBiblico) {
			return (
				<div>
					<label className="text-xs font-semibold text-gray-600 block mb-0.5">Conductor:</label>
					<BrotherSelector
						tipoAsignacion={tipo}
						rol="conductor"
						ambito="auditorio_principal"
						value={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "conductor" })}
						onChange={(v) => handlePartAssignmentChange(parte.id, "auditorio_principal", "conductor", v)}
					/>
					<label className="text-xs font-semibold text-gray-600 block mb-0.5 mt-1.5">Lector:</label>
					<BrotherSelector
						tipoAsignacion={tipo}
						rol="lector"
						ambito="auditorio_principal"
						value={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "lector" })}
						onChange={(v) => handlePartAssignmentChange(parte.id, "auditorio_principal", "lector", v)}
					/>
				</div>
			);
		}

		if (isNoStudent) {
			return (
				<div>
					<label className="text-xs font-semibold text-gray-600 block mb-0.5">Presentador:</label>
					<BrotherSelector
						tipoAsignacion={tipo}
						rol="estudiante"
						ambito="auditorio_principal"
						value={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "estudiante" })}
						onChange={(v) => handlePartAssignmentChange(parte.id, "auditorio_principal", "estudiante", v)}
					/>
				</div>
			);
		}

		if (needsSalaAux && needsAyudante) {
			return (
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="text-xs font-semibold text-gray-600 block mb-0.5">Estudiante:</label>
						<BrotherSelector
							tipoAsignacion={tipo}
							rol="estudiante"
							ambito="auditorio_principal"
							value={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "estudiante" })}
							onChange={(v) => handlePartAssignmentChange(parte.id, "auditorio_principal", "estudiante", v)}
						/>
						<label className="text-xs font-semibold text-gray-600 block mb-0.5 mt-1.5">Ayudante:</label>
						<BrotherSelector
							tipoAsignacion={tipo}
							rol="ayudante"
							ambito="auditorio_principal"
							sexoEstudiante={getAssignmentSexo(parte.id, "auditorio_principal")}
							estudianteId={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "estudiante" })}
							value={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "ayudante" })}
							onChange={(v) => handlePartAssignmentChange(parte.id, "auditorio_principal", "ayudante", v)}
						/>
					</div>
					<div>
						<label className="text-xs font-semibold text-gray-600 block mb-0.5">Estudiante:</label>
						<BrotherSelector
							tipoAsignacion={tipo}
							rol="estudiante"
							ambito="sala_auxiliar"
							value={getAssignment({ parte_id: parte.id, ambito: "sala_auxiliar", rol: "estudiante" })}
							onChange={(v) => handlePartAssignmentChange(parte.id, "sala_auxiliar", "estudiante", v)}
						/>
						<label className="text-xs font-semibold text-gray-600 block mb-0.5 mt-1.5">Ayudante:</label>
						<BrotherSelector
							tipoAsignacion={tipo}
							rol="ayudante"
							ambito="sala_auxiliar"
							sexoEstudiante={getAssignmentSexo(parte.id, "sala_auxiliar")}
							estudianteId={getAssignment({ parte_id: parte.id, ambito: "sala_auxiliar", rol: "estudiante" })}
							value={getAssignment({ parte_id: parte.id, ambito: "sala_auxiliar", rol: "ayudante" })}
							onChange={(v) => handlePartAssignmentChange(parte.id, "sala_auxiliar", "ayudante", v)}
						/>
					</div>
				</div>
			);
		}

		if (needsSalaAux) {
			return (
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="text-xs font-semibold text-gray-600 block mb-0.5">Estudiante:</label>
						<BrotherSelector
							tipoAsignacion={tipo}
							rol="estudiante"
							ambito="auditorio_principal"
							value={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "estudiante" })}
							onChange={(v) => handlePartAssignmentChange(parte.id, "auditorio_principal", "estudiante", v)}
						/>
					</div>
					<div>
						<label className="text-xs font-semibold text-gray-600 block mb-0.5">Estudiante:</label>
						<BrotherSelector
							tipoAsignacion={tipo}
							rol="estudiante"
							ambito="sala_auxiliar"
							value={getAssignment({ parte_id: parte.id, ambito: "sala_auxiliar", rol: "estudiante" })}
							onChange={(v) => handlePartAssignmentChange(parte.id, "sala_auxiliar", "estudiante", v)}
						/>
					</div>
				</div>
			);
		}

		return (
			<div>
				<label className="text-xs font-semibold text-gray-600 block mb-0.5">Presentador:</label>
				<BrotherSelector
					tipoAsignacion={tipo}
					rol="estudiante"
					ambito="auditorio_principal"
					value={getAssignment({ parte_id: parte.id, ambito: "auditorio_principal", rol: "estudiante" })}
					onChange={(v) => handlePartAssignmentChange(parte.id, "auditorio_principal", "estudiante", v)}
				/>
			</div>
		);
	};

	const getAssignmentSexo = (parteId: number, ambito: string): string | null => {
		const found = assignments.find(
			(a) =>
				a.parte_id === parteId &&
				a.ambito === ambito &&
				a.rol === "estudiante",
		);
		return found ? found.hermano_sexo : null;
	};

	const groupedPartes = partes.reduce<Record<string, Parte[]>>((acc, p) => {
		const sec = p.seccion;
		if (!acc[sec]) acc[sec] = [];
		acc[sec].push(p);
		return acc;
	}, {});

	if (loading) {
		return <p className="text-gray-500 text-center py-8">Cargando...</p>;
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-red-500 mb-4">{error}</p>
				<Link to="/semanas" className="text-slate-600 hover:text-slate-800 underline text-sm">
					Volver a semanas
				</Link>
			</div>
		);
	}

	if (!semana) return null;

	const sections: Array<{ key: string; label: string; color: string }> = [
		{ key: "tesoros", label: "TESOROS DE LA BIBLIA", color: "border-slate-600" },
		{ key: "mejores_maestros", label: "SEAMOS MEJORES MAESTROS", color: "border-yellow-600" },
		{ key: "vida_cristiana", label: "NUESTRA VIDA CRISTIANA", color: "border-red-700" },
	];

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-xl font-bold text-gray-800">
						Asignaciones — {formatDateRange(semana.fecha_inicio, semana.fecha_fin)}
					</h1>
					<div className="flex items-center gap-3 mt-1">
						{semana.libro_biblico && (
							<span className="text-sm text-gray-600">{semana.libro_biblico}</span>
						)}
						<span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
							{TIPO_ESPECIAL_LABELS[semana.tipo_especial] ?? semana.tipo_especial}
						</span>
						{savedFeedback && (
							<span className="text-xs text-green-600 font-medium">{savedFeedback}</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Link to={`/semanas/${semana.id}/s140`} className="text-slate-600 hover:text-slate-800 underline text-sm">
						Ver S-140
					</Link>
					<Link to="/semanas" className="text-slate-600 hover:text-slate-800 underline text-sm">
						← Volver
					</Link>
				</div>
			</div>

			<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
				<h2 className="text-sm font-semibold text-gray-700 mb-3">Marco General</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-xs text-gray-500 mb-1">Presidente</label>
						<BrotherSelector
							tipoAsignacion="normal"
							rol="presidente"
							ambito="auditorio_principal"
							value={semana.presidente_id}
							onChange={(v) => handleRoleChange("presidente_id", v)}
						/>
					</div>
					<div>
						<label className="block text-xs text-gray-500 mb-1">Consejero sala auxiliar</label>
						<BrotherSelector
							tipoAsignacion="normal"
							rol="consejero_sala"
							ambito="sala_auxiliar"
							value={semana.consejero_sala_id}
							onChange={(v) => handleRoleChange("consejero_sala_id", v)}
						/>
					</div>
					<div>
						<label className="block text-xs text-gray-500 mb-1">Oración apertura</label>
						<BrotherSelector
							tipoAsignacion="oracion"
							rol="oracion"
							ambito="auditorio_principal"
							value={semana.orador_oracion_apertura_id}
							onChange={(v) => handleRoleChange("orador_oracion_apertura_id", v)}
						/>
					</div>
					<div>
						<label className="block text-xs text-gray-500 mb-1">Oración cierre</label>
						<BrotherSelector
							tipoAsignacion="oracion"
							rol="oracion"
							ambito="auditorio_principal"
							value={semana.orador_oracion_cierre_id}
							onChange={(v) => handleRoleChange("orador_oracion_cierre_id", v)}
						/>
					</div>
				</div>
			</div>

			{sections.map((sec) => {
				const secPartes = groupedPartes[sec.key];
				if (!secPartes || secPartes.length === 0) return null;
				return (
					<div key={sec.key} className="mb-4">
						<div className={`${SECCION_COLORS[sec.key]} text-white px-3 py-2 rounded-t text-sm font-bold`}>
							{sec.label}
						</div>
						<div className="border border-t-0 border-gray-200 rounded-b divide-y divide-gray-100">
							{secPartes.map((p) => (
								<div key={p.id} className="px-3 py-3 hover:bg-gray-50 transition-colors">
									<div className="flex items-start gap-4">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<span className="text-xs font-bold text-gray-500">
													{p.numero_orden}.
												</span>
												<span className="text-sm text-gray-800">
													{p.titulo ?? ASIGNACION_LABELS[p.tipo_asignacion] ?? p.tipo_asignacion}
												</span>
												{p.duracion_minutos != null && (
													<span className="text-xs text-gray-400">({p.duracion_minutos} min)</span>
												)}
											</div>
											{renderSelectorsForPart(p)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
