import React from "react";
import type { Semana, Parte, AsignacionDetail, Hermano } from "../types";

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

interface S140WeekViewProps {
	semana: Semana;
	partes: Parte[];
	asignaciones: AsignacionDetail[];
	personas: Record<number, Hermano>;
}

export default function S140WeekView({ semana, partes, asignaciones, personas }: S140WeekViewProps) {
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

	if (semana.tipo_especial === "asamblea" || semana.tipo_especial === "conmemoracion") {
		return (
			<div className="s140-wrapper">
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
					<td className="bullet-part" colSpan={4}>
						• {titulo || "Palabras de introducción"} ({dur} min.)
					</td>
				</tr>
			);
		}

		if (tipo === "conclusion") {
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part" colSpan={4}>
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
					<td className="lbl">Conductor/Lector:</td>
					<td className="val">{conductor} / {lector}</td>
				</tr>
			);
		}

		if (tipo === "discurso_no_estudiante" || tipo === "busquemos_perlas" ||
			tipo === "analisis_auditorio" || tipo === "necesidades_congregacion") {
			const presentador = getAssignmentName(parte.id, "auditorio_principal", "estudiante");
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part" colSpan={3}>
						{index}. {titulo} ({dur} mins.)
					</td>
					<td className="val">{presentador}</td>
				</tr>
			);
		}

		if (tipo === "lectura_biblia" || tipo === "discurso_estudiante") {
			const estudianteAux = getAssignmentName(parte.id, "sala_auxiliar", "estudiante");
			const estudianteAud = getAssignmentName(parte.id, "auditorio_principal", "estudiante");

			if (!parte.requiere_sala_auxiliar) {
				return (
					<tr key={parte.id}>
						<td className="time">0:00</td>
						<td className="bullet-part" colSpan={2}>
							{index}. {titulo} ({dur} mins.)
						</td>
						<td className="lbl">Estudiante:</td>
						<td className="val">{estudianteAud}</td>
					</tr>
				);
			}

			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part">
						{index}. {titulo} ({dur} mins.)
					</td>
					<td className="lbl">Estudiante:</td>
					<td className="val">{estudianteAux}</td>
					<td className="val">{estudianteAud}</td>
				</tr>
			);
		}

		// empiece_conversaciones, haga_revisitas, haga_discipulos, explique_creencias_escenificacion
		const estAux = getAssignmentName(parte.id, "sala_auxiliar", "estudiante");
		const ayuAux = getAssignmentName(parte.id, "sala_auxiliar", "ayudante");
		const estAud = getAssignmentName(parte.id, "auditorio_principal", "estudiante");
		const ayuAud = getAssignmentName(parte.id, "auditorio_principal", "ayudante");

		if (!parte.requiere_sala_auxiliar) {
			return (
				<tr key={parte.id}>
					<td className="time">0:00</td>
					<td className="bullet-part" colSpan={2}>
						{index}. {titulo} ({dur} mins.)
					</td>
					<td className="lbl">Estudiante/Ayudante:</td>
					<td className="val">{estAud} / {ayuAud}</td>
				</tr>
			);
		}

		return (
			<tr key={parte.id}>
				<td className="time">0:00</td>
				<td className="bullet-part">
					{index}. {titulo} ({dur} mins.)
				</td>
				<td className="lbl">Estudiante/Ayudante:</td>
				<td className="val">{estAux} / {ayuAux}</td>
				<td className="val">{estAud} / {ayuAud}</td>
			</tr>
		);
	}

	function renderSection(
		secDef: { key: string; label: string; css: string },
		secPartes: Parte[],
		startIndex: number,
	) {
		const rows: React.JSX.Element[] = [];
		const hasSalaAux = secPartes.some((p) => p.requiere_sala_auxiliar);

		if (hasSalaAux) {
			rows.push(
				<tr key={`header-${secDef.key}`}>
					<td className={`sec-header ${secDef.css}`} colSpan={3}>
						{secDef.label}
					</td>
					<td className="col-sala-header">Sala auxiliar</td>
					<td className="col-aud-header">Auditorio principal</td>
				</tr>,
			);
		} else {
			rows.push(
				<tr key={`header-${secDef.key}`}>
					<td className={`sec-header ${secDef.css}`} colSpan={3}>
						{secDef.label}
					</td>
					<td colSpan={2} style={{ border: "none", borderBottom: "0.5px solid var(--color-border)" }}></td>
				</tr>,
			);
		}

		secPartes.forEach((parte, i) => {
			rows.push(renderPartRow(parte, startIndex + i + 1));
		});

		return rows;
	}

	let globalIndex = 0;
	const tesorosRows = renderSection(SECCIONES[0], tesorosPartes, globalIndex);
	globalIndex += tesorosPartes.length;
	const mejoresRows = renderSection(SECCIONES[1], mejoresPartes, globalIndex);
	globalIndex += mejoresPartes.length;

	return (
		<div className="week-container">
			<div className="form-code">S-140-S&nbsp;&nbsp;11/23</div>
			<table className="s140-table">
				<colgroup>
					<col style={{ width: "6.2%" }} />
					<col style={{ width: "26.6%" }} />
					<col style={{ width: "18.9%" }} />
					<col style={{ width: "23.7%" }} />
					<col style={{ width: "24.6%" }} />
				</colgroup>
				<tbody>
					<tr className="row-header">
						<td colSpan={3} className="cong-name">{CONG_NAME}</td>
						<td colSpan={2} className="main-title">
							Vida y Ministerio Cristianos
						</td>
					</tr>
					<tr style={{ height: 4, border: "none" }}>
						<td colSpan={5} style={{ border: "none", padding: 0 }} />
					</tr>
					<tr className="row-info">
						<td colSpan={3} className="date-text">{fullDate}</td>
						<td className="lbl">Presidente:</td>
						<td className="val">{getPersonaName(semana.presidente_id)}</td>
					</tr>
					<tr className="row-info row-info-last">
						<td colSpan={3} />
						<td className="lbl">Consejero de la sala auxiliar:</td>
						<td className="val">{getPersonaName(semana.consejero_sala_id)}</td>
					</tr>
					<tr style={{ height: 4, border: "none" }}>
						<td colSpan={5} style={{ border: "none", padding: 0 }} />
					</tr>
					<tr>
						<td className="time">0:00</td>
						<td className="bullet-part" colSpan={2}>
							• Canción {semana.cancion_apertura ?? ""}
						</td>
						<td className="lbl">Oración:</td>
						<td className="val">
							{getPersonaName(semana.orador_oracion_apertura_id)}
						</td>
					</tr>
					<tr>
						<td className="time">0:00</td>
						<td className="bullet-part" colSpan={4}>
							• Palabras de introducción (1 min.)
						</td>
					</tr>
					{tesorosRows}
					{mejoresRows}
					<tr>
						<td className={`sec-header sec-vida`} colSpan={3}>
							NUESTRA VIDA CRISTIANA
						</td>
						<td colSpan={2} style={{ border: "none", borderBottom: "0.5px solid var(--color-border)" }}></td>
					</tr>
					<tr>
						<td className="time">0:00</td>
						<td className="bullet-part" colSpan={4}>
							• Canción {semana.cancion_intermedia ?? ""}
						</td>
					</tr>
					{vidaPartes.map((parte, i) => renderPartRow(parte, globalIndex + i + 1))}
					<tr>
						<td className="time">0:00</td>
						<td className="bullet-part" colSpan={2}>
							• Canción {semana.cancion_cierre ?? ""}
						</td>
						<td className="lbl">Oración:</td>
						<td className="val">
							{getPersonaName(semana.orador_oracion_cierre_id)}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
