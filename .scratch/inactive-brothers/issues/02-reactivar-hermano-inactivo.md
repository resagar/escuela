# 02: Reactivar un hermano inactivo

**Qué construir:** Desde la vista de Inactivos de la pantalla Hermanos, la acción "Reactivar" (con confirmación) devuelve a un hermano a estado activo. El backend gana el comando `reactivate_hermano`, con la lógica de cambio de estado compartida con la desactivación y cubierta por un test SQLite in-memory (desactivar → reactivar → queda activo). Tras reactivar, la lista se recarga: el hermano sale de Inactivos, aparece en Activos y vuelve a ser seleccionable en los selectores de asignación, con su historial intacto. Se actualiza la documentación de requisitos (§5) y la tabla de comandos de arquitectura, incluida la decisión sobre la visibilidad de inactivos en familias.

**Bloqueado por:** 01 — Ver los hermanos inactivos en la pantalla Hermanos.

**Status:** ready-for-agent

- [ ] El comando de reactivación está registrado y disponible para el frontend; pone `activo = 1` sin tocar ningún otro campo.
- [ ] La lógica de activar/desactivar vive en una función compartida sobre la conexión SQLite; el test cubre: desactivar → reactivar deja activo, reactivar a alguien ya activo es no-op y un id inexistente no rompe.
- [ ] En la vista Inactivos, "Reactivar" pide confirmación; al aceptar, la lista se recarga y el hermano pasa a la vista Activos.
- [ ] El hermano reactivado vuelve a aparecer en los selectores de asignación y su historial de asignaciones sigue intacto.
- [ ] Documentación actualizada: requisitos §5 (la reactivación existe; los inactivos siguen visibles en el detalle de familia) y tabla de comandos de arquitectura.
- [ ] `cargo test`, `tsc --noEmit` y `pnpm build` pasan; prueba manual completa: desactivar → ver en Inactivos → reactivar → comprobar selectores e historial.
