import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

declare global {
	interface Window {
		escuelaTheme: {
			getTheme(): Theme;
			setTheme(theme: Theme): boolean;
		};
	}
}

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	storageError: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setCurrentTheme] = useState<Theme>(() => window.escuelaTheme.getTheme());
	const [storageError, setStorageError] = useState(false);
	const setTheme = (next: Theme) => {
		setStorageError(!window.escuelaTheme.setTheme(next));
		setCurrentTheme(next);
	};
	return <ThemeContext.Provider value={{ theme, setTheme, storageError }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) throw new Error("useTheme requires ThemeProvider");
	return context;
}
