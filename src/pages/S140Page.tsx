import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Semana, Parte, AsignacionDetail, Hermano } from "../types";
import S140WeekView from "../components/S140WeekView";
import { downloadS140AsJpeg } from "../utils/s140Export";
import "../styles/s140.css";

export default function S140Page() {
	const { id } = useParams();
	const contentRef = useRef<HTMLDivElement>(null);
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

	if (loading) return <p style={{ padding: 20 }}>Cargando...</p>;
	if (error) return <p style={{ padding: 20, color: "red" }}>Error: {error}</p>;
	if (!semana) return <p style={{ padding: 20 }}>Semana no encontrada.</p>;

	const currentIndex = semanas.findIndex((s) => s.id === semana.id);
	const prevId = currentIndex > 0 ? semanas[currentIndex - 1].id : null;
	const nextId = currentIndex < semanas.length - 1 ? semanas[currentIndex + 1].id : null;

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
				{" | "}
				<button
					onClick={() => {
						if (contentRef.current) {
							downloadS140AsJpeg(contentRef.current, `S140-${semana.fecha_inicio}.jpg`);
						}
					}}
				>
					Descargar JPEG
				</button>
				{" | "}
				<Link to="/s140/rango" className="text-slate-600 hover:text-slate-800 underline text-sm">
					Ver bimestre completo
				</Link>
			</div>

			<div ref={contentRef}>
				<S140WeekView
					semana={semana}
					partes={partes}
					asignaciones={asignaciones}
					personas={personas}
				/>
			</div>
		</div>
	);
}
