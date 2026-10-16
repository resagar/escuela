import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CongregationSettings } from "../types";

interface CongregationSettingsContextValue {
	/** Whether the congregation has an auxiliary room (app-wide hard lock). */
	hasAuxiliaryRoom: boolean;
	/** True while the settings are being loaded from the database. */
	loading: boolean;
	/** Persists the auxiliary-room flag and refreshes the shared value. */
	updateHasAuxiliaryRoom: (hasAuxiliaryRoom: boolean) => Promise<void>;
}

/**
 * Defaults keep the app's historical behavior (has auxiliary room) while the
 * stored setting loads and when it cannot be read.
 */
const DEFAULT_SETTINGS: CongregationSettings = { has_auxiliary_room: true };

const CongregationSettingsContext = createContext<CongregationSettingsContextValue | null>(null);

export function CongregationSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<CongregationSettings>(DEFAULT_SETTINGS);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const data = await invoke<CongregationSettings>("get_congregation_settings");
				setSettings(data);
			} catch (err) {
				console.error("Error loading congregation settings:", err);
			} finally {
				setLoading(false);
			}
		};
		loadSettings();
	}, []);

	const updateHasAuxiliaryRoom = useCallback(async (hasAuxiliaryRoom: boolean) => {
		const data = await invoke<CongregationSettings>("update_congregation_settings", {
			hasAuxiliaryRoom,
		});
		setSettings(data);
	}, []);

	const value = useMemo(
		() => ({
			hasAuxiliaryRoom: settings.has_auxiliary_room,
			loading,
			updateHasAuxiliaryRoom,
		}),
		[settings, loading, updateHasAuxiliaryRoom],
	);

	return (
		<CongregationSettingsContext.Provider value={value}>
			{children}
		</CongregationSettingsContext.Provider>
	);
}

export function useCongregationSettings(): CongregationSettingsContextValue {
	const context = useContext(CongregationSettingsContext);
	if (!context) {
		throw new Error("useCongregationSettings must be used within a CongregationSettingsProvider");
	}
	return context;
}
