# Interface dark mode with unchanged S forms

Status: ready-for-agent

## Problem Statement

The coordinator uses Escuela's light interface to manage the Roster, Semanas and Asignaciones. There is no dark appearance for these tasks. Adding one must preserve the recognizable colors of each Sección and the exact appearance of generated S-140 and S-89 documents, especially bimonthly output. A global recoloring would risk affecting previews, printed pages and exported images.

## Solution

Provide a persistent light/dark appearance preference for the application interface. Adapt neutral backgrounds, text, borders, controls, feedback and modals consistently across all screens. Preserve existing Sección colors independently of the selected appearance. Keep S-140 and S-89 sheets in their existing light document appearance in previews, printing/PDF and JPEG exports, while allowing the surrounding controls to follow the interface theme.

## User Stories

1. As a coordinator, I want to select a dark interface, so that I can work with a darker visual environment.
2. As a coordinator, I want to return to the light interface, so that I can use the appearance that suits my current environment.
3. As a coordinator, I want the appearance control in Configuración, so that I can find it without changing congregation data.
4. As a coordinator, I want my appearance preference remembered locally, so that I do not need to choose it on every launch.
5. As a coordinator, I want the chosen appearance applied when the app first appears, so that startup does not flash the opposite theme.
6. As a coordinator, I want the application to remain usable if the saved preference cannot be read or written, so that a visual preference cannot prevent my work.
7. As a coordinator, I want navigation and dashboard surfaces to follow the theme, so that the application feels consistent.
8. As a coordinator, I want Hermano lists and forms to follow the theme, so that I can manage the Roster comfortably.
9. As a coordinator, I want Familia lists and details to follow the theme, so that related Roster tasks use the same appearance.
10. As a coordinator, I want Semana lists and create/edit forms to follow the theme, so that planning does not switch to unrelated light surfaces.
11. As a coordinator, I want the MWB import workflow to follow the theme, so that I can review and import Semanas consistently.
12. As a coordinator, I want the Asignaciones view to follow the theme, so that I can assign Hermanos in the selected appearance.
13. As a coordinator, I want Tesoros, Mejores Maestros, Vida Cristiana and Marco colors preserved, so that their meaning remains immediately recognizable.
14. As a coordinator, I want existing Sección accents preserved wherever they appear, so that changing appearance does not change the program's visual vocabulary.
15. As a coordinator, I want assignment-picker modals and histories to follow the theme, so that selecting an Estudiante, Ayudante, Conductor, Lector or framework participant remains readable.
16. As a coordinator, I want recent-participant informational and selectable states to remain clear, so that appearance does not obscure eligibility.
17. As a coordinator, I want inputs, selects, checkboxes and disabled controls to remain readable, so that I can complete forms reliably.
18. As a coordinator, I want visible keyboard focus and clear feedback in both themes, so that I can operate the app without relying only on color.
19. As a coordinator, I want S-140 previews to retain their current light sheet and official colors, so that the preview represents the final document.
20. As a coordinator, I want S-89 previews to retain their current light sheet, so that assignment cards remain faithful to the final output.
21. As a coordinator, I want individual and bimonthly form-generation controls to follow the interface theme, so that the surrounding workflow is consistent without recoloring the sheets.
22. As a coordinator, I want printed and saved-as-PDF S forms to be independent of the theme, so that choosing dark mode does not alter distributed documents.
23. As a coordinator, I want JPEG exports to preserve document text, backgrounds and section colors, so that exported images remain identical in appearance across themes.
24. As a coordinator, I want switching between S-140, S-89 and ordinary screens to preserve their respective palettes, so that navigation does not leak document styles into the interface or theme styles into documents.
25. As a coordinator, I want a theme change to preserve unsaved edits and current selections, so that adjusting appearance does not interrupt my work.

## Implementation Decisions

- Treat interface neutrals, domain Sección accents and document colors as separate concerns. Do not implement dark mode by inversion filters or global substitution of existing color utilities.
- Add one application-level appearance preference, with `light` and `dark` values. Use the existing Configuración screen for the control, making its local-interface scope clear rather than treating it as a congregation setting.
- Use light appearance when no valid preference exists. This preserves the existing initial appearance. Automatic system-theme following is outside the initial scope.
- Persist the preference in local browser storage for this installation. No SQLite schema change, backend command, native capability or dependency is required for preference persistence. Storage failure must not crash startup or prevent changing appearance for the current session. If saving fails, communicate that the choice will not survive restart without blocking work.
- Resolve the initial preference before the interface is painted, and use the same resolution rules when React initializes. Invalid stored values fall back to light. Do not implement separate startup and runtime interpretations that can disagree.
- Share resolved appearance across the interface without remounting the application, resetting navigation, discarding unsaved forms or changing assignment selections.
- Introduce narrowly scoped neutral interface colors for backgrounds, surfaces, text, borders and interactive states. Prefer shared components and styles where they already exist; avoid a general design-system rewrite.
- Do not redefine general Tailwind color values or the document palette as interface theme variables. Give interface and document colors distinct names or scopes so that cascade and stylesheet loading order cannot couple them.
- Apply the theme to all current routes and shared components, including dashboard, Configuración, Roster, Familias, Semana lists and editors, MWB import, Asignaciones, histories, dialogs and generation controls.
- Preserve the existing background colors used for the Secciones in Asignaciones: slate for Tesoros, yellow/gold for Mejores Maestros, maroon/red for Vida Cristiana and gray for Marco. Preserve their current actual values, not merely equivalent color names. Do not replace them with the S-140 document palette, which has different values.
- Preserve existing Sección colors in any other screen where they are already used. The current Semana editor has a Sección selector rather than the same colored bands as Asignaciones; this feature does not add new bands or redesign that editor.
- Maintain readable labels, selection states, focus indicators, errors, success feedback, disabled controls and placeholders in both themes. Preserve domain accent backgrounds while adapting accompanying interface text or surrounding neutral surfaces when necessary for contrast.
- Set an appropriate CSS color scheme for themed interface controls and scrollbars. Keep document content explicitly in its light appearance; do not assume a light color-scheme declaration cancels author styles or dark-variant selectors.
- Establish a document boundary for both S-140 and S-89 sheets. Fix document background, text and existing palette within that boundary in screen preview and output. Dark selectors and inherited interface variables must not affect descendants inside it.
- Scope existing document colors without changing their values, typography, dimensions, spacing, pagination or section structure. Preserve current S-140 fidelity and the current S-89 design.
- Theme the UI surrounding document sheets, including individual and bimonthly selectors and export controls, rather than excluding entire generation screens from dark mode.
- Protect both document-output paths independently: print styles for printing/PDF, and the actual captured element for JPEG. An export clone attached under the document body must retain its document boundary and explicit colors even when the app is dark.
- A white canvas background alone is insufficient protection for JPEG text and internal backgrounds. If clone adjustments are needed, keep them local to capture rather than temporarily switching the visible application theme.
- Keep all current scheduling, eligibility, import, auxiliary-room and generation behavior intact. In particular, dark mode does not change which Hermanos are eligible or how recent participation is displayed or selected.
- Establish baseline form captures before changing theme or document styles. The first implementation step should isolate the current document appearance and prove it is preserved, before introducing a visible dark interface.

## Testing Decisions

- Test externally visible behavior and generated output rather than CSS class names, implementation-specific component structure or storage call counts.
- Use the existing Vitest pure-function test style to verify the theme-preference boundary: saved light/dark, absent or invalid values, read/write failures, consistent startup resolution and session fallback. Prefer the highest practical public preference interface rather than exposing internal helpers solely for tests.
- Review the rendered application in both themes through browser interaction, covering every route, shared modal, normal/empty/loading/error state, disabled control and keyboard focus. Existing Vitest infrastructure does not provide component or desktop end-to-end coverage; do not claim it does.
- Verify that switching appearance preserves unsaved Semana and Hermano edits, current navigation and Asignaciones selections.
- Record and compare the actual rendered Sección background values before and after theme changes. Check readable text without replacing the protected background colors.
- Verify the document boundary using the same seeded data, viewport, fonts and capture settings for light and dark themes. Compare document text, backgrounds, section-color samples, layout and page count rather than requiring binary equality of PDF/JPEG files with metadata or encoding differences.
- Cover the full output matrix: S-140 and S-89, each individual and bimonthly, each as screen preview, JPEG and print/PDF. Verify the surrounding controls separately because they should follow the interface theme while the sheets remain unchanged.
- Exercise navigation from S-140 to S-89 and back to ordinary screens, and theme changes before and after export, to expose CSS cascade or inherited-color leakage.
- Test the real JPEG capture path, including the clone attached under the document body; checking only print styles or the visible preview is insufficient.
- Verify preference persistence after restarting the packaged Tauri app and inspect actual WebView controls. Browser tests with simulated IPC do not prove native startup, persistence or rendering.
- Run current frontend tests, typechecking and production build. Run relevant Rust checks if backend or native configuration changes become demonstrably necessary; the intended implementation does not require them.
- Physical printing remains subject to printer and user-dialog settings. Compare output under the same settings and ensure the theme introduces no differences; CSS cannot guarantee identical physical color reproduction on arbitrary printers.
- The preference, visual interface, form-output and real-Tauri verification boundaries were proposed in conversation; the user then directed publication of this spec and continuation to ticket planning.

## Out of Scope

- Following the operating system theme automatically or adding a third appearance mode.
- Synchronizing native window decorations, operating-system file dialogs or other external UI with the chosen interface theme.
- Theme synchronization across devices, congregation-database persistence or a new backend settings subsystem.
- Recoloring S-140 or S-89 sheets for dark preview, changing their templates or redesigning exported documents.
- Replacing the existing Sección palette or introducing colored bands in views that do not already use them.
- Changing eligibility, scheduling, imports, auxiliary-room behavior or document content.
- Replacing the UI framework, adding a theme library or creating unrelated design-system infrastructure.

## Further Notes

The mandatory requirements are interface-only dark mode, unchanged generated forms and preserved existing Sección colors. The two-state control in Configuración, light initial default, local persistence, always-light document preview and exclusion of native-window theming are explicit minimal-scope assumptions synthesized for this spec; they were not separately selected by the user during research.

The existing research documents the code evidence and primary-source references. Current shared document-variable names are a risk when adding theme styles, not proof of an existing rendering defect. Implementation should preserve the current working output while establishing separation.

Ticket planning should begin with a verifiable document-isolation prefactor, followed by complete user-visible slices of the interface migration. Every later slice must retain the established form-output and Sección-color invariants. This spec does not publish implementation tickets by itself.
