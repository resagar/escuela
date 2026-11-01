# 04: Apply dark mode to Semana planning and MWB import

**What to build:** Let the coordinator list, create and edit Semanas and review MWB imports in the selected interface theme, retaining existing Sección accents and every scheduling and import rule.

**Blocked by:** 02: Add persistent theme selection and shared interface surfaces.

**Status:** completed

- [x] Semana lists, create/edit forms and Parte editors follow the selected theme using the shared neutral interface colors.
- [x] The complete MWB import workflow follows the theme, including file selection controls, progress, parsed-week previews, selected/excluded Semanas, adjustments and result/error feedback.
- [x] Existing Sección colors remain unchanged wherever present. Do not add Asignaciones-style bands to the Semana editor, which currently uses a Sección selector.
- [x] Fields, selects, checkboxes, labels, placeholders, borders, keyboard focus, disabled controls and empty/loading/error states remain readable in both themes.
- [x] Preserve the auxiliary-room lock, its notice/link and stored flags, as well as special-week behavior and existing import-selection rules.
- [x] Theme changes preserve unsaved Semana/Parte edits, selected import weeks, manual adjustments and current navigation without remounting the workflow.
- [x] Verify representative normal and special Semanas, auxiliary-room enabled/disabled states, and successful and failed import states in both appearances.
- [x] Compare any existing Sección accent background values across themes while checking their accompanying text remains readable.
- [x] Run relevant existing import tests, frontend typechecking and build; preserve established form-output invariants.
- [x] Do not change parsing, scheduling, data models, import payloads or section presentation beyond the necessary interface theme adaptation.

## Comments

Implemented and reviewed against the parent spec. Frontend verification: 42 tests, full TypeScript check and production build passed. Browser verification used synthetic data and simulated Tauri IPC; it covered both themes, the relevant workflows, preference failures, unsaved edits, Sección color invariance and document outputs. See the feature verification report for evidence and limits.
