# Documentación del Proyecto: Escuela (Asignaciones VyM)

Bienvenido a la documentación de desarrollo de la aplicación de escritorio para asignaciones de la Reunión Vida y Ministerio Cristianos.

## 🧭 Índice de Descubrimiento Progresivo

Para entender el proyecto y su diseño, lee los siguientes documentos en orden:

1. **[Contexto del Proyecto](project-context.md)**: El propósito de la aplicación, público objetivo y alcance del MVP.
2. **[Requerimientos y Reglas](requirements.md)**: Matriz de elegibilidad, semanas especiales, catálogo de tipos de asignación y modelo de datos. **Léelo antes de crear o modificar una feature de asignaciones.**
3. **[Guía de Diseño y UI: S-140](ux-guidelines.md)**: Especificación exacta de colores, fuentes, negritas y grilla matemática para generar el S-140 idéntico al oficial. (Implementación de referencia en `s140-mockup.html`).
4. **[Arquitectura y Modelo de Datos](architecture.md)**: Diagrama de componentes, base de datos SQLite y flujo del parser del mwb PDF.
5. **[Plan Maestro del MVP](master-plan.md)**: Plan detallado de 6 sprints con tareas, archivos, dependencias y criterios de aceptación.
6. **[Análisis del Sistema](system-analysis.md)**: Stack verificado contra el código, matriz de elegibilidad fila por fila, restricciones (S-140, parser, modelo de datos) y drift documentación vs implementación con fuentes primarias.

---

## 🛠️ Stack Tecnológico

* **Plataforma**: Tauri 2 (Desktop App local-first)
* **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + React Router v7
* **Backend**: Rust + SQLite (`rusqlite`)
* **Parser de PDF**: Módulo Rust `mwb_parser` con el crate `lopdf`
