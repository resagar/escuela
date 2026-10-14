# Ticket 01 — Eliminar `TipoEspecial::SinReunion` (variante muerta)

**Status:** abierto — sin bloqueos, trabajo pequeño (cabe en un worktree de cleanup)
**Tipo:** cleanup — dead code
**Drift:** `docs/user/system-analysis.md` §4.2 #16

## Actual Behavior

`TipoEspecial::SinReunion` existe en el enum (`src-tauri/src/mwb_parser/types.rs:32`) pero `parse_week_block` nunca la produce (`src-tauri/src/mwb_parser/mod.rs:476-486` solo genera Normal / Asamblea / Conmemoracion / VisitaSuperintendente). Su único consumidor es el mapeo a `"asamblea"` en `import_parsed_weeks` (`src-tauri/src/commands/semanas.rs:275`), que nunca se ejecuta.

## Expected Behavior

El enum refleja solo los tipos que el parser efectivamente produce.

## Fix

Dos ediciones (el orden es indistinto mientras ambas entren antes de compilar — el compilador verifica exhaustividad del match):

1. Eliminar la variante `SinReunion` de `src-tauri/src/mwb_parser/types.rs:32`.
2. Eliminar el brazo `mwb_parser::TipoEspecial::SinReunion => "asamblea",` de `src-tauri/src/commands/semanas.rs:275`.

## Verification

`cargo test` — compila el match exhaustivo y los tests existentes de parser deben seguir verdes.
