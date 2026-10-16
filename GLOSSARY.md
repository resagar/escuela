# Escuela — Asignaciones VyM

Vocabulario del dominio: gestión del roster de la congregación y automatización de
las asignaciones del programa semanal de la Reunión Vida y Ministerio Cristianos.

## Language

### Entidades

**Hermano**: Miembro del roster de la congregación, de cualquier sexo. Incluye hermanas y no bautizados.
_Avoid_: miembro, persona, publicador (como supertipo)

**Roster**: El conjunto de hermanos de la congregación gestionados por la app.
_Avoid_: lista de hermanos, base de datos

**Familia**: Grupo de hermanos que comparten hogar; habilita la regla de ayudante "o familiar".

**Semana**: Programa de una semana de reunión: fechas, libro bíblico, canciones y tipo especial. Contiene las partes y los roles del marco.

**Parte**: Item numerado del programa con título, duración, tipo de asignación y sección. Puede requerir sala auxiliar y/o ayudante.

**Asignación**: Colocación de un hermano en un papel de parte de una parte y un ámbito. Única por (parte, ámbito, papel de parte).

**S-140**: Formulario oficial de asignaciones de la reunión; la app lo genera con fidelidad visual exacta.

**S-89**: Formulario oficial de tarjetas de asignación por estudiante.

### Puesto de servicio

**Anciano**: Hermano con el puesto de servicio más alto; único elegible para "necesidades de la congregación".

**Siervo ministerial**: Hermano con puesto de servicio auxiliar; elegible para los mismos papeles no-estudiante que el anciano, excepto necesidades.

**Publicador**: Hermano bautizado que no es anciano ni siervo ministerial; elegible para partes de estudiante según la matriz.

**No bautizado**: Hermano que no es bautizado; no elegible para oración ni lector.
_Avoid_: estudiante bíblico

**Bautizado**: Hermano cuyo puesto de servicio no es "no bautizado" (anciano, siervo ministerial o publicador).

### Papel de parte

**Estudiante**: El hermano que recibe la parte. No confundir con "no bautizado" (puesto de servicio).
_Avoid_: predicador, expositor

**Ayudante**: Hermano que asiste al estudiante en una parte con ayudante; su elegibilidad (sexo/familiar) está en requirements.md §3.

**Conductor**: Hermano que conduce el estudio bíblico; requiere la capacidad de conducir estudio.

**Lector**: Hermano que lee en el estudio bíblico; debe ser varón bautizado.

### Roles del marco

**Presidente**: Hermano que conduce la reunión; requiere la capacidad de presidir.

**Consejero de sala auxiliar**: Hermano que asiste en la sala auxiliar; requiere la capacidad de ser consejero de sala.

**Orador (de oración)**: Varón bautizado que ofrece una de las tres oraciones de la semana (apertura, intermedia, cierre).

### Estructura del programa

**Ámbito**: Dónde ocurre una asignación: auditorio principal o sala auxiliar.

**Sección**: Grupo de partes: Tesoros de la Biblia, Seamos Mejores Maestros o Nuestra Vida Cristiana.

**Marco general**: Lo que rodea a las secciones: presidente, consejero, canciones, oraciones, introducción y conclusión.

**Tipo de asignación**: Clasificación de una parte (17 valores) que determina elegibilidad, sala auxiliar y ayudante. Catálogo en requirements.md §6.

**Semana especial**: Semana de tipo asamblea, conmemoración o visita del superintendente; se marca al importar o al editar la semana; reglas en requirements.md §4.
