import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import HermanosListPage from "./pages/HermanosListPage";
import HermanoFormPage from "./pages/HermanoFormPage";
import SemanasListPage from "./pages/SemanasListPage";
import ImportarMwbPage from "./pages/ImportarMwbPage";
import SemanaFormPage from "./pages/SemanaFormPage";
import AsignacionesPage from "./pages/AsignacionesPage";
import FamiliasListPage from "./pages/FamiliasListPage";
import FamiliaDetailPage from "./pages/FamiliaDetailPage";
import S140Page from "./pages/S140Page";
import S140RangoPage from "./pages/S140RangoPage";
import S89Page from "./pages/S89Page";
import S89RangoPage from "./pages/S89RangoPage";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<DashboardPage />} />
					<Route path="/hermanos" element={<HermanosListPage />} />
					<Route path="/hermanos/nuevo" element={<HermanoFormPage />} />
					<Route path="/hermanos/:id/editar" element={<HermanoFormPage />} />
					<Route path="/semanas" element={<SemanasListPage />} />
					<Route path="/semanas/importar" element={<ImportarMwbPage />} />
					<Route path="/semanas/nuevo" element={<SemanaFormPage />} />
					<Route path="/semanas/:id/editar" element={<SemanaFormPage />} />
					<Route path="/semanas/:id" element={<AsignacionesPage />} />
					<Route path="/familias" element={<FamiliasListPage />} />
					<Route path="/familias/:id" element={<FamiliaDetailPage />} />
					<Route path="/semanas/:id/s140" element={<S140Page />} />
					<Route path="/s140/rango" element={<S140RangoPage />} />
					<Route path="/semanas/:id/s89" element={<S89Page />} />
					<Route path="/s89/rango" element={<S89RangoPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
