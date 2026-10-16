# Spec: Ajuste de congregación — sala auxiliar

**Status:** ready-for-agent
**Fecha:** 2026-10-16
**Referencia:** nota de planificación `inkdrop://note/VKs1rz0d` (decisiones del usuario, 2026-10)

## Problema

La app asume que toda congregación tiene sala auxiliar: el parser del MWB infiere `requiere_sala_auxiliar` en cada parte según su tipo, y si la congregación no tiene sala auxiliar el Superintendente debe desmarcar "Sala aux." parte por parte, en cada importación de la guía y en cada edición de semana. Es trabajo manual repetido y fácil de olvidar. Además, hoy no existe ninguna pantalla de configuración de congregación donde declarar este hecho una sola vez, por lo que el ajuste no tiene dónde vivir.

## Solución

Una pantalla de **Configuración** — la primera de la app — donde el Superintendente declara si la congregación tiene sala auxiliar. El ajuste funciona como un **candado duro y no destructivo**:

- **Duro**: con la sala auxiliar desactivada, la app no permite marcarla en ningún editor, ni pide asignaciones, consejero o impresiones de ese ámbito.
- **No destructivo**: los datos ya guardados (marcas de partes, asignaciones de sala auxiliar, consejero) se conservan ocultos y reaparecen tal cual si el ajuste se reactiva.

Con el ajuste activo, el comportamiento actual de la app no cambia.

## Historias de usuario

1. Como Superintendente de la Reunión VyM, quiero declarar una sola vez si mi congregación tiene sala auxiliar, para no corregir ese dato semana por semana.
2. Como Superintendente, quiero que la importación del MWB respete el ajuste, para no revisar "Sala aux." parte por parte en cada guía.
3. Como Superintendente, quiero que con la sala auxiliar desactivada no se pueda marcar por error en ningún editor (candado duro), para que los formularios nunca salgan con contenido inconsistente.
4. Como Superintendente, quiero que el cambio aplique retroactivamente a las semanas ya importadas, para no tener que reeditarlas.
5. Como Superintendente, quiero que al reactivar la sala auxiliar reaparezca todo lo guardado, para no volver a capturar asignaciones.
6. Como Superintendente, quiero que la pantalla de asignaciones oculte el consejero y los selectores de sala auxiliar cuando el ajuste está desactivado, para no asignar a un ámbito que no existe.
7. Como Superintendente, quiero que el S-140 de una semana se imprima sin la fila del consejero de sala auxiliar cuando el ajuste está desactivado, para que refleje la realidad de la congregación.
8. Como Superintendente, quiero que el rango del S-140 (varias semanas) sea coherente con la vista de semana suelta, para imprimir bimestres completos sin sorpresas.
9. Como Superintendente, quiero que el S-140 conserve su fidelidad visual oficial cuando la sala auxiliar está activa, para seguir colgándolo en el tablero.
10. Como Superintendente, quiero que el S-89 no cambie, porque sus casillas de ubicación son parte fija del formulario oficial.
11. Como Superintendente, quiero que el valor por defecto sea "tiene sala auxiliar", para que actualizar la app no altere lo que ya funcionaba.
12. Como Superintendente, quiero que la configuración esté a un clic en la navegación principal, para ajustarla sin buscar.
13. Como Superintendente, quiero que desactivar la sala auxiliar no borre nada, para no perder trabajo si me equivoco.
14. Como Superintendente, quiero que la pantalla de Configuración quede preparada para futuros ajustes de congregación, para no rehacer el lugar donde viven.

## Decisiones de implementación

- **Persistencia**: tabla singleton `congregation_settings` (una sola fila) con `has_auxiliary_room INTEGER NOT NULL DEFAULT 1`, creada con el patrón de migración idempotente que ya usa la app. El default `1` ("tiene sala auxiliar") preserva el comportamiento actual en instalaciones nuevas y existentes.
- **Backend**: comandos `get_congregation_settings` / `update_congregation_settings` como wrappers finos sobre un módulo de settings con funciones puras sobre la conexión SQLite (mismo estilo de responsabilidad única que el resto de comandos).
- **UI**: ruta `/configuracion` con la página **Configuración**, entrada fija en el nav principal y breadcrumb. Un solo control por ahora: interruptor "La congregación tiene sala auxiliar". La página queda lista para futuros ajustes (p. ej., el nombre de congregación, hoy fijo en la plantilla del S-140).
- **Flag efectivo**: helper único del frontend que combina el ajuste con la marca guardada: `has_auxiliary_room && parte.requiere_sala_auxiliar`. Todas las vistas consumen el flag efectivo; el dato guardado nunca se reescribe por el ajuste (decisión no destructiva).
- **Candado duro en editores**: en el editor de importación del MWB y en el formulario de semana, la casilla "Sala aux." queda deshabilitada con un aviso y enlace a Configuración cuando el ajuste está off. (Detalle de UI asumido: deshabilitar con aviso en lugar de ocultar; revisable.)
- **Asignaciones**: con el ajuste off se ocultan el selector "Consejero de la sala auxiliar" y todos los selectores del ámbito sala auxiliar; las asignaciones guardadas de ese ámbito quedan ocultas y reaparecen al reactivar.
- **S-140**: la fila "Consejero de la sala auxiliar" pasa a renderizarse de forma condicional (oculta con el ajuste off). Los encabezados "Sala auxiliar"/"Auditorio principal" por sección ya se adaptan solos hoy cuando ninguna parte de la sección la requiere. Aplica a la vista de semana suelta y al rango. La guía visual (`ux-guidelines.md`) se actualiza con la regla condicional, porque es la referencia obligatoria de fidelidad del formulario.
- **Modelo de datos intacto**: el ADR 0003 sigue vigente — los roles del marco (presidente, consejero de sala, oradores) siguen siendo columnas FK de `semanas`; el ajuste solo condiciona su visualización, no el modelo. Sin migraciones destructivas.
- **Documentación**: `requirements.md` (sección de configuración de congregación), `architecture.md` y `schemaDB.md` (tabla nueva), `ux-guidelines.md` (fila condicional).

## Decisiones de pruebas

- Un buen test aquí verifica comportamiento externo (valores por defecto, persistencia, idempotencia), no detalles de SQL.
- **Seam único (Rust)**: el módulo de settings como funciones puras sobre la conexión, con tests unitarios dentro del módulo sobre una BD SQLite temporal — mismo patrón que los tests del módulo de elegibilidad. Casos: (a) BD nueva → default `1`; (b) reapertura → migración idempotente sin errores ni filas duplicadas; (c) update → get devuelve el valor nuevo; (d) el valor sobrevive a la reapertura.
- **Frontend**: hoy no existe runner de tests y se decidió no añadir infraestructura. El cableado del flag efectivo se verifica con la pasada manual de cada ticket (importación, formulario de semana, asignaciones, S-140 en ambos estados, S-89 sin regresión).
- **Pasada manual transversal**: ciclo on → off → on con datos ya cargados, comprobando que nada se pierde y que todo reaparece.

## Fuera de alcance

- Cambios al S-89: sus casillas "Sala principal / Sala auxiliar núm. 1" son parte fija del formulario (decisión del usuario).
- Ajuste del nombre de congregación (queda para una iteración futura de Configuración).
- Borrado o limpieza de datos de sala auxiliar existentes (decisión: conservar).
- Soporte multi-congregación (fuera del alcance del producto).
- Infraestructura de tests de frontend (vitest u otra): descartada en la revisión de seams con el usuario.
- Semanas especiales (asamblea, conmemoración, visita del superintendente): tienen sus propias reglas y su propio trabajo de planificación.

## Notas adicionales

- Referencia de planificación: `inkdrop://note/VKs1rz0d` (contiene referencias de código y el historial de decisiones).
- Hallazgo verificado: el S-140 ya oculta los encabezados de sala auxiliar por sección cuando ninguna parte la requiere; lo único que faltaba era la fila del consejero.
- Existe una página de detalle de semana sin ruta y con un chip "Sala aux." obsoleto (código muerto detectado); su limpieza es candidata a un ticket aparte porque requiere confirmación.
- El candado duro es consistente con el principio no destructivo del resto de la app (p. ej., borrado suave de hermanos).
