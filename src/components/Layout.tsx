import { Outlet, Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
	{ to: "/", label: "Dashboard" },
	{ to: "/semanas", label: "Semanas" },
	{ to: "/hermanos", label: "Hermanos" },
	{ to: "/familias", label: "Familias" },
];

function getBreadcrumbs(pathname: string): Array<{ label: string; path: string }> {
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) return [];

	const crumbs: Array<{ label: string; path: string }> = [];
	let currentPath = "";

	for (const seg of segments) {
		currentPath += `/${seg}`;
		if (seg === "semanas") crumbs.push({ label: "Semanas", path: "/semanas" });
		else if (seg === "hermanos") crumbs.push({ label: "Hermanos", path: "/hermanos" });
		else if (seg === "familias") crumbs.push({ label: "Familias", path: "/familias" });
		else if (seg === "importar") crumbs.push({ label: "Importar MWB", path: currentPath });
		else if (seg === "nuevo" || seg === "editar") crumbs.push({ label: "Editar", path: currentPath });
		else if (seg === "s140") crumbs.push({ label: "S-140", path: currentPath });
		else if (seg === "s89") crumbs.push({ label: "S-89", path: currentPath });
		else if (/^\d+$/.test(seg)) {
			const prevSeg = segments[segments.indexOf(seg) - 1];
			if (prevSeg === "semanas") crumbs.push({ label: `Semana #${seg}`, path: currentPath });
			else if (prevSeg === "familias") crumbs.push({ label: `Familia #${seg}`, path: currentPath });
			else crumbs.push({ label: `#${seg}`, path: currentPath });
		}
	}

	return crumbs;
}

export default function Layout() {
	const location = useLocation();
	const breadcrumbs = getBreadcrumbs(location.pathname);
	const isHome = location.pathname === "/";

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-slate-700 text-white px-4 py-3 shadow">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<a href="/" className="text-lg font-bold tracking-wide">
						Escuela — Asignaciones VyM
					</a>
					<div className="flex gap-4 text-sm">
						{NAV_LINKS.map((link) => {
							const isActive =
								link.to === "/"
									? isHome
									: location.pathname.startsWith(link.to);
							return (
								<Link
									key={link.to}
									to={link.to}
									className={`transition-colors ${
										isActive
											? "font-bold text-white border-b-2 border-white pb-0.5"
											: "hover:text-slate-300"
									}`}
								>
									{link.label}
								</Link>
							);
						})}
					</div>
				</div>
			</nav>
			<main className="max-w-4xl mx-auto p-4">
				{breadcrumbs.length > 0 && (
					<nav className="text-xs text-gray-400 mb-3">
						{breadcrumbs.map((crumb, i) => (
							<span key={crumb.path}>
								{i > 0 && <span className="mx-1">/</span>}
								{i < breadcrumbs.length - 1 ? (
									<Link to={crumb.path} className="hover:text-gray-600">
										{crumb.label}
									</Link>
								) : (
									<span className="text-gray-600">{crumb.label}</span>
								)}
							</span>
						))}
					</nav>
				)}
				<Outlet />
			</main>
		</div>
	);
}
