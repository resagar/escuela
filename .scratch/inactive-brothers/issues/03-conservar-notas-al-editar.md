# 03: Conservar las notas al editar un hermano

**Qué construir:** Editar a un hermano ya no borra sus notas. Hoy el formulario de edición envía las notas vacías y el guardado machaca las existentes; el arreglo conserva el valor cargado y lo reenvía al guardar, sin cambiar el contrato del comando de actualización.

**Bloqueado por:** Ninguno (puede empezar de inmediato).

**Status:** resuelto (2026-10-16) — implementado en `feat/inactive-brothers` (merge `f4600bd`)

- [ ] Editar un hermano que tenía notas (nombre, rol o permisos) las conserva tras guardar, verificado en pantalla y en la base.
- [x] Editar un hermano sin notas no falla ni inventa notas (siguen vacías).
- [x] `tsc --noEmit` y `pnpm build` pasan.

## Comments

- Implementado en `feat/ib-03-conservar-notas` (commit `11b8d36`; merge a integración `f4600bd`): el formulario carga las notas del hermano y las reenvía tal cual al guardar; el contrato de `update_hermano` no cambió. El code review fusionó el valor en el estado del formulario (`274ed2f`).
- Verificación: `tsc --noEmit` y `pnpm build` OK; chequeo con SQLite real del DDL y del SQL de `update_hermano`: el payload viejo borraba las notas (bug reproducido) y el nuevo las conserva; un hermano sin notas sigue con `NULL` sin fallar.
- AC 1: la parte "en la base" quedó verificada con el chequeo scripted; "en pantalla" no es ejecutable en este entorno (sin display) → pase manual pendiente: editar → cambiar nombre/rol/permisos → guardar → notas intactas.
