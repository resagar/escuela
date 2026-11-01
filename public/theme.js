// Resolve appearance synchronously before styles or React can paint.
(() => {
	let theme = "light";
	try {
		if (window.localStorage.getItem("escuela.theme") === "dark") theme = "dark";
	} catch {
		// Storage may be unavailable; the interface still works in this session.
	}
	document.documentElement.dataset.theme = theme;
	window.escuelaTheme = {
		getTheme: () => theme,
		setTheme(value) {
			theme = value === "dark" ? "dark" : "light";
			document.documentElement.dataset.theme = theme;
			try {
				window.localStorage.setItem("escuela.theme", theme);
				return true;
			} catch {
				return false;
			}
		},
	};
})();
