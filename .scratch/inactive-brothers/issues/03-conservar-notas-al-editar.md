# 03: Conservar las notas al editar un hermano

**Qué construir:** Editar a un hermano ya no borra sus notas. Hoy el formulario de edición envía las notas vacías y el guardado machaca las existentes; el arreglo conserva el valor cargado y lo reenvía al guardar, sin cambiar el contrato del comando de actualización.

**Bloqueado por:** Ninguno (puede empezar de inmediato).

**Status:** ready-for-agent

- [ ] Editar un hermano que tenía notas (nombre, rol o permisos) las conserva tras guardar, verificado en pantalla y en la base.
- [ ] Editar un hermano sin notas no falla ni inventa notas (siguen vacías).
- [ ] `tsc --noEmit` y `pnpm build` pasan.
