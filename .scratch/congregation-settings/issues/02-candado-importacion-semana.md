# 02: Importación y formulario de semana bajo candado de sala auxiliar

**Qué construir:** Con la sala auxiliar desactivada, la casilla "Sala aux." de cada parte queda deshabilitada —con aviso y enlace a Configuración— tanto en el editor de importación del MWB como en el formulario de semana; no existe forma de marcarla. Con el ajuste activo, el flujo actual no cambia: la casilla sigue siendo editable parte por parte según la inferencia del parser. Activar o desactivar el ajuste no altera las marcas guardadas.

**Bloqueado por:** 01.

**Status:** resuelto (2026-10-16) — integrado (merge `75697ea`); candado con componentes compartidos (casilla + aviso con enlace); interpretación aceptada: la vista previa estrena columna «Sala aux.» (antes existía el estado de edición sin control renderizado) — deshabilitada con el ajuste off, editable con on; no destructivo verificado por construcción (el formulario envía la marca guardada; la importación solo inserta)

- [x] Con el ajuste off, la vista previa de importación muestra "Sala aux." deshabilitada en todas las partes, con aviso y enlace a Configuración.
- [x] Con el ajuste off, el formulario de semana muestra la casilla deshabilitada con el mismo aviso.
- [x] Con el ajuste on, importación y formulario se comportan exactamente como hoy.
- [x] Ciclo off → on → off con una semana guardada: las marcas de las partes no cambian (no destructivo).
