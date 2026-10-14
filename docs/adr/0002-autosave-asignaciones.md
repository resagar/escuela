# 0002 — Autosave en selectores de asignación

Status: accepted

Asignar una semana completa son ~50 interacciones de selector. Decidido: cada cambio de
selector dispara `assign_brother` (UPSERT atómico) de inmediato; no existe estado
"sin guardar" ni botón de guardar.

Considered options: guardado explícito con botón (más fricción y riesgo de perder cambios
en un flujo de alto volumen, en una app local de usuario único).

Consequences: cada asignación es atómica y persistente al instante; la UI da feedback
"Guardado" ~2s; no hay rollback de sesión — corregir es re-asignar.
