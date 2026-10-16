# 04: Ajuste retroactivo al cambiar una semana guardada a visita

**What to build:** Al editar una semana ya guardada y cambiar su tipo a Visita del Superintendente, al guardar las partes de esa semana quedan sin sala auxiliar y sin el estudio bíblico; las asignaciones de sala existentes no quedan huérfanas. El resto de la edición (fechas, canciones, partes) sigue funcionando igual.

**Blocked by:** 03 — Marcar visita del superintendente en la vista previa

**Status:** ready-for-agent

- [ ] Al guardar una edición de semana con tipo visita, sus partes se ajustan (sala auxiliar desactivada, estudio bíblico eliminado).
- [ ] Las asignaciones de sala auxiliar existentes de esa semana no quedan huérfanas.
- [ ] Cambiar el tipo a visita no altera otros campos ni otras semanas.
- [ ] La edición de semana sigue disponible para corregir el tipo de semanas ya guardadas.
- [ ] Verificación manual: semana normal con estudio y sala auxiliar → cambiar a visita → verificar partes y asignaciones.
