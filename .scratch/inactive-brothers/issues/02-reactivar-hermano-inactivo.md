# 02: Reactivar un hermano inactivo

**Qué construir:** Desde la vista de Inactivos de la pantalla Hermanos, la acción "Reactivar" (con confirmación) devuelve a un hermano a estado activo. El backend gana el comando `reactivate_hermano`, con la lógica de cambio de estado compartida con la desactivación y cubierta por un test SQLite in-memory (desactivar → reactivar → queda activo). Tras reactivar, la lista se recarga: el hermano sale de Inactivos, aparece en Activos y vuelve a ser seleccionable en los selectores de asignación, con su historial intacto. Se actualiza la documentación de requisitos (§5) y la tabla de comandos de arquitectura, incluida la decisión sobre la visibilidad de inactivos en familias.

**Bloqueado por:** 01 — Ver los hermanos inactivos en la pantalla Hermanos.

**Status:** resuelto (2026-10-16) — implementado en `feat/inactive-brothers` (merge `66d0759`)

- [x] El comando de reactivación está registrado y disponible para el frontend; pone `activo = 1` sin tocar ningún otro campo.
- [x] La lógica de activar/desactivar vive en una función compartida sobre la conexión SQLite; el test cubre: desactivar → reactivar deja activo, reactivar a alguien ya activo es no-op y un id inexistente no rompe.
- [x] En la vista Inactivos, "Reactivar" pide confirmación; al aceptar, la lista se recarga y el hermano pasa a la vista Activos.
- [x] El hermano reactivado vuelve a aparecer en los selectores de asignación y su historial de asignaciones sigue intacto.
- [x] Documentación actualizada: requisitos §5 (la reactivación existe; los inactivos siguen visibles en el detalle de familia) y tabla de comandos de arquitectura.
- [ ] `cargo test`, `tsc --noEmit` y `pnpm build` pasan; prueba manual completa: desactivar → ver en Inactivos → reactivar → comprobar selectores e historial.

## Comments

- Implementado en `feat/ib-02-reactivar` (commits `921006e`, `6220782`, `47d0e85`; merge a integración `66d0759`). Función compartida `set_hermano_activo` sobre `&Connection`; comando `reactivate_hermano` registrado; UI "Reactivar" con confirmación nativa.
- Verificación: `cargo test` 14/14 (3 tests nuevos del seam: desactivar→reactivar preservando campos, ya activo no-op, id inexistente no-op); `tsc --noEmit` y `pnpm build` OK.
- AC 6: la parte automatizada pasa (cargo/tsc/build); la prueba manual completa en GUI no es ejecutable en este entorno (sin display) → pase manual pendiente: desactivar → ver en Inactivos → reactivar → comprobar selectores e historial.
