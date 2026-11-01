# 03: Apply dark mode to Roster and Familia workflows

**What to build:** Allow the coordinator to manage Hermanos and Familias in the selected interface theme, with readable lists, forms, details and feedback, while preserving their current behavior.

**Blocked by:** 02: Add persistent theme selection and shared interface surfaces.

**Status:** completed

- [x] Hermano lists, create/edit forms, active/inactive states and associated controls follow the selected theme.
- [x] Familia lists, create controls, member details and member-management interactions follow the selected theme.
- [x] Tables, cards, labels, placeholders, borders, hover/selection states, validation, errors, empty/loading states and disabled controls remain readable in both appearances.
- [x] Use the neutral interface colors and shared components established in ticket 02, preserving any existing semantic accents instead of redefining global colors.
- [x] Switching appearance preserves unsaved Hermano edits, current navigation, filters and selections.
- [x] Keyboard focus and action labels remain clear; appearance does not alter activation/reactivation, Familia membership or existing eligibility data.
- [x] Review the complete Roster and Familia workflows in both themes with representative data and empty/error states; do not claim pure-function tests prove rendered component behavior.
- [x] Run relevant existing frontend tests, typechecking and build, and retain the established S-form isolation invariants.
- [x] No new theme mode, unrelated redesign or backend behavior change is added.

## Comments

Implemented and reviewed against the parent spec. Frontend verification: 42 tests, full TypeScript check and production build passed. Browser verification used synthetic data and simulated Tauri IPC; it covered both themes, the relevant workflows, preference failures, unsaved edits, Sección color invariance and document outputs. See the feature verification report for evidence and limits.
