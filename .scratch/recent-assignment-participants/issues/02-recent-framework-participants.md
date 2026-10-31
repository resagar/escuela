# 02: Show recent participants for framework assignments

**What to build:** Extend the recent-participants experience to president, auxiliary-room counselor and prayer pickers. Reuse the historical retrieval and presentation introduced for Partes while matching the actual framework categories and retaining all eligibility safeguards.

**Blocked by:** 01: Show recent participants for Parte assignments.

**Status:** completed

- [x] President, auxiliary-room counselor, opening-prayer and closing-prayer pickers show the recent-participants section above the eligible list.
- [x] Match historical framework records by their category and role rather than comparing the selector's raw type value with the history type value.
- [x] President and auxiliary-room counselor histories remain separate from one another and from Parte assignments.
- [x] Prayer pickers show opening, intermediate and closing prayers as one historical category, preserving each event's description and role/date details.
- [x] Reuse the selected-Semana 21-day window, grouping, ordering, search, empty/loading/error behavior and stale-result protection established by ticket 01.
- [x] Include inactive and otherwise ineligible historical participants as informational entries, while keeping only currently eligible Hermanos selectable.
- [x] Recent participation never restricts eligibility, and no participant is duplicated in the lower eligible list.
- [x] Rust SQLite tests cover framework-role mapping, grouped prayers, date boundaries and historical participants outside current eligibility.
- [x] Extend Vitest coverage only for new transformation behavior, and manually verify every framework picker plus representative Parte pickers for regressions.
- [x] The resulting feature covers every current assignment picker without changing scheduling, eligibility rules or S-140 output.

## Comments

Implemented and reviewed against the parent spec. Verification: 33 frontend tests, 25 Rust tests (including five historical-query tests), TypeScript checks and production frontend build passed. Both Standards and Spec reviews reported no actionable findings. Browser checks with simulated Tauri IPC exercised ten pickers across all seven role families, search, selection by keyboard, inactive informational entries, history loading/error/empty states, stale responses and changing the selected Semana. Desktop and narrow-screen layouts were inspected. The native Tauri executable was not exercised; browser IPC was simulated and database queries were tested separately with SQLite in memory.
