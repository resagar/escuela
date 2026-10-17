# Análisis del Sistema — Escuela (Asignaciones VyM)

**Versión:** 1.1 (2026-10-16)
**Cambios v1.1:** re-verificado contra el código tras los features de **semanas especiales** y **configuración de congregación**: 7 tablas (`congregation_settings`), 16 rutas (`/configuracion`), referencias de línea actualizadas (`lib.rs`, `db.rs`, `rules.rs`, `App.tsx`, `S140WeekView.tsx`, `AsignacionesPage.tsx`, `requirements.md` v1.8) y drift #1 marcado **resuelto** en código.
**Metodología:** cada afirmación se verificó contra fuentes primarias (código fuente, `package.json`, `Cargo.toml`, `schemaDB.md`, `git log`), no solo contra los documentos de `docs/user/`. Las rutas son relativas a la raíz del repositorio. Los identificadores de código, rutas de archivo y cadenas de etiquetas se mantienen en English.

---

## 1. Stack verificado

| Capa | Docs afirman | Verificado en código | Estado |
|---|---|---|---|
| Plataforma | Tauri 2 (local-first desktop) | `tauri = "2"` (`src-tauri/Cargo.toml:21`), `@tauri-apps/api: ^2` (`package.json:14`), plugins `tauri-plugin-opener` + `tauri-plugin-dialog` (`src-tauri/src/lib.rs:25-26`) | ✅ coincide |
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + React Router v7 | `react: ^19.1.0`, `tailwindcss: ^4.3.0` + `@tailwindcss/vite: ^4.3.0`, `react-router-dom: ^7.16.0` (`package.json:13,20,21`), `typescript: ~5.8.3` (`package.json:28`) | ✅ coincide |
| Bundler | (no mencionado en docs/user) | `vite: ^7.0.4` (`package.json:29`), `@vitejs/plugin-react: ^4.6.0` (`package.json:27`) | ℹ️ omitido en docs/user; sí en `AGENTS.md:15` |
| Backend | Rust + SQLite (`rusqlite`) | `rusqlite = { version = "0.31", features = ["bundled"] }` (`src-tauri/Cargo.toml:25`); WAL + FKs: `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;` (`src-tauri/src/db.rs:18`) | ✅ coincide |
| Parser de PDF | Módulo `mwb_parser` con crate `lopdf` | `lopdf = "0.34"` (`src-tauri/Cargo.toml:27`) — **pero** el extractor primario es el binario externo `pdftotext`; `lopdf` es fallback (`src-tauri/src/mwb_parser/mod.rs:22-27,58-78`) | ⚠️ drift (ver §4.2 #11) |
| Otros crates | — | `regex = "1"`, `tokio = { version = "1", features = ["sync"] }`, `serde = "1"`, `serde_json = "1"` (`src-tauri/Cargo.toml:23,24,28,29`) | ℹ️ |
| Exportación JPEG | export S-140/S-89 a PDF/JPEG (`docs/user/requirements.md:79,114`) | `html2canvas: ^1.4.1` (`package.json:17`) + `@tauri-apps/plugin-dialog` save + comando `write_file_bytes` (`src/utils/s140Export.ts:17,33-40`) | ✅ coincide |
| Ventana | 1200×800, mín 900×600 (master-plan Tarea 1.6) | `width: 1200, height: 800, minWidth: 900, minHeight: 600`, título "Escuela — Asignaciones VyM" (`src-tauri/tauri.conf.json:14-20`) | ✅ coincide |
| Gestor de paquetes | pnpm | `pnpm-workspace.yaml`, scripts `pnpm` (`package.json:6-11`) | ✅ coincide |

**Resumen:** el stack documentado es correcto. La única desviación material es el parser: el código depende del binario externo `pdftotext` como camino principal, contradiciendo la afirmación de "lopdf (Rust nativo, sin dependencias externas)" (`docs/user/master-plan.md:9`).

---

## 2. Reglas de negocio

### 2.1 Filtro base (toda la matriz)

`WHERE activo = 1 ... ORDER BY nombre` en las 21 ramas de `get_eligible_brothers` (p. ej. `src-tauri/src/eligibility/rules.rs:26-35`). Coincide con `docs/user/requirements.md:30`.

### 2.2 Matriz de elegibilidad — verificada fila por fila

Fuente de verdad en código: `src-tauri/src/eligibility/rules.rs:8-371`. Doc: `docs/user/requirements.md:28-58`.

| `tipo_asignacion` | rol | Regla implementada (código) | requirements.md §3 | Estado |
|---|---|---|---|---|
| `discurso_no_estudiante` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:26-35`) | anciano, siervo_ministerial (req:34) | ✅ |
| `busquemos_perlas` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:36-45`) | idem (req:35) | ✅ |
| `lectura_biblia` | estudiante | `sexo = 'masculino'` (`rules.rs:46-56`) | sexo = masculino (req:36) | ✅ |
| `empiece_conversaciones` | estudiante | todos los activos (`rules.rs:57-66`) | todos los activos (req:37) | ✅ |
| `empiece_conversaciones` | ayudante | `sexo = ?2 OR <family_subquery>` (`rules.rs:67-120`, subconsulta en `rules.rs:16-21,76-78`) | mismo sexo **o familiar** (req:38) | ✅ |
| `haga_revisitas` | estudiante | todos los activos (`rules.rs:121-130`) | todos los activos (req:39) | ✅ |
| `haga_revisitas` | ayudante | `sexo = ?2` (`rules.rs:131-156`) | **solo mismo sexo** (req:40) | ✅ (fix (a)) |
| `haga_discipulos` | estudiante | todos los activos (`rules.rs:157-166`) | todos los activos (req:41) | ✅ |
| `haga_discipulos` | ayudante | `sexo = ?2` (`rules.rs:167-191`) | **solo mismo sexo** (req:42) | ✅ (fix (a)) |
| `explique_creencias_discurso` | estudiante | `sexo = 'masculino'` (`rules.rs:192-201`) | sexo = masculino (req:43) | ✅ |
| `explique_creencias_escenificacion` | estudiante | todos los activos (`rules.rs:202-211`) | todos los activos (req:44) | ✅ |
| `explique_creencias_escenificacion` | ayudante | `sexo = ?2 OR <family_subquery>` (`rules.rs:212-265`, family en `rules.rs:221-223`) | mismo sexo **o familiar** (req:45) | ✅ |
| `discurso_estudiante` | estudiante | `sexo = 'masculino'` (`rules.rs:276-286`) | sexo = masculino (req:46) | ✅ |
| `que_dirias` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:266-275`) | anciano, siervo_ministerial (req:47) | ✅ |
| `analisis_auditorio` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:287-296`) | idem (req:48) | ✅ |
| `necesidades_congregacion` | estudiante | `rol = 'anciano'` (`rules.rs:297-306`) | **solo anciano** (req:49) | ✅ |
| `estudio_biblico` | conductor | `puede_conducir_estudio = 1` (`rules.rs:307-317`) | `puede_conducir_estudio = 1` (req:50) | ✅ |
| `estudio_biblico` | lector | `sexo = 'masculino' AND rol != 'estudiante_biblia'` (`rules.rs:318-327`) | idem (req:51) | ✅ |
| (rol especial) `presidente` | — | `puede_presidir = 1` (`rules.rs:329-338`) | `puede_presidir = 1` (req:52) | ✅ |
| (rol especial) `consejero_sala` | — | `puede_ser_consejero_sala = 1` (`rules.rs:339-349`) | `puede_ser_consejero_sala = 1` (req:53) | ✅ |
| (rol especial) `oracion` | — | `sexo = 'masculino' AND rol != 'estudiante_biblia'` (`rules.rs:350-360`) | idem (req:54, commit a753338) | ✅ |

**Resultado: 21 de 21 reglas coinciden exactamente.** El drift #1 quedó **resuelto** en código con el fix (a) (`6cc29fe`, tests en `rules.rs`).

> **Detalle implementado no documentado en requirements.md §3:** cuando faltan `estudiante_id` o `sexo_estudiante`, los ayudantes degeneran a "solo sexo" o "todos los activos" (ramas de ayudante, p. ej. `rules.rs:131-156`). La UI siempre envía ambos (`src/pages/AsignacionesPage.tsx:210-211,232-233,289-290`).

### 2.3 `semana_roles` (marco general, tabla `semanas`)

- Presidente, consejero de sala auxiliar y 3 oradores (apertura/intermedia/cierre) se guardan en la tabla `semanas`: `presidente_id`, `consejero_sala_id`, `orador_oracion_apertura_id`, `orador_oracion_intermedia_id`, `orador_oracion_cierre_id` (`src-tauri/src/db.rs:53-57`), actualizados por `update_semana_roles` (`src-tauri/src/commands/asignaciones.rs:78-118`).
- Palabras de introducción (1 min) y conclusión (3 min) van a cargo del presidente y **no** se asignan por separado (`docs/user/requirements.md:20`); el parser las crea como partes tipo `introduccion`/`conclusion` de sección `marco` (`src-tauri/src/mwb_parser/mod.rs:588-639,742-768`).

### 2.4 Semanas especiales (`tipo_especial`, CHECK en `db.rs:52`)

| Tipo | Doc (requirements.md §4) | Código | Estado |
|---|---|---|---|
| `normal` | programa completo (req:64) | `TipoEspecial::Normal` (`mwb_parser/mod.rs:485`) | ✅ |
| `asamblea` | sin reunión, se importa sin partes (req:65) | detectada por keyword "ASAMBLEA" y sin estructura regular (`mod.rs:470,476-481`); `partes = Vec::new()` (`mod.rs:490-496`); S-140 muestra mensaje (`src/components/S140WeekView.tsx:51-59`) | ✅ |
| `conmemoracion` | sin reunión **si el superintendente lo decide**; la app no valida el día (req §4) | parser: marcada sin partes sin chequeo de día (`mod.rs:471-473,490-496`); el marcado manual en la vista previa excluye la semana del import (`src/lib/importPlanner.ts`) | ✅ (resuelto, ver §4.2 #5) |
| `visita_superintendente` | no hay clases auxiliares; el estudio bíblico se elimina; el discurso de servicio 30 min no se representa (req §4) | `applyVisitaAdjustments` (`src/lib/importPlanner.ts`) elimina el estudio y anula `requiere_sala_auxiliar` al importar y al guardar una semana como visita; `update_parte` limpia las asignaciones de sala (`partes.rs:132-138`) | ✅ (resuelto, ver §4.2 #6) |

### 2.5 Catálogo de tipos de asignación

Enum `TipoAsignacion` con 17 variantes, serializado en snake_case (`src-tauri/src/models.rs:4-23`). Métodos derivados: `seccion()` (`models.rs:26-35`), `requiere_sala_auxiliar()` (`models.rs:37-48`), `requiere_ayudante()` (`models.rs:50-58`), `solo_varones()` (`models.rs:60-65`), `solo_no_estudiante()` (`models.rs:67-77`). La tabla de `schemaDB.md:205-227` fue verificada contra estos métodos: **coincide en los 17 valores**. El catálogo de `docs/user/requirements.md:99` también coincide.

### 2.6 Otras reglas de negocio verificadas

- **Soft delete obligatorio:** `set_hermano_activo` compartido hace `UPDATE hermanos SET activo=?1 WHERE id=?2` (`src-tauri/src/commands/hermanos.rs:136-144`), expuesto por los comandos delgados `deactivate_hermano`/`reactivate_hermano` (`hermanos.rs:146-158`); `list_hermanos` por defecto devuelve solo activos (`hermanos.rs:17-54`). No existe `DELETE` de hermanos. ✅ (requirements.md:73)
- **Ayudante re-filtrado por sexo del estudiante:** la UI pasa `sexoEstudiante` + `estudianteId` a los selectores de ayudante (`AsignacionesPage.tsx:210-211,232-233,289-290`); `BrotherSelector` re-consulta al cambiar (`src/components/BrotherSelector.tsx:57-59`). ✅ (requirements.md:426-428 del master-plan)
- **UPSERT de asignaciones:** `INSERT OR REPLACE INTO asignaciones` (`src-tauri/src/commands/asignaciones.rs:15`), respaldado por `UNIQUE(parte_id, ambito, rol)` (`db.rs:89-90`). ✅
- **Regla de integridad NO documentada:** `update_parte` con `requiere_sala_auxiliar = false` borra las asignaciones de `sala_auxiliar` existentes (`src-tauri/src/commands/partes.rs:132-138`).
- **Historial de participación:** `get_brother_history` (`src-tauri/src/commands/historial.rs:121-131`) con ventana configurable (default 4 meses, `historial.rs:128`); la consulta cubre partes **y** roles de marco (presidente/consejero/oraciones) vía `UNION ALL` (`historial.rs:10-85`). Variante bulk: `get_eligible_brothers_with_history` (`src-tauri/src/commands/eligibility.rs:31-62`).
- **Importación transaccional:** `import_parsed_weeks` con `BEGIN`/`COMMIT`/`ROLLBACK` (`src-tauri/src/commands/semanas.rs:266-344`). ✅
- **S-89 implementado:** `get_s89_cards_for_week` filtra los 7 tipos de estudiante (`src-tauri/src/commands/s89.rs:37-45`); páginas `S89Page`/`S89RangoPage` (`src/App.tsx:38-39`). ✅ (requirements.md:79)
- **Familias:** CRUD + `add_familia_member` con `INSERT OR IGNORE` (`src-tauri/src/commands/familias.rs:109-121`); la subconsulta de familiares alimenta las reglas de ayudantes (`rules.rs:16-21`). ✅ (requirements.md:56,109)
- **Antelación ≥3 semanas, rotación del estudio, capacidades de estudiantes:** procesos humanos, no hay validación de app — coherente con requirements.md:76,78,81 (no hay código que las aplique; el historial solo informa, nunca bloquea). ✅

### 2.7 Configuración de congregación (sala auxiliar)

- **Pantalla y persistencia:** `/configuracion` (`src/pages/ConfiguracionPage.tsx`) edita un único ajuste: si la congregación tiene sala auxiliar (`docs/user/requirements.md:84-95`). Vive en la tabla singleton `congregation_settings` (`src-tauri/src/congregation/settings.rs:7,24`; comandos `src-tauri/src/commands/congregation.rs:7,13`, registrados en `lib.rs:64-65`), con default `has_auxiliary_room = 1` que preserva el comportamiento histórico.
- **Flag efectivo:** `hasEffectiveAuxiliaryRoom(has_auxiliary_room, parte)` (`src/utils/auxiliaryRoom.ts:11`) combina ajuste ∧ marca guardada; lo consumen las vistas con candado: importación MWB y formulario de semana (checkbox deshabilitado con aviso y enlace, `AuxiliaryRoomCheckbox`/`AuxiliaryRoomLockNotice`), asignaciones (consejero y selectores de sala ocultos) y S-140 (fila del consejero condicional, `src/components/S140WeekView.tsx:130,162,194,253,258`). Estado React: `useCongregationSettings` (`src/hooks/useCongregationSettings.tsx:30,71`).
- **No destructivo:** el ajuste nunca reescribe `partes.requiere_sala_auxiliar` ni borra asignaciones de `sala_auxiliar`; ambos sobreviven ocultos y reaparecen al reactivar. Los formularios envían la marca guardada o inferida sin cambios (`buildImportPayload`, `src/lib/importPlanner.ts:60`) y el S-89 no cambia (casillas fijas del formulario oficial). ✅ (`requirements.md:89-95`)

---

## 3. Restricciones y convenciones

### 3.1 Fidelidad visual del S-140

**Colores (✅ exactos):** `--color-slate: #575a5d`, `--color-gold: #be8900`, `--color-maroon: #7e0024`, `--color-text: #000000`, `--color-border: #dfdfdf`, `--color-white: #ffffff` (`src/styles/s140.css:2-10`) — idénticos a `docs/user/ux-guidelines.md:13-20`.

**Tipografías (✅ resuelto, era drift #12):** `ux-guidelines.md:30-36` ya documenta los tamaños implementados: **16.5pt** (título principal, `s140.css:90`), **11pt** (rango de fecha, `s140.css:102`), **10.0pt** (cabeceras de sección, `s140.css:141`), **10pt** (títulos y nombres, `s140.css:122,134`), **9pt** (horas, `s140.css:128`) y **8.0pt** (etiquetas, `s140.css:115`). El mockup de referencia (`s140-mockup.html:87,138,112`) y el CSS migrado coinciden.

**Grilla (✅ resuelto, era drift #13):** `ux-guidelines.md:42-52` ya documenta la **tabla unificada de 5 columnas**: 45/192/136/171/176px (`src/components/S140WeekView.tsx:235-239`; el mockup usa los porcentajes equivalentes 6.2/26.6/18.9/23.7/24.6%, `s140-mockup.html:237-244`). La columna extra es la celda de etiqueta ("Estudiante/Ayudante:", "Conductor/Lector:").

**Fuentes (✅ resuelto, era drift #14):** `ux-guidelines.md:26` ya exige `Arial, "Helvetica Neue", Helvetica` (`s140.css:19,43`); «Segoe UI» ya no aparece en `docs/user/` ni en `src/`.

**Impresión (✅):** `@page { size: letter; margin: 0.5in }` (`s140.css:14-17`), `print-color-adjust: exact` + `-webkit-print-color-adjust: exact` (`s140.css:25-26`), `page-break-inside: avoid` (`s140.css:181`) y una semana por página al imprimir rangos (`s140.css:190-198`; commit `d35a1a4`). El drift #15 quedó resuelto: `ux-guidelines.md:80-83` ya lo documenta.

**Convención:** el nombre de congregación está hardcodeado como `CONG_NAME = "Cong. CASANAY"` (`S140WeekView.tsx:6`), coherente con el alcance de congregación única (`docs/user/project-context.md:9`).

### 3.2 Parser del mwb

- **Idioma: solo español.** Meses en `SPANISH_MONTHS` (`mwb_parser/mod.rs:7-20`); keywords de secciones en español (`mod.rs:460-468`); clasificación por títulos en español (`mod.rs:802-965`). ✅ (`docs/user/master-plan.md:8`)
- **Convención de filename `mwb_S_YYYYMM.pdf`:** el año y mes base se extraen del path con regex `(\d{4})(\d{2})` (`mod.rs:103-112`); fallback 2026-01. Archivo de prueba en `refs/mwb_S_202609 (1).pdf`. ✅
- **Detección de semanas:** lógica propia `is_week_header_line` + `parse_week_header` (`mod.rs:179-323`), más robusta que la regex única que describe el master-plan (`docs/user/master-plan.md:159`) — drift #19 (documentación, no funcional).
- **Canciones:** regex `(?:\[SONG\]|Canción|Cántico)\s*(\d+)` (`mod.rs:511`); la intermedia es la primera canción en línea siguiente al header "VIDA CRISTIANA" (`mod.rs:531-544`), con manejo del texto fragmentado del PDF.
- **Sección de cada parte:** partes 1–3 → `tesoros`; la numerada que inicia tras "NUESTRA VIDA CRISTIANA" → `vida_cristiana`; el resto → `mejores_maestros` (`mod.rs:715-724`).
- **Introducción/conclusión por defecto:** si el PDF no las trae, se añaden con 1 min y 3 min (`mod.rs:742-768`), coherente con requirements.md:20.

### 3.3 Modelo de datos (SQLite)

**7 tablas** (`src-tauri/src/db.rs:31-105`): `hermanos`, `semanas`, `partes`, `asignaciones`, `familias`, `familia_miembros` y `congregation_settings` (nueva con el feature de configuración de congregación). Coincide con `schemaDB.md:6` y con el resumen de `docs/user/requirements.md:103-110`. El drift #8 («4 tablas» en architecture.md) sigue resuelto: `architecture.md:43` ya lista las 7.

- **PRAGMAs:** `journal_mode=WAL`, `foreign_keys=ON` (`db.rs:18`). ✅
- **CASCADE:** `partes.semana_id → semanas` (`db.rs:62`), `asignaciones.parte_id → partes` (`db.rs:75`), `familia_miembros` en ambos lados (`db.rs:93-94`). ✅
- **Sin ON DELETE (NO ACTION):** las 5 FK de `semanas` hacia `hermanos` (`db.rs:53-57`) y `asignaciones.hermano_id` (`db.rs:80`) — borrar un hermano con asignaciones falla por `PRAGMA foreign_keys=ON`. ✅ (`schemaDB.md:157,189,192`)
- **CHECK:** `hermanos.sexo` y `hermanos.rol` (`db.rs:34-35`), `semanas.tipo_especial` (`db.rs:52`), `partes.seccion` con **4 valores** incluyendo `marco` (`db.rs:65`), `asignaciones.ambito` y `asignaciones.rol` (`db.rs:77-79`). ✅ (`schemaDB.md:202`)
- **UNIQUE:** `idx_asignaciones_unique` sobre `(parte_id, ambito, rol)` (`db.rs:89-90`) — solo una asignación por rol en cada parte y ámbito. ✅ (`schemaDB.md:200`)
- **`tipo_asignacion`** se valida en Rust (enum `TipoAsignacion`), no por CHECK en la DB (`schemaDB.md:141`). ✅
- **`congregation_settings` (singleton):** `id INTEGER PRIMARY KEY CHECK (id = 1)` + `has_auxiliary_room` (0/1, default 1 vía `INSERT OR IGNORE`), sin relaciones ni CASCADE (`db.rs:98-104`; `schemaDB.md:159-167`). Ver §2.7.
- **Ubicación:** `app_data_dir()/escuela.db` (`src-tauri/src/lib.rs:13-20`).

### 3.4 Fuera de alcance (verificado: no implementado)

Rotación automática de hermanos, notificaciones, múltiples congregaciones, autenticación multi-usuario, historial de más de un bimestre en la vista de rotación, integración con JW Library o jw.org (`docs/user/requirements.md:122-125`, `docs/user/project-context.md:45-51`). El código no contiene ninguna de estas funcionalidades. ✅

### 3.5 Rutas de la UI (✅ verificadas)

`src/App.tsx:25-40` implementa exactamente las 16 rutas de `docs/user/requirements.md:118`: `/`, `/hermanos`, `/hermanos/nuevo`, `/hermanos/:id/editar`, `/semanas`, `/semanas/importar`, `/semanas/nuevo`, `/semanas/:id/editar`, `/semanas/:id`, `/familias`, `/familias/:id`, `/semanas/:id/s140`, `/s140/rango`, `/semanas/:id/s89`, `/s89/rango`, `/configuracion`.

---

## 4. Drift documentación vs implementación

### 4.1 Drift #1 — Ayudantes de `haga_revisitas` y `haga_discipulos` (elegibilidad) — ✅ resuelto

- **Doc:** `docs/user/requirements.md:40,42` — ayudante = "mismo sexo que el estudiante", citando el texto oficial §8/§10 ("alguien del mismo sexo" — **no** familiares).
- **Código:** `rules.rs:131-156` (`haga_revisitas`) y `rules.rs:167-191` (`haga_discipulos`) filtran `sexo = ?2` únicamente; el `OR <family_subquery>` ya no está en esas ramas.
- **Estado:** **resuelto (2026-10-16)** con el fix (a) (`6cc29fe`, tests en `rules.rs`): el código coincide con el texto oficial y con `requirements.md:58`. Nota de reversión en `.scratch/fix-ayudantes-haga-revisitas-discipulos/`.

### 4.2 Afirmaciones de docs contradichas por el código

> **Estado (2026-10-16):** los ítems #2–4, #7–15 y #17–21 (la parte documental) están **resueltos** en los documentos de referencia (`requirements.md`, `architecture.md`, `ux-guidelines.md`, `schemaDB.md`), corregidos contra el código en el batch `.scratch/docs-drift-batch/issues/01-correcciones-documentales.md`; `docs/user/master-plan.md` (documento histórico de planificación) conserva desfases puntuales, anotados en cada ítem. #1 (ayudantes): **resuelto** (fix (a), `6cc29fe`). #5 (`conmemoracion`) y #6 (`visita_superintendente`): **resueltos** con el feature de semanas especiales (`.scratch/special-weeks/spec.md`, tickets 01–05) — el tipo se marca manualmente en la vista previa de importación (asamblea y conmemoración **no se guardan**) y la visita ajusta las partes (sin estudio bíblico y sin sala auxiliar) al importar y de forma retroactiva al editar una semana. Antes eran **no-aplica** porque el parser solo detecta esas semanas por keyword (`mwb_parser/mod.rs:471-474,482-484`), que no aparece en los mwb reales (13/13 semanas `normal` en `escuela.db`); los tickets de `fix-conmemoracion-regla-dia-semana` y `fix-visita-superintendente-sala-auxiliar` quedaron anotados con la reversión. Variante muerta `TipoEspecial::SinReunion`: **eliminada** (`c05db16`). Con el feature de **configuración de congregación** (`.scratch/congregation-settings/spec.md`, tickets 01–04) se añadieron la §5.1 de `requirements.md` y la tabla `congregation_settings`: este documento se re-verificó (v1.1) contra ese estado — 7 tablas, 16 rutas, `lib.rs:28-65`.

2. **Presidente — filtro de rol.** `docs/user/master-plan.md:395` (Tarea 4.2) exige `puede_presidir = 1 AND rol IN ('anciano')`; el código solo filtra `puede_presidir = 1` sin restricción de rol (`rules.rs:329-338`). `requirements.md:52` (la referencia actual) sí coincide con el código → el master-plan está desfasado.
3. **Oración.** `docs/user/master-plan.md:397` dice "Todos activos"; el código filtra `sexo = 'masculino' AND rol != 'estudiante_biblia'` (`rules.rs:350-360`), regla introducida en el commit `a753338` ("fix: se resolvio el bug que hacia que mostraba a las hermanas en los selects de oracion y lectura del libro", verificado en `git log`). `requirements.md:54` sí coincide con el código.
4. **`estudio_biblico` lector.** `docs/user/master-plan.md:392` dice "Todos activos"; el código exige varón bautizado publicado (`rules.rs:318-327`). `requirements.md:51` sí coincide.
5. **`conmemoracion`.** `docs/user/requirements.md:66` — "Sin reunión **si cae entre semana**"; el código la marca sin partes incondicionalmente (`mwb_parser/mod.rs:471-473,490-496`), sin verificar el día. → **Resuelto (2026-10-16):** requirements §4 ahora define la decisión como manual, sin validación de día; la semana se marca en la vista previa de importación y, si se marca, **no se guarda**.
6. **`visita_superintendente`.** `docs/user/requirements.md:67` — "no hay clases auxiliares, todas las partes son solo auditorio principal"; el código detecta el tipo (`mod.rs:474,482-484`) pero **no implementa la regla**: `parse_parts` (`mod.rs:583-785`) y `import_parsed_weeks` (`semanas.rs:296-314`) no anulan `requiere_sala_auxiliar` para esa semana. → **Resuelto (2026-10-16):** al marcar la visita en la vista previa o al cambiar el tipo en el formulario, `applyVisitaAdjustments` (`src/lib/importPlanner.ts`) elimina el estudio bíblico y anula `requiere_sala_auxiliar`; `update_parte` limpia las asignaciones de sala (`partes.rs:132-138`).
7. **`get_bimonthly_stats` no existe.** Ya no lo lista ningún doc: `docs/user/architecture.md:143` lo aclara expresamente y `docs/user/requirements.md:114` no lo incluye. No hay ningún match en `src-tauri/` ni `src/`, y `lib.rs:28-65` no lo registra. (Existe `get_brother_history` y la variante bulk `get_eligible_brothers_with_history`, pero no stats agregadas del bimestre.)
8. **"4 tablas SQLite".** Resuelto: `docs/user/architecture.md:43` ya lista **7** tablas; `db.rs:98-104` añade `congregation_settings` a las 6 anteriores (`familias` y `familia_miembros` venían del batch). `requirements.md:103-110` y `schemaDB.md:6` las documentan.
9. **`partes.seccion` con 3 valores.** Resuelto: `docs/user/architecture.md:87` y `docs/user/requirements.md:101` ya nombran los **4** valores incluyendo `marco` (`db.rs:65`), usado por `oracion`/`cancion`/`introduccion`/`conclusion` (`models.rs:33`); `schemaDB.md:140,229` lo documentan.
10. **Comandos Tauri desfasados.** Resuelto: `docs/user/architecture.md:105-142` ya lista los **38** comandos registrados (`lib.rs:28-65`) — incluidos `get_adjacent_weeks`, `get_eligible_brothers_with_history`, el CRUD de familias, `write_file_bytes`, `get_s89_cards_for_week` y los de congregación. `requirements.md:114` es un resumen por grupos.
11. **Extractor del PDF.** `docs/user/architecture.md:11,151-152` ya documentan **`pdftotext`** como primario y `lopdf` como fallback (`mwb_parser/mod.rs:22-27,58-78`); `docs/user/master-plan.md:9` aún describe `lopdf` como estrategia "sin dependencias externas" (el "Plan B: pdftotext CLI" del master-plan, `:654`, es el camino real).
12. **Tipografías S-140.** Resuelto: `ux-guidelines.md:30-36` ya documenta 16.5/10.0/8.0pt (además de 11/10/9pt), igual que `s140.css:90,102,141,122,134,128,115` y `s140-mockup.html:87,138,112`.
13. **Grilla S-140.** Resuelto: `ux-guidelines.md:42-52` ya documenta la tabla unificada de 5 columnas (45/192/136/171/176px; `S140WeekView.tsx:235-239` y porcentajes 6.2/26.6/18.9/23.7/24.6% en `s140-mockup.html:238-244`).
14. **Fuente "Segoe UI".** Resuelto: `ux-guidelines.md:26` ya exige Arial/Helvetica Neue/Helvetica, igual que `s140.css:19,43`; «Segoe UI» ya no aparece en `docs/user/` ni en `src/`.
15. **Separadores entre semanas.** Resuelto: `ux-guidelines.md:80-83` documenta que el `hr` es solo de pantalla y que la impresión de rango fuerza una semana por página (`s140.css:190-198`, commit `d35a1a4`).
16. **Indicador de historial "[Nx]".** `docs/user/requirements.md:77` ya describe el modal real ("N participaciones · última: fecha (rol)", `src/components/BrotherPickerModal.tsx:118-125`) sobre una ventana de 4 meses (`BrotherSelector.tsx:20`); commit `3a2f668`.
17. **Mensaje de semana sin reunión.** `docs/user/master-plan.md:530` espera "Semana de Asamblea — No hay reunión"; `S140WeekView.tsx:51-59` muestra el mensaje genérico `Esta semana es de tipo "X". No hay programa S-140 disponible.`
18. **"Partes de estudiante: cualquier publicador".** `docs/user/project-context.md:27` — el código admite **todos los activos** (incluidos ancianos/siervos, p. ej. `rules.rs:57-66`); `requirements.md:37,82` lo documenta correctamente ("todos los activos", "los ancianos pueden recibir asignaciones de estudiante").
19. **Regex de detección de semanas.** `docs/user/master-plan.md:159` cita `r"(\d{1,2})\s*(?:al|–|-|de)\s*(\d{1,2})\s*de\s*(\w+)"`; la implementación real es `is_week_header_line` + `parse_week_header` con parsing tokenizado (`mod.rs:179-323`).
20. **Flujo del parser (diagrama).** Resuelto: `docs/user/architecture.md:160,166` ya describe `split_into_week_blocks()` y `parse_week_block()`; las funciones reales viven en `mod.rs:401-428` y `mod.rs:430-508`.

### 4.3 Lo que SÍ coincide (verificado contra código)

Stack y versiones (§1) · matriz de elegibilidad 21/21 filas (§2.2) · `semana_roles` (§2.3) · semanas especiales (§2.4) · catálogo de 17 tipos y sus flags (§2.5, `schemaDB.md:205-227`) · soft delete, UPSERT, transacciones de importación, S-89, familias y ajuste de congregación (§2.6–§2.7) · colores S-140, tipografías, grilla, impresión (§3.1) · parser en español y convención `mwb_S_YYYYMM.pdf` (§3.2) · modelo de 7 tablas, FKs, CASCADE, CHECK, UNIQUE (§3.3) · rutas de UI (§3.5) · comandos de `requirements.md:114` (sin `get_bimonthly_stats`, que no existe en el código — drift #7).

---

## 5. Fuentes

**Primarias (código):**
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `vite.config.ts`, `index.html`
- `src-tauri/src/lib.rs`, `db.rs`, `models.rs`, `main.rs`
- `src-tauri/src/eligibility/rules.rs`, `eligibility/mod.rs`
- `src-tauri/src/mwb_parser/mod.rs`, `mwb_parser/types.rs`
- `src-tauri/src/congregation/{mod,settings}.rs`
- `src-tauri/src/commands/{hermanos,semanas,partes,asignaciones,eligibility,familias,historial,mwb,export,s89,congregation}.rs`
- `src/types.ts`, `src/App.tsx`, `src/lib/importPlanner.ts`, `src/hooks/useCongregationSettings.tsx`, `src/utils/{auxiliaryRoom,s140Export}.ts`
- `src/components/{BrotherSelector,BrotherPickerModal,S140WeekView,AuxiliaryRoomCheckbox,AuxiliaryRoomLockNotice}.tsx`
- `src/pages/{AsignacionesPage,ConfiguracionPage,ImportarMwbPage,SemanaFormPage,S140Page}.tsx`
- `src/styles/s140.css`, `schemaDB.md`, `s140-mockup.html`
- `git log` (commits `a753338`, `d35a1a4`, `3a2f668`, `6cc29fe`)

**Documentación analizada:**
- `docs/user/README.md`, `project-context.md`, `requirements.md` (v1.8), `ux-guidelines.md`, `architecture.md`, `master-plan.md`
- `.scratch/special-weeks/spec.md`, `.scratch/congregation-settings/spec.md`, `docs/adr/0003-modelo-datos.md`
- `AGENTS.md`, `PRD_Asignaciones_VyM.md` (contexto)
