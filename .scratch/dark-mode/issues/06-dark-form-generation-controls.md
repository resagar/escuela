# 06: Apply dark mode to S-form generation controls

**What to build:** Adapt the interface surrounding individual and bimonthly S-140/S-89 generation to the chosen theme while keeping the previewed sheets and every generated output in their original document appearance.

**Blocked by:** 02: Add persistent theme selection and shared interface surfaces.

**Status:** implemented — native verification pending

- [x] Individual and bimonthly generation screens for both S-140 and S-89 theme their surrounding headings, navigation, selectors, range controls, export actions and feedback.
- [x] Document sheets remain explicitly light with their existing text, section colors, geometry, typography and pagination in both interface themes.
- [x] The interface theme applies to generation controls rather than excluding the entire generation route or recoloring document content.
- [x] Changing appearance preserves current week/range selections, navigation and generated content without remounting the workflow.
- [x] Compare S-140/S-89, individual/bimonthly, across preview, actual JPEG export and print/PDF using the same data and capture settings in both themes.
- [x] Compare document text, internal color samples, backgrounds, dimensions and page counts; do not rely solely on the white canvas background or require byte-for-byte equality of encoded files.
- [x] Verify the actual capture clone under the document body retains ticket 01's document boundary, including after switching theme before or after export.
- [x] Navigate S-140 to S-89 to ordinary screens in both themes and confirm there is no theme/document variable or cascade leakage.
- [x] Empty/loading/error states, disabled export controls and keyboard focus remain readable; existing generation and auxiliary-room behavior remains unchanged.
- [ ] Inspect real Tauri generation controls and export behavior where supported, distinguishing native verification from browser runs with simulated IPC. Physical printer differences are outside the theme-invariance guarantee.
- [x] Run current frontend tests, typechecking and build; do not introduce a new template, export format, dependency or native-window theming feature.

## Comments

Implemented and reviewed against the parent spec. Frontend verification: 42 tests, full TypeScript check and production build passed. Browser verification used synthetic data and simulated Tauri IPC; it covered both themes, the relevant workflows, preference failures, unsaved edits, Sección color invariance and document outputs. See the feature verification report for evidence and limits.

The native acceptance criterion remains unchecked: this environment has no graphical display or Xvfb, so packaged Tauri restart persistence, native WebView controls and file-dialog integration were not exercised. Implementation is finished; native verification is pending.
