import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Semana, Parte, AsignacionDetail, Hermano } from "../types";
import "../styles/s140.css";

const CONG_NAME = "Cong. CASANAY";

const MESES = [
	"ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
	"JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

function formatDateForS140(inicio: string, fin: string): string {
	const [, sm, sd] = inicio.split("-");
	const [, , ed] = fin.split("-");
	const em = fin.split("-")[1];
	if (sm === em) {
		return `${Number(sd)}-${Number(ed)} DE ${MESES[Number(sm) - 1]}`;
	}
	return `${Number(sd)} DE ${MESES[Number(sm) - 1]} - ${Number(ed)} DE ${MESES[Number(em) - 1]}`;
}

const SECCIONES = [
	{ key: "tesoros", label: "TESOROS DE LA BIBLIA", css: "sec-tesoros" },
	{ key: "mejores_maestros", label: "SEAMOS MEJORES MAESTROS", css: "sec-mejores" },
	{ key: "vida_cristiana", label: "NUESTRA VIDA CRISTIANA", css: "sec-vida" },
];

export default function S140Page() {
	const { id } = useParams();
	const [semana, setSemana] = useState<Semana | null>(null);
	const [partes, setPartes] = useState<Parte[]>([]);
	const [asignaciones, setAsignaciones] = useState<AsignacionDetail[]>([]);
	const [semanas, setSemanas] = useState<Semana[]>([]);
	const [personas, setPersonas] = useState<Record<number, Hermano>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		const semanaId = Number(id);

		setLoading(true);
		setError(null);

		Promise.all([
			invoke<Semana>("get_semana", { id: semanaId }),
			invoke<Parte[]>("list_partes", { semanaId }),
			invoke<AsignacionDetail[]>("get_assignments_for_week", { semanaId }),
			invoke<Semana[]>("list_semanas"),
		])
			.then(([s, p, a, allSemanas]) => {
				setSemana(s);
				setPartes(p);
				setAsignaciones(a);
				setSemanas(allSemanas);
				return fetchPersonas(s, a);
			})
			.catch((err) => setError(String(err)))
			.finally(() => setLoading(false));
	}, [id]);

	async function fetchPersonas(s: Semana, a: AsignacionDetail[]) {
		const ids = new Set<number>();
		if (s.presidente_id) ids.add(s.presidente_id);
		if (s.consejero_sala_id) ids.add(s.consejero_sala_id);
		if (s.orador_oracion_apertura_id) ids.add(s.orador_oracion_apertura_id);
		if (s.orador_oracion_cierre_id) ids.add(s.orador_oracion_cierre_id);
		for (const asig of a) ids.add(asig.hermano_id);

		const results: Record<number, Hermano> = {};
		await Promise.all(
			Array.from(ids).map(async (pid) => {
				try {
					const h = await invoke<Hermano>("get_hermano", { id: pid });
					results[pid] = h;
				} catch {
					// ignore missing hermano
				}
			}),
		);
		setPersonas(results);
	}

	function getPersonaName(id: number | null | undefined): string {
		if (!id) return "";
		return personas[id]?.nombre ?? "";
	}

	function getAssignmentName(parteId: number, ambito: string, rol: string): string {
		const found = asignaciones.find(
			(a) => a.parte_id === parteId && a.ambito === ambito && a.rol === rol,
		);
		return found ? found.hermano_nombre : "";
	}

	if (loading) return <p style={{ padding: 20 }}>Cargando...</p>;
	if (error) return <p style={{ padding: 20, color: "red" }}>Error: {error}</p>;
	if (!semana) return <p style={{ padding: 20 }}>Semana no encontrada.</p>;

	const currentIndex = semanas.findIndex((s) => s.id === semana.id);
	const prevId = currentIndex > 0 ? semanas[currentIndex - 1].id : null;
	const nextId = currentIndex < semanas.length - 1 ? semanas[currentIndex + 1].id : null;

	if (semana.tipo_especial === "asamblea" || semana.tipo_especial === "conmemoracion") {
		return (
			<div className="s140-wrapper">
				<div className="no-print">
					{prevId ? (
						<Link to={`/semanas/${prevId}/s140`}>← Anterior</Link>
					) : (
						<span>← Anterior</span>
					)}
					{" | "}
					{nextId ? (
						<Link to={`/semanas/${nextId}/s140`}>Siguiente →</Link>
					) : (
						<span>Siguiente →</span>
					)}
					{" | "}
					<button onClick={() => window.print()}>Imprimir / Guardar PDF</button>
				</div>
				<p style={{ padding: 20 }}>
					Esta semana es de tipo "{semana.tipo_especial}". No hay programa S-140 disponible.
				</p>
			</div>
		);
	}

	const dateText = formatDateForS140(semana.fecha_inicio, semana.fecha_fin);
	const bookText = semana.libro_biblico ? ` | ${semana.libro_biblico}` : "";
	const fullDate = dateText + bookText;

	const tesorosPartes = partes.filter((p) => p.seccion === "tesoros");
	const mejoresPartes = partes.filter((p) => p.seccion === "mejores_maestros");
	const vidaPartes = partes.filter((p) => p.seccion === "vida_cristiana");

	function renderPartRow(parte: Parte, index: number) {
		const tipo = parte.tipo_asignacion;
		const dur = parte.duracion_minutos ?? 0;
		const titulo = parte.titulo ?? "";

		if (tipo === "introduccion") {
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part" colSpan={3}>
						• {titulo || "Palabras de introducción"} ({dur} min.)
					</td>
				</tr>
			);
		}

		if (tipo === "conclusion") {
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part" colSpan={3}>
						• {titulo || "Palabras de conclusión"} ({dur} min.)
					</td>
				</tr>
			);
		}

		if (tipo === "estudio_biblico") {
			const conductor = getAssignmentName(parte.id, "auditorio_principal", "conductor");
			const lector = getAssignmentName(parte.id, "auditorio_principal", "lector");
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part" colSpan={2}>
						{index}. Estudio bíblico de la congregación ({dur} mins.)
					</td>
					<td className="val">
						<span className="lbl">Conductor/Lector:</span>
						<br />
						{conductor} / {lector}
					</td>
				</tr>
			);
		}

		if (tipo === "discurso_no_estudiante" || tipo === "busquemos_perlas" ||
			tipo === "analisis_auditorio" || tipo === "necesidades_congregacion") {
			const presentador = getAssignmentName(parte.id, "auditorio_principal", "estudiante") ||
				getAssignmentName(parte.id, "auditorio_principal", "estudiante");
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part" colSpan={2}>
						{index}. {titulo} ({dur} mins.)
					</td>
					<td className="val">{presentador}</td>
				</tr>
			);
		}

		if (tipo === "lectura_biblia" || tipo === "discurso_estudiante") {
			const estudianteAux = getAssignmentName(parte.id, "sala_auxiliar", "estudiante") ||
				getAssignmentName(parte.id, "sala_auxiliar", "estudiante");
			const estudianteAud = getAssignmentName(parte.id, "auditorio_principal", "estudiante") ||
				getAssignmentName(parte.id, "auditorio_principal", "estudiante");
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part">
						{index}. {titulo} ({dur} mins.)
					</td>
					<td className="val">
						<span className="lbl">Estudiante:</span> {estudianteAux}
					</td>
					<td className="val">{estudianteAud}</td>
				</tr>
			);
		}

		// empiece_conversaciones, haga_revisitas, haga_discipulos, explique_creencias_escenificacion
		const estAux = getAssignmentName(parte.id, "sala_auxiliar", "estudiante");
			const ayuAux = getAssignmentName(parte.id, "sala_auxiliar", "ayudante");
			const estAud = getAssignmentName(parte.id, "auditorio_principal", "estudiante");
			const ayuAud = getAssignmentName(parte.id, "auditorio_principal", "ayudante");
		return (
			<tr key={parte.id}>
				<td className="time">0:00</td>
				<td className="bullet-part">
					{index}. {titulo} ({dur} mins.)
				</td>
				<td className="val">
					<span className="lbl">Estudiante/Ayudante:</span>
					<br />
					{estAux} / {ayuAux}
				</td>
				<td className="val">
					<span className="lbl">Estudiante/Ayudante:</span>
					<br />
					{estAud} / {ayuAud}
				</td>
			</tr>
		);
	}

	function renderSection(
		secDef: { key: string; label: string; css: string },
		secPartes: Parte[],
		startIndex: number,
	) {
		const rows: React.JSX.Element[] = [];

		if (secDef.key !== "vida_cristiana") {
			rows.push(
				<tr key={`header-${secDef.key}`} className="row-section-header">
					<td className={`sec-header ${secDef.css}`} colSpan={2}>
						{secDef.label}
					</td>
					<td className="col-sala-header">Sala auxiliar</td>
					<td className="col-aud-header">Auditorio principal</td>
				</tr>,
			);
		}

		secPartes.forEach((parte, i) => {
			rows.push(renderPartRow(parte, startIndex + i + 1));
		});

		return rows;
	}

	let globalIndex = 0;
	const tesorosRows = renderSection(
		SECCIONES[0],
		tesorosPartes,
		globalIndex,
	);
	globalIndex += tesorosPartes.length;
	const mejoresRows = renderSection(
		SECCIONES[1],
		mejoresPartes,
		globalIndex,
	);
	globalIndex += mejoresPartes.length;

	return (
		<div className="s140-wrapper">
			<div className="no-print">
				{prevId ? (
					<Link to={`/semanas/${prevId}/s140`}>← Anterior</Link>
				) : (
					<span>← Anterior</span>
				)}
				{" | "}
				{nextId ? (
					<Link to={`/semanas/${nextId}/s140`}>Siguiente →</Link>
				) : (
					<span>Siguiente →</span>
				)}
				{" | "}
				<button onClick={() => window.print()}>Imprimir / Guardar PDF</button>
			</div>

			<div className="week-container">
				<table className="s140-table">
					<tbody>
						{/* Header */}
						<tr className="row-header">
							<td colSpan={2} className="cong-name">{CONG_NAME}</td>
							<td colSpan={2} className="main-title">
								VIDA Y MINISTERIO CRISTIANOS
							</td>
						</tr>
						{/* Spacer */}
						<tr style={{ height: 4, border: "none" }}>
							<td style={{ border: "none" }} colSpan={4} />
						</tr>
						{/* Date + President */}
						<tr className="row-info">
							<td colSpan={2} className="date-text">{fullDate}</td>
							<td colSpan={2} className="pres-text">
								<span className="lbl">Presidente:</span>{" "}
								<span className="val">{getPersonaName(semana.presidente_id)}</span>
							</td>
						</tr>
						{/* Consejero */}
						<tr className="row-info">
							<td style={{ border: "none" }} />
							<td colSpan={2} />
							<td className="pres-text">
								<span className="lbl">Consejero de la sala auxiliar:</span>{" "}
								<span className="val">{getPersonaName(semana.consejero_sala_id)}</span>
							</td>
						</tr>
						{/* Opening song + prayer */}
						<tr>
							<td className="time">0:00</td>
							<td className="bullet-part" colSpan={2}>
								• Canción {semana.cancion_apertura ?? ""}
							</td>
							<td>
								<span className="lbl">Oración:</span>{" "}
								<span className="val">
									{getPersonaName(semana.orador_oracion_apertura_id)}
								</span>
							</td>
						</tr>
						{/* Introduction */}
						<tr>
							<td className="time">0:00</td>
							<td className="bullet-part" colSpan={3}>
								• Palabras de introducción (1 min.)
							</td>
						</tr>
						{/* Tesoros section */}
						{tesorosRows}
						{/* Mejores Maestros section */}
						{mejoresRows}
						{/* Vida Cristiana header */}
						<tr>
							<td className={`sec-header sec-vida`} colSpan={4}>
								NUESTRA VIDA CRISTIANA
							</td>
						</tr>
						{/* Intermediate song */}
						<tr>
							<td className="time">0:00</td>
							<td className="bullet-part" colSpan={3}>
								• Canción {semana.cancion_intermedia ?? ""}
							</td>
						</tr>
						{/* Vida Cristiana parts */}
						{vidaPartes.map((parte, i) => renderPartRow(parte, globalIndex + i + 1))}
						{/* Closing song + prayer */}
						<tr>
							<td className="time">0:00</td>
							<td className="bullet-part" colSpan={2}>
								• Canción {semana.cancion_cierre ?? ""}
							</td>
							<td>
								<span className="lbl">Oración:</span>{" "}
								<span className="val">
									{getPersonaName(semana.orador_oracion_cierre_id)}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
