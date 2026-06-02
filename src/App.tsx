import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HermanosListPage from "./pages/HermanosListPage";
import HermanoFormPage from "./pages/HermanoFormPage";
import SemanasListPage from "./pages/SemanasListPage";
import ImportarMwbPage from "./pages/ImportarMwbPage";
import SemanaFormPage from "./pages/SemanaFormPage";
import AsignacionesPage from "./pages/AsignacionesPage";
import FamiliasListPage from "./pages/FamiliasListPage";
import FamiliaDetailPage from "./pages/FamiliaDetailPage";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<SemanasListPage />} />
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
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
