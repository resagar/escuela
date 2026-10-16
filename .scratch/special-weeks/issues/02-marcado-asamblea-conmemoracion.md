# 02: Marcar asamblea y conmemoración en la vista previa (no se importan)

**What to build:** En la vista previa de importación, cada semana puede marcarse como Asamblea o Conmemoración (Normal como valor por defecto). Las semanas marcadas muestran el aviso "sin reunión" y al pulsar "Importar" no se guardan; el resto del bimestre se importa igual que hoy.

**Blocked by:** 01 — Prefactor: extraer la construcción del payload a funciones puras

**Status:** ready-for-agent

- [ ] Cada semana de la vista previa tiene un selector de tipo: Normal / Asamblea / Conmemoración.
- [ ] Al marcar asamblea o conmemoración, la fila muestra "sin reunión" y sus partes no se envían.
- [ ] Al importar, las semanas marcadas no se guardan (no aparecen en la lista de semanas).
- [ ] Volver a Normal antes de importar restaura el comportamiento normal.
- [ ] Las semanas no marcadas se importan exactamente como hoy (tests del módulo puro + verificación manual).
- [ ] Marcar el tipo de una semana no afecta las ediciones de partes de las demás.
