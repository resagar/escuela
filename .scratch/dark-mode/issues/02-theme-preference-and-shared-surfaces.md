# 02: Add persistent theme selection and shared interface surfaces

**What to build:** Let the coordinator select a light or dark interface from Configuración, remember the choice locally, and see it applied consistently to navigation, dashboard and shared controls without affecting S forms or congregation settings.

**Blocked by:** 01: Isolate S-form appearance from interface themes.

**Status:** implemented — native verification pending

- [x] Configuración exposes an accessible light/dark appearance control, clearly separate from congregation settings. There is no system-following mode in this scope.
- [x] Persist a valid selection in local browser storage; absent or invalid preferences resolve to light.
- [x] Resolve appearance before the interface is first painted, using the same interpretation during React initialization, without an opposite-theme startup flash.
- [x] Storage read failure falls back safely. Write failure still permits a session-only appearance change and provides nonblocking feedback that it will not survive restart.
- [x] Share the selected theme without remounting the app, resetting navigation, discarding unsaved edits or changing Asignaciones selections.
- [x] Navigation, dashboard, Configuración and shared interface surfaces use readable theme-specific neutral colors, including shared modal chrome, buttons, fields, focus and feedback states.
- [x] Scope neutral interface colors separately from domain Sección accents, document colors and general Tailwind color values; do not use inversion filters or indiscriminate global utility replacements.
- [x] Interface controls and scrollbars use a coherent color scheme while document boundaries established in ticket 01 remain unchanged.
- [x] Existing congregation settings, auxiliary-room controls and persistence remain operational and independent of the appearance preference.
- [x] Vitest tests the public preference behavior for saved values, invalid/absent values, read/write failures and consistent startup/session resolution, following the existing pure-function test style.
- [ ] Verify keyboard operation, readable states and both appearances in the rendered shared surfaces, plus restart persistence and actual controls in packaged Tauri. Record browser-only verification separately from native evidence.
- [x] Run existing frontend tests, typechecking and production build. No SQLite migration, new backend command, native theme permission or theme dependency is introduced.
- [x] Confirm the ticket 01 form-output invariants still hold after enabling the real dark interface.

## Comments

Implemented and reviewed against the parent spec. Frontend verification: 42 tests, full TypeScript check and production build passed. Browser verification used synthetic data and simulated Tauri IPC; it covered both themes, the relevant workflows, preference failures, unsaved edits, Sección color invariance and document outputs. See the feature verification report for evidence and limits.

The native acceptance criterion remains unchecked: this environment has no graphical display or Xvfb, so packaged Tauri restart persistence, native WebView controls and file-dialog integration were not exercised. Implementation is finished; native verification is pending.
