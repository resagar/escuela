# Spec: Ver y reactivar hermanos inactivos

## Problema

Cuando un hermano del roster se desactiva (baja lógica, `activo = 0`) desaparece de la pantalla Hermanos y de todos los selectores de asignación, y no queda ninguna forma en la app de verlo ni de revertirlo: recuperar una baja equivocada exige editar la base de datos a mano.

Quien gestiona el roster no puede auditar quiénes están inactivos, ni corregir una desactivación sin riesgo.

## Solución

La pantalla Hermanos gana un filtro Activos/Inactivos. La vista de inactivos muestra a los hermanos dados de baja con un indicador "Inactivo", conserva el enlace Editar y ofrece la acción "Reactivar" con confirmación.

Al reactivar, el hermano vuelve automáticamente a las listas y a los selectores de asignación —todos los filtros se basan en `activo = 1`— con todo su historial intacto. La baja sigue siendo lógica: nunca se borra a un hermano.

Además, editar a un hermano deja de borrar sus notas (bug encontrado al planificar la feature).

## Historias de usuario

1. Como responsable del roster, quiero ver a los hermanos inactivos desde la pantalla Hermanos, para saber quiénes fueron dados de baja.
2. Como responsable del roster, quiero alternar entre Activos e Inactivos sin salir de la pantalla, para revisar el roster sin interrumpir mi flujo.
3. Como responsable del roster, quiero que la vista por defecto siga mostrando solo activos, para que mi uso diario no cambie.
4. Como responsable del roster, quiero que cada hermano inactivo lleve un indicador visible, para distinguirlo de un vistazo.
5. Como responsable del roster, quiero reactivar a un hermano con un clic, para corregir una baja equivocada sin tocar la base de datos.
6. Como responsable del roster, quiero que la reactivación pida confirmación, para evitar reactivaciones accidentales.
7. Como responsable del roster, quiero que tras reactivar el hermano desaparezca de la vista de inactivos y aparezca en la de activos, para confirmar que la acción funcionó.
8. Como responsable del roster, quiero poder editar los datos de un hermano inactivo antes de reactivarlo, para corregir la causa de su baja.
9. Como responsable del roster, quiero que editar a un hermano no borre sus notas, para conservar sus circunstancias especiales.
10. Como responsable del roster, quiero que la lista de inactivos no ofrezca "Desactivar", para no ejecutar acciones sin sentido.
11. Como responsable del roster, quiero poder desactivar desde la vista de activos como hasta hoy, para no perder la funcionalidad existente.
12. Como responsable de las asignaciones, quiero que los inactivos no aparezcan en los selectores mientras estén inactivos, para no asignarles partes por error.
13. Como responsable de las asignaciones, quiero que un hermano reactivado vuelva a aparecer en los selectores, para poder asignarle partes de nuevo.
14. Como responsable del roster, quiero que un hermano reactivado conserve su historial de asignaciones, para no perder su registro.
15. Como responsable del roster, quiero que los inactivos sigan visibles en el detalle de su familia, para entender la composición del hogar.
16. Como responsable del roster, quiero que el estado de cada hermano se conserve al cerrar y reabrir la app, para que la vista sea consistente.
17. Como miembro del equipo, quiero que la documentación refleje la reactivación y las decisiones tomadas, para mantener las reglas del proyecto al día.

## Decisiones de implementación

- **Dominio**: la baja sigue siendo lógica y nunca se elimina a un hermano; reactivar es la transición inversa de la desactivación. Compatible con el ADR 0003 (soft delete obligatorio).
- **Backend**: nuevo comando `reactivate_hermano(id)`, registrado junto a los comandos de hermanos existentes. La lógica de cambio de estado se extrae a una función compartida sobre la conexión SQLite que ambos comandos (activar y desactivar) delegan — mismo patrón que la elegibilidad: comando delgado sobre funciones que reciben la conexión.
- **Listado**: se reutiliza el comando de listado de hermanos con el parámetro de "solo activos" en falso; ya devuelve el estado de cada hermano y ordena por nombre. No se crea un comando de listado nuevo.
- **Pantalla Hermanos**: filtro segmentado Activos/Inactivos con botones (patrón de toggle ya usado en el formulario de hermano). La vista de inactivos filtra del lado del cliente por estado; sus filas llevan el indicador "Inactivo", el enlace Editar y la acción Reactivar con confirmación nativa (igual que Desactivar). Tras reactivar, la lista se recarga.
- **Bug de notas**: el formulario de edición conserva y reenvía las notas cargadas en lugar de enviar un valor vacío; el contrato del comando de actualización no cambia.
- **Documentación**: se actualizan la sección de soft delete de los requisitos (§5) y la tabla de comandos de la documentación de arquitectura.
- **Decisiones de alcance** (confirmadas por el usuario en el plan, Q1–Q7): filtro en la misma pantalla; comando separado del de actualización; edición de inactivos permitida; arreglo del bug de notas dentro de esta feature; sin fecha/motivo de baja; sin reactivación por lotes; los inactivos siguen visibles en el detalle de familia (solo se documenta).

## Decisiones de testing

- Un buen test aquí comprueba el comportamiento externo de la transición de estado (desactivar y reactivar contra la base), no detalles de implementación.
- **Seam único**: funciones Rust que reciben la conexión SQLite, probadas con conexión in-memory replicando el DDL de la tabla de hermanos. Es el mismo patrón (y prior art) de los tests de elegibilidad existentes.
- Cobertura: desactivar → reactivar deja `activo = 1`; reactivar a un hermano ya activo es un no-op seguro; un id inexistente no rompe (mismo comportamiento que desactivar).
- **Frontend**: el repo no tiene framework de tests; no se introduce uno por esta feature. La verificación de la UI es manual, con pasos concretos en los tickets.
- No se añaden tests de comandos Tauri ni harness nuevo: el punto más alto testeable sin infraestructura nueva es la función sobre la conexión.

## Fuera de alcance

- Registrar fecha y/o motivo de la baja: requeriría una columna nueva y manejo de migración; feature aparte si se necesita.
- Reactivación por lotes: los casos son aislados (YAGNI).
- Cambiar la visibilidad de los inactivos en el detalle de familia: se deja como está y se documenta.
- Auditoría de quién activa, desactiva o reactiva.

## Notas adicionales

- Plan de origen: nota de Inkdrop [Funcionalidad para Ver a los hermanos inactivos y poder reactivarlos](inkdrop://note/WMfnYuqK); las preguntas Q1–Q7 quedaron decididas por el usuario (2026-10).
- ADR relevante: `docs/adr/0003-modelo-datos.md` (soft delete obligatorio). La reactivación no contradice el ADR: no borra nada.
- El historial de participación ya funciona con hermanos inactivos y no se toca; la reactivación restaura la elegibilidad sola, porque todos los selectores filtran por `activo = 1`.
