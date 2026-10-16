# 01: Ver los hermanos inactivos en la pantalla Hermanos

**Qué construir:** En la pantalla Hermanos, un filtro Activos/Inactivos permite ver a los hermanos dados de baja lógica. La vista de Inactivos lista solo a los hermanos con baja (con su indicador "Inactivo") y sin la acción "Desactivar"; el enlace Editar se mantiene. La vista por defecto (Activos) queda igual que hoy, con la acción Desactivar. El listado reutiliza el comando de listado existente con el parámetro de "solo activos" en falso: no hay cambios de backend.

**Bloqueado por:** Ninguno (puede empezar de inmediato).

**Status:** resuelto (2026-10-16) — implementado en `feat/inactive-brothers` (merge `6fe26ba`)

- [x] La pantalla Hermanos muestra un filtro Activos/Inactivos; al abrir, la vista por defecto es Activos y se ve igual que hoy.
- [x] La vista Inactivos muestra únicamente hermanos con baja lógica, ordenados por nombre.
- [x] Cada fila inactiva muestra el indicador "Inactivo", conserva el enlace Editar y no ofrece "Desactivar".
- [x] Al desactivar un hermano desde Activos, cambia a Inactivos y aparece listado; al volver a Activos ya no está.
- [x] Los selectores de asignación siguen sin mostrar inactivos (sin regresión).
- [x] `tsc --noEmit` y `pnpm build` pasan.

## Comments

- Implementado en `feat/ib-01-ver-inactivos` (commit `b6c56f0`; merge a integración `6fe26ba`). El code review pidió conservar el filtro al volver de editar (`274ed2f`).
- Verificación: `pnpm exec tsc --noEmit` y `pnpm build` OK. Sin regresión en selectores (todos filtran `activo = 1`; revisión estática).
- Interpretación de AC 4: al desactivar, la lista se recarga y el hermano sale de Activos; aparece al abrir la pestaña Inactivos (sin cambio automático de pestaña; decisión del plan: filtro en la misma pantalla).
- La comprobación visual en la GUI no es ejecutable en este entorno (sin display): queda un pase manual recomendado.
