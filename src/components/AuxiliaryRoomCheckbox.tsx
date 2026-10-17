import { AUXILIARY_ROOM_LOCK_NOTICE_ID } from "./AuxiliaryRoomLockNotice";
import { useCongregationSettings } from "../hooks/useCongregationSettings";

interface AuxiliaryRoomCheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
}

/**
 * "Sala aux." checkbox with the congregation hard lock built in.
 *
 * With the auxiliary room disabled the checkbox stays visible but cannot be
 * marked, and it keeps showing the stored mark as is: the setting never rewrites
 * that data, so it reappears untouched when the setting is turned back on.
 */
export default function AuxiliaryRoomCheckbox({
	checked,
	onChange,
}: AuxiliaryRoomCheckboxProps) {
	const { hasAuxiliaryRoom } = useCongregationSettings();
	const locked = !hasAuxiliaryRoom;

	return (
		<label
			className={`flex items-center gap-1 text-xs ${
				locked ? "cursor-not-allowed text-gray-400" : "text-gray-600"
			}`}
			title={
				locked
					? "La congregación no tiene sala auxiliar. Puedes cambiarlo en Configuración."
					: undefined
			}
		>
			<input
				type="checkbox"
				checked={checked}
				disabled={locked}
				aria-describedby={locked ? AUXILIARY_ROOM_LOCK_NOTICE_ID : undefined}
				onChange={(e) => onChange(e.target.checked)}
			/>
			Sala aux.
		</label>
	);
}
