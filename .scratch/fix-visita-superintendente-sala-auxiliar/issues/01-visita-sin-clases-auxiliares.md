# Ticket 01 — Visita del Superintendente: no hay clases auxiliares

**Status:** abierto — **bloqueado**: requiere un mwb real de semana de Visita en `refs/`
**Tipo:** bug — la regla detectada no se implementa
**Regla:** `docs/user/requirements.md:62` — "El 'Estudio bíblico' se reemplaza por el **discurso de servicio de 30 min** del superintendente de circuito. **No hay clases auxiliares** (§21): todas las partes son solo auditorio principal"
**Drift:** `docs/user/system-analysis.md` §4.2 #6

## Actual Behavior

El parser detecta "VISITA DEL SUPERINTENDENTE" (`src-tauri/src/mwb_parser/mod.rs:474`) y fija `TipoEspecial::VisitaSuperintendente` (`mod.rs:482-483`), pero `parse_parts` corre igual (`mod.rs:490-496`, rama `else`) y `requiere_sala_auxiliar` de cada parte nunca se anula. `import_parsed_weeks` persiste los flags tal cual (`src-tauri/src/commands/semanas.rs:296-314`). Resultado: una semana de visita importa partes con sala auxiliar, violando §21.

## Expected Behavior

Toda parte de una semana `visita_superintendente` tiene `requiere_sala_auxiliar = false`; el S-140 de esa semana muestra todas las partes en el auditorio principal únicamente. El "Estudio bíblico" aparece reemplazado por el discurso de servicio de 30 min.

## Root Cause

La detección de la visita solo fija `tipo_especial`; no hay post-proceso sobre las partes. La anulación de `requiere_sala_auxiliar` no existe en ninguna capa (parser, import ni UI).

## Fix — propuesta, pendiente de input

En `parse_week_block` (`mod.rs:430-508`), cuando `is_visita`, aplicar sobre el resultado de `parse_parts`:

```rust
let mut partes = parse_parts(body);
if is_visita {
    for p in &mut partes {
        p.requiere_sala_auxiliar = false;
    }
}
```

**Hipótesis a verificar:** el mwb oficial de una semana de visita ya trae el "Discurso de servicio" en lugar del "Estudio bíblico" (el workbook de esa semana lo reemplaza). En ese caso `classify_part_type` lo clasifica como `discurso_no_estudiante` por el fallback `upper.contains("DISCURSO")` (`mod.rs:952-957`) — elegibilidad anciano/siervo, correcta para el superintendente de circuito — y no haría falta "reemplazar" nada en la app: bastaría la anulación de sala auxiliar.

## Input necesario (bloquea la verificación de la hipótesis)

Un mwb real de semana de Visita del Superintendente en `refs/` para confirmar: (a) si el discurso de servicio viene como parte numerada y su título exacto, (b) si el "Estudio bíblico" sigue apareciendo en el texto, (c) si el mwb trae o no estructura de sala auxiliar.

## Verification

Con el sample real: importar; verificar por SQL que todas las partes de la semana tienen `requiere_sala_auxiliar = 0` y que el S-140 (`/semanas/:id/s140`) muestra todo en el auditorio principal.
