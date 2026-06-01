import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HermanosListPage from "./pages/HermanosListPage";
import HermanoFormPage from "./pages/HermanoFormPage";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout />}>
					<Route path="/" element={<HermanosListPage />} />
					<Route path="/hermanos" element={<HermanosListPage />} />
					<Route path="/hermanos/nuevo" element={<HermanoFormPage />} />
					<Route path="/hermanos/:id/editar" element={<HermanoFormPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
