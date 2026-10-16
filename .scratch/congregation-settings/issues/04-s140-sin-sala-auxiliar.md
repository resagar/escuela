# 04: S-140 sin sala auxiliar

**Qué construir:** Con la sala auxiliar desactivada, el S-140 generado (semana suelta y rango multi-semana) oculta la fila "Consejero de la sala auxiliar" y mantiene la fidelidad visual oficial en todo lo demás (los encabezados de sección de sala auxiliar ya se adaptan solos cuando ninguna parte la requiere). Con el ajuste activo, el S-140 es idéntico al actual. Se actualiza la guía visual `ux-guidelines.md` con la regla condicional y se verifica impresión/exportación.

**Bloqueado por:** 01.

**Status:** ready-for-agent

- [ ] Con el ajuste off, el S-140 de semana suelta no muestra la fila del consejero y la grilla no queda desalineada ni con filas vacías.
- [ ] Con el ajuste off, el rango del S-140 se genera coherente en todas las semanas.
- [ ] Con el ajuste on, el S-140 (semana y rango) es visualmente idéntico al actual, incluida la fila del consejero.
- [ ] Impresión/exportación verificadas en ambos estados (una semana por página, márgenes, colores y tipografías intactos).
- [ ] `ux-guidelines.md` documenta la regla condicional de la fila del consejero.
