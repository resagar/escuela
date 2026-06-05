import { useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Semana, S89Card } from "../types";
import { renderS89Pages } from "../components/S89PageSheet";
import { downloadS89AsJpeg } from "../utils/s89Export";
import "../styles/s89.css";

interface WeekCards {
	semana: Semana;
	cards: S89Card[];
}

function formatDateShort(fecha: string): string {
	const [_y, m, d] = fecha.split("-");
	return `${Number(d)}/${Number(m)}`;
}

function groupByMonth(semanas: Semana[]): Map<string, Semana[]> {
	const groups = new Map<string, Semana[]>();
	const MESES_LABELS = [
		"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
		"Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
	];
	for (const s of semanas) {
		const monthIdx = Number(s.fecha_inicio.split("-")[1]) - 1;
		const year = s.fecha_inicio.split("-")[0];
		const key = `${MESES_LABELS[monthIdx]} ${year}`;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(s);
	}
	return groups;
}

export default function S89RangoPage() {
	const previewRef = useRef<HTMLDivElement>(null);
	const [semanas, setSemanas] = useState<Semana[]>([]);
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const [fechaDesde, setFechaDesde] = useState("");
	const [fechaHasta, setFechaHasta] = useState("");
	const [previewData, setPreviewData] = useState<WeekCards[]>([]);
	const [showPreview, setShowPreview] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadingPreview, setLoadingPreview] = useState(false);

	useEffect(() => {
		loadSemanas();
	}, []);

	const loadSemanas = async () => {
		try {
			setLoading(true);
			const data = await invoke<Semana[]>("list_semanas");
			setSemanas(data);
			setSelected(new Set(data.map((s) => s.id)));
		} catch (err) {
			console.error("Error loading semanas:", err);
		} finally {
			setLoading(false);
		}
	};

	const groupedSemanas = useMemo(() => groupByMonth(semanas), [semanas]);

	useEffect(() => {
		if (!fechaDesde && !fechaHasta) return;
		const newSelected = new Set<number>();
		for (const s of semanas) {
			const okDesde = !fechaDesde || s.fecha_inicio >= fechaDesde;
			const okHasta = !fechaHasta || s.fecha_fin <= fechaHasta;
			if (okDesde && okHasta) newSelected.add(s.id);
		}
		setSelected(newSelected);
	}, [fechaDesde, fechaHasta]);

	const toggleAll = () => {
		if (selected.size === semanas.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(semanas.map((s) => s.id)));
		}
	};

	const toggleWeek = (id: number) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const loadPreview = async () => {
		try {
			setLoadingPreview(true);
			const selectedSemanas = semanas.filter((s) => selected.has(s.id));
			if (selectedSemanas.length === 0) return;

			const weekDataList: WeekCards[] = [];

			for (const s of selectedSemanas) {
				const cards = await invoke<S89Card[]>("get_s89_cards_for_week", { semanaId: s.id });
				weekDataList.push({ semana: s, cards });
			}

			setPreviewData(weekDataList);
			setShowPreview(true);
		} catch (err) {
			console.error("Error loading preview:", err);
		} finally {
			setLoadingPreview(false);
		}
	};

	if (loading) {
		return <p className="text-gray-500 text-center py-8">Cargando semanas...</p>;
	}

	return (
		<div>
			{!showPreview ? (
				<>
					<h1 className="text-xl font-bold text-gray-800 mb-4">
						S-89 — Selección de semanas
					</h1>

					<div className="flex items-center gap-4 mb-4">
						<button
							onClick={toggleAll}
							className="text-xs text-slate-600 hover:text-slate-800 underline"
						>
							{selected.size === semanas.length ? "Deseleccionar todas" : "Seleccionar todas"}
						</button>
						<span className="text-xs text-gray-400">
							{selected.size} de {semanas.length} semanas
						</span>
					</div>

					<div className="flex gap-3 mb-4">
						<div>
							<label className="block text-xs text-gray-500 mb-1">Desde</label>
							<input
								type="date"
								value={fechaDesde}
								onChange={(e) => setFechaDesde(e.target.value)}
								className="border border-gray-300 rounded px-2 py-1 text-xs"
							/>
						</div>
						<div>
							<label className="block text-xs text-gray-500 mb-1">Hasta</label>
							<input
								type="date"
								value={fechaHasta}
								onChange={(e) => setFechaHasta(e.target.value)}
								className="border border-gray-300 rounded px-2 py-1 text-xs"
							/>
						</div>
					</div>

					<div className="space-y-4 mb-6">
						{Array.from(groupedSemanas.entries()).map(([month, sems]) => (
							<div key={month}>
								<h2 className="text-sm font-semibold text-gray-700 mb-2">{month}</h2>
								<div className="space-y-1">
									{sems.map((s) => (
										<label
											key={s.id}
											className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${
												selected.has(s.id)
													? "border-slate-400 bg-slate-50"
													: "border-gray-200 bg-white hover:bg-gray-50"
											}`}
										>
											<input
												type="checkbox"
												checked={selected.has(s.id)}
												onChange={() => toggleWeek(s.id)}
												className="rounded"
											/>
											<span className="text-sm text-gray-800">
												{formatDateShort(s.fecha_inicio)} - {formatDateShort(s.fecha_fin)}
											</span>
											{s.libro_biblico && (
												<span className="text-xs text-gray-500">{s.libro_biblico}</span>
											)}
											{s.tipo_especial !== "normal" && (
												<span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
													{s.tipo_especial}
												</span>
											)}
										</label>
									))}
								</div>
							</div>
						))}
					</div>

					<button
						onClick={loadPreview}
						disabled={selected.size === 0 || loadingPreview}
						className={`px-6 py-2 rounded text-sm transition-colors ${
							selected.size === 0 || loadingPreview
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-slate-700 text-white hover:bg-slate-800"
						}`}
					>
						{loadingPreview ? "Cargando..." : "Vista previa"}
					</button>
				</>
			) : (
				<div className="s89-wrapper">
					<div className="no-print mb-4 flex items-center gap-4">
						<button
							onClick={() => setShowPreview(false)}
							className="text-slate-600 hover:text-slate-800 underline text-sm"
						>
							← Volver a selección
						</button>
						<button
							onClick={() => window.print()}
							className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
						>
							Imprimir / Guardar PDF
						</button>
						<button
							onClick={() => {
								if (previewRef.current) {
									downloadS89AsJpeg(previewRef.current, `S89-bimestre.jpg`);
								}
							}}
							className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded hover:bg-slate-50 transition-colors text-sm"
						>
							Descargar JPEG
						</button>
						<span className="text-xs text-gray-400">
							{previewData.length} semanas
						</span>
					</div>

					<div ref={previewRef}>
						{previewData.map((wd) => (
							<div key={wd.semana.id}>
								{renderS89Pages(wd.cards)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
