# Ticket 01 — Batch de correcciones documentales (drift doc-only)

**Status:** abierto — **no requiere worktree**: ediciones directas de documentación
**Tipo:** docs — el código es correcto (verificado contra fuentes primarias); los documentos están desfasados
**Drift:** `docs/user/system-analysis.md` §4.2 #2-4, #7-15, #17-21 (la parte documental de cada ítem)

## Correcciones

### `docs/user/ux-guidelines.md` (el mockup `s140-mockup.html` es la referencia declarada y coincide con el código → el documento es el desfasado)

1. `:30-36` tipografías: 14.5pt → **16.5pt** (título principal), 10.5pt → **10.0pt** (cabeceras de sección), 8.5pt → **8.0pt** (etiquetas). 11pt (fecha), 10pt (títulos/nombres) y 9pt (horas) ya coinciden.
2. `:44-49` grilla: 4 columnas (45/355/175/175px) → **5 columnas** 45/192/136/171/176px (equivalentes en %: 6.2/26.6/18.9/23.7/24.6%). La columna extra es la celda de etiqueta ("Estudiante/Ayudante:", "Conductor/Lector:").
3. `:26` fuentes: quitar "Segoe UI" — el código usa `Arial, "Helvetica Neue", Helvetica, sans-serif` (`src/styles/s140.css:19,43`).
4. `:64` separadores `hr` punteados entre semanas → **una semana por página** al imprimir un rango (commit `d35a1a4`; `src/styles/s140.css:190-198`).

### `docs/user/architecture.md`

5. `:41` "4 tablas" → **6 tablas** (`hermanos`, `semanas`, `partes`, `asignaciones`, `familias`, `familia_miembros`; `src-tauri/src/db.rs:31-96`).
6. `:85` `partes.seccion` con 3 valores → **4** (incluye `marco`; CHECK en `db.rs:65`).
7. `:105-127` tabla de comandos: todo está implementado (`src-tauri/src/lib.rs:26-62`); los 12 comandos existentes que no aparecen: `get_eligible_brothers`, `get_adjacent_weeks`, `get_eligible_brothers_with_history`, `create_familia`, `list_familias`, `get_familia`, `delete_familia`, `add_familia_member`, `remove_familia_member`, `list_familias_with_count`, `write_file_bytes`, `get_s89_cards_for_week`.
8. `:11,135` parser "lopdf (Rust nativo, sin dependencias externas)" → **`pdftotext` (binario externo) es el extractor primario; `lopdf` es fallback** (`src-tauri/src/mwb_parser/mod.rs:22-27,58-78`).
9. `:141` diagrama `split_into_weeks()` con regex única → `split_into_week_blocks` + `parse_week_block` con parsing tokenizado (`mod.rs:401-508`).

### `docs/user/requirements.md`

10. `:91` quitar `get_bimonthly_stats` — **no tiene consumidor**: el dashboard calcula el progreso client-side (`src/pages/DashboardPage.tsx:53-86`).
11. `:79` sección de cada tipo: añadir `marco` a los valores (`tesoros` / `mejores_maestros` / `vida_cristiana` / `marco`; `src-tauri/src/models.rs:33`).
12. `:68` indicador de historial: el `[Nx]` del bimestre fue reemplazado por un **modal** con "N participaciones · última: fecha (rol)" sobre ventana de **4 meses** (commit `3a2f668`; `src/components/BrotherPickerModal.tsx:118-125`, `src/components/BrotherSelector.tsx:20`, `src-tauri/src/commands/historial.rs:128`).

### `docs/user/project-context.md`

13. `:27` "Partes de estudiante: cualquier publicador" → **todos los activos** (incluidos ancianos/siervos; `requirements.md:32,73` ya es correcto).

### `docs/user/master-plan.md` (documento histórico, 2026-06-01 — no reescribir el plan)

14. Añadir nota al inicio: "Documento histórico del plan de 2026-06-01. La referencia vigente de reglas es `requirements.md`; las reglas de presidente/oración/lector y el flujo del parser descritos aquí están desfasados." (Cubre drift #2-4 y #18-21 sin falsificar el plan.)

## Verification

Al terminar, marcar los ítems #2-4, #7-15, #17-21 de `docs/user/system-analysis.md` §4.2 como resueltos (o regenerar el análisis con `/research`).
