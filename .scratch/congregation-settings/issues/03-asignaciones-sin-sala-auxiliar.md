# 03: Pantalla de asignaciones sin sala auxiliar

**Qué construir:** Con la sala auxiliar desactivada, la pantalla de asignaciones no muestra el selector "Consejero de la sala auxiliar" ni los selectores del ámbito sala auxiliar de ninguna parte; las partes se comportan como solo auditorio principal. Al reactivar el ajuste, las asignaciones guardadas en sala auxiliar reaparecen tal cual. El S-89 no cambia: sus tarjetas marcan "Sala principal" cuando ninguna asignación cae en sala auxiliar.

**Bloqueado por:** 01.

**Status:** ready-for-agent

- [ ] Con el ajuste off, la pantalla no muestra el consejero de sala auxiliar ni selectores de sala auxiliar en ninguna parte.
- [ ] Con el ajuste off, una parte con marca guardada de sala auxiliar se puede asignar normalmente en auditorio principal.
- [ ] Ciclo on → off → on con datos cargados: las asignaciones de sala auxiliar desaparecen y reaparecen intactas.
- [ ] S-89 sin regresión: con el ajuste off, todas las tarjetas marcan "Sala principal".
