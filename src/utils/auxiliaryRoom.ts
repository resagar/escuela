import type { Parte } from "../types";

/**
 * Effective auxiliary-room flag of a part.
 *
 * The congregation setting acts as a hard lock: with no auxiliary room, no part
 * is treated as auxiliary, whatever is stored in `parte.requiere_sala_auxiliar`.
 * The stored mark is never rewritten, so it reappears untouched when the setting
 * is turned back on.
 */
export function hasEffectiveAuxiliaryRoom(
	hasAuxiliaryRoom: boolean,
	parte: Pick<Parte, "requiere_sala_auxiliar">,
): boolean {
	return hasAuxiliaryRoom && parte.requiere_sala_auxiliar;
}
