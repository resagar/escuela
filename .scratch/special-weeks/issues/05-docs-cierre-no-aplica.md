# 05: Docs y cierre del no-aplica

**What to build:** La documentación del dominio refleja el comportamiento real implementado (marcado manual en la importación, semanas sin reunión que no se guardan, visita sin sala auxiliar ni estudio, conmemoración sin validación de fecha), y los tickets cerrados como no-aplica quedan anotados según la reversión, sin borrar su historia.

**Blocked by:** 04 — Ajuste retroactivo al cambiar una semana guardada a visita

**Status:** resuelto (2026-10-16) — docs del dominio actualizadas + no-aplica anotados

- [x] requirements §4 actualizado: tipos de semana especial con el marcado manual y sus efectos (asamblea/conmemoración no se importan; visita sin sala auxiliar/estudio; sin validación de fecha).
- [x] El análisis de sistema marca los drifts #5 (conmemoración) y #6 (visita) como resueltos con el nuevo comportamiento.
- [x] Los tickets de no-aplica de conmemoración y visita registran la reversión (anotación, sin eliminar contenido).
- [x] Glosario revisado (solo si algún término necesita ajuste).

## Comments

`requirements.md` v1.5 (§4: comportamiento + "Marcado del tipo"), `system-analysis.md` §2.4/§4.2 actualizados, `GLOSSARY.md` ("se marca al importar o al editar la semana") y notas de reversión en `.scratch/fix-conmemoracion-regla-dia-semana/` y `.scratch/fix-visita-superintendente-sala-auxiliar/`.
