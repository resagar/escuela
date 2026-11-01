# 01: Isolate S-form appearance from interface themes

**What to build:** Preserve the current S-140 and S-89 appearance independently of surrounding interface colors, including individual and bimonthly previews, JPEG generation and printing/PDF. This is the verifiable prefactor required before introducing a visible dark interface.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] Record baseline S-140 and S-89 output using representative, fixed individual and bimonthly data before changing document styles.
- [x] Give each document an explicit appearance boundary with its current light background, text and palette, independent of inherited interface colors and any ancestor dark selector.
- [x] Isolate document color variables from future interface theme variables without changing their values or redefining general Tailwind colors.
- [x] Preserve current typography, dimensions, spacing, section colors, pagination and auxiliary-room behavior.
- [x] Preserve the document boundary and colors in the actual JPEG capture clone attached under the document body; a white canvas background alone is not considered sufficient.
- [x] Preserve printing/PDF styles independently of the JPEG capture path. Do not temporarily recolor the visible app to generate a document.
- [x] Demonstrate unchanged documents under both light and simulated dark surrounding styles, covering S-140/S-89, individual/bimonthly, preview/JPEG/print-PDF.
- [x] Compare rendered content, geometry, page count and internal color samples with the baseline rather than requiring binary equality of encoded files.
- [x] Verify navigation between S-140, S-89 and ordinary screens does not leak document colors or styles into the interface.
- [x] Keep this ticket limited to document isolation; do not add a visible theme control, new document template or unrelated export refactor.

## Comments

Implemented and reviewed against the parent spec. Frontend verification: 42 tests, full TypeScript check and production build passed. Browser verification used synthetic data and simulated Tauri IPC; it covered both themes, the relevant workflows, preference failures, unsaved edits, Sección color invariance and document outputs. See the feature verification report for evidence and limits.
