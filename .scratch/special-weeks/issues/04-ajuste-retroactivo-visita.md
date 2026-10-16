# 04: Ajuste retroactivo al cambiar una semana guardada a visita

**What to build:** Al editar una semana ya guardada y cambiar su tipo a Visita del Superintendente, al guardar las partes de esa semana quedan sin sala auxiliar y sin el estudio bíblico; las asignaciones de sala existentes no quedan huérfanas. El resto de la edición (fechas, canciones, partes) sigue funcionando igual.

**Blocked by:** 03 — Marcar visita del superintendente en la vista previa

**Status:** resuelto (2026-10-16) — `SemanaFormPage` ajusta las partes al guardar como visita (commit `7f40c2a`)

- [x] Al guardar una edición de semana con tipo visita, sus partes se ajustan (sala auxiliar desactivada, estudio bíblico eliminado).
- [x] Las asignaciones de sala auxiliar existentes de esa semana no quedan huérfanas.
- [x] Cambiar el tipo a visita no altera otros campos ni otras semanas.
- [x] La edición de semana sigue disponible para corregir el tipo de semanas ya guardadas.
- [ ] Verificación manual: semana normal con estudio y sala auxiliar → cambiar a visita → verificar partes y asignaciones.

## Comments

Implementado en `7f40c2a`. El ajuste reutiliza `applyVisitaAdjustments` antes del re-guardado (update/delete de partes). Las asignaciones no quedan huérfanas por dos vías ya existentes: `update_parte` borra las de sala al anular el flag (`partes.rs:132-138`) y el borrado del estudio cascadea por FK (`db.rs:75`, `PRAGMA foreign_keys=ON`). Verificación manual pendiente (flujo GUI no ejecutable en este entorno).
