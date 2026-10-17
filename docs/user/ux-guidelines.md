# Guía de Diseño y UI: S-140

Esta guía documenta la especificación visual exacta del formulario **S-140** (Programa de la Reunión Vida y Ministerio Cristianos) para asegurar que la generación automática en la aplicación tenga una fidelidad visual del 100% respecto al formato oficial.

El archivo `s140-mockup.html` en la raíz del proyecto es la **implementación de referencia** y contiene el HTML/CSS exacto que debe utilizarse para compilar la vista de impresión en React (`S140Page`).

---

## 🎨 1. Paleta de Colores Corporativos

Se deben usar estrictamente los siguientes códigos de color hexadecimales (extraídos de la paleta oficial):

| Sección / Elemento | Código HEX | Uso en la UI |
|--------------------|-------------|--------------|
| **TESOROS DE LA BIBLIA** | `#575A5D` | Fondo de cabecera de sección. Color principal de horas y etiquetas. |
| **SEAMOS MEJORES MAESTROS** | `#BE8900` | Fondo de cabecera de sección. |
| **NUESTRA VIDA CRISTIANA** | `#7E0024` | Fondo de cabecera de sección. |
| **Bordes de Tabla** | `#DFDFDF` | Cuadrícula de la tabla (grosor de 0.5pt / 1px). |
| **Texto de nombres y títulos** | `#000000` | Texto de los títulos de las partes y nombres de asignados. |
| **Fondo General** | `#FFFFFF` | Fondo de página y celdas. |

---

## ✍️ 2. Tipografías, Pesos y Tamaños (en pt)

La tipografía es **Arial, "Helvetica Neue", Helvetica** (fuentes sans-serif del sistema; `src/styles/s140.css:19,43`). Los tamaños de fuente y pesos deben mapearse exactamente así para evitar distorsiones en la impresión:

| Elemento | Tamaño | Peso (Weight) | Color |
|----------|--------|---------------|-------|
| **Título Principal** (Reunión) | `16.5pt` | **Bold (Negrita)** | `#000000` |
| **Rango de fecha de la semana** | `11pt` | **Bold (Negrita)** | `#000000` |
| **Cabeceras de Sección** | `10.0pt` | **Bold (Negrita)** | `#FFFFFF` (Fondo color de sección) |
| **Títulos de Partes** | `10pt` | Normal (Regular) | `#000000` |
| **Nombres de Hermanos** | `10pt` | Normal (Regular) | `#000000` |
| **Horas (`0:00`)** | `9pt` | **Bold (Negrita)** | `#575A5D` (Slate Gray) |
| **Etiquetas** (`Presidente:`, `Estudiante:`, etc.) | `8.0pt` | **Bold (Negrita)** | `#575A5D` (Slate Gray) |

*Nota: Es un error común hacer los títulos de las partes en negrita. Deben ser peso normal (`font-weight: normal`).*

---

## 📐 3. Grilla y Proporciones de Columna

Para garantizar una alineación milimétrica perfecta de arriba a abajo de la página, el programa semanal se construye sobre una **única tabla unificada de 5 columnas** (coordenadas del docx oficial; `s140-mockup.html:237-244`, `src/components/S140WeekView.tsx:235-239`):

1. **Columna 1: Hora (`0:00`)** → Ancho de `45px` (6.2% del ancho imprimible).
2. **Columna 2: Título de la Parte** → Ancho de `192px` (26.6% del ancho imprimible).
3. **Columna 3: Etiqueta** (`Estudiante/Ayudante:`, `Conductor/Lector:`, `Oración:`, etc.) → Ancho de `136px` (18.9% del ancho imprimible).
4. **Columna 4: Sala Auxiliar** → Ancho de `171px` (23.7% del ancho imprimible).
5. **Columna 5: Auditorio Principal** → Ancho de `176px` (24.6% del ancho imprimible).

La columna extra (Columna 3) es la celda de etiqueta: en las partes con sala auxiliar, la etiqueta va en la Columna 3 y los nombres en las Columnas 4 y 5.

### Reglas de Combinación de Celdas (`colspan`):
* **Cabecera superior**: Congregación `colspan="3"` (Columnas 1–3); título del formulario `colspan="2"` (Columnas 4–5).
* **Filas de información**: La fila de fecha/libro lleva el texto en `colspan="3"` (Columnas 1–3) y "Presidente:" + nombre en las Columnas 4–5; la fila de consejero lleva `colspan="3"` vacío (Columnas 1–3) y "Consejero de la sala auxiliar:" + nombre en las Columnas 4–5 (condicional: se oculta cuando la congregación no tiene sala auxiliar, ver la regla al final de esta sección).
* **Canción + Oración**: Título `colspan="2"` (Columnas 2–3); la etiqueta "Oración:" va en la Columna 4 y el nombre en la Columna 5.
* **Palabras de introducción/conclusión y canción intermedia**: `colspan="4"` (Columnas 2–5).
* **Cabeceras de sección** (Tesoros, Mejores Maestros): `colspan="3"` (Columnas 1–3); si la sección tiene sala auxiliar, siguen los encabezados "Sala auxiliar" (Columna 4) y "Auditorio principal" (Columna 5); si no (Vida Cristiana), una celda vacía `colspan="2"` (Columnas 4–5).
* **Partes sin sala auxiliar**: el título abarca `colspan="3"` (Columnas 2–4) si no lleva etiqueta (Discursos, Perlas, Análisis, Necesidades, ¿Qué dirías?), o `colspan="2"` (Columnas 2–3) si lleva etiqueta ("Estudiante:" / "Estudiante/Ayudante:") — en ese caso la etiqueta va en la Columna 4 y el nombre en la Columna 5.
* **Partes con sala auxiliar** (Lectura de la Biblia, Empiece conversaciones, etc.): Título en la Columna 2, etiqueta en la Columna 3, sala auxiliar en la Columna 4 y auditorio principal en la Columna 5.
* **Estudio bíblico de la congregación**: Título `colspan="2"` (Columnas 2–3), etiqueta "Conductor/Lector:" en la Columna 4 y el par "Conductor / Lector" en la Columna 5.

### Regla condicional: congregación sin sala auxiliar

Cuando el ajuste **«La congregación tiene sala auxiliar»** está desactivado (estado «La congregación no tiene sala auxiliar» en Configuración), el S-140 —tanto en la vista de semana suelta como en el rango multi-semana— se genera así:

* **Fila del consejero oculta**: la fila "Consejero de la sala auxiliar" no se renderiza. La fila de fecha/libro y presidente pasa a ser la última fila de información y conserva el borde inferior (`row-info-last`) que cierra el bloque administrativo, de modo que la grilla no queda desalineada ni aparecen filas vacías.
* **Flag efectivo**: la marca de sala auxiliar se evalúa combinando el ajuste de congregación con la marca guardada de cada parte (ajuste ∧ marca). Con el ajuste desactivado ninguna parte se trata como de sala auxiliar, aunque la marca siga guardada (no se borra).
* **Columnas de sala auxiliar colapsadas**: las partes se renderizan con las reglas de "partes sin sala auxiliar" (una sola columna de nombres), y los encabezados de sección solo muestran "Sala auxiliar" / "Auditorio principal" cuando alguna parte de la sección requiere efectivamente la sala auxiliar.

Con el ajuste activo, el formulario es **idéntico** a la plantilla de referencia `s140-mockup.html`, incluida la fila del consejero.

---

## 🖨️ 4. Reglas de Impresión (`@media print`)

Al compilar a PDF o imprimir, se deben asegurar las siguientes reglas de CSS para que el formato quepa perfectamente en hojas tamaño carta (Letter):

* **Márgenes de página**: `0.5in` en los cuatro lados.
* **Saltos de página**: Cada semana se encapsula en un contenedor con `page-break-inside: avoid;`.
* **Separadores**: el `hr` punteado entre semanas es solo de pantalla; al imprimir un rango se fuerza **una semana por página** (`page-break-after: always` en `.week-page`, `src/styles/s140.css:190-198`; commit `d35a1a4`).
* **Forzar colores de fondo**: Asegurar la propiedad `print-color-adjust: exact;` y `-webkit-print-color-adjust: exact;` en el body para que los navegadores impriman los fondos de color de las secciones.
