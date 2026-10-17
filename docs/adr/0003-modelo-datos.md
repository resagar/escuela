# 0003 — Modelo de datos: semana_roles en `semanas`, UNIQUE(parte,ámbito,papel), soft delete

Status: accepted

Tres decisiones de modelo en el SQLite de 6 tablas: (1) los roles del marco (presidente,
consejero de sala, 3 oradores) son columnas FK en `semanas` — son exactamente uno por
semana, un conjunto fijo que siempre se lee con la semana; (2) `asignaciones` tiene
UNIQUE(parte_id, ambito, rol) — un solo hermano por papel en cada parte y ámbito, del que
depende el UPSERT del autosave; (3) borrado suave obligatorio: los hermanos nunca se
borran (`activo = 0`) porque asignaciones e historial los referencian con FKs activas.

Consequences: desnormalización deliberada 1:1 de los roles del marco; cambiar su conjunto
exige migración de columnas; el historial de participación sobrevive a la desactivación.

Enmienda (2026-10-16): el recuento inicial («SQLite de 6 tablas») quedó desactualizado — la
app usa hoy **7 tablas** con `congregation_settings` (configuración singleton de congregación;
feature «sala auxiliar»). Las tres decisiones de este ADR siguen vigentes sin cambios.
