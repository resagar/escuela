# Guía para Agentes de IA (AGENTS.md)

Este repositorio contiene la aplicación de escritorio **Escuela**, una herramienta local-first para gestionar el roster de la congregación, parsear la guía de actividades (mwb) y automatizar las asignaciones del programa semanal de la Reunión Vida y Ministerio Cristianos (S-140).

## 🧭 Documentación Progresiva

Toda la documentación detallada del proyecto está organizada en la carpeta `.docs/`. **No agregues explicaciones extensas a este archivo.**

* **Punto de Entrada**: Lee **`.docs/README.md`** para navegar por los documentos de diseño, arquitectura y base de datos.
* **Guía Visual del S-140**: Lee **`.docs/ux-guidelines.md`** antes de modificar cualquier vista de impresión. La plantilla de referencia exacta está en **`s140-mockup.html`**.

## 🛠️ Stack y Comandos de Desarrollo

* **Stack**: Tauri 2 (Rust) + React 19 + TypeScript + Vite 7 + SQLite.
* **Gestor de Paquetes**: `pnpm`

### Comandos frecuentes:
* `pnpm install` - Instalar dependencias del frontend.
* `pnpm tauri dev` - Iniciar la aplicación en modo desarrollo (inicia Vite + ventana Tauri).
* `pnpm tauri build` - Compilar el instalador nativo de escritorio.

## ⚠️ Reglas No Negociables de Operación

1. **Idioma de Comunicación**: Toda la comunicación (planes, discusiones, explicaciones, respuestas) debe ser en **Español**.
2. **Idioma del Código**: Todo lo relacionado con el código (nombres de variables, comentarios, commits, tablas, endpoints) debe escribirse en **Inglés**.
3. **Diseño Visual S-140**: La fidelidad visual del formulario S-140 generado debe ser idéntica al oficial. Cualquier cambio en los componentes de visualización o impresión del S-140 debe cumplir estrictamente con **`.docs/ux-guidelines.md`**.
