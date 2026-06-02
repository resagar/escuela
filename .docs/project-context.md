# Contexto del Proyecto

## Propósito

Escuela automatiza la preparación del programa semanal de la Reunión Vida y Ministerio Cristianos (formulario S-140). El proceso manual actual es repetitivo, propenso a errores, y requiere mantener mentalmente múltiples reglas del S-38 (elegibilidad de hermanos, rotación, restricciones por sexo/rol).

## Usuario

Usuario único: el Superintendente de la Reunión Vida y Ministerio Cristianos de la congregación Casanay, responsable de hacer asignaciones bimestrales con al menos 3 semanas de anticipación.

## Dominio del Problema

### Estructura de la Reunión

La reunión dura 1h 45min y tiene 3 secciones:

- **Tesoros de la Biblia**: Discurso (10min), Busquemos perlas escondidas (10min), Lectura de la Biblia (4min)
- **Seamos Mejores Maestros**: 1-4 asignaciones variables (Empiece conversaciones, Haga revisitas, Haga discípulos, Explique sus creencias, Discurso)
- **Nuestra Vida Cristiana**: 1-2 asignaciones (análisis, discurso, entrevista) + Estudio bíblico de la congregación (30min)

Marco general fijo: Presidente, Consejero de sala auxiliar, Canciones + Oraciones.

### Reglas de Elegibilidad (S-38)

- Partes no-estudiante: ancianos o siervos ministeriales
- Partes de estudiante: cualquier publicador
- Lectura de la Biblia, Discurso estudiante, Explique creencias (discurso): solo varones
- Ayudante de mismo sexo que el estudiante (empiece conversaciones, haga revisitas, haga discípulos, explique creencias escenificación)
- Necesidades de la congregación: solo ancianos
- Presidente: solo ancianos aprobados
- Conductor de estudio: solo hermanos aprobados

### Formulario S-140

El output final es una tabla con 4 columnas (Hora, Título, Sala Auxiliar, Auditorio Principal) que se imprime y coloca en el tablero de anuncios. Ver `.docs/ux-guidelines.md` para especificación visual exacta.

## Alcance del MVP

1. Roster de la congregación con atributos de elegibilidad
2. Importación automática del programa desde PDF de la guía de actividades (mwb)
3. Asignación de hermanos con validación de elegibilidad
4. Vista S-140 imprimible
5. Dashboard con progreso del bimestre

### Fuera de Alcance

- Rotación automática de hermanos
- Notificaciones a participantes
- Múltiples congregaciones
- Autenticación multi-usuario
- Historial de más de un bimestre
- Integración con JW Library o jw.org
