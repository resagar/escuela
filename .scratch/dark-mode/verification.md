# Dark mode implementation verification

Date: 2026-11-01. Baseline: `228eea923673ff92c4be4bc5e2e4f820e6cb8095`.

## Implemented behavior

- Configuración provides persistent light/dark selection for this installation. The synchronous bootstrap and React share one preference implementation. Invalid or unreadable preferences fall back to light; failed writes preserve the session choice and display feedback.
- Neutral interface colors cover all current route families and shared components. Existing Asignaciones backgrounds and MWB section-chip colors are unchanged. The golden Mejores Maestros band uses black foreground to improve measured contrast from 2.94:1 to 7.15:1 without changing its background.
- Document variables have distinct namespaces and local scope. Screen sheets explicitly stay light, export wrappers retain black text on white, and print media forces a light root scheme. The existing gray-50 app canvas behind the printed document is preserved to avoid changing pre-feature PDF output. The S-140 screen sheet is now explicitly white rather than inheriting the interface canvas.
- No backend, schema, dependencies, native permissions, eligibility, import payload or scheduling changes were needed.

## Automated checks

- `pnpm test`: 42 tests passed across three suites, including nine preference tests. The preference tests execute the actual synchronous bootstrap in a sandbox with storage/document boundary fixtures.
- TDD red/green evidence: initial bootstrap test failed because the script did not exist, then passed; the persistence test failed because the setter did not exist, then passed with the implementation.
- `pnpm exec tsc --noEmit -p tsconfig.json`: passed, including test files.
- `pnpm build`: passed. The production HTML loads the synchronous theme script before the application module; the copied script matches its source. Vite retains the existing advisory for a bundle over 500 kB.
- Whitespace/diff checks passed. No Rust logic was changed; a Rust test run was not necessary for the frontend-only implementation.

## Browser and output evidence

Checks ran against the actual frontend in headless Chromium with synthetic Roster, Semana, Parte and Asignación data. Tauri invoke, file-dialog and file-write boundaries were simulated; JPEG rendering itself used the real html2canvas exporter and PDF rendering used Chromium print media.

- Examined 14 non-document routes in both themes, including creation/editing, Familia details, MWB selection/preview and range selectors. Checked actual dark canvas colors and preserved domain accent values.
- Exercised auxiliary-room lock state, special-week selection, inactive informational participants, keyboard selection, recent-history failure and an empty Familia state.
- Verified persistence after browser reload, failed-save feedback, and preservation of unsaved Hermano and Semana edits during an appearance change.
- Inspected desktop interface and picker appearance. The mechanical UI detector reported one existing accent-border warning on the pre-feature batch-Hermano form; it was left unchanged to avoid an unrelated redesign.
- Captured S-140/S-89 individual and bimonthly output before altering styles. Repeated the same scenes in both themes and compared document text, dimensions, font/foreground/section-color samples, real JPEG output and rasterized PDFs.

| Output | JPEG bytes | Baseline and themed SHA-256 | PDF pages |
| --- | ---: | --- | ---: |
| S-140 individual | 217637 | `f1e22f8be9023f605b37e9f2954b323eb52e55435ab294e349fc644f845c3de9` | 1 |
| S-140 bimonthly | 369030 | `f6991eed910cac2762aab21c66d6ec8222bc036caf27a5a682e0ff35dcb47a33` | 2 |
| S-89 individual | 151139 | `4450afe2d71c935e62d6ef05ba48c0c511b25bcce0cac7ebc353bc0dfd5e4061` | 1 |
| S-89 bimonthly | 298757 | `dbfdf0b276443219fd400a5b100d002fb1dcc08d95f15937c3b3cb4f54a6120e` | 1 |

The JPEG hashes matched the baseline. PDF files were rasterized with the same renderer and dimensions to compare actual page pixels rather than PDF timestamps/metadata. All four variants retained their page counts and matched the baseline raster output. These are representative scenes, not proof for every possible congregation dataset or physical printer.

## Standards

No actionable documented-standard violations or Fowler-baseline smells were found in the independent review.

## Spec

No functional findings remain open. One contrast finding was corrected by changing only the Mejores Maestros foreground. Document output, domain accents, preference failures and interface-state preservation were verified at the agreed browser/pure-preference boundaries.

## Remaining native verification

This environment has neither a graphical session nor Xvfb. Packaged Tauri restart persistence, native WebView controls and operating-system file dialogs were not exercised. Tickets 02 and 06 retain their native acceptance criteria unchecked and are marked implemented with native verification pending; the remaining four tickets are completed. Browser IPC simulation must not be reported as native verification.

The feature is implemented, but the native verification gap remains a release check. Native-window theming and physical-printer color matching are outside the agreed scope.
