import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { ParsedWeek, ParsedPart } from "../types";
import { ASIGNACION_LABELS } from "../types";

type Step = "idle" | "file_selected" | "parsing" | "preview" | "saving" | "error";

function seccionColor(seccion: string) {
	switch (seccion) {
		case "tesoros":
			return "bg-blue-100 text-blue-700";
		case "mejores_maestros":
			return "bg-green-100 text-green-700";
		case "vida_cristiana":
			return "bg-orange-100 text-orange-700";
		case "marco":
			return "bg-gray-100 text-gray-500";
		default:
			return "bg-gray-100 text-gray-500";
	}
}

function seccionLabel(seccion: string) {
	switch (seccion) {
		case "tesoros":
			return "Tesoros";
		case "mejores_maestros":
			return "Mejores Maestros";
		case "vida_cristiana":
			return "Vida Cristiana";
		case "marco":
			return "Marco";
		default:
			return seccion;
	}
}

export default function ImportarMwbPage() {
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>("idle");
	const [filePath, setFilePath] = useState<string>("");
	const [parsedWeeks, setParsedWeeks] = useState<ParsedWeek[]>([]);
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
	const [filterDate, setFilterDate] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
	const [editingParts, setEditingParts] = useState<Record<string, Partial<ParsedPart>>>({});

	const handlePickFile = async () => {
		try {
			const path = await invoke<string | null>("pick_mwb_file");
			if (path) {
				setFilePath(path);
				setStep("file_selected");
				setErrorMessage("");
			}
		} catch (err) {
			setErrorMessage(String(err));
			setStep("error");
		}
	};

	const handleParse = async () => {
		try {
			setStep("parsing");
			const weeks = await invoke<ParsedWeek[]>("parse_mwb_pdf", {
				path: filePath,
			});
			setParsedWeeks(weeks);
			setSelectedIndices(new Set(weeks.map((_, i) => i)));
			setStep("preview");
		} catch (err) {
			setErrorMessage(String(err));
			setStep("error");
		}
	};

	const handleFilterDateChange = (date: string) => {
		setFilterDate(date);
		if (!date) {
			setSelectedIndices(new Set(parsedWeeks.map((_, i) => i)));
			return;
		}
		const newSelected = new Set<number>();
		parsedWeeks.forEach((w, i) => {
			if (w.fecha_inicio >= date) {
				newSelected.add(i);
			}
		});
		setSelectedIndices(newSelected);
	};

	const toggleWeek = (index: number) => {
		setSelectedIndices((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	};

	const toggleExpand = (index: number) => {
		setExpandedWeek((prev) => (prev === index ? null : index));
	};

	const handlePartEdit = (
		weekIndex: number,
		partIndex: number,
		field: string,
		value: string | number | boolean,
	) => {
		const key = `${weekIndex}-${partIndex}`;
		setEditingParts((prev) => ({
			...prev,
			[key]: { ...prev[key], [field]: value },
		}));
	};

	const buildImportData = (): ParsedWeek[] => {
		return Array.from(selectedIndices)
			.sort()
			.map((weekIdx) => {
				const original = parsedWeeks[weekIdx];
				const partes = original.partes.map((p, pIdx) => {
					const key = `${weekIdx}-${pIdx}`;
					const edits = editingParts[key] || {};
					return {
						...p,
						...(edits.titulo !== undefined && { titulo: edits.titulo }),
						...(edits.tipo_asignacion !== undefined && {
							tipo_asignacion: edits.tipo_asignacion,
						}),
						...(edits.duracion_minutos !== undefined && {
							duracion_minutos: Number(edits.duracion_minutos),
						}),
						...(edits.requiere_sala_auxiliar !== undefined && {
							requiere_sala_auxiliar: Boolean(edits.requiere_sala_auxiliar),
						}),
						...(edits.requiere_ayudante !== undefined && {
							requiere_ayudante: Boolean(edits.requiere_ayudante),
						}),
					};
				});
				return { ...original, partes };
			});
	};

	const handleImport = async () => {
		try {
			setStep("saving");
			const importData = buildImportData();
			await invoke("import_parsed_weeks", { parsedWeeks: importData });
			navigate("/semanas");
		} catch (err) {
			setErrorMessage(String(err));
			setStep("error");
		}
	};

	const fileName = filePath.split(/[\\/]/).pop() ?? filePath;

	if (step === "parsing") {
		return (
			<div className="text-center py-16">
				<p className="text-lg text-gray-600">Analizando PDF...</p>
				<div className="mt-4 inline-block w-6 h-6 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (step === "saving") {
		return (
			<div className="text-center py-16">
				<p className="text-lg text-gray-600">Guardando semanas...</p>
				<div className="mt-4 inline-block w-6 h-6 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (step === "error") {
		return (
			<div className="text-center py-12">
				<p className="text-red-500 bg-red-50 border border-red-200 rounded p-4 mb-4 inline-block">
					{errorMessage}
				</p>
				<div className="flex gap-2 justify-center">
					<button
						onClick={() => {
							setStep("idle");
							setErrorMessage("");
						}}
						className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 text-sm"
					>
						Reintentar
					</button>
					<button
						onClick={() => navigate("/semanas")}
						className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded hover:bg-slate-50 text-sm"
					>
						Volver
					</button>
				</div>
			</div>
		);
	}

	if (step === "preview") {
		const selectedCount = selectedIndices.size;
		return (
			<div>
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-xl font-bold text-gray-800">
						Vista previa de importación
					</h1>
					<button
						onClick={() => {
							setStep("idle");
							setFilePath("");
							setParsedWeeks([]);
						}}
						className="text-sm text-gray-500 hover:text-gray-700 underline"
					>
						Seleccionar otro archivo
					</button>
				</div>

				<div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-sm text-gray-600">
					Archivo: <span className="font-medium">{fileName}</span> —{" "}
					{parsedWeeks.length} semanas detectadas
				</div>

				<div className="mb-4">
					<label className="text-sm text-gray-600 mr-2">
						A partir de fecha:
					</label>
					<input
						type="date"
						value={filterDate}
						onChange={(e) => handleFilterDateChange(e.target.value)}
						className="border border-gray-300 rounded px-2 py-1 text-sm"
					/>
				</div>

				<div className="space-y-2 mb-4">
					{parsedWeeks.map((week, i) => {
						const isSelected = selectedIndices.has(i);
						const isSpecial =
							week.tipo_especial !== "Normal" &&
							week.tipo_especial !== "normal";
						return (
							<div
								key={i}
								className={`border rounded-lg overflow-hidden ${
									isSelected ? "border-slate-300" : "border-gray-200 opacity-60"
								}`}
							>
								<div className="flex items-center gap-3 px-3 py-2 bg-gray-50">
									<input
										type="checkbox"
										checked={isSelected}
										onChange={() => toggleWeek(i)}
										className="w-4 h-4"
									/>
									<button
										className="flex-1 text-left"
										onClick={() => toggleExpand(i)}
									>
										<span className="font-medium text-sm">
											{week.fecha_inicio} — {week.fecha_fin}
										</span>
										{week.libro_biblico && (
											<span className="text-gray-500 text-xs ml-2">
												· {week.libro_biblico}
											</span>
										)}
									</button>
									{isSpecial && (
										<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
											Sin reunión
										</span>
									)}
								</div>

								{expandedWeek === i && !isSpecial && (
									<div className="p-3 border-t border-gray-200">
										<div className="text-xs mb-2">
											<span className="font-semibold">Canciones:</span>{" "}
											{week.cancion_apertura} ·{" "}
											{week.cancion_intermedia} ·{" "}
											{week.cancion_cierre}
										</div>
										<table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
											<thead className="bg-gray-100">
												<tr>
													<th className="px-2 py-1 text-left">#</th>
													<th className="px-2 py-1 text-left">Sección</th>
													<th className="px-2 py-1 text-left">Título</th>
													<th className="px-2 py-1 text-left">Tipo</th>
													<th className="px-2 py-1 text-center">Dur.</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-200">
												{week.partes.map((part, pIdx) => {
													const editKey = `${i}-${pIdx}`;
													const edits = editingParts[editKey] || {};
													const currentTipo =
														edits.tipo_asignacion ??
														part.tipo_asignacion;
													const isUncertain =
														currentTipo ===
															"discurso_estudiante" &&
														part.tipo_asignacion ===
															"discurso_estudiante" &&
														!part.titulo
															.toUpperCase()
															.includes("DISCURSO");
													return (
														<tr
															key={pIdx}
															className={
																isUncertain
																	? "bg-yellow-50"
																	: ""
															}
														>
															<td className="px-2 py-1">
																{part.numero_orden}
															</td>
															<td className="px-2 py-1">
																<span
																	className={`inline-block px-1.5 py-0.5 rounded text-xs ${seccionColor(part.seccion)}`}
																>
																	{seccionLabel(part.seccion)}
																</span>
															</td>
															<td className="px-2 py-1">
																<input
																	type="text"
																	value={
																		(edits.titulo ??
																			part.titulo) as string
																	}
																	onChange={(e) =>
																		handlePartEdit(
																			i,
																			pIdx,
																			"titulo",
																			e.target.value,
																		)
																	}
																	className="w-full border border-gray-300 rounded px-1 py-0.5"
																/>
															</td>
															<td className="px-2 py-1">
																<select
																	value={currentTipo}
																	onChange={(e) =>
																		handlePartEdit(
																			i,
																			pIdx,
																			"tipo_asignacion",
																			e.target.value,
																		)
																	}
																	className="border border-gray-300 rounded px-1 py-0.5 max-w-[180px]"
																>
																	{Object.entries(
																		ASIGNACION_LABELS,
																	).map(
																		([key, label]) => (
																			<option
																				key={key}
																				value={key}
																			>
																				{label}
																			</option>
																		),
																	)}
																</select>
															</td>
															<td className="px-2 py-1 text-center">
																<input
																	type="number"
																	value={
																		(edits
																			.duracion_minutos ??
																			part.duracion_minutos) as number
																	}
																	onChange={(e) =>
																		handlePartEdit(
																			i,
																			pIdx,
																			"duracion_minutos",
																			Number(
																				e.target
																					.value,
																			),
																		)
																	}
																	className="w-12 border border-gray-300 rounded px-1 py-0.5 text-center"
																	min={0}
																/>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}

								{expandedWeek === i && isSpecial && (
									<div className="p-3 border-t border-gray-200 text-sm text-gray-500">
										Esta semana no hay reunión. Se importará como
										referencia sin partes asignables.
									</div>
								)}
							</div>
						);
					})}
				</div>

				<div className="flex gap-2">
					<button
						onClick={handleImport}
						disabled={selectedCount === 0}
						className={`px-6 py-2 rounded text-sm transition-colors ${
							selectedCount > 0
								? "bg-slate-700 text-white hover:bg-slate-800"
								: "bg-gray-200 text-gray-400 cursor-not-allowed"
						}`}
					>
						Importar {selectedCount} semana
						{selectedCount !== 1 ? "s" : ""} seleccionada
						{selectedCount !== 1 ? "s" : ""}
					</button>
				</div>
			</div>
		);
	}

	if (step === "file_selected") {
		return (
			<div className="text-center py-12">
				<h1 className="text-xl font-bold text-gray-800 mb-2">
					Importar guía de actividades (mwb)
				</h1>
				<div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6 inline-block text-sm text-gray-600">
					Archivo seleccionado: <span className="font-medium">{fileName}</span>
				</div>
				<div className="flex gap-2 justify-center">
					<button
						onClick={handleParse}
						className="bg-slate-700 text-white px-6 py-3 rounded hover:bg-slate-800 transition-colors"
					>
						Analizar PDF
					</button>
					<button
						onClick={handlePickFile}
						className="bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded hover:bg-slate-50 transition-colors"
					>
						Seleccionar otro archivo
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="text-center py-12">
			<h1 className="text-xl font-bold text-gray-800 mb-2">
				Importar guía de actividades (mwb)
			</h1>
			<p className="text-gray-500 mb-6">
				Selecciona el archivo mwb_S_YYYYMM.pdf para importar el programa
				semanal
			</p>
			<button
				onClick={handlePickFile}
				className="bg-slate-700 text-white px-6 py-3 rounded hover:bg-slate-800 transition-colors"
			>
				Seleccionar PDF
			</button>
		</div>
	);
}
