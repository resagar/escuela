# 03: Pantalla de asignaciones sin sala auxiliar

**Qué construir:** Con la sala auxiliar desactivada, la pantalla de asignaciones no muestra el selector "Consejero de la sala auxiliar" ni los selectores del ámbito sala auxiliar de ninguna parte; las partes se comportan como solo auditorio principal. Al reactivar el ajuste, las asignaciones guardadas en sala auxiliar reaparecen tal cual. El S-89 no cambia: sus tarjetas marcan "Sala principal" cuando ninguna asignación cae en sala auxiliar.

**Bloqueado por:** 01.

**Status:** resuelto (2026-10-16) — integrado (merge `cf6cce6`); ocultamiento solo de render (la pantalla no llama `update_parte`); S-89 intacto — con asignaciones de sala auxiliar retenidas las tarjetas conservan el ámbito guardado (conservación deliberada, documentada en `requirements.md` §5.1)

- [x] Con el ajuste off, la pantalla no muestra el consejero de sala auxiliar ni selectores de sala auxiliar en ninguna parte.
- [x] Con el ajuste off, una parte con marca guardada de sala auxiliar se puede asignar normalmente en auditorio principal.
- [x] Ciclo on → off → on con datos cargados: las asignaciones de sala auxiliar desaparecen y reaparecen intactas.
- [x] S-89 sin regresión: con el ajuste off, todas las tarjetas marcan "Sala principal" (con asignaciones de sala auxiliar retenidas conservan el ámbito guardado: conservación deliberada).
