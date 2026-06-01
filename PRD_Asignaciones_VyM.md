# PRD — App de Asignaciones: Reunión Vida y Ministerio Cristianos
**Versión:** 1.2 (MVP)
**Fecha:** Junio 2026
**Autor:** René García

---

## 1. Visión General

### 1.1 Problema

Preparar el programa semanal de la reunión Vida y Ministerio Cristianos (el S-140) es un proceso manual repetitivo y propenso a errores. Cada semana hay que:

- Revisar la guía de actividades (mwb) para entender qué partes componen el programa
- Recordar qué hermanos están disponibles y cuáles califican para cada asignación según las reglas del S-38
- Asegurarse de no repetir a la misma persona en múltiples semanas seguidas
- Llenar manualmente el formulario S-140 con todos los participantes (auditorio principal + sala auxiliar)

Esto consume tiempo innecesario y requiere mantener mentalmente muchas reglas y restricciones a la vez.

### 1.2 Solución

Una aplicación de escritorio personal (Tauri + React + Rust + SQLite) que:

- **Importa automáticamente** el programa de cada semana desde la guía de actividades (mwb PDF), eliminando la transcripción manual,
- Centraliza el roster de la congregación y las reglas de elegibilidad de cada tipo de asignación,
- Permite asignar hermanos con validación automática,
- Genera el S-140 semanal listo para imprimir — en cuestión de minutos.

### 1.3 Usuario

Usuario único: el Superintendente de la Reunión Vida y Ministerio de la congregación Casanay (René García), quien es el responsable de hacer estas asignaciones bimestralmente con al menos 3 semanas de anticipación por asignación.

---

## 2. Contexto del Dominio

### 2.1 Estructura de la Reunión

La reunión tiene una duración total de 1 hora 45 minutos y se divide en tres secciones principales:

**Sección 1 — Tesoros de la Biblia**
| # | Parte | Duración | Tipo |
|---|-------|----------|------|
| 1 | Discurso | 10 min | No-estudiante (anciano o siervo ministerial) |
| 2 | Busquemos perlas escondidas | 10 min | No-estudiante (anciano o siervo ministerial) |
| 3 | Lectura de la Biblia | 4 min | Estudiante varón |

**Sección 2 — Seamos Mejores Maestros**
| # | Parte | Duración | Tipo |
|---|-------|----------|------|
| 4–7 | Variable (Empiece conversaciones / Haga revisitas / Haga discípulos / Explique sus creencias / Discurso) | 1–5 min c/u | Estudiante (con ayudante) |

> El número de partes y sus tipos varían semana a semana según la guía de actividades.

**Sección 3 — Nuestra Vida Cristiana**
| # | Parte | Duración | Tipo |
|---|-------|----------|------|
| — | Canción | — | — |
| Var. | 1–2 asignaciones (análisis, discurso, entrevista, etc.) | 5–15 min | No-estudiante (anciano o siervo ministerial) |
| Último | Estudio bíblico de la congregación | 30 min | No-estudiante — conductor + lector |

**Marco general (fijo cada semana)**
- Presidente de la reunión
- Consejero de la sala auxiliar
- Canciones + oraciones (hermanos que las llevan)

### 2.2 Reglas de Elegibilidad (extraídas del S-38)

Estas son las restricciones que la app debe conocer y aplicar:

**Presidente de la reunión**
- Solo ancianos (o siervos ministeriales en congregaciones con pocos ancianos, aprobados por el cuerpo de ancianos)
- Se turnan entre los hermanos aprobados

**Partes no-estudiante (Tesoros, Vida Cristiana)**
- A cargo de un anciano o siervo ministerial competente
- Las partes del cuerpo de ancianos (necesidades de la congregación) solo pueden asignarse a un anciano

**Partes de estudiante — Reglas generales**
- Cualquier publicador puede recibir asignaciones de estudiante
- Personas no publicadoras pueden participar si aceptan enseñanzas bíblicas y viven según principios cristianos (requiere aprobación del superintendente)

**Restricciones por tipo de asignación**

| Tipo de asignación | Estudiante | Ayudante |
|-------------------|------------|----------|
| Empiece conversaciones | Varón o mujer | Mismo sexo o familiar |
| Haga revisitas | Varón o mujer | Mismo sexo |
| Haga discípulos | Varón o mujer | Mismo sexo |
| Explique sus creencias (discurso) | Solo varón | — |
| Explique sus creencias (escenificación) | Varón o mujer | Mismo sexo o familiar |
| Discurso | Solo varón | — |
| Lectura de la Biblia | Solo varón | — |

**Sala auxiliar**
- Cada asignación de estudiante se replica en la sala auxiliar con estudiantes diferentes
- La sala auxiliar tiene su propio consejero (anciano preferiblemente, o siervo ministerial aprobado)

**Estudio bíblico de la congregación**
- Conductor: anciano competente (siervos ministeriales solo si hay pocos ancianos)
- Lector: hermano diferente cada semana si es posible

### 2.3 El Formulario S-140

Es el output final. Su estructura para cada semana es:

```
[Fecha] | [Libro bíblico de la semana]
Presidente: [Nombre]
Consejero sala auxiliar: [Nombre]

[Hora] • Canción [N] — Oración: [Nombre]
[Hora] • Palabras de introducción (1 min.)

TESOROS DE LA BIBLIA         | Sala auxiliar | Auditorio principal
[Hora] 1. [Título] (10 min.) | [Nombre]      | [Nombre]
[Hora] 2. Busquemos...       | [Nombre]      | [Nombre]
[Hora] 3. Lectura de Biblia  | Est: [Nombre] | Est: [Nombre] / [Nombre]

SEAMOS MEJORES MAESTROS      | Sala auxiliar | Auditorio principal
[Hora] 4. [Tipo] ([min.])    | Est/Ayu: [Nombre]/[Nombre] | Est/Ayu: [Nombre]/[Nombre]
...

NUESTRA VIDA CRISTIANA
[Hora] • Canción [N]
[Hora] [N]. [Título] ([min.])  [Nombre]
[Hora] [N]. Estudio bíblico    Conductor/Lector: [Nombre]/[Nombre]

[Hora] • Palabras de conclusión (3 min.)
[Hora] • Canción [N] — Oración: [Nombre]
```

---

## 3. Objetivos del MVP

1. Mantener un roster de miembros de la congregación con sus atributos de elegibilidad
2. Importar automáticamente el programa semanal desde el PDF de la guía de actividades (mwb), con revisión manual opcional
3. Asignar hermanos a cada parte con validación automática de elegibilidad
4. Visualizar el S-140 completo de cada semana
5. Exportar o imprimir el S-140 en un formato limpio

---

## 4. Funcionalidades

### 4.1 Módulo: Roster de la Congregación

**Descripción:** Catálogo de todos los hermanos de la congregación con los atributos necesarios para determinar su elegibilidad en cada tipo de asignación.

**Atributos de cada hermano:**
- Nombre completo
- Sexo (masculino / femenino)
- Rol (anciano / siervo ministerial / publicador / estudiante de la Biblia)
- Está aprobado para presidir la reunión (sí/no)
- Está aprobado para conducir el estudio bíblico (sí/no)
- Puede ser consejero de sala auxiliar (sí/no)
- Está activo (sí/no) — para ocultar temporalmente a hermanos no disponibles
- Notas opcionales (ej. "viaja frecuentemente en marzo")

**Funcionalidades:**
- Agregar, editar y desactivar hermanos
- Listado con filtros por rol y sexo
- Sin eliminación permanente (solo desactivación) para preservar historial

### 4.2 Módulo: Programa Semanal

**Descripción:** Importación automática del programa desde la guía de actividades (mwb PDF), con revisión y edición manual como respaldo.

#### Flujo principal: Importación automática desde PDF

1. El usuario descarga el PDF de la guía de actividades desde jw.org (archivo mwb_S_YYYYMM.pdf)
2. Lo abre desde la app (diálogo de archivos del sistema operativo)
3. El **parser integrado en Rust** extrae el texto del PDF y lo estructura automáticamente:
   - Detecta los límites de cada semana (encabezados de fecha)
   - Extrae el libro bíblico, canciones de apertura/intermedia/cierre
   - Identifica cada parte con su número, título, tipo de asignación, duración, sección
   - Determina automáticamente si requiere sala auxiliar y/o ayudante
4. La app muestra una **vista previa** con todas las semanas parseadas
5. El usuario revisa y corrige cualquier error de interpretación (~30 segundos por semana)
6. Confirma → las semanas y partes se guardan en la base de datos

#### Flujo alternativo: Ingreso manual

Si el usuario no tiene el PDF o prefiere hacerlo manualmente, puede crear semanas y partes una por una (como respaldo).

**Datos de la semana:**
- Fecha (rango, ej. "2-8 de marzo")
- Libro/capítulos bíblicos asignados
- Canción de apertura, canción intermedia (antes de Nuestra Vida Cristiana), canción de cierre

**Partes del programa:**
Cada parte tiene:
- Número de parte
- Sección (Tesoros / Seamos Mejores Maestros / Nuestra Vida Cristiana)
- Tipo de asignación (de un catálogo predefinido)
- Título (tomado de la guía)
- Duración en minutos
- Si requiere sala auxiliar (sí/no)
- Si requiere ayudante (sí/no)

**Tipos de asignación disponibles (catálogo):**
- Discurso (no-estudiante)
- Busquemos perlas escondidas
- Lectura de la Biblia
- Empiece conversaciones
- Haga revisitas
- Haga discípulos
- Explique sus creencias (discurso)
- Explique sus creencias (escenificación)
- Discurso (estudiante)
- Análisis con el auditorio
- Necesidades de la congregación
- Estudio bíblico de la congregación
- Oración

**Consideraciones de implementación:**
- Las semanas de asamblea no tienen reunión (se puede marcar como "semana sin reunión")
- La semana de la Conmemoración cancela la reunión Vida y Ministerio si cae entre semana
- Durante la visita del superintendente de circuito, el "Estudio bíblico" se reemplaza por su discurso de servicio (flag especial en la semana)
- El parser debe manejar variaciones menores en el formato del PDF entre distintas ediciones del mwb

### 4.3 Módulo: Asignaciones

**Descripción:** El corazón de la app. Permite asignar hermanos a cada parte del programa con validación de reglas.

**Flujo por semana:**
1. El usuario selecciona una semana del programa
2. Ve todas las partes del programa listadas
3. Para cada parte, selecciona al hermano (y ayudante si aplica) para el auditorio principal y la sala auxiliar
4. La app filtra automáticamente el selector para mostrar solo los hermanos elegibles según el tipo de asignación
5. El usuario asigna y guarda

**Validaciones automáticas:**
- Lectura de la Biblia, Discurso (estudiante), Explique sus creencias (discurso) → solo muestra varones
- Haga revisitas, Haga discípulos → ayudante debe ser del mismo sexo que el estudiante
- Necesidades de la congregación → solo muestra ancianos
- Presidente, Conductor del estudio, Consejero de sala → solo muestra hermanos con el flag correspondiente activado
- Hermanos desactivados no aparecen en los selectores

**Historial y rotación (básico para MVP):**
- La app muestra cuántas veces ha participado cada hermano en el bimestre actual
- Permite ver las últimas 2 asignaciones de cada hermano al hacer hover/tap en su nombre
- No impone rotación automática en el MVP, pero informa al usuario para que decida

**Semana completa:**
Además de las partes del programa, se asignan:
- Presidente de la semana
- Consejero de sala auxiliar
- Hermano que hace la oración de apertura
- Hermano que hace la oración de cierre

### 4.4 Módulo: Vista S-140

**Descripción:** Visualización del programa completo de una semana en el formato del formulario S-140.

**Características:**
- Muestra el S-140 tal como aparecería en el tablero de anuncios
- Columnas: Hora (rellenable manualmente o calculable) | Sala auxiliar | Auditorio principal
- Las partes no-estudiante solo tienen una columna (no se replican en sala auxiliar)
- Estado visual: partes sin asignar se destacan en color diferente
- Botón de imprimir / exportar a PDF

**Navegación entre semanas:**
- Vista de bimestre completo con indicador de progreso (cuántas semanas están completas)
- Acceso rápido a semana anterior / siguiente

---

## 5. Arquitectura Técnica

### 5.1 Stack Seleccionado

Dado el contexto (app personal, usuario único, sin necesidad de servidor), se eligió un stack **local-first de escritorio**:

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Plataforma** | Tauri 2 | Desktop app multiplataforma (Linux, Windows, macOS). Empaqueta el frontend web en un WebView nativo con backend Rust. Cero infraestructura — la app se ejecuta localmente. |
| **Frontend** | React 19 + TypeScript | SPA con estado rico para los selectores de asignación. TypeScript para type-safety en el modelo de datos y reglas de elegibilidad compartidas. |
| **Backend** | Rust (vía Tauri commands) | Lógica de elegibilidad, CRUD, y acceso a datos. Expuesto al frontend mediante `invoke()` de Tauri. |
| **Base de datos** | SQLite (rusqlite con feature `bundled`) | Archivo único en el filesystem del usuario. Portable, backupeable (copiar el archivo), sin servidor. |
| **Bundler** | Vite 7 | Dev server rápido con HMR. Output estático que Tauri empaqueta en el binario. |
| **Estilos** | Tailwind CSS v4 | Utility-first, rápido para construir UI limpia. Soporte nativo de `@media print` para la vista S-140. |
| **Router** | React Router v7 | Navegación SPA entre vistas (dashboard, hermanos, semanas, S-140). |
| **PDF parsing** | `lopdf` (Rust crate) | Extracción de texto desde el PDF del mwb sin dependencias externas. Alternativa: invocar `pdftotext` como subproceso. |
| **Package manager** | pnpm | Rápido, deterministico, ya configurado en el scaffold. |

**Ventajas de este stack sobre alternativas:**
- **Cero infraestructura**: no hay deploy, no hay servidor, no hay dominio. La app se instala como cualquier programa.
- **Datos locales**: el archivo SQLite vive en el disco del usuario. Se puede respaldar copiándolo a Drive/ Dropbox/ USB.
- **Impresión nativa**: el WebView accede al diálogo de impresión del sistema operativo.
- **Offline por diseño**: no hay llamadas de red.
- **Mobile-ready**: Tauri 2 soporta Android/iOS como target futuro si se necesita.
- **Performance**: Rust para las queries de elegibilidad y SQLite embebido sin overhead de ORM pesado.

### 5.2 Modelo de Datos

Implementado como tablas SQLite con structs Rust correspondientes (serde `Serialize`/`Deserialize` para pasar al frontend vía JSON).

**Tabla `hermanos`**
| Columna | Tipo | Notas |
|---------|------|-------|
| id | INTEGER PK | Autoincremental |
| nombre | TEXT NOT NULL | Nombre completo |
| sexo | TEXT NOT NULL | `masculino` / `femenino` |
| rol | TEXT NOT NULL | `anciano` / `siervo_ministerial` / `publicador` / `estudiante_biblia` |
| puede_presidir | INTEGER NOT NULL DEFAULT 0 | 0/1 |
| puede_conducir_estudio | INTEGER NOT NULL DEFAULT 0 | 0/1 |
| puede_ser_consejero_sala | INTEGER NOT NULL DEFAULT 0 | 0/1 |
| activo | INTEGER NOT NULL DEFAULT 1 | 0/1 — soft delete |
| notas | TEXT | Opcional |

**Tabla `semanas`**
| Columna | Tipo | Notas |
|---------|------|-------|
| id | INTEGER PK | |
| fecha_inicio | TEXT NOT NULL | ISO 8601 (YYYY-MM-DD) |
| fecha_fin | TEXT NOT NULL | ISO 8601 |
| libro_biblico | TEXT | |
| cancion_apertura | INTEGER | Número de canción |
| cancion_intermedia | INTEGER | |
| cancion_cierre | INTEGER | |
| tipo_especial | TEXT NOT NULL DEFAULT 'normal' | `normal` / `asamblea` / `conmemoracion` / `visita_superintendente` |
| presidente_id | INTEGER | FK → hermanos.id |
| consejero_sala_id | INTEGER | FK → hermanos.id |
| orador_oracion_apertura_id | INTEGER | FK → hermanos.id |
| orador_oracion_intermedia_id | INTEGER | FK → hermanos.id |
| orador_oracion_cierre_id | INTEGER | FK → hermanos.id |

**Tabla `partes`**
| Columna | Tipo | Notas |
|---------|------|-------|
| id | INTEGER PK | |
| semana_id | INTEGER NOT NULL | FK → semanas.id ON DELETE CASCADE |
| numero_orden | INTEGER NOT NULL | Orden dentro de la semana |
| seccion | TEXT NOT NULL | `tesoros` / `mejores_maestros` / `vida_cristiana` |
| tipo_asignacion | TEXT NOT NULL | Ver catálogo §4.2 |
| titulo | TEXT | |
| duracion_minutos | INTEGER | |
| requiere_sala_auxiliar | INTEGER NOT NULL DEFAULT 0 | 0/1 |
| requiere_ayudante | INTEGER NOT NULL DEFAULT 0 | 0/1 |

**Tabla `asignaciones`**
| Columna | Tipo | Notas |
|---------|------|-------|
| id | INTEGER PK | |
| parte_id | INTEGER NOT NULL | FK → partes.id ON DELETE CASCADE |
| ambito | TEXT NOT NULL | `auditorio_principal` / `sala_auxiliar` |
| rol | TEXT NOT NULL | `estudiante` / `ayudante` / `conductor` / `lector` |
| hermano_id | INTEGER NOT NULL | FK → hermanos.id |

> **Nota:** `presentador` fue removido del enum de roles — las partes no-estudiante son presentadas por el mismo hermano asignado como estudiante. Las partes de oración y presidencia se asignan directamente en la tabla `semanas`.

### 5.3 Lógica de Elegibilidad

Se implementa como un módulo Rust (`elegibility`) expuesto al frontend mediante un comando Tauri:

```rust
#[tauri::command]
fn get_eligible_brothers(
    tipo_asignacion: TipoAsignacion,
    rol: RolAsignacion,
    ambito: Ambito,
) -> Vec<Hermano> { ... }
```

El módulo recibe `tipo_asignacion`, `rol` y `ambito` y retorna los hermanos elegibles consultando SQLite con los filtros correspondientes. Esta lógica es la fuente de verdad única para filtrar los selectores en la UI.

El frontend React consume este comando vía `invoke("get_eligible_brothers", { ... })` desde los componentes de asignación.

### 5.4 Parser del MWB (PDF → Datos estructurados)

Módulo Rust (`mwb_parser`) que extrae el programa semanal desde el PDF de la guía de actividades.

**Pipeline:**
1. **Extracción de texto:** usando `lopdf` (crate Rust nativo para leer PDFs) o `pdftotext` como proceso externo
2. **Parseo línea por línea:** detecta encabezados de semana, secciones, canciones y partes mediante regex y heurísticas posicionales
3. **Clasificación de partes:** cada línea numerada se clasifica en un `TipoAsignacion` según palabras clave detectadas:

| Palabra clave detectada | TipoAsignacion | Sección | Sala aux | Ayudante |
|------------------------|----------------|---------|----------|----------|
| `"No tengas miedo"`, `"Una profecía"`, etc. (título libre, parte 1) | `discurso_no_estudiante` | tesoros | No | No |
| `Busquemos perlas escondidas` | `busquemos_perlas` | tesoros | No | No |
| `Lectura de la Biblia` | `lectura_biblia` | tesoros | Sí | No |
| `Empiece conversaciones` | `empiece_conversaciones` | mejores_maestros | Sí | Sí |
| `Haga revisitas` | `haga_revisitas` | mejores_maestros | Sí | Sí |
| `Haga discípulos` | `haga_discipulos` | mejores_maestros | Sí | Sí |
| `Explique sus creencias` + `Discurso` en texto | `explique_creencias_discurso` | mejores_maestros | Sí | No |
| `Explique sus creencias` (sin "Discurso") | `explique_creencias_escenificacion` | mejores_maestros | Sí | Sí |
| `Discurso` (en Seamos Mejores, parte numerada) | `discurso_estudiante` | mejores_maestros | Sí | No |
| `Análisis con el auditorio` | `analisis_auditorio` | vida_cristiana | No | No |
| `Necesidades de la congregación` | `necesidades_congregacion` | vida_cristiana | No | No |
| `Estudio bíblico de la congregación` | `estudio_biblico` | vida_cristiana | No | No |
| `Discurso` (en Vida Cristiana) | `discurso_no_estudiante` | vida_cristiana | No | No |

4. **Salida:** JSON con todas las semanas y partes, que el frontend muestra en una vista previa para revisión antes de guardar en BD.

```rust
#[tauri::command]
fn parse_mwb_pdf(path: String) -> Result<Vec<ParsedWeek>, String> { ... }

struct ParsedWeek {
    fecha_inicio: String,    // "2026-03-02"
    fecha_fin: String,       // "2026-03-08"
    libro_biblico: String,   // "Isaías 41, 42"
    cancion_apertura: u8,
    cancion_intermedia: u8,
    cancion_cierre: u8,
    tipo_especial: TipoEspecial,  // Normal, Asamblea, Conmemoracion
    partes: Vec<ParsedPart>,
}
```

**Precisión esperada:** ~90-95% de las partes se clasifican correctamente sin intervención. Las partes ambiguas (ej. "Explique sus creencias" sin subtipo claro) se marcan para revisión manual en la vista previa.

---

## 6. Interfaz de Usuario

### 6.1 Vistas Principales

La navegación se maneja con React Router. Cada vista es un componente React.

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `DashboardPage` | Dashboard: bimestre actual, semanas, estado de completitud |
| `/hermanos` | `HermanosListPage` | Listado y gestión del roster |
| `/hermanos/nuevo` | `HermanoFormPage` | Formulario para nuevo hermano |
| `/hermanos/:id/editar` | `HermanoFormPage` | Formulario para editar hermano existente |
| `/semanas` | `SemanasListPage` | Listado de semanas del bimestre |
| `/semanas/importar` | `ImportarMwbPage` | Subir PDF del mwb, vista previa del parseo, confirmar |
| `/semanas/:id` | `AsignacionesPage` | Vista de asignaciones de la semana |
| `/semanas/:id/s140` | `S140Page` | Vista S-140 imprimible |

### 6.2 Principios de UI

- Orientada a velocidad: lo que más se usa (asignar hermanos) debe hacerse en el menor número de clics posible
- Mobile-friendly: poder usar desde el teléfono durante una reunión si es necesario
- Sin distracciones: interfaz limpia, sin elementos decorativos innecesarios
- Feedback inmediato: al asignar a alguien inelegible, error claro con la razón

---

## 7. Fuera de Alcance (MVP)

Las siguientes funcionalidades quedan explícitamente fuera del MVP pero se documentan para futuras versiones:

- Algoritmo de rotación automática de hermanos
- Notificaciones o recordatorios a los participantes
- Múltiples congregaciones
- Autenticación / multi-usuario
- Historial de más de un bimestre en la vista de rotación
- Exportación al formato exacto del S-140 de la Watch Tower (replicar el formato oficial)
- Integración con JW Library o jw.org

---

## 8. Criterios de Éxito

El MVP se considera exitoso si:

1. Se puede crear el roster completo de la congregación en menos de 30 minutos
2. Se puede importar el programa de un bimestre completo (8-9 semanas) desde el PDF y revisarlo en menos de 5 minutos totales
3. Se puede completar todas las asignaciones de una semana en menos de 10 minutos
4. El S-140 generado tiene toda la información necesaria para colocarlo en el tablero de anuncios sin modificaciones adicionales
5. La app no permite asignaciones que violen las reglas del S-38

---

## 9. Riesgos y Consideraciones

| Riesgo | Mitigación |
|--------|------------|
| El programa varía semana a semana y tiene casos especiales (asamblea, conmemoración, visita del superintendente) | Manejar como tipos especiales de semana con lógica específica para cada caso |
| Las reglas del S-38 pueden cambiar en futuras ediciones | Centralizar la lógica de elegibilidad en un servicio para facilitar actualizaciones |
| El bimestre tiene ciclos de 2 meses y luego cambia el programa | Diseñar para que sea fácil iniciar un nuevo bimestre sin perder el historial anterior |
| El parser del PDF puede fallar con ediciones futuras del mwb si cambia el formato | Vista previa obligatoria antes de guardar. Flujo manual como respaldo. Tests con múltiples ediciones del mwb. |

---

## 10. Plan de Implementación (MVP)

### Fase 1 — Base (Semana 1-2)
- [x] Scaffold del proyecto (Tauri 2 + React 19 + TypeScript + Vite 7) — ya existe
- [ ] Agregar dependencias: `rusqlite` (bundled), `react-router`, Tailwind CSS v4
- [ ] Schema SQLite: crear tablas `hermanos`, `semanas`, `partes`, `asignaciones` desde Rust (migration inicial)
- [ ] Comandos Tauri: CRUD de Hermanos (`create_hermano`, `update_hermano`, `list_hermanos`, `deactivate_hermano`)
- [ ] Páginas React: `HermanosListPage`, `HermanoFormPage`
- [ ] Catálogo de tipos de asignación (enum en Rust, compartido con frontend)

### Fase 2 — Programa (Semana 2-3)
- [ ] Módulo Rust `mwb_parser`: extraer texto de PDF, parsear semanas y partes
- [ ] Comando Tauri: `parse_mwb_pdf(path)` que devuelve JSON estructurado
- [ ] Página React: `ImportarMwbPage` con vista previa del parseo y confirmación
- [ ] Comandos Tauri: CRUD de Semanas y Partes (para guardar lo parseado y edición manual)
- [ ] Páginas React: `SemanasListPage`, formulario manual de creación de semana con partes
- [ ] Lógica de semanas especiales (asamblea, conmemoración, visita superintendente)

### Fase 3 — Asignaciones (Semana 3-4)
- [ ] Módulo Rust `elegibility` con comando `get_eligible_brothers`
- [ ] Comandos Tauri: `assign_brother`, `get_assignments_for_part`
- [ ] Página React: `AsignacionesPage` con selectores filtrados por elegibilidad
- [ ] Página React: `S140Page` con vista imprimible

### Fase 4 — Pulido (Semana 4-5)
- [ ] Estilos de impresión (`@media print`) para el S-140
- [ ] Historial básico de participación (consulta SQL para últimas N asignaciones por hermano)
- [ ] Dashboard con indicador de progreso del bimestre
- [ ] Testing manual con datos reales de Casanay

---

*Este documento es la versión inicial del PRD. Está sujeto a revisión conforme avance el desarrollo.*
