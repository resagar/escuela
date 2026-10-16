# 01: Prefactor — extraer la construcción del payload de importación a funciones puras

**What to build:** La transformación que hoy vive dentro de la vista previa de importación (combinar las semanas parseadas, la selección y las ediciones de partes) pasa a un módulo puro con tests de caracterización, y se incorpora el runner de tests. El botón "Importar" sigue comportándose exactamente igual.

**Blocked by:** Ninguno (puede empezar de inmediato)

**Status:** resuelto (2026-10-16) — módulo puro `src/lib/importPlanner.ts` + vitest (`pnpm test`, 29 tests); `pnpm build` verde (commit `cbcf8db`)

- [x] La construcción del payload vive en un módulo puro, sin estado de React ni llamadas a Tauri.
- [x] El comportamiento actual queda caracterizado por tests (selección de semanas y ediciones de título, tipo de asignación, duración, sala auxiliar y ayudante).
- [x] `pnpm test` ejecuta los tests del módulo y `pnpm build` (tsc + vite) pasa sin errores.
- [x] El flujo manual de importación no cambia (mismas semanas, mismas partes editadas).
