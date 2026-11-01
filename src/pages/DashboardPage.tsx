import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import type { Semana, Parte, AsignacionDetail, Hermano } from "../types";

interface SemanaStatus {
	semana: Semana;
	totalPartes: number;
	asignadas: number;
	estado: "completa" | "parcial" | "pendiente";
}

function formatDateRange(inicio: string, fin: string) {
	const fmt = (d: string) => {
		const [_y, m, day] = d.split("-");
		return `${day}/${m}`;
	};
	return `${fmt(inicio)} - ${fmt(fin)}`;
}

function getBimestreLabel() {
	const now = new Date();
	const month = now.getMonth();
	const year = now.getFullYear();
	const bimestres: [string, string][] = [
		["Enero", "Febrero"],
		["Febrero", "Marzo"],
		["Marzo", "Abril"],
		["Abril", "Mayo"],
		["Mayo", "Junio"],
		["Junio", "Julio"],
		["Julio", "Agosto"],
		["Agosto", "Septiembre"],
		["Septiembre", "Octubre"],
		["Octubre", "Noviembre"],
		["Noviembre", "Diciembre"],
		["Diciembre", "Enero"],
	];
	const idx = Math.floor(month / 2);
	const [a, b] = bimestres[idx];
	return `${a} - ${b} ${year}`;
}

export default function DashboardPage() {
	const [stats, setStats] = useState<SemanaStatus[]>([]);
	const [hermanoCount, setHermanoCount] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadDashboard();
	}, []);

	const loadDashboard = async () => {
		try {
			setLoading(true);
			const [semanas, hermanos] = await Promise.all([
				invoke<Semana[]>("list_semanas"),
				invoke<Hermano[]>("list_hermanos"),
			]);
			setHermanoCount(hermanos.length);

			const statuses: SemanaStatus[] = [];
			for (const s of semanas) {
				if (s.tipo_especial === "asamblea" || s.tipo_especial === "conmemoracion") {
					statuses.push({ semana: s, totalPartes: 0, asignadas: 0, estado: "completa" });
					continue;
				}
				const [partes, asignaciones] = await Promise.all([
					invoke<Parte[]>("list_partes", { semanaId: s.id }),
					invoke<AsignacionDetail[]>("get_assignments_for_week", { semanaId: s.id }),
				]);
				const total = partes.length;
				const uniquePartes = new Set(asignaciones.map((a) => a.parte_id));
				const asignadas = uniquePartes.size;
				let estado: "completa" | "parcial" | "pendiente" = "pendiente";
				if (total > 0 && asignadas >= total) estado = "completa";
				else if (asignadas > 0) estado = "parcial";
				statuses.push({ semana: s, totalPartes: total, asignadas, estado });
			}
			setStats(statuses);
		} catch (err) {
			console.error("Error loading dashboard:", err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <p className="text-ui-muted text-center py-8">Cargando...</p>;
	}

	const semanasNormales = stats.filter((s) => s.totalPartes > 0);
	const completas = semanasNormales.filter((s) => s.estado === "completa").length;
	const parciales = semanasNormales.filter((s) => s.estado === "parcial").length;
	const pendientes = semanasNormales.filter((s) => s.estado === "pendiente").length;
	const totalPartesAll = semanasNormales.reduce((acc, s) => acc + s.totalPartes, 0);
	const totalAsignadasAll = semanasNormales.reduce((acc, s) => acc + s.asignadas, 0);
	const progressPct = totalPartesAll > 0 ? Math.round((totalAsignadasAll / totalPartesAll) * 100) : 0;

	const nextWeeks = stats
		.filter((s) => s.semana.tipo_especial === "normal" && s.estado !== "completa")
		.slice(0, 3);

	const firstPending = stats.find(
		(s) => s.semana.tipo_especial === "normal" && s.estado !== "completa",
	);

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-ui-text">Dashboard</h1>
				<p className="text-sm text-ui-muted">{getBimestreLabel()}</p>
			</div>

			{stats.length === 0 && hermanoCount === 0 ? (
				<div className="text-center py-16">
					<p className="text-ui-muted mb-4">
						Bienvenido a Escuela. Para comenzar, agrega hermanos y importa el programa.
					</p>
					<div className="flex gap-3 justify-center">
						<Link
							to="/hermanos/nuevo"
							className="bg-slate-700 text-white px-5 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
						>
							Agregar hermanos
						</Link>
						<Link
							to="/semanas/importar"
							className="bg-ui-surface text-ui-link border border-ui-border px-5 py-2 rounded hover:bg-ui-hover transition-colors text-sm"
						>
							Importar mwb
						</Link>
					</div>
				</div>
			) : (
				<>
					<div className="grid grid-cols-4 gap-4 mb-6">
						<div className="bg-ui-surface border border-ui-divider rounded-lg p-4 text-center">
							<div className="text-3xl font-bold text-ui-text">{semanasNormales.length}</div>
							<div className="text-xs text-ui-muted mt-1">Total semanas</div>
						</div>
						<div className="bg-ui-surface border border-ui-divider rounded-lg p-4 text-center">
							<div className="text-3xl font-bold text-ui-success">{completas}</div>
							<div className="text-xs text-ui-muted mt-1">Completas</div>
						</div>
						<div className="bg-ui-surface border border-ui-divider rounded-lg p-4 text-center">
							<div className="text-3xl font-bold text-ui-warning">{parciales}</div>
							<div className="text-xs text-ui-muted mt-1">Parciales</div>
						</div>
						<div className="bg-ui-surface border border-ui-divider rounded-lg p-4 text-center">
							<div className="text-3xl font-bold text-ui-danger">{pendientes}</div>
							<div className="text-xs text-ui-muted mt-1">Pendientes</div>
						</div>
					</div>

					<div className="bg-ui-surface border border-ui-divider rounded-lg p-4 mb-6">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-ui-text">Progreso del bimestre</span>
							<span className="text-sm font-semibold text-ui-text">{progressPct}%</span>
						</div>
						<div className="w-full bg-ui-subtle rounded-full h-3">
							<div
								className="bg-slate-700 h-3 rounded-full transition-all duration-500"
								style={{ width: `${progressPct}%` }}
							/>
						</div>
						<div className="text-xs text-ui-muted mt-1">
							{totalAsignadasAll} de {totalPartesAll} partes asignadas
						</div>
					</div>

					{nextWeeks.length > 0 && (
						<div className="mb-6">
							<h2 className="text-sm font-semibold text-ui-text mb-3">Próximas semanas</h2>
							<div className="space-y-2">
								{nextWeeks.map((s) => (
									<div
										key={s.semana.id}
										className="bg-ui-surface border border-ui-divider rounded-lg p-3 flex items-center justify-between"
									>
										<div>
											<div className="text-sm font-medium text-ui-text">
												{formatDateRange(s.semana.fecha_inicio, s.semana.fecha_fin)}
											</div>
											<div className="text-xs text-ui-muted mt-0.5">
												{s.asignadas} de {s.totalPartes} partes asignadas
												{s.semana.libro_biblico && ` · ${s.semana.libro_biblico}`}
											</div>
										</div>
										<Link
											to={`/semanas/${s.semana.id}`}
											className="text-ui-link hover:text-ui-link underline text-xs"
										>
											Asignar →
										</Link>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="flex gap-3">
						{firstPending && (
							<Link
								to={`/semanas/${firstPending.semana.id}`}
								className="bg-slate-700 text-white px-5 py-2 rounded hover:bg-slate-800 transition-colors text-sm"
							>
								Continuar asignaciones
							</Link>
						)}
						{semanasNormales.length > 0 && (
							<Link
								to="/s140/rango"
								className="bg-ui-surface text-ui-link border border-ui-border px-5 py-2 rounded hover:bg-ui-hover transition-colors text-sm"
							>
								Ver S-140 del bimestre
							</Link>
						)}
						<Link
							to="/semanas"
							className="bg-ui-surface text-ui-link border border-ui-border px-5 py-2 rounded hover:bg-ui-hover transition-colors text-sm"
						>
							Ver todas las semanas
						</Link>
					</div>
				</>
			)}
		</div>
	);
}
