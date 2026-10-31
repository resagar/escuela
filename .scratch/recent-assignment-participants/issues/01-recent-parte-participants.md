# 01: Show recent participants for Parte assignments

**What to build:** Add an informational section above the eligible-Hermanos list in every Parte assignment picker, showing all Hermanos who performed that Tipo de asignación during the three calendar weeks before the selected Semana. Include all recorded roles, including Ayudantes, and participants who are no longer eligible. Deliver historical retrieval, picker presentation and verification together, following the parent spec.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] The section works for all Parte assignment selectors, including Estudiante, Ayudante, Conductor and Lector where applicable, rather than only student assignments.
- [x] Historical retrieval is independent of current eligibility and includes inactive and otherwise ineligible recorded participants with their identities, dates, roles and assignment descriptions.
- [x] Match Tipo de asignación across roles and rooms, regardless of changes in title, ordering or duration.
- [x] Include Semana start dates in the interval from selected Semana start minus 21 calendar days, inclusive, to selected Semana start, exclusive; never anchor to today or count stored weeks instead.
- [x] Each recent Hermano appears once with all matching events, newest first; participants are ordered by most recent event with deterministic name/identity tie-breaking.
- [x] Eligible recent participants remain selectable. Other historical participants are clearly informational and cannot be selected using either mouse or keyboard.
- [x] Recent participation does not change the SQL eligibility rules or grant eligibility. Recent eligible participants are omitted only from the lower presentation list to avoid duplicate rows.
- [x] Existing name search applies to both sections, while current selection behavior and individual-history access remain available for eligible participants.
- [x] Loading, empty and failed history states are distinct. Historical-query failure is visible and does not add restrictions to ordinary eligible selection.
- [x] Switching Semana or assignment context does not show or select participants using stale history or eligibility results.
- [x] Rust tests with SQLite in memory cover boundaries, missing weeks, cross-role/type matching, inactive/ineligible participants, repeated events and distinct identities sharing a name.
- [x] Vitest verifies grouping and list separation without changing the eligible selection set; manually verify actual picker behavior, search, selection and history states.
- [x] No schema migration, unrelated refactor or new testing framework is introduced without a demonstrated necessity.

## Comments

Implemented and reviewed against the parent spec. Verification: 33 frontend tests, 25 Rust tests (including five historical-query tests), TypeScript checks and production frontend build passed. Both Standards and Spec reviews reported no actionable findings. Browser checks with simulated Tauri IPC exercised ten pickers across all seven role families, search, selection by keyboard, inactive informational entries, history loading/error/empty states, stale responses and changing the selected Semana. Desktop and narrow-screen layouts were inspected. The native Tauri executable was not exercised; browser IPC was simulated and database queries were tested separately with SQLite in memory.
