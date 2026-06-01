import { Outlet } from "react-router-dom";

export default function Layout() {
	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-slate-700 text-white px-4 py-3 shadow">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<a href="/" className="text-lg font-bold tracking-wide">
						Escuela — Asignaciones VyM
					</a>
					<div className="flex gap-4 text-sm">
						<a
							href="/hermanos"
							className="hover:text-slate-300 transition-colors"
						>
							Hermanos
						</a>
					</div>
				</div>
			</nav>
			<main className="max-w-4xl mx-auto p-4">
				<Outlet />
			</main>
		</div>
	);
}
