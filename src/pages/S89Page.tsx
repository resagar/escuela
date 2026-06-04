import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Semana, S89Card } from "../types";
import { renderS89Pages } from "../components/S89PageSheet";
import { downloadS89AsJpeg } from "../utils/s89Export";
import "../styles/s89.css";

export default function S89Page() {
	const { id } = useParams();
	const contentRef = useRef<HTMLDivElement>(null);
	const [cards, setCards] = useState<S89Card[]>([]);
	const [semanas, setSemanas] = useState<Semana[]>([]);
	const [semana, setSemana] = useState<Semana | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		const semanaId = Number(id);

		setLoading(true);
		setError(null);

		Promise.all([
			invoke<S89Card[]>("get_s89_cards_for_week", { semanaId }),
			invoke<Semana[]>("list_semanas"),
			invoke<Semana>("get_semana", { id: semanaId }),
		])
			.then(([c, allSemanas, s]) => {
				setCards(c);
				setSemanas(allSemanas);
				setSemana(s);
			})
			.catch((err) => setError(String(err)))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) return <p style={{ padding: 20 }}>Cargando...</p>;
	if (error) return <p style={{ padding: 20, color: "red" }}>Error: {error}</p>;
	if (!semana) return <p style={{ padding: 20 }}>Semana no encontrada.</p>;

	const currentIndex = semanas.findIndex((s) => s.id === semana.id);
	const prevId = currentIndex > 0 ? semanas[currentIndex - 1].id : null;
	const nextId = currentIndex < semanas.length - 1 ? semanas[currentIndex + 1].id : null;

	return (
		<div className="s89-wrapper">
			<div className="no-print">
				{prevId ? (
					<Link to={`/semanas/${prevId}/s89`}>← Anterior</Link>
				) : (
					<span>← Anterior</span>
				)}
				{" | "}
				{nextId ? (
					<Link to={`/semanas/${nextId}/s89`}>Siguiente →</Link>
				) : (
					<span>Siguiente →</span>
				)}
				{" | "}
				<button onClick={() => window.print()}>Imprimir / Guardar PDF</button>
				{" | "}
				<button
					onClick={() => {
						if (contentRef.current) {
							downloadS89AsJpeg(contentRef.current, `S89-${semana.fecha_inicio}.jpg`);
						}
					}}
				>
					Descargar JPEG
				</button>
				{" | "}
				<Link to="/s89/rango" className="text-slate-600 hover:text-slate-800 underline text-sm">
					Ver bimestre completo
				</Link>
			</div>

			<div ref={contentRef}>
				{renderS89Pages(cards)}
			</div>
		</div>
	);
}
