import { Link } from "react-router-dom";
import { useCongregationSettings } from "../hooks/useCongregationSettings";

/** Id of the lock notice, referenced by `AuxiliaryRoomCheckbox` with `aria-describedby`. */
export const AUXILIARY_ROOM_LOCK_NOTICE_ID = "auxiliary-room-lock-notice";

interface AuxiliaryRoomLockNoticeProps {
	className?: string;
}

/**
 * Notice shown when the congregation has no auxiliary room, with a link to the
 * setting that turns the lock off.
 *
 * Renders nothing with the setting on, so the normal editing flow stays unchanged.
 */
export default function AuxiliaryRoomLockNotice({
	className = "",
}: AuxiliaryRoomLockNoticeProps) {
	const { hasAuxiliaryRoom } = useCongregationSettings();

	if (hasAuxiliaryRoom) return null;

	return (
		<p
			id={AUXILIARY_ROOM_LOCK_NOTICE_ID}
			className={`rounded border border-ui-warning-border bg-ui-warning-surface p-2 text-xs text-ui-warning ${className}`}
		>
			La congregación no tiene sala auxiliar: «Sala aux.» queda deshabilitada y las
			marcas de sala auxiliar no se usan (se conservan: si vuelves a activarla,
			reaparecen tal cual).{" "}
			<Link
				to="/configuracion"
				className="font-medium underline hover:text-ui-warning"
			>
				Revisar en Configuración
			</Link>
		</p>
	);
}
