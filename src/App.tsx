import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { CongregationSettingsProvider } from "./hooks/useCongregationSettings";
import AsignacionesPage from "./pages/AsignacionesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import DashboardPage from "./pages/DashboardPage";
import FamiliaDetailPage from "./pages/FamiliaDetailPage";
import FamiliasListPage from "./pages/FamiliasListPage";
import HermanoFormPage from "./pages/HermanoFormPage";
import HermanosListPage from "./pages/HermanosListPage";
import ImportarMwbPage from "./pages/ImportarMwbPage";
import S89Page from "./pages/S89Page";
import S89RangoPage from "./pages/S89RangoPage";
import S140Page from "./pages/S140Page";
import S140RangoPage from "./pages/S140RangoPage";
import SemanaFormPage from "./pages/SemanaFormPage";
import SemanasListPage from "./pages/SemanasListPage";

function App() {
	return (
		<CongregationSettingsProvider>
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
						<Route path="/configuracion" element={<ConfiguracionPage />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</CongregationSettingsProvider>
	);
}

export default App;
