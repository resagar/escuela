# 02: Importación y formulario de semana bajo candado de sala auxiliar

**Qué construir:** Con la sala auxiliar desactivada, la casilla "Sala aux." de cada parte queda deshabilitada —con aviso y enlace a Configuración— tanto en el editor de importación del MWB como en el formulario de semana; no existe forma de marcarla. Con el ajuste activo, el flujo actual no cambia: la casilla sigue siendo editable parte por parte según la inferencia del parser. Activar o desactivar el ajuste no altera las marcas guardadas.

**Bloqueado por:** 01.

**Status:** ready-for-agent

- [ ] Con el ajuste off, la vista previa de importación muestra "Sala aux." deshabilitada en todas las partes, con aviso y enlace a Configuración.
- [ ] Con el ajuste off, el formulario de semana muestra la casilla deshabilitada con el mismo aviso.
- [ ] Con el ajuste on, importación y formulario se comportan exactamente como hoy.
- [ ] Ciclo off → on → off con una semana guardada: las marcas de las partes no cambian (no destructivo).
