# Plan Maestro: Escuela — Asignaciones VyM (MVP Completo)

**Generado**: 2026-06-01
**Complejidad Estimada**: Alta
**Enfoque**: Robusto por módulo — cada módulo se completa y se valida antes de pasar al siguiente
**Idioma del parser**: Solo español (mwb_S_YYYYMM.pdf)
**Estrategia Parser**: lopdf (Rust nativo, sin dependencias externas)
**Testing**: Validación manual al final de cada sprint
**Diálogo de archivos**: Desde Rust (tauri-plugin-dialog en backend)

---

## Visión General

Este plan cubre todo el trabajo restante del MVP, desde completar la Fase 1 (catálogo de tipos, tipos compartidos) hasta la Fase 4 (dashboard, historial, pulido). Se estructura en **6 sprints** que construyen el producto incrementalmente.

### Requisitos clave del usuario incorporados

- **Selección de semanas al importar**: En la vista previa del parseo, el usuario puede marcar/desmarcar qué semanas quiere importar. Útil cuando el bimestre ya empezó y solo se necesitan las semanas restantes.
- **Semanas sin reunión**: La semana de la Conmemoración y Asamblea se detectan automáticamente y se marcan como "sin reunión" (no tienen partes que asignar).
- **Parser + UI integrados**: El módulo de parseo y la interfaz de importación se desarrollan juntos para poder probar visualmente desde el primer momento.

### Línea de tiempo estimada

| Sprint | Nombre | Horas est. |
|--------|--------|------------|
| 1 | Completar Base + Documentación | 3-4h |
| 2 | Parser del MWB + UI de Importación | 10-14h |
| 3 | CRUD de Semanas/Partes + UI de Listado | 5-6h |
| 4 | Módulo de Elegibilidad (Backend) | 4-5h |
| 5 | UI de Asignaciones + S-140 Imprimible | 8-10h |
| 6 | Dashboard, Historial, Pulido | 4-5h |

**Total estimado**: 34-44 horas

---

## Sprint 1: Completar Base + Documentación

**Objetivo**: Cerrar los cabos sueltos de la Fase 1 y dejar una base sólida. Tipos compartidos, documentación de arquitectura, y preparación de dependencias para los siguientes sprints.

**Demo/Validación**:
- `pnpm tauri dev` compila y arranca sin errores
- `index.html` muestra título correcto y `lang="es"`
- `tsc --noEmit` y `cargo check` limpios
- `.docs/architecture.md` y `.docs/project-context.md` existen y están completos
- CRUD de hermanos (individual + batch) funciona igual que antes

### Tarea 1.1: Arreglar index.html y README.md
- **Archivos**: `index.html`, `README.md`
- **Descripción**:
  - `index.html`: Cambiar `lang="en"` → `lang="es"`, `<title>` → `"Escuela — Asignaciones VyM"`
  - `README.md`: Reemplazar template genérico de Tauri por descripción real del proyecto
- **Dependencias**: Ninguna
- **Criterios de aceptación**: HTML con lang es y título descriptivo. README menciona "Escuela", "asignaciones", "Reunión Vida y Ministerio"

### Tarea 1.2: Extraer tipos TypeScript compartidos
- **Archivos**: `src/types.ts` (NUEVO), `src/pages/HermanosListPage.tsx`, `src/pages/HermanoFormPage.tsx`
- **Descripción**:
  - Crear `src/types.ts` con interfaces `Hermano`, `BatchHermanoInput`, constantes `ROL_LABELS`, y tipos `Sexo`, `Rol`
  - Eliminar definiciones duplicadas en las páginas, importar de `types.ts`
- **Dependencias**: Ninguna
- **Criterios de aceptación**: `tsc --noEmit` limpio. Páginas de hermanos funcionan idéntico

### Tarea 1.3: Agregar comando get_hermano (backend)
- **Archivos**: `src-tauri/src/commands/hermanos.rs`, `src-tauri/src/lib.rs`, `src/pages/HermanoFormPage.tsx`
- **Descripción**:
  - Implementar `get_hermano(db, id: i64) -> Result<Hermano, String>` (SELECT por ID)
  - Registrar en `lib.rs`
  - Actualizar `HermanoFormPage.tsx`: reemplazar carga de TODOS los hermanos + filter por `invoke("get_hermano", { id })`
- **Dependencias**: 1.2
- **Criterios de aceptación**: Editar hermano carga solo sus datos sin consultar toda la tabla

### Tarea 1.4: Crear catálogo de tipos de asignación (Rust enum)
- **Archivos**: `src-tauri/src/models.rs`
- **Descripción**:
  - Definir enum `TipoAsignacion` con todas las variantes del PRD §4.2:
    ```rust
    pub enum TipoAsignacion {
        DiscursoNoEstudiante, BusquemosPerlas, LecturaBiblia,
        EmpieceConversaciones, HagaRevisitas, HagaDiscipulos,
        ExpliqueCreenciasDiscurso, ExpliqueCreenciasEscenificacion,
        DiscursoEstudiante, AnalisisAuditorio, NecesidadesCongregacion,
        EstudioBiblico, Oracion, Cancion, Introduccion, Conclusion,
    }
    ```
  - Implementar `Serialize`/`Deserialize`
  - Métodos: `seccion()`, `requiere_sala_auxiliar()`, `requiere_ayudante()`, `solo_varones()`, `solo_no_estudiante()`
  - Cada método mapea según tabla PRD §2.1 y §5.4
- **Dependencias**: Ninguna
- **Criterios de aceptación**: `cargo check` limpio. Cada variante mapea correctamente

### Tarea 1.5: Documentación de arquitectura (.docs)
- **Archivos**: `.docs/project-context.md` (NUEVO), `.docs/architecture.md` (NUEVO), `.docs/README.md`
- **Descripción**:
  - `project-context.md`: Propósito, usuario, dominio, alcance MVP (basado en PRD §1-3)
  - `architecture.md`: Stack, componentes, flujo del parser, modelo de datos (4 tablas), lista de comandos Tauri
  - Actualizar `.docs/README.md`: links a archivos existentes
- **Dependencias**: Ninguna
- **Criterios de aceptación**: Archivos existen y cubren los temas. Índice sin links rotos

### Tarea 1.6: Agregar plugin dialog de Tauri + ajustes de window
- **Archivos**: `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`, `src-tauri/tauri.conf.json`
- **Descripción**:
  - `Cargo.toml`: Agregar `tauri-plugin-dialog = "2"`
  - `lib.rs`: `.plugin(tauri_plugin_dialog::init())`
  - `capabilities/default.json`: Agregar `"dialog:default"` a permisos
  - `tauri.conf.json`: ventana 1200×800, minWidth 900, minHeight 600, título "Escuela — Asignaciones VyM"
- **Dependencias**: Ninguna
- **Criterios de aceptación**: `pnpm tauri dev` arranca. Ventana más grande

### Tarea 1.7: Validación integral del Sprint 1
- [ ] `pnpm tauri dev` arranca limpio
- [ ] `tsc --noEmit` y `cargo check` limpios
- [ ] Crear, listar, editar, desactivar hermanos funciona
- [ ] Batch mode: crear 3+ hermanos a la vez funciona
- [ ] `get_hermano` carga datos de edición eficientemente
- [ ] `.docs/` tiene los 3 archivos con contenido real

---

## Sprint 2: Parser del MWB PDF + UI de Importación

**Objetivo**: Implementar el parser Rust que extrae el programa desde el mwb PDF, Y la interfaz React completa para importar con selección de semanas. Al final, el usuario puede abrir un PDF, ver todas las semanas parseadas, elegir cuáles importar, revisar/editar, y guardarlas en la base de datos.

**Demo/Validación**:
- Abrir `refs/mwb_S_202603.pdf` desde la app
- Ver vista previa con todas las semanas detectadas (~8-9)
- Ver checkboxes por semana — marcar/desmarcar funciona
- Semana de Conmemoración marcada como "Sin reunión"
- Editar una parte en la preview → confirmar → semanas guardadas en DB
- Navegar a `/semanas` → ver las semanas importadas

### Tarea 2.1: Agregar lopdf como dependencia
- **Archivos**: `src-tauri/Cargo.toml`
- **Descripción**: Agregar `lopdf = "0.34"` a `[dependencies]`
- **Dependencias**: 1.7
- **Criterios de aceptación**: `cargo check` compila

### Tarea 2.2: Estructura del módulo mwb_parser
- **Archivos**: `src-tauri/src/mwb_parser/mod.rs` (NUEVO), `src-tauri/src/mwb_parser/types.rs` (NUEVO), `src-tauri/src/lib.rs`
- **Descripción**:
  - Crear módulo `mwb_parser` con submódulo `types`
  - `types.rs`: structs `ParsedWeek`, `ParsedPart`, enum `TipoEspecial` (Normal, Asamblea, Conmemoracion, VisitaSuperintendente, SinReunion)
  - `mod.rs`: función `parse_mwb_pdf(path: &str) -> Result<Vec<ParsedWeek>, String>`
  - Declarar `mod mwb_parser;` en `lib.rs`
- **Dependencias**: 2.1
- **Criterios de aceptación**: `cargo check` compila con el nuevo módulo

### Tarea 2.3: Extracción de texto y detección de semanas
- **Archivos**: `src-tauri/src/mwb_parser/mod.rs`
- **Descripción**:
  - `extract_text_from_pdf(path)`: `Document::load()` + `.extract_text(&page_numbers)` para todas las páginas
  - `split_into_weeks(raw_text)`: detectar encabezados de semana con regex:
    - Patrón: `r"(\d{1,2})\s*(?:al|–|-|de)\s*(\d{1,2})\s*de\s*(\w+)"`
    - Separar texto en bloques por semana
  - Detectar semanas especiales buscando keywords:
    - "ASAMBLEA" / "asamblea" → `TipoEspecial::SinReunion`
    - "CONMEMORACIÓN" / "Conmemoración" → `TipoEspecial::SinReunion`
    - (Estas semanas se importan pero sin partes — el usuario las ve marcadas como "Sin reunión")
  - Manejo de errores: archivo no encontrado, PDF corrupto, sin texto extraíble
- **Dependencias**: 2.2
- **Criterios de aceptación**:
  - Con `refs/mwb_S_202603.pdf`, retorna texto no vacío con frases reconocibles
  - Detecta 8-9 semanas
  - Semanas sin reunión marcadas con `TipoEspecial::SinReunion`

### Tarea 2.4: Parseo de cada semana (partes, canciones, libro)
- **Archivos**: `src-tauri/src/mwb_parser/mod.rs`
- **Descripción**:
  - `parse_week(week_text) -> Result<ParsedWeek, String>`:
    - **Libro bíblico**: extraer del encabezado (ej. "ISAÍAS 48, 49")
    - **Fechas**: parsear inicio/fin en ISO 8601
    - **Canciones**: detectar números con patrón `"Canción\s+(\d+)"` / `"Cántico\s+(\d+)"`:
      - 1ra → `cancion_apertura`, la de antes de "NUESTRA VIDA CRISTIANA" → `cancion_intermedia`, última → `cancion_cierre`
    - **Secciones**: detectar encabezados "TESOROS DE LA BIBLIA", "SEAMOS MEJORES MAESTROS", "NUESTRA VIDA CRISTIANA"
    - **Partes**: detectar líneas numeradas `r"^(\d+)\.\s+(.+?)\s+\((\d+)\s*min"`:
      - Extraer número, título, duración
      - Asignar sección según contexto
      - Clasificar `tipo_asignacion` con `classify_part_type(title, section)`
  - `classify_part_type(title, section) -> (String, bool, bool)`:
    - Usar tabla de keywords del PRD §5.4
    - Orden: chequeos más específicos primero (ej. "Explique sus creencias" + "Discurso"), luego generales
    - Retorna: tipo_asignacion, requiere_sala_auxiliar, requiere_ayudante
- **Dependencias**: 2.3
- **Criterios de aceptación**:
  - Para una semana normal: 8-9 partes clasificadas correctamente
  - "Busquemos perlas escondidas" → no-estudiante, sin sala aux
  - "Lectura de la Biblia" → con sala aux, sin ayudante
  - "Empiece conversaciones" → con sala aux, con ayudante
  - Precisión >90%

### Tarea 2.5: Comando Tauri parse_mwb_pdf
- **Archivos**: `src-tauri/src/commands/mwb.rs` (NUEVO), `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`
- **Descripción**:
  ```rust
  #[tauri::command]
  fn parse_mwb_pdf(path: String) -> Result<Vec<ParsedWeek>, String> {
      mwb_parser::parse_mwb_pdf(&path)
  }
  ```
  - Registrar en `lib.rs` y `commands/mod.rs`
- **Dependencias**: 2.4
- **Criterios de aceptación**: Comando invocable desde frontend, retorna JSON con semanas y partes

### Tarea 2.6: Comando Rust para abrir diálogo de archivo
- **Archivos**: `src-tauri/src/commands/mwb.rs`
- **Descripción**:
  ```rust
  #[tauri::command]
  fn pick_mwb_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
      use tauri_plugin_dialog::DialogExt;
      // Abre file picker filtrado por PDF
      // Retorna Some(path) o None si el usuario canceló
  }
  ```
  - Usar `tauri-plugin-dialog` (ya configurado en Sprint 1)
  - Filtrar por `*.pdf`
- **Dependencias**: 1.6, 2.5
- **Criterios de aceptación**: Comando abre diálogo nativo, retorna ruta seleccionada o None

### Tarea 2.7: CRUD de Semanas y Partes (Backend)
- **Archivos**: `src-tauri/src/commands/semanas.rs` (NUEVO), `src-tauri/src/commands/partes.rs` (NUEVO), `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`
- **Descripción**:
  - **Semanas**: `create_semana`, `update_semana`, `list_semanas`, `get_semana`, `delete_semana` (cascade)
  - **Partes**: `create_parte`, `update_parte`, `list_partes(semana_id)`, `delete_parte` (cascade)
  - **Importación bulk**: `import_parsed_weeks(db, parsed_weeks: Vec<ParsedWeek>) -> Result<Vec<Semana>, String>`:
    - Transacción: itera semanas → INSERT en `semanas` → INSERT partes con FK
    - Si una falla, ROLLBACK completo
    - Retorna semanas creadas con IDs
  - Registrar todos los comandos en `lib.rs`
- **Dependencias**: 2.5
- **Criterios de aceptación**:
  - Crear semana + listar + actualizar + eliminar (cascade) funciona
  - `import_parsed_weeks` con 2 semanas persiste todo correctamente
  - Rollback si hay error

### Tarea 2.8: SemanasListPage
- **Archivos**: `src/pages/SemanasListPage.tsx` (NUEVO), `src/App.tsx`, `src/components/Layout.tsx`
- **Descripción**:
  - Ruta `/semanas` → `SemanasListPage`
  - Listado cronológico de semanas
  - Cada fila: rango de fechas, libro bíblico, tipo (normal / sin reunión), # partes, estado (sin asignar / parcial / completo)
  - Botón "Importar mwb" → `/semanas/importar`
  - Click en semana → `/semanas/:id` (placeholder hasta Sprint 5)
  - Estados: loading, empty ("No hay semanas. ¡Importa el primer mwb!"), listado
  - Navbar: agregar link "Semanas"
- **Dependencias**: 2.7
- **Criterios de aceptación**: Lista vacía/llena funciona, navegación a importar funciona

### Tarea 2.9: ImportarMwbPage — Vista previa con selección de semanas
- **Archivos**: `src/pages/ImportarMwbPage.tsx` (NUEVO), `src/App.tsx`
- **Descripción**:
  - Ruta `/semanas/importar`
  - **Paso 1 — Seleccionar PDF**:
    - Botón "Seleccionar PDF" → `invoke("pick_mwb_file")` → diálogo nativo
    - Mostrar ruta del archivo seleccionado
    - Botón "Analizar" → `invoke("parse_mwb_pdf", { path })`
  - **Paso 2 — Vista previa (componente clave)**:
    - **Selector de semanas**: cada semana parseada tiene un checkbox. Por defecto: todas marcadas.
    - **Encabezado de filtro**: "Seleccionar semanas a partir de:" con un input de fecha (o selector de semana). Al cambiar, auto-desmarca semanas anteriores.
    - Cada semana se muestra en una tarjeta expandible (accordion):
      - Cabecera: checkbox + rango de fechas + libro bíblico + badge de tipo (Normal / Sin reunión)
      - Si es "Sin reunión": badge rojo, sin partes expandibles
      - Si es normal: expandir muestra lista de partes con número, título, tipo, sección, duración
    - **Edición inline**: cada campo de parte es editable (título, tipo como dropdown, duración)
    - Partes con tipo incierto → resaltadas en amarillo
  - **Paso 3 — Confirmar**:
    - Botón "Importar N semanas seleccionadas"
    - Llama a `invoke("import_parsed_weeks", { parsedWeeks: soloLasSeleccionadas })`
    - Redirige a `/semanas`
  - Estados: seleccionando, parseando ("Analizando PDF..."), preview, guardando, error
- **Dependencias**: 2.6, 2.7, 2.8
- **Criterios de aceptación**:
  - Flujo completo: seleccionar PDF → analizar → ver preview con checkboxes → desmarcar semanas → editar parte → confirmar → semanas en `/semanas`
  - Filtro "a partir de fecha" funciona (desmarca automáticamente)
  - Semanas "Sin reunión" se marcan visualmente
  - Error de parseo muestra mensaje descriptivo
  - Cancelar diálogo de archivo no rompe la página

### Tarea 2.10: Formulario manual de creación de semana
- **Archivos**: `src/pages/SemanaFormPage.tsx` (NUEVO), `src/App.tsx`
- **Descripción**:
  - Ruta `/semanas/nuevo`
  - Formulario con campos: fechas, libro, canciones, tipo_especial
  - Sección dinámica "Partes": botón "Agregar parte" que añade filas (número, título, tipo, duración, flags)
  - Usa comandos `create_semana` + `create_parte` en secuencia
- **Dependencias**: 2.7
- **Criterios de aceptación**: Crear semana manual con 3+ partes → aparece en listado

### Tarea 2.11: Validación del Sprint 2
- [ ] Abrir `refs/mwb_S_202603.pdf` → vista previa con ~8-9 semanas
- [ ] Marcar/desmarcar semanas → solo las marcadas se importan
- [ ] Filtro "a partir de fecha" desmarca correctamente
- [ ] Semanas sin reunión detectadas y marcadas
- [ ] Editar título de una parte en preview → cambio se refleja
- [ ] Confirmar importación → semanas en `/semanas`
- [ ] Crear semana manualmente → funciona
- [ ] `cargo check` y `tsc --noEmit` limpios

---

## Sprint 3: CRUD de Semanas/Partes + UI de Listado

> **Nota**: Este sprint queda reducido porque el CRUD de semanas/partes se movió al Sprint 2 (Tarea 2.7) y la UI de listado también (Tarea 2.8). Este sprint ahora cubre lo que quedó pendiente de la UI de semanas y la preparación para asignaciones.

**Objetivo**: Completar la gestión de semanas con edición y eliminación desde la UI, y dejar todo listo para el módulo de asignaciones.

**Demo/Validación**:
- Editar una semana existente (cambiar libro, canciones)
- Eliminar una semana (con confirmación)
- Ver detalle de semana con sus partes listadas

### Tarea 3.1: Vista de detalle de semana + eliminación
- **Archivos**: `src/pages/SemanaDetailPage.tsx` (NUEVO), `src/App.tsx`, `src/pages/SemanasListPage.tsx`
- **Descripción**:
  - Ruta `/semanas/:id` → `SemanaDetailPage` (luego será reemplazada por `AsignacionesPage` en Sprint 5, pero por ahora muestra datos)
  - Muestra: fechas, libro, canciones, tipo
  - Lista de partes con número, título, tipo, duración
  - Botón "Editar" (navega a formulario de edición)
  - Botón "Eliminar" con confirmación → `invoke("delete_semana", { id })` → redirige a `/semanas`
  - Botón "Asignar hermanos" (placeholder, navegará a `/semanas/:id/asignar` en Sprint 5)
- **Dependencias**: 2.7, 2.8
- **Criterios de aceptación**: Ver detalle de semana, eliminar con confirmación

### Tarea 3.2: Edición de semana y partes desde UI
- **Archivos**: `src/pages/SemanaFormPage.tsx` (actualizar)
- **Descripción**:
  - Extender `SemanaFormPage` para modo edición (cuando recibe `:id` en la URL)
  - Cargar datos existentes con `get_semana` + `list_partes`
  - Al guardar: `update_semana` + para cada parte: crear/actualizar/eliminar según cambios
- **Dependencias**: 3.1
- **Criterios de aceptación**: Editar semana existente → cambios persisten

### Tarea 3.3: Validación del Sprint 3
- [ ] Ver detalle de semana importada → datos correctos
- [ ] Editar libro bíblico de una semana → cambio persiste
- [ ] Eliminar semana → desaparece del listado, partes eliminadas en cascade
- [ ] `tsc --noEmit` y `cargo check` limpios

---

## Sprint 4: Módulo de Elegibilidad (Backend)

**Objetivo**: Implementar el motor de reglas que filtra hermanos elegibles para cada tipo de asignación. Es la fuente de verdad que alimenta los selectores de la UI.

**Demo/Validación**:
- Probar `get_eligible_brothers` con cada tipo de asignación + rol
- Verificar que las reglas del PRD §2.2 y §4.3 se cumplen estrictamente
- Casos borde: sin hermanos que cumplan, todos los roles/sexos

### Tarea 4.1: Módulo eligibility — Estructura y comando Tauri
- **Archivos**: `src-tauri/src/eligibility/mod.rs` (NUEVO), `src-tauri/src/eligibility/rules.rs` (NUEVO), `src-tauri/src/commands/eligibility.rs` (NUEVO), `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`
- **Descripción**:
  - `eligibility/rules.rs`: función principal
    ```rust
    pub fn get_eligible_brothers(
        conn: &Connection,
        tipo_asignacion: &str,
        rol: &str,
        ambito: &str,
        sexo_estudiante: Option<&str>,
    ) -> Result<Vec<Hermano>, String>
    ```
  - `eligibility/mod.rs`: re-exporta
  - `commands/eligibility.rs`: comando Tauri wrapper
  - Registrar en `lib.rs`
- **Dependencias**: 1.4
- **Criterios de aceptación**: `cargo check` compila. Comando invocable desde frontend

### Tarea 4.2: Implementar todas las reglas de elegibilidad
- **Archivos**: `src-tauri/src/eligibility/rules.rs`
- **Descripción**: Construir query SQL dinámica según tipo_asignacion + rol:

| Tipo Asignación | Rol | Filtro SQL |
|---|---|---|
| `discurso_no_estudiante` | estudiante | `rol IN ('anciano', 'siervo_ministerial')` |
| `busquemos_perlas` | estudiante | `rol IN ('anciano', 'siervo_ministerial')` |
| `lectura_biblia` | estudiante | `sexo = 'masculino'` |
| `empiece_conversaciones`, `haga_revisitas`, `haga_discipulos` | estudiante | Todos activos |
| `empiece_conversaciones`, `haga_revisitas`, `haga_discipulos` | ayudante | Mismo sexo que `sexo_estudiante` |
| `explique_creencias_discurso`, `discurso_estudiante` | estudiante | `sexo = 'masculino'` |
| `explique_creencias_escenificacion` | estudiante | Todos activos |
| `explique_creencias_escenificacion` | ayudante | Mismo sexo que estudiante |
| `analisis_auditorio` | estudiante | `rol IN ('anciano', 'siervo_ministerial')` |
| `necesidades_congregacion` | estudiante | `rol = 'anciano'` |
| `estudio_biblico` | conductor | `puede_conducir_estudio = 1` |
| `estudio_biblico` | lector | Todos activos |

- Reglas especiales fuera del catálogo de partes:
  - **Presidente**: `puede_presidir = 1 AND rol IN ('anciano')` (o siervo con flag)
  - **Consejero sala auxiliar**: `puede_ser_consejero_sala = 1`
  - **Oración**: Todos activos
- Filtro base siempre: `activo = 1`, ordenado por nombre
- **Dependencias**: 4.1
- **Criterios de aceptación**:
  - `necesidades_congregacion` + estudiante → solo ancianos
  - `lectura_biblia` + estudiante → solo varones
  - `empiece_conversaciones` + ayudante + sexo_estudiante="femenino" → solo femeninas
  - `estudio_biblico` + conductor → solo `puede_conducir_estudio = 1`
  - Presidente → solo `puede_presidir = 1`

### Tarea 4.3: Validación manual del Sprint 4
- Para cada tipo de asignación del catálogo:
  - [ ] Discurso no-estudiante → solo ancianos/siervos
  - [ ] Necesidades → solo ancianos
  - [ ] Lectura Biblia → solo varones
  - [ ] Empiece conversaciones + estudiante → todos
  - [ ] Empiece conversaciones + ayudante (con sexo_estudiante) → mismo sexo
  - [ ] Estudio bíblico + conductor → solo flag activo
  - [ ] Estudio bíblico + lector → todos
  - [ ] Presidente → solo flag activo
  - [ ] Consejero → solo flag activo
  - [ ] Oración → todos

---

## Sprint 5: UI de Asignaciones + S-140 Imprimible

**Objetivo**: Construir la página de asignaciones (el corazón de la app) con selectores inteligentes filtrados por elegibilidad, y la vista S-140 con fidelidad 100% al formato oficial.

**Demo/Validación**:
- Asignar hermanos a una semana completa con validación de reglas
- Selectores solo muestran hermanos elegibles
- Al seleccionar estudiante, ayudante se re-filtra por sexo
- Ver S-140 renderizado idéntico al mockup
- Imprimir S-140 → PDF correcto

### Tarea 5.1: Componente BrotherSelector
- **Archivos**: `src/components/BrotherSelector.tsx` (NUEVO)
- **Descripción**:
  - Props: `tipoAsignacion`, `rol`, `ambito`, `sexoEstudiante?`, `value`, `onChange`
  - Al montar/cambiar dependencias: `invoke("get_eligible_brothers", { ... })`
  - Muestra `<select>` con opción vacía "-- Sin asignar --"
  - Formato: "Nombre Completo (Anc)" — rol abreviado
  - Estado: loading, error, datos
- **Dependencias**: 4.2
- **Criterios de aceptación**: Componente reusable, filtra correctamente según props

### Tarea 5.2: Comandos de asignación (Backend)
- **Archivos**: `src-tauri/src/commands/asignaciones.rs` (NUEVO), `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`
- **Descripción**:
  - `assign_brother(db, parte_id, ambito, rol, hermano_id)`: UPSERT (INSERT o UPDATE si ya existe)
  - `remove_assignment(db, parte_id, ambito, rol)`: DELETE
  - `get_assignments_for_week(db, semana_id)`: JOIN partes → asignaciones → hermanos, retorna todas las asignaciones de la semana
  - `update_semana_roles(db, semana_id, presidente_id?, consejero_sala_id?, orador_apertura_id?, orador_cierre_id?)`: UPDATE en tabla semanas
  - Registrar en `lib.rs`
- **Dependencias**: 2.7, 5.1
- **Criterios de aceptación**: Asignar → persiste. Re-asignar → actualiza. Obtener → retorna correcto

### Tarea 5.3: AsignacionesPage — Estructura completa
- **Archivos**: `src/pages/AsignacionesPage.tsx` (NUEVO), `src/App.tsx`
- **Descripción**:
  - Ruta `/semanas/:id` → `AsignacionesPage` (reemplaza `SemanaDetailPage`)
  - Cabecera: fechas, libro, tipo especial
  - **Sección Marco General**:
    - Presidente: `BrotherSelector` con filtro presidencia
    - Consejero sala auxiliar: `BrotherSelector` con filtro consejero
    - Oración apertura: `BrotherSelector` sin filtro (todos)
    - Oración cierre: `BrotherSelector` sin filtro
  - **Secciones del programa** (Tesoros, Mejores Maestros, Vida Cristiana):
    - Agrupadas visualmente con encabezados de sección
    - Cada parte muestra: número, título, duración, tipo
    - Partes no-estudiante: 1 `BrotherSelector` (el presentador)
    - Partes estudiante sin ayudante: 1 `BrotherSelector` por ámbito
    - Partes estudiante con ayudante: 2 `BrotherSelector` por ámbito (estudiante + ayudante)
    - Partes con sala auxiliar: 2 columnas lado a lado
    - Al cambiar estudiante → ayudante se re-filtra automáticamente (pasar `sexoEstudiante`)
  - **Autosave**: cada cambio en un selector dispara `invoke("assign_brother", ...)` automáticamente
  - Feedback visual: indicador "Guardado" por 2 segundos
  - Al cargar: pre-llenar selectores con `get_assignments_for_week`
  - Botón "Ver S-140" → navega a `/semanas/:id/s140`
- **Dependencias**: 5.1, 5.2
- **Criterios de aceptación**:
  - Selectores solo muestran hermanos elegibles según reglas
  - Ayudante se filtra por sexo del estudiante seleccionado
  - Asignaciones persisten al recargar
  - Sala auxiliar se asigna independiente del auditorio principal
  - Autosave funciona sin botón de guardar

### Tarea 5.4: Migrar estilos S-140 del mockup a CSS
- **Archivos**: `src/styles/s140.css` (NUEVO)
- **Descripción**:
  - Extraer TODOS los estilos de `s140-mockup.html` líneas 7-187 a `src/styles/s140.css`
  - Preservar exactamente:
    - Variables CSS (`--color-slate`, `--color-gold`, `--color-maroon`, etc.)
    - Clases: `.s140-table`, `.row-header`, `.row-info`, `.sec-header`, `.sec-tesoros`, `.sec-mejores`, `.sec-vida`, `.time`, `.lbl`, `.val`, `.bullet-part`, `.col-sala-header`, `.col-aud-header`, `.date-text`, `.pres-text`, `.cong-name`, `.main-title`, `.week-container`, `.week-separator`, `.no-print`
    - Tamaños de fuente EXACTOS: 14.5pt, 11pt, 10.5pt, 10pt, 9pt, 8.5pt (NO redondear)
    - Pesos: bold donde corresponda, NORMAL para títulos de partes
    - Anchos de columna: 45px / 355px / 175px / 175px
    - Colores: `#575A5D`, `#BE8900`, `#7E0024`, `#DFDFDF`, `#000000`, `#FFFFFF`
    - Reglas `@media print`: `@page { size: letter; margin: 0.5in; }`, `print-color-adjust: exact`
  - NO modificar ningún valor. Esto es una migración 1:1.
- **Dependencias**: `s140-mockup.html` (referencia), `.docs/ux-guidelines.md` (especificación)
- **Criterios de aceptación**: El CSS es idéntico al del mockup. No hay desviaciones.

### Tarea 5.5: S140Page — Componente React de visualización
- **Archivos**: `src/pages/S140Page.tsx` (NUEVO), `src/App.tsx`
- **Descripción**:
  - Ruta `/semanas/:id/s140`
  - Al cargar: `get_semana` + `list_partes` + `get_assignments_for_week`
  - Renderizar tabla `s140-table` con estructura **idéntica** al mockup:
    - Fila 0: Congregación + "Vida y Ministerio Cristianos"
    - Fila 1: spacer 4px
    - Fila 2: Fecha + Libro | Presidente
    - Fila 3: (vacío) | Consejero sala auxiliar
    - Fila 4: Canción apertura + Oración
    - Fila 5: Palabras de introducción
    - Cabecera TESOROS + column headers
    - Partes de Tesoros (con/sin sala aux según tipo)
    - Cabecera SEAMOS MEJORES MAESTROS + column headers
    - Partes de Mejores Maestros
    - Cabecera NUESTRA VIDA CRISTIANA (colspan=4)
    - Canción intermedia
    - Partes de Vida Cristiana (sin sala aux)
    - Estudio bíblico
    - Conclusión
    - Canción cierre + Oración
  - Lógica de renderizado por tipo:
    - Partes sin sala aux: título colspan=2, nombre en columna 4
    - Partes con sala aux: título en col 2, sala aux en col 3, auditorio en col 4
    - Partes con ayudante: "Estudiante/Ayudante:\nNombre1 / Nombre2"
    - Estudio bíblico: "Conductor/Lector:\nNombre1 / Nombre2"
    - Canción + oración: canción colspan=2, oración en col 4
  - Partes sin asignar: celda vacía (sin errores)
  - Semanas sin reunión: mostrar mensaje "Semana de Asamblea — No hay reunión" o "Semana de la Conmemoración — No hay reunión"
  - Barra superior (`.no-print`): botón "Imprimir / Guardar PDF" + navegación "← Anterior | Siguiente →"
- **Dependencias**: 5.3, 5.4
- **Criterios de aceptación**:
  - Vista en pantalla idéntica a `s140-mockup.html`
  - Nombres asignados aparecen donde corresponde
  - Imprimir → PDF con formato correcto (márgenes 0.5in, colores de fondo visibles)
  - Semanas sin reunión muestran mensaje apropiado
  - Navegación entre semanas funciona

### Tarea 5.6: Validación del Sprint 5
- [ ] Asignar presidente → solo `puede_presidir`
- [ ] Asignar "Necesidades" → solo ancianos
- [ ] Asignar "Lectura Biblia" → solo varones
- [ ] Asignar estudiante femenina → ayudante filtrado a femeninas
- [ ] Asignar sala auxiliar independiente
- [ ] Recargar → asignaciones persisten
- [ ] S-140 renderizado → comparar visualmente con mockup
- [ ] Imprimir → PDF correcto
- [ ] Semana sin reunión → mensaje adecuado

---

## Sprint 6: Dashboard, Historial, y Pulido

**Objetivo**: Completar el MVP con dashboard, historial de participación, y pulido final de UX.

**Demo/Validación**:
- Dashboard muestra progreso real del bimestre
- Tooltips de historial en selectores
- App navegable y pulida

### Tarea 6.1: DashboardPage
- **Archivos**: `src/pages/DashboardPage.tsx` (NUEVO), `src/App.tsx`
- **Descripción**:
  - Ruta `/` → `DashboardPage`
  - Resumen: total semanas, completas, parciales, pendientes
  - Barra de progreso visual
  - Próximas 2-3 semanas con presidente asignado
  - CTA "Ir a asignaciones pendientes" → primera semana incompleta
  - Si no hay semanas: CTA "Importar primer mwb"
  - Si no hay hermanos: CTA "Agregar hermanos"
- **Dependencias**: 5.3
- **Criterios de aceptación**: Dashboard funcional con datos reales, CTAs guían al usuario nuevo

### Tarea 6.2: Historial de participación (Backend)
- **Archivos**: `src-tauri/src/commands/historial.rs` (NUEVO), `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`
- **Descripción**:
  - `get_brother_history(db, hermano_id)`: últimas 10 participaciones (JOIN asignaciones → partes → semanas)
  - `get_bimonthly_stats(db)`: conteo de participaciones por hermano en el bimestre actual
  - Structs: `AssignmentHistory`, `BrotherStats`
  - Registrar en `lib.rs`
- **Dependencias**: 5.2
- **Criterios de aceptación**: Historial retorna datos correctos, stats agrupados por hermano

### Tarea 6.3: Indicadores de historial en selectores
- **Archivos**: `src/components/BrotherSelector.tsx`, `src/pages/AsignacionesPage.tsx`
- **Descripción**:
  - Al montar `BrotherSelector`: cargar stats del bimestre para todos los hermanos
  - En el dropdown, al hacer hover sobre un hermano: tooltip con últimas 2 asignaciones
  - Indicador visual sutil junto al nombre:
    - Verde: 0-1 participaciones
    - Amarillo: 2-3
    - Rojo: 4+ (posible sobreuso)
  - NUNCA bloquear asignación — solo informar
- **Dependencias**: 6.2
- **Criterios de aceptación**: Tooltip con historial, indicador de color visible pero no restrictivo

### Tarea 6.4: Ajustes finales de UX
- **Archivos**: `src/components/Layout.tsx`, `src/App.css`, `src-tauri/tauri.conf.json`
- **Descripción**:
  - `Layout.tsx`: breadcrumb en páginas anidadas, navbar con Dashboard/Hermanos/Semanas
  - `App.css`: estilos globales, focus rings, transiciones
  - `tauri.conf.json`: verificar window 1200×800
- **Dependencias**: 6.1
- **Criterios de aceptación**: Navegación fluida, breadcrumbs correctos, UI pulida

### Tarea 6.5: Validación final del MVP
- [ ] **Flujo completo**: Abrir app → crear hermanos (batch) → importar mwb → seleccionar solo semanas de junio → revisar preview → confirmar → asignar presidente/consejero/oraciones → asignar todas las partes con validación → ver S-140 → imprimir
- [ ] Semanas sin reunión se importan pero no requieren asignaciones
- [ ] Dashboard refleja progreso real
- [ ] Historial en tooltips
- [ ] Editar hermano → cambios en selectores
- [ ] Desactivar hermano → desaparece de selectores, no de asignaciones existentes
- [ ] Eliminar semana → cascade limpio
- [ ] `tsc --noEmit` y `cargo check` limpios
- [ ] `pnpm tauri build` compila sin errores (binario de producción)

---

## Resumen de Archivos Nuevos por Sprint

| Sprint | Archivos Nuevos |
|--------|----------------|
| 1 | `src/types.ts`, `.docs/project-context.md`, `.docs/architecture.md` |
| 2 | `src-tauri/src/mwb_parser/mod.rs`, `src-tauri/src/mwb_parser/types.rs`, `src-tauri/src/commands/mwb.rs`, `src-tauri/src/commands/semanas.rs`, `src-tauri/src/commands/partes.rs`, `src/pages/SemanasListPage.tsx`, `src/pages/ImportarMwbPage.tsx`, `src/pages/SemanaFormPage.tsx` |
| 3 | `src/pages/SemanaDetailPage.tsx` (actualizaciones a `SemanaFormPage.tsx`) |
| 4 | `src-tauri/src/eligibility/mod.rs`, `src-tauri/src/eligibility/rules.rs`, `src-tauri/src/commands/eligibility.rs` |
| 5 | `src/components/BrotherSelector.tsx`, `src/pages/AsignacionesPage.tsx`, `src/pages/S140Page.tsx`, `src/styles/s140.css`, `src-tauri/src/commands/asignaciones.rs` |
| 6 | `src/pages/DashboardPage.tsx`, `src-tauri/src/commands/historial.rs` |

## Archivos Modificados Significativamente

| Archivo | Sprints |
|---------|---------|
| `src-tauri/src/lib.rs` | 1, 2, 4, 5, 6 (plugins + comandos) |
| `src/App.tsx` | 1, 2, 3, 5, 6 (rutas) |
| `src/components/Layout.tsx` | 2, 6 (navbar + breadcrumb) |
| `src-tauri/src/commands/mod.rs` | 2, 4, 5, 6 |
| `src-tauri/Cargo.toml` | 1, 2 (lopdf, dialog) |
| `src-tauri/capabilities/default.json` | 1 (dialog) |
| `src-tauri/src/models.rs` | 1 (enum TipoAsignacion) |
| `index.html` | 1 |
| `README.md` | 1 |
| `src-tauri/tauri.conf.json` | 1, 6 |
| `.docs/README.md` | 1 |

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| El formato del mwb PDF cambia y el parser falla | Alto | Media | Vista previa obligatoria + edición inline. Flujo manual como respaldo. Regex flexibles, no offsets fijos. |
| `lopdf.extract_text()` no extrae bien texto del mwb (encoding complejo) | Alto | Baja | Plan B: `pdftotext` CLI. Estructura modular permite cambiar extractor sin tocar el parser. |
| La selección de semanas "a partir de fecha" es ambigua si el mwb cruza meses | Medio | Media | Usamos las fechas parseadas de cada semana (ISO 8601). Comparación exacta. |
| Reglas de elegibilidad del S-38 cambian | Medio | Baja | Centralizadas en `eligibility/rules.rs` — un solo archivo. |
| Performance con muchas semanas | Bajo | Baja | SQLite + WAL + FKs indexadas. Volumen esperado: cientos, no millones. |
| Migración CSS del mockup a React — pérdida de fidelidad | Medio | Media | Copia 1:1 de clases y valores. Sin "mejoras". Validación visual contra mockup. |

---

## Estrategia de Verificación

- **Por tarea**: `cargo check` (Rust) o `tsc --noEmit` (TypeScript) después de cada cambio
- **Por sprint**: checklist de validación manual al final
- **Final (Sprint 6)**: flujo completo end-to-end con datos reales de `refs/mwb_S_202603.pdf`

### Commits recomendados
Hacer commit al final de cada sprint:
```
feat(sprint-1): complete base setup, shared types, and architecture docs
feat(sprint-2): add mwb PDF parser and import UI with week selection
feat(sprint-3): complete week/part CRUD UI
feat(sprint-4): add eligibility engine with all S-38 rules
feat(sprint-5): add assignment UI with smart selectors and S-140 printable view
feat(sprint-6): add dashboard, participation history, and UX polish
```

---

## Rollback

Si un sprint introduce problemas:
- **Rust**: los comandos son incrementales. Comentar su registro en `lib.rs` sin afectar los demás.
- **React**: las páginas son rutas independientes. Una página rota no afecta a las otras.
- **DB**: solo `CREATE TABLE IF NOT EXISTS` — nunca migraciones destructivas.
- **Git**: revertir al commit del sprint anterior.
