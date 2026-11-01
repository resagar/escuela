import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const bootstrap = () => readFileSync(new URL("../../public/theme.js", import.meta.url), "utf8");

function launch(saved: string | null, failRead = false, failWrite = false) {
	const values = new Map(saved === null ? [] : [["escuela.theme", saved]]);
	const document = { documentElement: { dataset: {} as Record<string, string> } };
	const window = { localStorage: {
		getItem: (key: string) => { if (failRead) throw new Error("Unavailable"); return values.get(key) ?? null; },
		setItem: (key: string, value: string) => { if (failWrite) throw new Error("Full"); values.set(key, value); },
	} };
	runInNewContext(bootstrap(), { window, document });
	return { document, values, preference: (window as typeof window & {
		escuelaTheme: { getTheme(): string; setTheme(theme: string): boolean };
	}).escuelaTheme };
}

describe("appearance preference", () => {
	it("applies a saved dark preference before the application starts", () => {
		const { document, preference } = launch("dark");
		expect(document.documentElement.dataset.theme).toBe("dark");
		expect(preference.getTheme()).toBe("dark");
	});

	it("changes appearance immediately and remembers it for the next launch", () => {
		const { document, preference, values } = launch(null);
		expect(preference.setTheme("dark")).toBe(true);
		expect(document.documentElement.dataset.theme).toBe("dark");
		expect(launch(values.get("escuela.theme")!).preference.getTheme()).toBe("dark");
		expect(preference.setTheme("light")).toBe(true);
		expect(preference.getTheme()).toBe("light");
	});

	it.each([null, "light", "system", "invalid", "DARK"])("defaults safely to light for %s", (saved) => {
		const { document, preference } = launch(saved);
		expect(preference.getTheme()).toBe("light");
		expect(document.documentElement.dataset.theme).toBe("light");
	});

	it("survives a storage read failure and still permits a session choice", () => {
		const { document, preference } = launch("dark", true);
		expect(preference.getTheme()).toBe("light");
		expect(preference.setTheme("dark")).toBe(true);
		expect(document.documentElement.dataset.theme).toBe("dark");
	});

	it("reports a failed save while applying the theme for the current session", () => {
		const { document, preference, values } = launch("light", false, true);
		expect(preference.setTheme("dark")).toBe(false);
		expect(preference.getTheme()).toBe("dark");
		expect(document.documentElement.dataset.theme).toBe("dark");
		expect(values.get("escuela.theme")).toBe("light");
	});
});
