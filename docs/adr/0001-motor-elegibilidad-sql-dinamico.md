# 0001 — Elegibilidad como SQL dinámico en Rust

Status: accepted

La app resuelve "qué hermanos son elegibles" para cada selector de la UI. Decidido:
`get_eligible_brothers` (src-tauri/src/eligibility/rules.rs) implementa las 21 ramas de
la matriz como SQL dinámico construido en Rust y ejecutado en SQLite; no hay motor de
reglas ni DSL.

Considered options: un motor de reglas/DSL (indirección innecesaria para 21 reglas que
cambian rara vez) y reglas en una tabla de DB (pierde tipado y verificación en
compile-time sin ganar configurabilidad útil).

Consequences: añadir un tipo de asignación = nueva variante del enum + nueva rama SQL;
la matriz completa es auditable en un solo archivo; no hay reglas configurables en runtime.
