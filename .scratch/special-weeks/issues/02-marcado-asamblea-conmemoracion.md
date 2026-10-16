# 02: Marcar asamblea y conmemoración en la vista previa (no se importan)

**What to build:** En la vista previa de importación, cada semana puede marcarse como Asamblea o Conmemoración (Normal como valor por defecto). Las semanas marcadas muestran el aviso "sin reunión" y al pulsar "Importar" no se guardan; el resto del bimestre se importa igual que hoy.

**Blocked by:** 01 — Prefactor: extraer la construcción del payload a funciones puras

**Status:** resuelto (2026-10-16) — selector de tipo en la vista previa + exclusión en `buildImportPayload` (commit `c497c69`)

- [x] Cada semana de la vista previa tiene un selector de tipo: Normal / Asamblea / Conmemoración.
- [x] Al marcar asamblea o conmemoración, la fila muestra "sin reunión" y sus partes no se envían.
- [x] Al importar, las semanas marcadas no se guardan (no aparecen en la lista de semanas).
- [x] Volver a Normal antes de importar restaura el comportamiento normal.
- [ ] Las semanas no marcadas se importan exactamente como hoy (tests del módulo puro + verificación manual).
- [x] Marcar el tipo de una semana no afecta las ediciones de partes de las demás.

## Comments

Implementado en `c497c69` (tests de `buildImportPayload` verdes). Verificación manual pendiente (flujo GUI no ejecutable en este entorno): marcar una semana como asamblea/conmemoración en la vista previa e importar; confirmar que no aparece en la lista de semanas y que el resto del bimestre llega intacto.
