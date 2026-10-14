# Ticket 01 — Ayudante de `haga_revisitas`/`haga_discipulos`: solo mismo sexo

**Status:** resuelto — fix (a) aplicado
**Tipo:** bug — el código viola una regla documentada
**Regla:** `docs/user/requirements.md` §3, filas `haga_revisitas`/`haga_discipulos` + `ayudante` (texto oficial §8/§10: "alguien del mismo sexo")
**Drift:** `docs/user/system-analysis.md` §4.1 (#1); nota pendiente en `docs/user/requirements.md:53`

## Actual Behavior

`get_eligible_brothers` para `(haga_revisitas, ayudante)` y `(haga_discipulos, ayudante)` —con `estudiante_id` y `sexo_estudiante` presentes, que es siempre el caso desde la UI (`src/pages/AsignacionesPage.tsx:214-215,236-237,293-294`)— genera SQL:

```sql
WHERE activo = 1 AND (sexo = ?2 OR <family_subquery>)
```

(`src-tauri/src/eligibility/rules.rs:140-141` y `:204-205`). Eso hace elegible a **cualquier familiar, incluidos de distinto sexo**.

**Reproducción (datos reales de `escuela.db`, estudiante_id=19, Alianyelis Colmenares, femenino):**

- **Rojo: 24 elegibles** — las 23 mujeres **más Ali Colmenares (id 14, masculino)**, su hermano. Viola §8.
- Segundo caso: estudiante_id=2 (Daylibell de Garcia) → aparece Rene Garcia (id 1, anciano), su hermano.

## Expected Behavior

Ayudante = alguien del **mismo sexo** que el estudiante (§8/§10). La concesión "o un familiar" aplica solo a `empiece_conversaciones` (§7) y `explique_creencias_escenificacion` (§11) — ver `requirements.md:51`.

## Root Cause

Las dos ramas copiaron el patrón de `empiece_conversaciones` (`rules.rs:67-119`), que sí incluye el `OR <family_subquery>`. El `family_subquery` (`rules.rs:16-21`) está bien definido; el error es usarlo en las dos ramas donde el texto oficial no lo permite.

## Fix — propuesto, pendiente de confirmación

Dos alternativas; la diferencia es visible en datos reales (hermanas de Alianyelis: Aislin 20, Audelis 23, Mayerlin 24):

### Fix (a) — "solo mismo sexo" (recomendado)

Lectura literal de `requirements.md:53` ("son solo mismo sexo"). Colapsar la rama a la forma que ya tienen las ramas sin `estudiante_id` (`rules.rs:160-182`):

```diff
-        ("haga_revisitas", "ayudante") => {
-            if let Some(eid) = estudiante_id {
-                if let Some(sex) = sexo_estudiante {
-                    (
-                        format!(
-                            "SELECT ... WHERE activo = 1
-                                         AND (sexo = ?2 OR {})
-                             ORDER BY nombre",
-                            family_subquery
-                        ),
-                        vec![Box::new(eid), Box::new(sex.to_string())],
-                    )
-                } else { /* todos */ }
-            } else { /* sexo o todos */ }
-        }
+        ("haga_revisitas", "ayudante") => {
+            if let Some(sex) = sexo_estudiante {
+                (
+                    "SELECT ... WHERE activo = 1 AND sexo = ?1
+                     ORDER BY nombre".into(),
+                    vec![Box::new(sex.to_string())],
+                )
+            } else {
+                "SELECT ... WHERE activo = 1 ORDER BY nombre".into(), vec![]
+            }
+        }
```

Ídem para `haga_discipulos` (`rules.rs:195-247`). Resultado con estudiante 19: **23 elegibles** (sus 3 hermanas siguen elegibles — son del mismo sexo). `estudiante_id` deja de influir en estas dos ramas (la firma del comando no cambia; otros tipos sí lo usan).

### Fix (b) — "mismo sexo y no familiar"

Si "no familiares" en `requirements.md:35,37` es una exclusión (no solo la ausencia del permiso extra):

```diff
-AND (sexo = ?2 OR {})
+AND sexo = ?2 AND id NOT IN ({})
```

Resultado con estudiante 19: **19 elegibles** (excluye a sus 3 hermanas). Más estricto, pero el texto oficial no dice explícitamente "no familiares" para §8/§10.

## Test (seam propuesto, a acordar)

`src-tauri/tests/parser_test.rs` ya existe, pero `mod eligibility` es privado (`lib.rs:3`) — un integration test en `tests/` no lo alcanza. Propuesta: **unit test** `#[cfg(test)]` dentro de `src/eligibility/rules.rs` (o `src/eligibility/tests.rs`), con SQLite in-memory (`rusqlite` ya es dependencia; no hace falta `dev-dependencies`): insertar una familia tipo Colmenares (1 varón + 3 mujeres) y afirmar que para `(haga_revisitas, ayudante)` con estudiante femenino **el varón no aparece** (y bajo fix (b), que sus hermanas tampoco).

## Related Issues

- Drift #5 (conmemoración incondicional) y #6 (visita_superintendente sin anulación de sala auxiliar): tickets aparte.
- Tras aplicar: actualizar la nota "Drift pendiente" en `requirements.md:53` y el status de este ticket a `resuelto`.

## Registro de resolución

- **2026-10-13**: fix (a) aplicado en `src-tauri/src/eligibility/rules.rs` — las ramas `(haga_revisitas, ayudante)` y `(haga_discipulos, ayudante)` colapsaron a la forma `sexo = ?1` (sin `estudiante_id`, sin `family_subquery`). Verificación: `cargo test` — 3 tests nuevos + 8 tests de parser existentes, todos verdes. Pendiente: prueba manual en la app (selector de ayudante con estudiante femenino de familia mixta) y commit.
