# Escuela — Asignaciones VyM

Aplicación de escritorio local-first para gestionar el roster de la congregación y automatizar las asignaciones del programa semanal de la Reunión Vida y Ministerio Cristianos (formulario S-140).

## Stack

- **Plataforma**: Tauri 2 (Rust + WebView)
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + React Router v7
- **Backend**: Rust + SQLite (rusqlite)
- **Parser PDF**: lopdf (Rust nativo)

## Desarrollo

```bash
pnpm install
pnpm tauri dev
```

## Documentación

Toda la documentación del proyecto está en [.docs/](.docs/).
