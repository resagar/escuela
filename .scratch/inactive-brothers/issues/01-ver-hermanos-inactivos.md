# 01: Ver los hermanos inactivos en la pantalla Hermanos

**Qué construir:** En la pantalla Hermanos, un filtro Activos/Inactivos permite ver a los hermanos dados de baja lógica. La vista de Inactivos lista solo a los hermanos con baja (con su indicador "Inactivo") y sin la acción "Desactivar"; el enlace Editar se mantiene. La vista por defecto (Activos) queda igual que hoy, con la acción Desactivar. El listado reutiliza el comando de listado existente con el parámetro de "solo activos" en falso: no hay cambios de backend.

**Bloqueado por:** Ninguno (puede empezar de inmediato).

**Status:** ready-for-agent

- [ ] La pantalla Hermanos muestra un filtro Activos/Inactivos; al abrir, la vista por defecto es Activos y se ve igual que hoy.
- [ ] La vista Inactivos muestra únicamente hermanos con baja lógica, ordenados por nombre.
- [ ] Cada fila inactiva muestra el indicador "Inactivo", conserva el enlace Editar y no ofrece "Desactivar".
- [ ] Al desactivar un hermano desde Activos, cambia a Inactivos y aparece listado; al volver a Activos ya no está.
- [ ] Los selectores de asignación siguen sin mostrar inactivos (sin regresión).
- [ ] `tsc --noEmit` y `pnpm build` pasan.
