# 03: Marcar visita del superintendente en la vista previa (sin sala auxiliar ni estudio)

**What to build:** El selector de tipo de la vista previa añade "Visita del Superintendente". Al marcarla, la semana se importa con todas sus partes sin sala auxiliar y sin la parte de estudio bíblico; su S-140 sale sin clases auxiliares y la pantalla de asignación la identifica con el badge existente.

**Blocked by:** 02 — Marcar asamblea y conmemoración en la vista previa

**Status:** resuelto (2026-10-16) — opción en el selector + `applyVisitaAdjustments` en el payload (commit `74d331c`)

- [x] El selector de tipo incluye Visita del Superintendente.
- [x] Al marcar la visita, el payload de esa semana aplica: todas las partes con sala auxiliar desactivada y sin la parte de estudio bíblico.
- [x] La semana guardada no tiene partes con sala auxiliar ni estudio bíblico (verificable en asignación y S-140).
- [x] El tipo "visita" se persiste correctamente (round-trip del enum frontend ↔ base), cubierto por tests.
- [x] La utilidad de ajuste de visita es reutilizable por la pantalla de edición de semana (la usa el ticket 04).
- [ ] Verificación manual: importar un mwb real con una semana marcada como visita; revisar lista de semanas, pantalla de asignación (badge) y S-140.

## Comments

Implementado en `74d331c`. Verificación manual pendiente (flujo GUI no ejecutable en este entorno): importar un mwb real con una semana marcada como visita; revisar lista de semanas (badge del tipo), pantalla de asignación y S-140.
