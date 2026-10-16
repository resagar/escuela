# Arquitectura y Modelo de Datos

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Plataforma | Tauri 2 (WebView nativo + backend Rust) |
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + React Router v7 |
| Backend | Rust (Tauri commands) |
| Base de datos | SQLite (rusqlite bundled, WAL mode) |
| Parser PDF | `pdftotext` (binario externo, primario) + `lopdf` (fallback) |

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────┐
│                   Tauri App                          │
│  ┌──────────────┐      ┌──────────────────────────┐ │
│  │  WebView      │      │  Rust Backend             │ │
│  │  (React SPA)  │◄────►│  ┌────────────────────┐  │ │
│  │               │invoke│  │  commands/           │  │ │
│  │  Routes:      │      │  │  └ hermanos.rs       │  │ │
│  │  /             │      │  │  └ mwb.rs            │  │ │
│  │  /hermanos     │      │  │  └ semanas.rs        │  │ │
│  │  /semanas      │      │  │  └ partes.rs         │  │ │
│  │  /semanas/:id  │      │  │  └ elegibilidad.rs   │  │ │
│  │  /semanas/:id/ │      │  │  └ asignaciones.rs   │  │ │
│  │    s140        │      │  │  └ historial.rs      │  │ │
│  │               │      │  ├────────────────────┤  │ │
│  │               │      │  │  mwb_parser/        │  │ │
│  │               │      │  │  eligibility/        │  │ │
│  │               │      │  ├────────────────────┤  │ │
│  │               │      │  │  db.rs (SQLite)     │  │ │
│  │               │      │  │  models.rs           │  │ │
│  └──────────────┘      └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Base de Datos

6 tablas SQLite con foreign keys y WAL mode: `hermanos`, `semanas`, `partes`, `asignaciones`, `familias`, `familia_miembros` (`src-tauri/src/db.rs:31-96`).

### `hermanos`
Catálogo de miembros de la congregación.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | Autoincremental |
| nombre | TEXT | Nombre completo |
| sexo | TEXT | "masculino" / "femenino" |
| rol | TEXT | "anciano" / "siervo_ministerial" / "publicador" / "estudiante_biblia" |
| puede_presidir | INTEGER | 0/1 — aprobado para presidir |
| puede_conducir_estudio | INTEGER | 0/1 — aprobado para conducir estudio |
| puede_ser_consejero_sala | INTEGER | 0/1 — aprobado para consejero sala auxiliar |
| activo | INTEGER | 0/1 — soft delete |
| notas | TEXT | Opcional |

### `semanas`
Programa de cada semana del bimestre.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | |
| fecha_inicio | TEXT | ISO 8601 |
| fecha_fin | TEXT | ISO 8601 |
| libro_biblico | TEXT | Capítulos asignados |
| cancion_apertura | INTEGER | Número de canción |
| cancion_intermedia | INTEGER | |
| cancion_cierre | INTEGER | |
| tipo_especial | TEXT | "normal" / "asamblea" / "conmemoracion" / "visita_superintendente" |
| presidente_id | FK→hermanos | |
| consejero_sala_id | FK→hermanos | |
| orador_oracion_apertura_id | FK→hermanos | |
| orador_oracion_intermedia_id | FK→hermanos | |
| orador_oracion_cierre_id | FK→hermanos | |

### `partes`
Partes del programa de cada semana.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | |
| semana_id | FK→semanas (CASCADE) | |
| numero_orden | INTEGER | Orden dentro de la semana |
| seccion | TEXT | "tesoros" / "mejores_maestros" / "vida_cristiana" / "marco" |
| tipo_asignacion | TEXT | Ver catálogo `TipoAsignacion` |
| titulo | TEXT | |
| duracion_minutos | INTEGER | |
| requiere_sala_auxiliar | INTEGER | 0/1 |
| requiere_ayudante | INTEGER | 0/1 |

### `asignaciones`
Asignación de hermanos a partes.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | |
| parte_id | FK→partes (CASCADE) | |
| ambito | TEXT | "auditorio_principal" / "sala_auxiliar" |
| rol | TEXT | "estudiante" / "ayudante" / "conductor" / "lector" |
| hermano_id | FK→hermanos | |

## Comandos Tauri

Todos implementados y registrados en `src-tauri/src/lib.rs:26-63`:

| Comando | Descripción |
|---------|------------|
| `list_hermanos` | Lista hermanos, opcionalmente solo activos |
| `get_hermano` | Obtiene un hermano por ID |
| `create_hermano` | Crea un hermano individual |
| `create_hermanos_batch` | Creación por lotes con transacción |
| `update_hermano` | Actualiza campos de un hermano |
| `deactivate_hermano` | Soft delete (activo=0) |
| `reactivate_hermano` | Revierte el soft delete (activo=1) |
| `parse_mwb_pdf` | Parsea un PDF de guía de actividades (mwb) |
| `pick_mwb_file` | Abre el diálogo nativo de selección de PDF |
| `create_semana`, `update_semana`, `list_semanas`, `get_semana`, `delete_semana` | CRUD de semanas (delete en cascade) |
| `get_adjacent_weeks` | Semanas adyacentes (navegación previa/siguiente) |
| `import_parsed_weeks` | Importación transaccional de semanas parseadas |
| `create_parte`, `update_parte`, `list_partes`, `delete_parte` | CRUD de partes (delete en cascade) |
| `get_eligible_brothers` | Hermanos elegibles según tipo de asignación, rol y ámbito |
| `get_eligible_brothers_with_history` | Elegibles con historial de participaciones (bulk) |
| `assign_brother`, `remove_assignment`, `get_assignments_for_week`, `update_semana_roles` | Asignaciones (UPSERT) y roles de la semana |
| `get_brother_history` | Historial de participaciones de un hermano (ventana configurable, default 4 meses) |
| `create_familia`, `list_familias`, `get_familia`, `delete_familia` | CRUD de familias |
| `add_familia_member`, `remove_familia_member`, `list_familias_with_count` | Miembros de familia y listado con conteo |
| `write_file_bytes` | Escritura de bytes exportados (PDF/JPEG) |
| `get_s89_cards_for_week` | Tarjetas S-89 de una semana |

> `get_bimonthly_stats` no existe: el dashboard calcula el progreso del bimestre client-side (`src/pages/DashboardPage.tsx:53-86`).

## Flujo del Parser MWB

```
PDF (mwb_S_YYYYMM.pdf)
  │
  ▼
extract_text_from_pdf(): pdftotext (binario externo, primario)
  │  └─ fallback: lopdf::Document::load() → extract_text()
  ▼
Texto plano del PDF
  │
  ▼
normalize_text() (unifica saltos de línea, marcadores [SONG], etc.)
  │
  ▼
split_into_week_blocks() — detecta encabezados de semana (is_week_header_line + parse_week_header, parsing tokenizado)
  │
  ▼
Vec<(header, body)> (bloque por semana)
  │
  ▼
parse_week_block() para cada bloque:
  ├── extraer libro bíblico
  ├── parsear fechas (ISO 8601)
  ├── detectar canciones
  ├── detectar secciones (Tesoros/Mejores/Vida)
  ├── detectar partes numeradas
  └── classify_part_type() (tabla de keywords)
  │
  ▼
Vec<ParsedWeek> → JSON → frontend (preview)
  │
  ▼
Usuario revisa, edita, selecciona semanas
  │
  ▼
import_parsed_weeks() → INSERT en semanas + partes (transacción)
```

## Flujo de Asignación

```
Usuario selecciona tipo de asignación + rol
  │
  ▼
BrotherSelector (React):
  invoke("get_eligible_brothers", { tipo, rol, ambito, sexo_estudiante })
  │
  ▼
eligibility::rules.rs:
  └── Construye query SQL dinámica según reglas del S-38
  └── Filtra: activo=1, rol/sexo según tipo de parte
  └── Retorna Vec<Hermano>
  │
  ▼
Usuario selecciona hermano → autosave:
  invoke("assign_brother", { parte_id, ambito, rol, hermano_id })
  │
  ▼
DB: INSERT OR UPDATE (UPSERT)
  │
  ▼
S140Page: llama get_assignments_for_week → renderiza tabla
```
