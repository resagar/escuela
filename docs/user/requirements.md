# Requerimientos y Reglas — Escuela (Asignaciones VyM)

**Versión:** 1.6 (2026-10)
**Cambios v1.6 (2026-10):** documentado el candado en los editores (§5.1): la casilla «Sala aux.» de la vista previa de importación del MWB y del formulario de semana queda deshabilitada con aviso y enlace a Configuración, y los formularios envían siempre la marca guardada o inferida (nunca forzada a `0`, para no borrar asignaciones ocultas).
**Cambios v1.5 (2026-10):** nueva §5.1: configuración de congregación (ajuste de sala auxiliar) como candado duro y no destructivo; tabla `congregation_settings`, comandos y ruta `/configuracion`.
**Cambios v1.4 (2026-10):** documentadas en §5 dos reglas implícitas del código: integridad de sala auxiliar al editar una parte, y degeneración de ayudantes cuando faltan datos del estudiante.
**Fuentes:** PRD_Asignaciones_VyM.md v1.2, instrucciones oficiales de la Reunión Vida y Ministerio Cristianos (S-38), código implementado.
**Propósito de este documento:** referencia única y consultable de las reglas del dominio. Antes de crear o modificar una feature de asignaciones, leer este archivo. El PRD sigue siendo la fuente de verdad del alcance; este archivo destila las **reglas** que la app debe aplicar.

---

## 1. Propósito y usuario

App de escritorio local-first (Tauri 2 + React 19 + Rust + SQLite) para el **Superintendente de la Reunión Vida y Ministerio** de la congregación Casanay. Importa el programa semanal desde la guía de actividades (mwb PDF), gestiona el roster, asigna hermanos con validación automática de elegibilidad, y genera el S-140 (y el S-89) listos para imprimir. Usuario único, sin servidor, offline por diseño.

## 2. Estructura de la reunión (dominio fijo)

**Marco general (toda semana):** presidente de la reunión, consejero de sala auxiliar, canción + oración de apertura, canción + oración de cierre (y oración intermedia en el modelo de datos), palabras de introducción (1 min) y de conclusión (3 min) — a cargo del presidente, no se asignan por separado.

| Sección | Partes | Duración |
|---|---|---|
| Tesoros de la Biblia | Discurso (10 min, no-estudiante), Busquemos perlas escondidas (10 min, no-estudiante), Lectura de la Biblia (4 min, estudiante varón) | ~24 min |
| Seamos Mejores Maestros | Variable según la guía (15 min): empiece conversaciones, haga revisitas, haga discípulos, explique sus creencias, discurso, ¿qué dirías?, análisis con el auditorio | 15 min |
| Nuestra Vida Cristiana | Canción, 1–2 asignaciones no-estudiante (5–15 min), Estudio bíblico de la congregación (30 min, conductor + lector) | resto hasta 1h45 total |

## 3. Matriz de elegibilidad (regla principal)

Filtro base **siempre**: `activo = 1`, ordenado por nombre. Fuente de verdad en código: `src-tauri/src/eligibility/rules.rs`.

| tipo_asignacion | rol | Elegibles | Notas |
|---|---|---|---|
| `discurso_no_estudiante` | estudiante | anciano, siervo_ministerial | Tesoros / Vida Cristiana |
| `busquemos_perlas` | estudiante | anciano, siervo_ministerial | |
| `lectura_biblia` | estudiante | sexo = masculino | |
| `empiece_conversaciones` | estudiante | todos los activos | |
| `empiece_conversaciones` | ayudante | mismo sexo que el estudiante **o familiar** | |
| `haga_revisitas` | estudiante | todos los activos | |
| `haga_revisitas` | ayudante | mismo sexo que el estudiante | Oficial §8: "alguien del mismo sexo" — **no** familiares |
| `haga_discipulos` | estudiante | todos los activos | |
| `haga_discipulos` | ayudante | mismo sexo que el estudiante | Oficial §10: "alguien del mismo sexo" — **no** familiares |
| `explique_creencias_discurso` | estudiante | sexo = masculino | |
| `explique_creencias_escenificacion` | estudiante | todos los activos | |
| `explique_creencias_escenificacion` | ayudante | mismo sexo **o familiar** | Oficial §11: "mismo sexo o un familiar" |
| `discurso_estudiante` | estudiante | sexo = masculino | |
| `que_dirias` | estudiante | anciano, siervo_ministerial | Oficial §9: presidente u otro anciano/siervo competente |
| `analisis_auditorio` | estudiante | anciano, siervo_ministerial | |
| `necesidades_congregacion` | estudiante | **solo anciano** | Oficial §16: siempre a cargo de un anciano |
| `estudio_biblico` | conductor | `puede_conducir_estudio = 1` | Anciano competente; siervo ministerial solo si hay pocos ancianos. Lo decide el cuerpo de ancianos |
| `estudio_biblico` | lector | sexo = masculino y rol ≠ `estudiante_biblia` | Varón bautizado publicado (regla implementada; el texto oficial no la especifica) |
| (rol especial) `presidente` | — | `puede_presidir = 1` | Anciano aprobado por el cuerpo de ancianos, se turnan (§25) |
| (rol especial) `consejero_sala` | — | `puede_ser_consejero_sala = 1` | Anciano preferiblemente; siervo si es necesario (§27) |
| (rol especial) `oracion` | — | sexo = masculino y rol ≠ `estudiante_biblia` | Varón bautizado publicado (regla implementada; commit a753338) |

> **Familia:** "familiar" se resuelve por la tabla `familia_miembros` (hermanos que comparten familia). Solo aplica a los ayudantes de `empiece_conversaciones` (§7) y `explique_creencias_escenificacion` (§11) — los únicos tipos donde el texto oficial dice "mismo sexo o un familiar".
>
> **Resuelto (fix (a) — solo mismo sexo):** los ayudantes de `haga_revisitas` y `haga_discipulos` se filtran por `sexo = sexo_estudiante` únicamente; un familiar del mismo sexo sigue siendo elegible (es mismo sexo). Fix aplicado con tests en `src-tauri/src/eligibility/rules.rs`; ticket en `.scratch/fix-ayudantes-haga-revisitas-discipulos/issues/01-ayudante-solo-mismo-sexo.md`.

## 4. Reglas de semana especial (`tipo_especial` en tabla `semanas`)

| Tipo | Comportamiento |
|---|---|
| `normal` | Programa completo con sala auxiliar según partes |
| `asamblea` | **Sin reunión** (§22). Se importa sin partes; no requiere asignaciones |
| `conmemoracion` | **Sin reunión** si cae entre semana (§23) |
| `visita_superintendente` | El "Estudio bíblico" se reemplaza por el **discurso de servicio de 30 min** del superintendente de circuito. **No hay clases auxiliares** (§21): todas las partes son solo auditorio principal |

## 5. Reglas de negocio

- **Soft delete obligatorio**: los hermanos se desactivan (`activo = 0`), nunca se eliminan, para preservar historial. Los desactivados no aparecen en selectores pero sus asignaciones existentes se mantienen.
- **Integridad de sala auxiliar**: editar una parte a `requiere_sala_auxiliar = 0` borra automáticamente sus asignaciones de `sala_auxiliar` existentes (`update_parte`, `src-tauri/src/commands/partes.rs:132-138`).
- **Ayudantes sin datos del estudiante**: si faltan `estudiante_id` o `sexo_estudiante`, los ayudantes degeneran a "solo sexo" o "todos los activos" (`src-tauri/src/eligibility/rules.rs:85-118`); la UI siempre envía ambos, así que solo afecta a llamadas directas al comando.
- **Rotación del estudio bíblico** (§17): si es posible, conductor **y** lector diferentes cada semana. Informativo, no bloqueante.
- **Historial de participación**: al abrir un selector se muestra un modal por hermano con "N participaciones · última: fecha (rol)" sobre una ventana de **4 meses** (`src/components/BrotherPickerModal.tsx:118-125`, `src/components/BrotherSelector.tsx:20`, `src-tauri/src/commands/historial.rs:128`; commit `3a2f668`). **Nunca bloquea** una asignación — solo informa.
- **Antelación**: las asignaciones se entregan con ≥3 semanas de anticipación (proceso humano, no validación de app).
- **S-89**: las asignaciones de estudiante se formalizan en el formulario oficial S-89 (módulo implementado: `S89Page`, `S89RangoPage`, export a PDF/JPEG).
- **Tiempo total**: la reunión dura 1h45 incluyendo canciones y oraciones (§20). Validación de suma de duraciones: pendiente/futuro.
- **Lecturas largas**: el superintendente considera las capacidades de cada estudiante al asignar lecturas más largas (§5) — nota de proceso, no regla de filtro.
- **Ancianos como estudiantes**: si es necesario, los ancianos pueden recibir asignaciones de estudiante (§6).

## 5.1 Configuración de congregación (sala auxiliar)

Pantalla **Configuración** (ruta `/configuracion`, entrada fija en el nav principal), la primera de la app, donde el Superintendente declara si la congregación tiene sala auxiliar. Por ahora es el único ajuste; la pantalla queda preparada para futuros ajustes de congregación.

- **Persistencia**: tabla singleton `congregation_settings` (una sola fila, `id = 1`) con `has_auxiliary_room` (0/1). Default `1` = "tiene sala auxiliar", que preserva el comportamiento histórico en instalaciones nuevas y existentes. Lógica en `src-tauri/src/congregation/settings.rs`; migración idempotente en `src-tauri/src/db.rs`.
- **Alcance del ajuste**: candado **duro y no destructivo**.
  - *Duro*: con el ajuste off, ningún editor permite marcar «Sala aux.», la app no pide asignaciones, consejero ni impresiones de ese ámbito, y el S-140 no muestra la fila del consejero.
  - *No destructivo*: las marcas guardadas (`partes.requiere_sala_auxiliar`) y las asignaciones de `sala_auxiliar` se conservan ocultas y reaparecen intactas al reactivar el ajuste. El ajuste nunca reescribe esos datos.
- **Flag efectivo**: helper compartido del frontend `hasEffectiveAuxiliaryRoom(has_auxiliary_room, parte)` (`src/utils/auxiliaryRoom.ts`): el ajuste debe estar on **y** la parte marcada. Todas las vistas consumen el flag efectivo; el dato guardado se lee tal cual.
- **Editores**: en la vista previa de importación del MWB y en el formulario de semana la casilla «Sala aux.» se muestra deshabilitada (no oculta) con aviso y enlace a Configuración cuando el ajuste está off; conserva visible la marca guardada o inferida por el parser. Ambos formularios envían esa marca **sin cambios**, nunca forzada a `0`: forzarla borraría las asignaciones de `sala_auxiliar` de la parte al guardar (`update_parte`). Activación y desactivación del ajuste nunca alteran datos guardados.
- **Comandos**: `get_congregation_settings` y `update_congregation_settings(has_auxiliary_room)`.
- **S-89 sin cambios**: sus casillas «Sala principal / Sala auxiliar núm. 1» son parte fija del formulario oficial.

## 6. Catálogo de tipos de asignación (`tipo_asignacion`)

`discurso_no_estudiante`, `busquemos_perlas`, `lectura_biblia`, `empiece_conversaciones`, `haga_revisitas`, `haga_discipulos`, `explique_creencias_discurso`, `explique_creencias_escenificacion`, `discurso_estudiante`, `que_dirias`, `analisis_auditorio`, `necesidades_congregacion`, `estudio_biblico`, `oracion`, `cancion`, `introduccion`, `conclusion`.

Cada tipo define: sección (`tesoros` / `mejores_maestros` / `vida_cristiana` / `marco`), `requiere_sala_auxiliar`, `requiere_ayudante`. Enum Rust en `src-tauri/src/models.rs:33` (`marco` = `oracion`/`cancion`/`introduccion`/`conclusion`).

## 7. Modelo de datos (SQLite, resumen)

- **hermanos**: id, nombre, sexo (`masculino`/`femenino`), rol (`anciano`/`siervo_ministerial`/`publicador`/`estudiante_biblia`), puede_presidir, puede_conducir_estudio, puede_ser_consejero_sala, activo, notas
- **semanas**: id, fecha_inicio, fecha_fin (ISO 8601), libro_biblico, cancion_apertura/intermedia/cierre, tipo_especial, presidente_id, consejero_sala_id, orador_oracion_apertura/intermedia/cierre_id
- **partes**: id, semana_id (CASCADE), numero_orden, seccion, tipo_asignacion, titulo, duracion_minutos, requiere_sala_auxiliar, requiere_ayudante
- **asignaciones**: id, parte_id (CASCADE), ambito (`auditorio_principal`/`sala_auxiliar`), rol (`estudiante`/`ayudante`/`conductor`/`lector`), hermano_id
- **familias** / **familia_miembros**: agrupaciones familiares; `familia_miembros.familia_id` + `hermano_id`. Usadas por la regla "o familiar" de ayudantes
- **congregation_settings**: tabla singleton (una fila, `id = 1`) con `has_auxiliary_room` (0/1). Ajuste de congregación; ver §5.1

## 8. Comandos Tauri (resumen)

`get_eligible_brothers(tipo_asignacion, rol, ambito, sexo_estudiante?, estudiante_id?)` → `Vec<Hermano>` · CRUD hermanos (create/update/get/list/deactivate, batch) · `parse_mwb_pdf(path)`, `pick_mwb_file()`, `import_parsed_weeks(weeks)` · CRUD semanas y partes · `assign_brother`, `remove_assignment`, `get_assignments_for_week`, `update_semana_roles` · `get_congregation_settings`, `update_congregation_settings(has_auxiliary_room)` · `get_brother_history` · exportación S-140/S-89 (PDF/JPEG).

## 9. Rutas de la UI

`/` Dashboard · `/hermanos`, `/hermanos/nuevo`, `/hermanos/:id/editar` · `/semanas`, `/semanas/importar`, `/semanas/nuevo`, `/semanas/:id/editar`, `/semanas/:id` (Asignaciones) · `/familias`, `/familias/:id` · `/semanas/:id/s140`, `/s140/rango` · `/semanas/:id/s89`, `/s89/rango` · `/configuracion` (Configuración de congregación, §5.1)

**Fidelidad S-140**: visual/impresión del S-140 debe ser idéntico al oficial — ver `docs/user/ux-guidelines.md` y `s140-mockup.html` antes de tocar cualquier vista de impresión.

## 10. Fuera de alcance

Rotación automática de hermanos · notificaciones a participantes · múltiples congregaciones · autenticación/multi-usuario · historial de más de un bimestre en la vista de rotación · integración con JW Library o jw.org.

## 11. Del texto oficial: fuera de alcance para la app

Contenido y circunstancias de las conversaciones (§13–15), palabras de ánimo y consejo del presidente (§19), función de consejero auxiliar de aconsejar en privado (§26), videos de JW Library (§28). Son contexto del conductor de la reunión, no reglas de asignación ni de la app.
