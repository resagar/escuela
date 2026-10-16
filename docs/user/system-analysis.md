# Análisis del Sistema — Escuela (Asignaciones VyM)

**Versión:** 1.0
**Metodología:** cada afirmación se verificó contra fuentes primarias (código fuente, `package.json`, `Cargo.toml`, `schemaDB.md`, `git log`), no solo contra los documentos de `docs/user/`. Las rutas son relativas a la raíz del repositorio. Los identificadores de código, rutas de archivo y cadenas de etiquetas se mantienen en English.

---

## 1. Stack verificado

| Capa | Docs afirman | Verificado en código | Estado |
|---|---|---|---|
| Plataforma | Tauri 2 (local-first desktop) | `tauri = "2"` (`src-tauri/Cargo.toml:21`), `@tauri-apps/api: ^2` (`package.json:14`), plugins `tauri-plugin-opener` + `tauri-plugin-dialog` (`src-tauri/src/lib.rs:24-25`) | ✅ coincide |
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + React Router v7 | `react: ^19.1.0`, `tailwindcss: ^4.3.0` + `@tailwindcss/vite: ^4.3.0`, `react-router-dom: ^7.16.0` (`package.json:13,20,21`), `typescript: ~5.8.3` (`package.json:28`) | ✅ coincide |
| Bundler | (no mencionado en docs/user) | `vite: ^7.0.4` (`package.json:29`), `@vitejs/plugin-react: ^4.6.0` (`package.json:27`) | ℹ️ omitido en docs/user; sí en `AGENTS.md:15` |
| Backend | Rust + SQLite (`rusqlite`) | `rusqlite = { version = "0.31", features = ["bundled"] }` (`src-tauri/Cargo.toml:25`); WAL + FKs: `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;` (`src-tauri/src/db.rs:18`) | ✅ coincide |
| Parser de PDF | Módulo `mwb_parser` con crate `lopdf` | `lopdf = "0.34"` (`src-tauri/Cargo.toml:27`) — **pero** el extractor primario es el binario externo `pdftotext`; `lopdf` es fallback (`src-tauri/src/mwb_parser/mod.rs:22-27,58-78`) | ⚠️ drift (ver §4.2 #11) |
| Otros crates | — | `regex = "1"`, `tokio = { version = "1", features = ["sync"] }`, `serde = "1"`, `serde_json = "1"` (`src-tauri/Cargo.toml:23,24,28,29`) | ℹ️ |
| Exportación JPEG | export S-140/S-89 a PDF/JPEG (`docs/user/requirements.md:70,91`) | `html2canvas: ^1.4.1` (`package.json:17`) + `@tauri-apps/plugin-dialog` save + comando `write_file_bytes` (`src/utils/s140Export.ts:17,33-40`) | ✅ coincide |
| Ventana | 1200×800, mín 900×600 (master-plan Tarea 1.6) | `width: 1200, height: 800, minWidth: 900, minHeight: 600`, título "Escuela — Asignaciones VyM" (`src-tauri/tauri.conf.json:14-20`) | ✅ coincide |
| Gestor de paquetes | pnpm | `pnpm-workspace.yaml`, scripts `pnpm` (`package.json:6-11`) | ✅ coincide |

**Resumen:** el stack documentado es correcto. La única desviación material es el parser: el código depende del binario externo `pdftotext` como camino principal, contradiciendo la afirmación de "lopdf (Rust nativo, sin dependencias externas)" (`docs/user/master-plan.md:7`).

---

## 2. Reglas de negocio

### 2.1 Filtro base (toda la matriz)

`WHERE activo = 1 ... ORDER BY nombre` en las 21 ramas de `get_eligible_brothers` (p. ej. `src-tauri/src/eligibility/rules.rs:30-31`). Coincide con `docs/user/requirements.md:25`.

### 2.2 Matriz de elegibilidad — verificada fila por fila

Fuente de verdad en código: `src-tauri/src/eligibility/rules.rs:8-427`. Doc: `docs/user/requirements.md:27-49`.

| `tipo_asignacion` | rol | Regla implementada (código) | requirements.md §3 | Estado |
|---|---|---|---|---|
| `discurso_no_estudiante` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:26-34`) | anciano, siervo_ministerial (req:29) | ✅ |
| `busquemos_perlas` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:36-44`) | idem (req:30) | ✅ |
| `lectura_biblia` | estudiante | `sexo = 'masculino'` (`rules.rs:46-54`) | sexo = masculino (req:31) | ✅ |
| `empiece_conversaciones` | estudiante | todos los activos (`rules.rs:57-65`) | todos los activos (req:32) | ✅ |
| `empiece_conversaciones` | ayudante | `sexo = ?2 OR <family_subquery>` (`rules.rs:67-119`, subconsulta en `rules.rs:16-21,76-78`) | mismo sexo **o familiar** (req:33) | ✅ |
| `haga_revisitas` | estudiante | todos los activos (`rules.rs:121-129`) | todos los activos (req:34) | ✅ |
| `haga_revisitas` | ayudante | `sexo = ?2 OR <family_subquery>` (`rules.rs:131-183`, family en `rules.rs:140-142`) | **solo mismo sexo** (req:35) | ❌ drift #1 |
| `haga_discipulos` | estudiante | todos los activos (`rules.rs:185-193`) | todos los activos (req:36) | ✅ |
| `haga_discipulos` | ayudante | `sexo = ?2 OR <family_subquery>` (`rules.rs:195-247`, family en `rules.rs:204-206`) | **solo mismo sexo** (req:37) | ❌ drift #1 |
| `explique_creencias_discurso` | estudiante | `sexo = 'masculino'` (`rules.rs:249-257`) | sexo = masculino (req:38) | ✅ |
| `explique_creencias_escenificacion` | estudiante | todos los activos (`rules.rs:259-267`) | todos los activos (req:39) | ✅ |
| `explique_creencias_escenificacion` | ayudante | `sexo = ?2 OR <family_subquery>` (`rules.rs:269-321`, family en `rules.rs:278-280`) | mismo sexo **o familiar** (req:40) | ✅ |
| `discurso_estudiante` | estudiante | `sexo = 'masculino'` (`rules.rs:333-341`) | sexo = masculino (req:41) | ✅ |
| `que_dirias` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:323-331`) | anciano, siervo_ministerial (req:42) | ✅ |
| `analisis_auditorio` | estudiante | `rol IN ('anciano','siervo_ministerial')` (`rules.rs:344-352`) | idem (req:43) | ✅ |
| `necesidades_congregacion` | estudiante | `rol = 'anciano'` (`rules.rs:354-362`) | **solo anciano** (req:44) | ✅ |
| `estudio_biblico` | conductor | `puede_conducir_estudio = 1` (`rules.rs:364-372`) | `puede_conducir_estudio = 1` (req:45) | ✅ |
| `estudio_biblico` | lector | `sexo = 'masculino' AND rol != 'estudiante_biblia'` (`rules.rs:375-383`) | idem (req:46) | ✅ |
| (rol especial) `presidente` | — | `puede_presidir = 1` (`rules.rs:386-394`) | `puede_presidir = 1` (req:47) | ✅ |
| (rol especial) `consejero_sala` | — | `puede_ser_consejero_sala = 1` (`rules.rs:396-404`) | `puede_ser_consejero_sala = 1` (req:48) | ✅ |
| (rol especial) `oracion` | — | `sexo = 'masculino' AND rol != 'estudiante_biblia'` (`rules.rs:407-415`) | idem (req:49, commit a753338) | ✅ |

**Resultado: 19 de 21 reglas coinciden exactamente.** La única divergencia es el drift #1 (abajo).

> **Detalle implementado no documentado en requirements.md §3:** cuando faltan `estudiante_id` o `sexo_estudiante`, los ayudantes degeneran a "solo sexo" o "todos los activos" (`rules.rs:85-118` y bloques análogos). La UI siempre envía ambos (`src/pages/AsignacionesPage.tsx:214-215,236-237,293-294`).

### 2.3 `semana_roles` (marco general, tabla `semanas`)

- Presidente, consejero de sala auxiliar y 3 oradores (apertura/intermedia/cierre) se guardan en la tabla `semanas`: `presidente_id`, `consejero_sala_id`, `orador_oracion_apertura_id`, `orador_oracion_intermedia_id`, `orador_oracion_cierre_id` (`src-tauri/src/db.rs:53-57`), actualizados por `update_semana_roles` (`src-tauri/src/commands/asignaciones.rs:78-118`).
- Palabras de introducción (1 min) y conclusión (3 min) van a cargo del presidente y **no** se asignan por separado (`docs/user/requirements.md:15`); el parser las crea como partes tipo `introduccion`/`conclusion` de sección `marco` (`src-tauri/src/mwb_parser/mod.rs:588-639,742-768`).

### 2.4 Semanas especiales (`tipo_especial`, CHECK en `db.rs:52`)

| Tipo | Doc (requirements.md §4) | Código | Estado |
|---|---|---|---|
| `normal` | programa completo (req:59) | `TipoEspecial::Normal` (`mwb_parser/mod.rs:485`) | ✅ |
| `asamblea` | sin reunión, se importa sin partes (req:60) | detectada por keyword "ASAMBLEA" y sin estructura regular (`mod.rs:470,476-481`); `partes = Vec::new()` (`mod.rs:490-496`); S-140 muestra mensaje (`src/components/S140WeekView.tsx:47-55`) | ✅ |
| `conmemoracion` | sin reunión **si cae entre semana** (req:61) | marcada sin partes **incondicionalmente** (`mod.rs:471-473,490-496`); no hay chequeo del día de la semana | ⚠️ drift #5 |
| `visita_superintendente` | estudio bíblico reemplazado por discurso de servicio 30 min; **no hay clases auxiliares** (req:62) | detectada por keyword "VISITA DEL SUPERINTENDENTE" (`mod.rs:474,482-484`) pero **no** transforma las partes: `parse_parts` corre igual y `requiere_sala_auxiliar` nunca se anula | ❌ drift #6 |

### 2.5 Catálogo de tipos de asignación

Enum `TipoAsignacion` con 17 variantes, serializado en snake_case (`src-tauri/src/models.rs:4-23`). Métodos derivados: `seccion()` (`models.rs:26-35`), `requiere_sala_auxiliar()` (`models.rs:37-48`), `requiere_ayudante()` (`models.rs:50-58`), `solo_varones()` (`models.rs:60-65`), `solo_no_estudiante()` (`models.rs:67-77`). La tabla de `schemaDB.md:194-212` fue verificada contra estos métodos: **coincide en los 17 valores**. El catálogo de `docs/user/requirements.md:77` también coincide.

### 2.6 Otras reglas de negocio verificadas

- **Soft delete obligatorio:** `set_hermano_activo` compartido hace `UPDATE hermanos SET activo=?1 WHERE id=?2` (`src-tauri/src/commands/hermanos.rs:136-144`), expuesto por los comandos delgados `deactivate_hermano`/`reactivate_hermano` (`hermanos.rs:146-158`); `list_hermanos` por defecto devuelve solo activos (`hermanos.rs:17-54`). No existe `DELETE` de hermanos. ✅ (requirements.md:66)
- **Ayudante re-filtrado por sexo del estudiante:** la UI pasa `sexoEstudiante` + `estudianteId` a los selectores de ayudante (`AsignacionesPage.tsx:214-215,236-237,293-294`); `BrotherSelector` re-consulta al cambiar (`src/components/BrotherSelector.tsx:57-59`). ✅ (requirements.md:426-428 del master-plan)
- **UPSERT de asignaciones:** `INSERT OR REPLACE INTO asignaciones` (`src-tauri/src/commands/asignaciones.rs:15`), respaldado por `UNIQUE(parte_id, ambito, rol)` (`db.rs:89-90`). ✅
- **Regla de integridad NO documentada:** `update_parte` con `requiere_sala_auxiliar = false` borra las asignaciones de `sala_auxiliar` existentes (`src-tauri/src/commands/partes.rs:132-138`).
- **Historial de participación:** `get_brother_history` (`src-tauri/src/commands/historial.rs:121-131`) con ventana configurable (default 4 meses, `historial.rs:128`); la consulta cubre partes **y** roles de marco (presidente/consejero/oraciones) vía `UNION ALL` (`historial.rs:10-85`). Variante bulk: `get_eligible_brothers_with_history` (`src-tauri/src/commands/eligibility.rs:31-62`).
- **Importación transaccional:** `import_parsed_weeks` con `BEGIN`/`COMMIT`/`ROLLBACK` (`src-tauri/src/commands/semanas.rs:266-344`). ✅
- **S-89 implementado:** `get_s89_cards_for_week` filtra los 7 tipos de estudiante (`src-tauri/src/commands/s89.rs:37-45`); páginas `S89Page`/`S89RangoPage` (`src/App.tsx:35-36`). ✅ (requirements.md:70)
- **Familias:** CRUD + `add_familia_member` con `INSERT OR IGNORE` (`src-tauri/src/commands/familias.rs:109-121`); la subconsulta de familiares alimenta las reglas de ayudantes (`rules.rs:16-21`). ✅ (requirements.md:51,87)
- **Antelación ≥3 semanas, rotación del estudio, capacidades de estudiantes:** procesos humanos, no hay validación de app — coherente con requirements.md:67,69,72 (no hay código que las aplique; el historial solo informa, nunca bloquea). ✅

---

## 3. Restricciones y convenciones

### 3.1 Fidelidad visual del S-140

**Colores (✅ exactos):** `--color-slate: #575a5d`, `--color-gold: #be8900`, `--color-maroon: #7e0024`, `--color-text: #000000`, `--color-border: #dfdfdf`, `--color-white: #ffffff` (`src/styles/s140.css:2-10`) — idénticos a `docs/user/ux-guidelines.md:13-20`.

**Tipografías (⚠️ drift #12):** `ux-guidelines.md:30-36` exige 14.5pt (título principal), 10.5pt (cabeceras de sección) y 8.5pt (etiquetas). La implementación usa **16.5pt** (`s140.css:90`), **10.0pt** (`s140.css:141`) y **8.0pt** (`s140.css:115`). El mockup de referencia (`s140-mockup.html:87,138,112`) y el CSS migrado coinciden entre sí → **`ux-guidelines.md` es el documento desfasado**, no el código. Los tamaños 11pt (fecha, `s140.css:102`), 10pt (títulos/nombres, `s140.css:122,134`) y 9pt (horas, `s140.css:128`) sí coinciden.

**Grilla (⚠️ drift #13):** `ux-guidelines.md:44-49` describe 4 columnas (45/355/175/175px). La implementación real usa **5 columnas**: 45/192/136/171/176px (`src/components/S140WeekView.tsx:230-236`); el mockup usa los porcentajes equivalentes 6.2/26.6/18.9/23.7/24.6% y comenta "based on the official 5-column docx coordinates" (`s140-mockup.html:237-244`). La columna extra es la celda de etiqueta ("Estudiante/Ayudante:", "Conductor/Lector:").

**Fuentes (⚠️ drift #14):** `ux-guidelines.md:26` recomienda "Segoe UI, Arial, o Helvetica"; el código usa `Arial, "Helvetica Neue", Helvetica, sans-serif` (`s140.css:19,43`) — "Segoe UI" no aparece en el repo (grep sin resultados en `src-tauri`).

**Impresión (✅ con una excepción):** `@page { size: letter; margin: 0.5in }` (`s140.css:14-17`), `print-color-adjust: exact` + `-webkit-print-color-adjust: exact` (`s140.css:25-26`), `page-break-inside: avoid` (`s140.css:181`). Excepción (drift #15): el doc describe separadores `hr` entre semanas (`ux-guidelines.md:64`), pero la vista de rango imprime **una semana por página** (`s140.css:190-198`; commit `d35a1a4` "force one page per week when printing a range").

**Convención:** el nombre de congregación está hardcodeado como `CONG_NAME = "Cong. CASANAY"` (`S140WeekView.tsx:4`), coherente con el alcance de congregación única (`docs/user/project-context.md:9`).

### 3.2 Parser del mwb

- **Idioma: solo español.** Meses en `SPANISH_MONTHS` (`mwb_parser/mod.rs:7-20`); keywords de secciones en español (`mod.rs:460-468`); clasificación por títulos en español (`mod.rs:802-965`). ✅ (`docs/user/master-plan.md:6`)
- **Convención de filename `mwb_S_YYYYMM.pdf`:** el año y mes base se extraen del path con regex `(\d{4})(\d{2})` (`mod.rs:103-112`); fallback 2026-01. Archivo de prueba en `refs/mwb_S_202609 (1).pdf`. ✅
- **Detección de semanas:** lógica propia `is_week_header_line` + `parse_week_header` (`mod.rs:179-323`), más robusta que la regex única que describe el master-plan (`docs/user/master-plan.md:157`) — drift #19 (documentación, no funcional).
- **Canciones:** regex `(?:\[SONG\]|Canción|Cántico)\s*(\d+)` (`mod.rs:511`); la intermedia es la primera canción en línea siguiente al header "VIDA CRISTIANA" (`mod.rs:531-544`), con manejo del texto fragmentado del PDF.
- **Sección de cada parte:** partes 1–3 → `tesoros`; la numerada que inicia tras "NUESTRA VIDA CRISTIANA" → `vida_cristiana`; el resto → `mejores_maestros` (`mod.rs:715-724`).
- **Introducción/conclusión por defecto:** si el PDF no las trae, se añaden con 1 min y 3 min (`mod.rs:742-768`), coherente con requirements.md:15.

### 3.3 Modelo de datos (SQLite)

**6 tablas** (`src-tauri/src/db.rs:31-96`), no 4 como afirma `docs/user/architecture.md:41` (drift #8): `hermanos`, `semanas`, `partes`, `asignaciones`, `familias`, `familia_miembros`. Coincide con `schemaDB.md:6` y con el resumen de `docs/user/requirements.md:83-87`.

- **PRAGMAs:** `journal_mode=WAL`, `foreign_keys=ON` (`db.rs:18`). ✅
- **CASCADE:** `partes.semana_id → semanas` (`db.rs:62`), `asignaciones.parte_id → partes` (`db.rs:75`), `familia_miembros` en ambos lados (`db.rs:93-94`). ✅
- **Sin ON DELETE (NO ACTION):** las 5 FK de `semanas` hacia `hermanos` (`db.rs:53-57`) y `asignaciones.hermano_id` (`db.rs:80`) — borrar un hermano con asignaciones falla por `PRAGMA foreign_keys=ON`. ✅ (`schemaDB.md:153,176-179`)
- **CHECK:** `hermanos.sexo` y `hermanos.rol` (`db.rs:34-35`), `semanas.tipo_especial` (`db.rs:52`), `partes.seccion` con **4 valores** incluyendo `marco` (`db.rs:65`), `asignaciones.ambito` y `asignaciones.rol` (`db.rs:77-79`). ✅ (`schemaDB.md:187`)
- **UNIQUE:** `idx_asignaciones_unique` sobre `(parte_id, ambito, rol)` (`db.rs:89-90`) — solo una asignación por rol en cada parte y ámbito. ✅ (`schemaDB.md:185`)
- **`tipo_asignacion`** se valida en Rust (enum `TipoAsignacion`), no por CHECK en la DB (`schemaDB.md:137,192`). ✅
- **Ubicación:** `app_data_dir()/escuela.db` (`src-tauri/src/lib.rs:12-19`).

### 3.4 Fuera de alcance (verificado: no implementado)

Rotación automática de hermanos, notificaciones, múltiples congregaciones, autenticación multi-usuario, historial de más de un bimestre en la vista de rotación, integración con JW Library o jw.org (`docs/user/requirements.md:99-101`, `docs/user/project-context.md:45-51`). El código no contiene ninguna de estas funcionalidades. ✅

### 3.5 Rutas de la UI (✅ verificadas)

`src/App.tsx:22-36` implementa exactamente las 15 rutas de `docs/user/requirements.md:95`: `/`, `/hermanos`, `/hermanos/nuevo`, `/hermanos/:id/editar`, `/semanas`, `/semanas/importar`, `/semanas/nuevo`, `/semanas/:id/editar`, `/semanas/:id`, `/familias`, `/familias/:id`, `/semanas/:id/s140`, `/s140/rango`, `/semanas/:id/s89`, `/s89/rango`.

---

## 4. Drift documentación vs implementación

### 4.1 Drift #1 — Ayudantes de `haga_revisitas` y `haga_discipulos` (elegibilidad)

- **Doc:** `docs/user/requirements.md:35,37` — ayudante = "mismo sexo que el estudiante", citando el texto oficial §8/§10 ("alguien del mismo sexo" — **no** familiares).
- **Código:** `src-tauri/src/eligibility/rules.rs:140-142` (`haga_revisitas`) y `rules.rs:204-206` (`haga_discipulos`) aplican `sexo = ?2 OR <family_subquery>` → **los familiares también son elegibles**.
- **Estado:** el propio doc ya lo registra como "Drift pendiente (código)… Corrección de código pendiente de autorización" (`requirements.md:53`). El código es más permisivo que la regla oficial. **Acción pendiente: decidir si se alinea el código al texto oficial (quitar el `OR family` en esas dos ramas) o se actualiza el doc.**

### 4.2 Afirmaciones de docs contradichas por el código

> **Estado (2026-10-14):** los ítems #2–4, #7–15 y #17–21 (la parte documental) están **resueltos** — los docs de `docs/user/` se corrigieron contra el código en el batch `.scratch/docs-drift-batch/issues/01-correcciones-documentales.md`. #5 (`conmemoracion`) y #6 (`visita_superintendente`): **no-aplica**. El parser detecta esas semanas solo por keyword (`mwb_parser/mod.rs:471-474,482-484`), que no aparece en los mwb reales (13/13 semanas `normal` en `escuela.db`); la vía manual (`SemanaForm.tsx`) fue descartada. Variante muerta `TipoEspecial::SinReunion`: **eliminada** (`c05db16`). #1 (ayudantes): **resuelto** (fix (a), `6cc29fe`).

2. **Presidente — filtro de rol.** `docs/user/master-plan.md:393` (Tarea 4.2) exige `puede_presidir = 1 AND rol IN ('anciano')`; el código solo filtra `puede_presidir = 1` sin restricción de rol (`rules.rs:386-394`). `requirements.md:47` (la referencia actual) sí coincide con el código → el master-plan está desfasado.
3. **Oración.** `docs/user/master-plan.md:395` dice "Todos activos"; el código filtra `sexo = 'masculino' AND rol != 'estudiante_biblia'` (`rules.rs:407-415`), regla introducida en el commit `a753338` ("fix: se resolvio el bug que hacia que mostraba a las hermanas en los selects de oracion y lectura del libro", verificado en `git log`). `requirements.md:49` sí coincide con el código.
4. **`estudio_biblico` lector.** `docs/user/master-plan.md:390` dice "Todos activos"; el código exige varón bautizado publicado (`rules.rs:375-383`). `requirements.md:46` sí coincide.
5. **`conmemoracion`.** `docs/user/requirements.md:61` — "Sin reunión **si cae entre semana**"; el código la marca sin partes incondicionalmente (`mwb_parser/mod.rs:471-473,490-496`), sin verificar el día.
6. **`visita_superintendente`.** `docs/user/requirements.md:62` — "no hay clases auxiliares, todas las partes son solo auditorio principal"; el código detecta el tipo (`mod.rs:474,482-484`) pero **no implementa la regla**: `parse_parts` (`mod.rs:583-785`) y `import_parsed_weeks` (`semanas.rs:296-314`) no anulan `requiere_sala_auxiliar` para esa semana.
7. **`get_bimonthly_stats` no existe.** Listado en `docs/user/requirements.md:91` y `docs/user/architecture.md:128`; no hay ningún match en `src-tauri/` ni `src/`, y `lib.rs:26-62` no lo registra. (Existe `get_brother_history` y la variante bulk `get_eligible_brothers_with_history`, pero no stats agregadas del bimestre.)
8. **"4 tablas SQLite".** `docs/user/architecture.md:41` — son **6** (`db.rs:83-96` añade `familias` y `familia_miembros`). `requirements.md:83-87` y `schemaDB.md` sí las documentan.
9. **`partes.seccion` con 3 valores.** `docs/user/architecture.md:85` y `docs/user/requirements.md:79` nombran solo `tesoros`/`mejores_maestros`/`vida_cristiana`; el CHECK real tiene **4** valores incluyendo `marco` (`db.rs:65`), usado por `oracion`/`cancion`/`introduccion`/`conclusion` (`models.rs:33`). `schemaDB.md:214` sí lo documenta.
10. **Comandos Tauri desfasados.** `docs/user/architecture.md:105-128` lista como "Implementados" solo el CRUD de hermanos y como "Planeados" todo lo demás — **todo está implementado hoy** (`lib.rs:26-62`). Además, 12 comandos existentes no aparecen en architecture.md: `get_adjacent_weeks` (`lib.rs:38`), `get_eligible_brothers_with_history` (`lib.rs:54`), `create_familia`, `list_familias`, `get_familia`, `delete_familia`, `add_familia_member`, `remove_familia_member`, `list_familias_with_count` (`lib.rs:46-52`), `write_file_bytes` (`lib.rs:60`), `get_s89_cards_for_week` (`lib.rs:61`). `requirements.md:91` tampoco menciona estos últimos.
11. **Extractor del PDF.** `docs/user/architecture.md:11,136` y `docs/user/master-plan.md:7` afirman `lopdf` como estrategia ("Rust nativo, sin dependencias externas"); el código ejecuta primero el binario externo **`pdftotext`** y usa `lopdf` de fallback (`mwb_parser/mod.rs:22-27,58-78`). El "Plan B: pdftotext CLI" del master-plan (`:652`) se convirtió en el camino principal.
12. **Tipografías S-140.** Ver §3.1: `ux-guidelines.md:30-36` (14.5/10.5/8.5pt) vs `s140.css:90,141,115` y `s140-mockup.html:87,138,112` (16.5/10.0/8.0pt). El mockup —declarado "implementación de referencia" en `ux-guidelines.md:5`— y el CSS coinciden; la guía es la desfasada.
13. **Grilla S-140.** `ux-guidelines.md:44-49` (4 columnas: 45/355/175/175px) vs 5 columnas reales 45/192/136/171/176px (`S140WeekView.tsx:230-236`) o 6.2/26.6/18.9/23.7/24.6% (`s140-mockup.html:238-244`, comentario "official 5-column docx coordinates").
14. **Fuente "Segoe UI".** `ux-guidelines.md:26` la lista primero; no existe en el código (`s140.css:19,43` usan Arial/Helvetica Neue/Helvetica).
15. **Separadores entre semanas.** `ux-guidelines.md:64` describe `hr` punteado; la vista de rango imprime una semana por página (`s140.css:190-198`, commit `d35a1a4`).
16. **Indicador de historial "[Nx]".** `docs/user/requirements.md:68` describe un conteo `[Nx]` del bimestre en los selectores; la UI real es un modal con "N participaciones · última: fecha (rol)" (`src/components/BrotherPickerModal.tsx:118-125`) sobre una ventana de 4 meses (`BrotherSelector.tsx:20`), no el formato ni el período del doc. (Introducido en el commit `3a2f668`.)
17. **Mensaje de semana sin reunión.** `docs/user/master-plan.md:528` espera "Semana de Asamblea — No hay reunion"; `S140WeekView.tsx:47-55` muestra el mensaje genérico `Esta semana es de tipo "X". No hay programa S-140 disponible.`
18. **"Partes de estudiante: cualquier publicador".** `docs/user/project-context.md:27` — el código admite **todos los activos** (incluidos ancianos/siervos, p. ej. `rules.rs:57-65`); `requirements.md:32,73` lo documenta correctamente ("todos los activos", "los ancianos pueden recibir asignaciones de estudiante").
19. **Regex de detección de semanas.** `docs/user/master-plan.md:157` cita `r"(\d{1,2})\s*(?:al|–|-|de)\s*(\d{1,2})\s*de\s*(\w+)"`; la implementación real es `is_week_header_line` + `parse_week_header` con parsing tokenizado (`mod.rs:179-323`).
20. **Flujo del parser (diagrama).** `docs/user/architecture.md:142` describe `split_into_weeks()` con la regex de arriba; las funciones reales son `split_into_week_blocks` (`mod.rs:401-428`) y `parse_week_block` (`mod.rs:430-508`).

### 4.3 Lo que SÍ coincide (verificado contra código)

Stack y versiones (§1) · matriz de elegibilidad 19/21 filas (§2.2) · `semana_roles` (§2.3) · catálogo de 17 tipos y sus flags (§2.5, `schemaDB.md:194-212`) · soft delete, UPSERT, transacciones de importación, S-89, familias (§2.6) · colores S-140, márgenes de impresión, `print-color-adjust` (§3.1) · parser en español y convención `mwb_S_YYYYMM.pdf` (§3.2) · modelo de 6 tablas, FKs, CASCADE, CHECK, UNIQUE (§3.3) · rutas de UI (§3.5) · comandos de `requirements.md:91` excepto `get_bimonthly_stats` (drift #7).

---

## 5. Fuentes

**Primarias (código):**
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `vite.config.ts`, `index.html`
- `src-tauri/src/lib.rs`, `db.rs`, `models.rs`, `main.rs`
- `src-tauri/src/eligibility/rules.rs`, `eligibility/mod.rs`
- `src-tauri/src/mwb_parser/mod.rs`, `mwb_parser/types.rs`
- `src-tauri/src/commands/{hermanos,semanas,partes,asignaciones,eligibility,familias,historial,mwb,export,s89}.rs`
- `src/types.ts`, `src/App.tsx`, `src/components/{BrotherSelector,BrotherPickerModal,S140WeekView}.tsx`, `src/pages/AsignacionesPage.tsx`, `src/pages/S140Page.tsx`, `src/styles/s140.css`, `src/utils/s140Export.ts`
- `schemaDB.md`, `s140-mockup.html`
- `git log` (commits `a753338`, `d35a1a4`, `3a2f668`)

**Documentación analizada:**
- `docs/user/README.md`, `project-context.md`, `requirements.md` (v1.3), `ux-guidelines.md`, `architecture.md`, `master-plan.md`
- `AGENTS.md`, `PRD_Asignaciones_VyM.md` (contexto)
