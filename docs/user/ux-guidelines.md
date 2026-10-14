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

La tipografía recomendada es **Segoe UI, Arial, o Helvetica** (fuentes sans-serif del sistema). Los tamaños de fuente y pesos deben mapearse exactamente así para evitar distorsiones en la impresión:

| Elemento | Tamaño | Peso (Weight) | Color |
|----------|--------|---------------|-------|
| **Título Principal** (Reunión) | `14.5pt` | **Bold (Negrita)** | `#000000` |
| **Rango de fecha de la semana** | `11pt` | **Bold (Negrita)** | `#000000` |
| **Cabeceras de Sección** | `10.5pt` | **Bold (Negrita)** | `#FFFFFF` (Fondo color de sección) |
| **Títulos de Partes** | `10pt` | Normal (Regular) | `#000000` |
| **Nombres de Hermanos** | `10pt` | Normal (Regular) | `#000000` |
| **Horas (`0:00`)** | `9pt` | **Bold (Negrita)** | `#575A5D` (Slate Gray) |
| **Etiquetas** (`Presidente:`, `Estudiante:`, etc.) | `8.5pt` | **Bold (Negrita)** | `#575A5D` (Slate Gray) |

*Nota: Es un error común hacer los títulos de las partes en negrita. Deben ser peso normal (`font-weight: normal`).*

---

## 📐 3. Grilla y Proporciones de Columna

Para garantizar una alineación milimétrica perfecta de arriba a abajo de la página, el programa semanal se construye sobre una **única tabla unificada de 4 columnas**:

1. **Columna 1: Hora (`0:00`)** → Ancho fijo de `45px` (~6.3% del ancho imprimible).
2. **Columna 2: Título de la Parte** → Ancho fijo de `355px` (~44.3% del ancho imprimible).
3. **Columna 3: Sala Auxiliar** → Ancho de `175px` (~24.9% del ancho imprimible).
4. **Columna 4: Auditorio Principal** → Ancho de `175px` (~24.5% del ancho imprimible).

### Reglas de Combinación de Celdas (`colspan`):
* **Líneas de Canción e Introducción**: La celda del título de la canción usa `colspan="2"` (abarca Columna 2 y 3). La oración o el presidente se asigna en la Columna 4.
* **Partes sin Sala Auxiliar** (Discursos, Perlas, partes de Vida Cristiana): El título de la parte usa `colspan="2"` (abarca Columna 2 y 3), y el orador se coloca en la Columna 4.
* **Cabecera de Vida Cristiana**: Como esta sección no tiene Sala Auxiliar, su cabecera de sección usa `colspan="4"` para cruzar toda la tabla de forma limpia.

---

## 🖨️ 4. Reglas de Impresión (`@media print`)

Al compilar a PDF o imprimir, se deben asegurar las siguientes reglas de CSS para que el formato quepa perfectamente en hojas tamaño carta (Letter):

* **Márgenes de página**: `0.5in` en los cuatro lados.
* **Saltos de página**: Cada semana se encapsula en un contenedor con `page-break-inside: avoid;`.
* **Separadores**: Entre semanas consecutivas en una misma hoja se usa un separador sutil (`hr` con borde superior de 1px punteado en pantalla, sólido gris en impresión).
* **Forzar colores de fondo**: Asegurar la propiedad `print-color-adjust: exact;` y `-webkit-print-color-adjust: exact;` en el body para que los navegadores impriman los fondos de color de las secciones.
