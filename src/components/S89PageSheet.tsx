import React from "react";
import type { S89Card as S89CardData } from "../types";
import S89Card from "./S89Card";

const MESES = [
	"enero", "febrero", "marzo", "abril", "mayo", "junio",
	"julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateDisplay(fechaInicio: string): string {
	const [, m, d] = fechaInicio.split("-");
	const y = fechaInicio.split("-")[0];
	const dia = Number(d);
	const mes = MESES[Number(m) - 1];
	return `${dia} de ${mes} de ${y}`;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
}

interface S89PageSheetProps {
	cards: S89CardData[];
}

export function renderS89Pages(cards: S89CardData[]): React.JSX.Element[] {
	const pages = chunkArray(cards, 4);
	return pages.map((pageCards, pageIndex) => (
		<S89PageSheet key={pageIndex} cards={pageCards} />
	));
}

function S89PageSheet({ cards }: S89PageSheetProps) {
	return (
		<div className="page-shadow-wrapper">
			<div className="s89-grid-container">
				{cards.map((card, i) => (
					<S89Card
						key={`${card.parte_id}-${card.ambito}-${i}`}
						estudianteNombre={card.estudiante_nombre}
						ayudanteNombre={card.ayudante_nombre}
						fechaFormateada={formatDateDisplay(card.fecha_inicio)}
						numeroOrden={card.numero_orden}
						ambito={card.ambito}
					/>
				))}
				{/* Fill remaining slots with empty divs to maintain grid */}
				{cards.length < 4 &&
					Array.from({ length: 4 - cards.length }).map((_, i) => (
						<div key={`empty-${i}`} className="s89-card" />
					))}
			</div>
		</div>
	);
}

export default S89PageSheet;
