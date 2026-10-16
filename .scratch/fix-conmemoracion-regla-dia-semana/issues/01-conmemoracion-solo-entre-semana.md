# Ticket 01 — Conmemoración: solo "sin reunión" si cae entre semana

**Status:** cerrado — **no-aplica** (el mwb no marca semanas de Conmemoración; no hay input mecanizado)
**Tipo:** bug — el código implementa un proxy, no la regla documentada
**Regla:** `docs/user/requirements.md:61` — "Sin reunión **si cae entre semana** (§23)"
**Drift:** `docs/user/system-analysis.md` §4.2 #5

## Actual Behavior

El parser detecta la keyword "CONMEMORACIÓN" en el cuerpo (`src-tauri/src/mwb_parser/mod.rs:471-473`) y, si la semana además carece de estructura regular (`!has_regular_structure`, `mod.rs:460-468`), fija `TipoEspecial::Conmemoracion` (`mod.rs:476-481`) y devuelve `partes = Vec::new()` (`mod.rs:490-496`). **Nunca se consulta el día de la semana** en que cae la Conmemoración: la decisión usa "no hay estructura regular" como proxy de "cae entre semana".

## Expected Behavior

La regla es basada en el día: Conmemoración entre semana (lun–vie) → sin reunión; fin de semana (sáb/dom) → reunión normal con sus partes.

## Root Cause

`parse_week_block` (`mod.rs:430-508`) no extrae la fecha de la Conmemoración del texto — no hay nada de lo que calcular el weekday. El proxy de estructura funciona en el caso común (el mwb de una Conmemoración entre semana no trae las secciones regulares), pero es una regla distinta a la documentada y diverge en los casos límite.

## Fix — propuesta, pendiente de input

- **Opción A (regla basada en el día):** extraer del texto del mwb la fecha de la Conmemoración y calcular su weekday: lun–vie → `Conmemoracion` sin partes; sáb/dom → `Normal` con partes parseadas.
- **Opción B (documentar el proxy):** si con muestras reales se demuestra que `!has_regular_structure` es equivalente a "cae entre semana" en la práctica, cerrar como doc-only (documentar el proxy en `requirements.md:61`) y no tocar el parser.

## Input necesario (bloquea el fix)

Un mwb real con semana de Conmemoración en `refs/` — idealmente dos: uno con la Conmemoración entre semana y uno en fin de semana — para decidir entre la opción A y la B y diseñar la extracción de la fecha. (Los PDFs reales de `refs/` son la fuente de validación del parser.)

## Verification

Con el sample real: importar y verificar `tipo_especial` y el nº de partes resultante contra la regla (`requirements.md:61`).

## Cierre (2026-10-13)

**No-aplica.** Verificado en `escuela.db`: las 13 semanas importadas son todas `normal`; el parser solo pondría `Conmemoracion` al encontrar la keyword "CONMEMORACIÓN" en el cuerpo del mwb (`mwb_parser/mod.rs:471-474`), que **no aparece** en los mwb reales (`refs/mwb_S_202609 (1).pdf`). La única vía actual sería marcarlo manualmente desde `SemanaForm.tsx:319-321`, pero se decidió no manejar conmemoraciones en esta app. La regla §23 (weekday) queda pendiente de una decisión UX si se admite el marcaje manual. Drift `docs/user/system-analysis.md` §4.2 #5 → `no-aplica`.

## Reversión (2026-10-16)

Reabierto por el feature de semanas especiales (`.scratch/special-weeks/spec.md`, tickets 01–05). Lo implementado:
- El marcaje manual ya existe: semana a semana en la vista previa de importación (`src/pages/ImportarMwbPage.tsx` + `src/lib/importPlanner.ts`).
- La **opción A** (validar el día de la semana) quedó descartada: la decisión es manual, caso a caso — la app **no valida el día**.
- Al marcar una semana como conmemoración (o asamblea), `buildImportPayload` la excluye: **no se guarda** ningún registro. Con eso el input pendiente de este ticket (un mwb real de conmemoración) deja de ser necesario.

`requirements.md` §4 quedó actualizada a este comportamiento; el drift §4.2 #5 pasa a **resuelto**.
