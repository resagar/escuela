# Semanas especiales en la importación del mwb

## Problem Statement

El superintendente importa el bimestre desde la guía de actividades (mwb), pero el mwb publicado **no marca** las semanas especiales: la app las detecta por palabras clave que no aparecen en los archivos reales, así que todas las semanas entran como normales.

Eso produce tres problemas:

- Las semanas **sin reunión** (asamblea y conmemoración) se guardan como semanas normales, con partes asignables y S-140/S-89 imprimibles.
- La semana de la **visita del superintendente** se importa con clases auxiliares y estudio bíblico, cuando el programa real no tiene sala auxiliar y el estudio se reemplaza por el discurso de servicio.
- La única corrección posible hoy es editar la semana **después** de importarla, y esa edición no ajusta las partes: hay que limpiarlas a mano.

## Solution

Durante la vista previa de importación, cada semana puede marcarse con su tipo: normal, asamblea, conmemoración o visita del superintendente. Los ajustes se aplican **antes de guardar**:

- **Asamblea y conmemoración:** la semana no se guarda (no hay reunión).
- **Visita del superintendente:** todas las partes quedan sin sala auxiliar y sin el estudio bíblico.
- **El resto de semanas** se importa exactamente como hoy.

La corrección posterior sigue disponible al editar una semana ya guardada, y al pasar una semana a "visita" sus partes se ajustan de la misma forma.

## User Stories

1. Como superintendente, quiero marcar una semana como asamblea en la vista previa de importación, para que no se guarde y no aparezca como semana asignable.
2. Como superintendente, quiero marcar una semana como conmemoración en la vista previa, para que no se guarde.
3. Como superintendente, quiero ver un aviso de "sin reunión" al marcar asamblea o conmemoración, para confirmar que el efecto es el que espero.
4. Como superintendente, quiero poder devolver una semana a "normal" antes de importar, para deshacer el marcado si me equivoqué.
5. Como superintendente, quiero que las semanas que no marco se importen exactamente como hoy, para no arriesgar el resto del bimestre.
6. Como superintendente, quiero marcar una semana como visita del superintendente, para que sus partes se importen sin sala auxiliar.
7. Como superintendente, quiero que la semana de visita no conserve el estudio bíblico, porque en el programa real lo reemplaza el discurso de servicio.
8. Como superintendente, quiero que la semana de visita se identifique en la pantalla de asignación, para recordar mientras asigno que no hay clases auxiliares.
9. Como superintendente, quiero que el S-140 de una semana de visita no muestre clases auxiliares, para que el formulario impreso refleje el programa real.
10. Como superintendente, quiero corregir el tipo de una semana ya guardada, para arreglar una importación equivocada.
11. Como superintendente, quiero que al cambiar una semana guardada a visita sus partes se limpien solas (sin sala auxiliar, sin estudio), para no editarlas una por una.
12. Como superintendente, quiero que las asignaciones de sala auxiliar existentes no queden huérfanas cuando el ajuste quita esa sala.
13. Como superintendente, quiero decidir yo si una conmemoración de fin de semana tiene reunión, sin que la app me imponga la regla del día.
14. Como superintendente, quiero marcar el tipo semana a semana (no en bloque), porque las semanas especiales son poco frecuentes.
15. Como superintendente, quiero que el tipo editado se guarde correctamente aunque el frontend y la base de datos usen formatos distintos, para no acabar con una semana con tipo corrupto.
16. Como superintendente, quiero que marcar el tipo de una semana no afecte a las semanas no seleccionadas.
17. Como superintendente, quiero que marcar un tipo especial no descarte las ediciones de partes que ya hice en esa semana (título, tipo de asignación, duración).
18. Como quien mantiene la app, quiero tests automatizados del módulo puro de transformación, para detectar regresiones cuando se toque la importación.
19. Como quien mantiene la app, quiero que la construcción del payload esté fuera del componente, para poder probarla sin montar la interfaz.
20. Como quien mantiene la app, quiero que el comportamiento actual del importador quede caracterizado por tests antes de añadir los tipos, para refactorizar con red.

## Implementation Decisions

- El marcado manual vive en la **vista previa de importación**: un selector de tipo por semana; las opciones con "sin reunión" reutilizan el render de semana especial que ya existe.
- **Asamblea y conmemoración** se excluyen del lote de importación: no se guardan en la base de datos.
- **Visita del superintendente**: la semana se importa con todas las partes sin sala auxiliar y sin la parte de estudio bíblico. No se sintetiza la parte del discurso de servicio: el discurso se maneja fuera de la app.
- **Conmemoración sin validación de fecha**: el superintendente decide en cada caso si esa semana tiene reunión.
- Un **módulo puro de planificación de importación** concentra la transformación (aplicar ediciones de partes, aplicar el tipo por semana, excluir semanas sin reunión, ajustar visita) y expone una utilidad de ajuste de visita reutilizable.
- La **edición de semana** reutiliza esa utilidad: al guardar con tipo visita, ajusta el estado local de partes antes del re-guardado; los comandos existentes ya limpian las asignaciones de sala al quitar la sala auxiliar y al borrar partes.
- El **tipo** viaja al backend en el formato del enum serializado y el comando de importación lo persiste en el formato de la base; la normalización es responsabilidad del módulo puro y está cubierta por tests.
- **Sin cambios** al parser mwb (la detección por palabra clave queda como está) ni a los comandos del backend.
- Las **etiquetas de tipo de semana** hoy duplicadas en varias páginas se consolidan en un único lugar y las usa el selector.
- El **badge existente** en la pantalla de asignación se mantiene como indicador de la visita (decisión: basta).
- **Prefactoring primero:** el ticket 01 extrae la transformación y añade tests de caracterización sin cambiar comportamiento.

## Testing Decisions

- Se prueba solo el **comportamiento externo** de las funciones puras: dada una lista de semanas parseadas, una selección y ediciones, el payload resultante; nunca el estado interno de React.
- **Seam único:** el módulo puro de planificación de importación (el punto más alto sin montar React). La utilidad de ajuste de visita se prueba por el mismo seam.
- **Infra nueva:** vitest como runner de los tests de frontend, con su script en `package.json` (aprobado en el desglose de tickets). Prior art conceptual: los tests del parser, que inyectan texto y verifican el resultado.
- Casos cubiertos: exclusión de asamblea/conmemoración, ajuste de visita (sala auxiliar y estudio), normalización del tipo, y caracterización del comportamiento actual del import (prefactor).
- **Verificación manual** por ticket: importar un mwb real marcando cada tipo y revisar lista de semanas, pantalla de asignación y S-140; además del cambio normal → visita en la edición de semana.

## Out of Scope

- Validación automática del día de la semana en conmemoraciones.
- Sintetizar o asignar la parte del "Discurso de servicio" del superintendente.
- Marcado en bloque o por rango de fechas.
- Cambios al parser mwb.
- Cambios en comandos o reglas del backend.
- Migrar o corregir en lote semanas especiales ya guardadas (se corrigen una a una, si aparece el caso).

## Further Notes

- Origen: nota de planificación de Inkdrop «Funcionalidad para semanas sin reunion por asamblea, visita del superintendente o conmemoracion», con las 6 decisiones del usuario registradas allí.
- Revierte parcialmente dos tickets cerrados como **no-aplica** (conmemoración y visita); el ticket 05 actualiza la documentación y su estado, sin borrar su historia.
- Formato del tipo: el frontend recibe el enum en PascalCase y la base usa snake_case; hoy la vista previa chequea ambos formatos — cuidar la normalización al editar.
- La edición de semana guarda primero la semana y luego re-guarda las partes; el ajuste debe hacerse en el estado local para no reintroducir los valores viejos.
- Referencias del dominio: requirements §4 (tipos de semana especial), §5 (integridad de sala auxiliar) y el término "Semana especial" del glosario.
