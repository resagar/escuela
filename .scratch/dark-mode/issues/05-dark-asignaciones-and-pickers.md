# 05: Apply dark mode to Asignaciones and participant pickers

**What to build:** Let the coordinator assign Hermanos in the selected theme, including all participant pickers, recent participants and histories, while keeping Sección colors and eligibility behavior unchanged.

**Blocked by:** 02: Add persistent theme selection and shared interface surfaces.

**Status:** completed

- [x] The weekly Asignaciones view, Parte rows, Marco controls, navigation and saved/error feedback follow the selected interface theme.
- [x] Preserve the actual current Sección background values for Tesoros, Mejores Maestros, Vida Cristiana and Marco. Do not substitute the different S-140 document palette.
- [x] Every picker family follows the theme: Estudiante, Ayudante, Conductor, Lector, Presidente, Consejero de sala auxiliar and Orador de oración.
- [x] Search, recent-participant rows, remaining eligible rows, full histories and tables are readable in both appearances, including loading, empty and failure states.
- [x] Recent inactive or otherwise ineligible Hermanos remain visibly informational and unselectable; recent eligible Hermanos remain selectable. Theme changes never modify eligibility or recent-history matching.
- [x] Preserve current selection, unsaved interface state, Semana context and history behavior when appearance changes, without resetting the page or picker workflow.
- [x] Verify keyboard focus, search, selection and informational entries in both themes; preserve mouse and keyboard selection safeguards and current stale-response protection.
- [x] Compare actual Sección background values across themes and inspect text contrast without changing the protected backgrounds.
- [x] Run the existing picker transformation tests, other relevant frontend tests, typechecking and build; preserve the established S-form isolation invariants.
- [x] Do not change assignment rules, history windows, candidate ordering, auxiliary-room logic or scheduling behavior.

## Comments

Implemented and reviewed against the parent spec. Frontend verification: 42 tests, full TypeScript check and production build passed. Browser verification used synthetic data and simulated Tauri IPC; it covered both themes, the relevant workflows, preference failures, unsaved edits, Sección color invariance and document outputs. See the feature verification report for evidence and limits.
