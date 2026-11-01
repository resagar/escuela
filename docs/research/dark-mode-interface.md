# Investigación: dark mode de interfaz sin alterar formularios S

Fecha: 2026-10-31. Alcance: investigación de código y documentación primaria; no implementación ni cambios de configuración.

## Conclusión

Es viable agregar dark mode sin modificar los formularios S-140/S-89. El trabajo central es separar los colores de la interfaz de los colores del documento, y asegurar esa separación tanto en la previsualización como en impresión/PDF y JPEG. No alcanza con agregar un interruptor ni con poner un fondo blanco al exportar: hoy los formularios y sus controles comparten el árbol de la aplicación, y la captura JPEG clona el contenido bajo `body`. [Rutas de la aplicación](../../src/App.tsx#L36-L39), [exportación S-140](../../src/utils/s140Export.ts#L9-L22), [exportación S-89](../../src/utils/s89Export.ts#L9-L22).

## Requisitos confirmados

- Dark mode cambia solamente la interfaz de la aplicación.
- La generación de formularios S correspondientes a los bimestres conserva sus colores y fidelidad visual.
- Se mantienen los colores característicos de las secciones en asignaciones y en cualquier otra vista donde existan, incluida la edición de Semana.
- No se pidió rediseñar los documentos, modificar reglas de asignación ni introducir nuevas bandas de sección en pantallas que actualmente no las tienen.

Estos requisitos provienen del pedido del usuario. La fidelidad exacta del S-140 también es una regla documentada: fondo blanco, texto negro y paleta específica por sección. [Guía visual](../user/ux-guidelines.md#L1-L20).

## Estado actual verificado

| Área | Evidencia | Implicación |
| --- | --- | --- |
| Base de estilos | [App.css](../../src/App.css#L1-L15) importa Tailwind, define el foco y una transición para controles. [Dependencias](../../package.json#L14-L23) declaran Tailwind 4, React 19 y html2canvas. | No hay un sistema de tema en esta base; hay que definirlo e integrarlo. |
| Contenedor de la app | [Layout](../../src/components/Layout.tsx#L45-L46) usa fondo gris claro y navegación slate. Los formularios de Semana usan utilidades claras en campos, etiquetas y botones. [Editor](../../src/pages/SemanaFormPage.tsx#L434-L512). | Cambiar solo el fondo dejaría tarjetas, modales y controles con combinaciones inconsistentes. |
| Colores de Sección en asignaciones | [Mapa de colores](../../src/pages/AsignacionesPage.tsx#L10-L15): Tesoros `bg-slate-700`, Mejores Maestros `bg-yellow-600`, Vida Cristiana `bg-red-800`, Marco `bg-gray-600`. | Deben permanecer como colores de dominio, independientes de los colores neutrales del tema. |
| Edición de Semana | [Catálogo de Secciones](../../src/pages/SemanaFormPage.tsx#L33-L37) y [editor](../../src/pages/SemanaFormPage.tsx#L391-L445). | No se encontró un mapa de bandas por sección equivalente al de asignaciones. Conservar lo existente no implica inventar una presentación nueva. |
| Paleta S-140 | [Variables](../../src/styles/s140.css#L1-L10) y [cabeceras](../../src/styles/s140.css#L139-L155): `#575a5d`, `#be8900`, `#7e0024`, texto negro y blanco. | Esta paleta documental no es idéntica a las utilidades de las secciones de la UI: no deben unificarse cambiando colores. |
| Variables de formularios | [S-140](../../src/styles/s140.css#L2-L10) y [S-89](../../src/styles/s89.css#L2-L7) declaran variables globales bajo `:root`, varias con el mismo nombre. | Hoy sus valores comunes coinciden; no demuestra un bug actual. Sí representa riesgo de colisión al incorporar tokens de tema. |
| Impresión/PDF | Las páginas llaman `window.print()`: [S-140 individual](../../src/pages/S140Page.tsx#L89), [S-140 bimestre](../../src/pages/S140RangoPage.tsx#L252), [S-89 individual](../../src/pages/S89Page.tsx#L62), [S-89 bimestre](../../src/pages/S89RangoPage.tsx#L219). | “Guardar PDF” usa el flujo de impresión; hay que comprobar también sus reglas CSS. |
| JPEG | Ambos exportadores crean un clon, lo agregan a `body` y capturan con html2canvas y fondo blanco. [S-140](../../src/utils/s140Export.ts#L9-L22), [S-89](../../src/utils/s89Export.ts#L9-L22). | El clon puede heredar color o variables del tema. Un ancestro oscuro también puede activar variantes `dark:` dentro del clon. |
| Preferencias existentes | [congregation_settings](../../src-tauri/src/db.rs#L98-L104) almacena únicamente el ajuste de sala auxiliar. | No conviene tratar una preferencia visual local como configuración de la congregación por defecto. |

## Qué hace falta hacer

1. **Definir el contrato visual y la frontera del documento.** Identificar los elementos temáticos —navegación, fondos, tarjetas, texto, bordes, estados, campos, modales y controles de exportación— y distinguirlos del contenido S-140/S-89. La hoja sigue clara también dentro de una pantalla oscura. Los controles que rodean la hoja sí pueden usar dark mode. Esta separación debe hacerse sobre el contenido real, no excluir toda la página de exportación de manera indiscriminada. Las páginas individuales y de rango mezclan controles y documento. [S-140 individual](../../src/pages/S140Page.tsx#L75-L94), [S-89 bimestre](../../src/pages/S89RangoPage.tsx#L210-L227).

2. **Agregar una preferencia de tema y aplicarla antes del primer pintado.** Propuesta: `light`, `dark` y `system`, con estado resuelto compartido y persistencia local. Tailwind 4 permite dirigir `dark:` con un selector explícito; su documentación contempla almacenamiento local, detección del sistema y aplicación temprana para evitar el destello claro. El modo elegido, valor inicial y ubicación del control siguen pendientes. [Documentación oficial de Tailwind](https://tailwindcss.com/docs/dark-mode).

3. **Definir colores neutrales de interfaz y migrar las superficies.** Usar nombres específicos, por ejemplo `--ui-surface`, `--ui-text` y `--ui-border`, sin redefinir los colores generales de Tailwind ni las variables documentales globales. Aplicarlos a componentes compartidos y después a todas las vistas. Conservar las bandas y acentos de Sección sin convertirlos en fondos neutrales. Es una recomendación derivada del uso actual de utilidades claras y variables globales, no una decisión ya aprobada. [Layout](../../src/components/Layout.tsx#L45-L46), [App.css](../../src/App.css#L1-L15), [colores de Sección](../../src/pages/AsignacionesPage.tsx#L10-L15).

4. **Aislar los formularios de forma explícita.** Mantener los valores actuales, pero darles alcance documental o nombres exclusivos. Fijar fondo, texto y esquema claro en la raíz de la hoja. Evitar que variantes oscuras o variables heredadas entren en el documento. Poner `color-scheme: light` o `data-theme="light"` por sí solo no cancela una regla `dark:` basada en un ancestro oscuro: el selector debe respetar esa frontera, o la hoja debe quedar fuera de su alcance. `color-scheme` controla partes dibujadas por el navegador, no reemplaza los estilos del autor. [Tailwind: selector de dark mode](https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually), [especificación CSS Color Adjustment](https://www.w3.org/TR/css-color-adjust-1/#color-scheme-prop).

5. **Proteger ambos caminos de salida.** Mantener reglas claras y la paleta documental en impresión/PDF; asegurar el mismo contexto en la raíz clonada para JPEG. html2canvas permite ajustar el documento clonado mediante `onclone`, sin modificar la UI visible. Su opción `backgroundColor` no restablece el texto ni los estilos internos del DOM: se necesita el aislamiento anterior. No es necesario decidir de antemano si habrá un helper compartido; primero comprobar los dos exportadores. [Opciones oficiales de html2canvas](https://html2canvas.hertzen.com/configuration), [exportadores actuales](../../src/utils/s140Export.ts#L9-L22).

6. **Verificar contraste y regresión visual.** Revisar texto, etiquetas, placeholders, bordes, foco, estados deshabilitados, errores y selección en ambos temas. Mantener los colores de Sección no exime de comprobar el contraste de su texto. WCAG 2.2 establece los criterios de contraste; el tema no debe depender solamente del color para comunicar estados. [WCAG 2.2](https://www.w3.org/TR/WCAG22/#contrast-minimum).

## Supuestos y decisiones pendientes

- **Persistencia:** se propone `localStorage` como preferencia visual de esta instalación, sin migración SQLite ni dependencia nueva. Es persistente por origen; debe manejarse su indisponibilidad y comprobarse al reiniciar la aplicación empaquetada. Si se necesita respaldar o trasladar la preferencia con la base de datos, este supuesto cambia. [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
- **Modos disponibles:** `light/dark/system` es una propuesta; el usuario pidió dark mode, no confirmó un selector de tres opciones. En modo `system`, los cambios del sistema deben afectar la UI mientras la app está abierta; una elección explícita debe prevalecer. `matchMedia` permite consultar y observar la preferencia. [API de matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia).
- **Previsualización:** se propone que la hoja se vea siempre clara y con los colores finales, aunque el entorno sea oscuro. Es la interpretación más coherente con “solo interfaz”, pero debe quedar explícita en una futura spec.
- **Alcance de formularios:** se propone proteger S-140 y S-89, tanto individuales como por bimestre, para evitar diferencias entre rutas que reutilizan sus estilos y exportadores. El pedido enfatiza los bimestres, sin pedir que la exportación individual cambie. [Rutas](../../src/App.tsx#L36-L39).
- **Tema nativo de ventana y diálogos:** dejarlo siguiendo al sistema sería el alcance mínimo de interfaz web. Sincronizarlo con la elección manual es opcional y requiere verificación por plataforma. Tauri ofrece `setTheme`, pero requiere un permiso específico; en Linux/macOS el efecto es a nivel de aplicación. No es necesario añadirlo para colorear el contenido React. [API oficial Tauri](https://v2.tauri.app/reference/javascript/api/namespacewindow/#settheme).
- **Paleta de Sección:** conservar exactamente los colores actuales de la UI donde existen y los valores documentales actuales del S-140, sin confundir ambas paletas. No se aprobó rediseñar los acentos o añadirlos donde no existen. [Asignaciones](../../src/pages/AsignacionesPage.tsx#L10-L15), [guía S-140](../user/ux-guidelines.md#L9-L20).

## Problemas y riesgos concretos

- **Contaminación por herencia:** texto claro, variables neutrales oscuras o variantes activadas por un ancestro pueden alcanzar la hoja y el clon de JPEG. Una solución basada solo en `@media print` no cubre el camino de captura de pantalla de html2canvas. [Exportación S-89](../../src/utils/s89Export.ts#L9-L22), [configuración html2canvas](https://html2canvas.hertzen.com/configuration).
- **Reemplazos globales peligrosos:** `text-white` sirve tanto para texto sobre una banda de Sección como para controles. Invertir colores, aplicar filtros o sustituir globalmente `bg-white`/`text-*` puede alterar el documento y los colores que deben conservarse. Se necesita una migración por función visual, no una sustitución indiscriminada. [Layout](../../src/components/Layout.tsx#L45-L46), [cabeceras S-140](../../src/styles/s140.css#L139-L155).
- **Variables globales compartidas:** S-140 y S-89 ya comparten nombres bajo `:root`; redefinirlos como colores de tema introduciría una dependencia de cascada o carga CSS. Deben aislarse conservando sus valores. [S-140](../../src/styles/s140.css#L2-L10), [S-89](../../src/styles/s89.css#L2-L7).
- **Destello de tema y controles nativos:** resolver la preferencia únicamente después de montar React puede mostrar el tema claro al arrancar. Los controles y barras de desplazamiento también necesitan un `color-scheme` coherente. [Tailwind](https://tailwindcss.com/docs/dark-mode#with-system-theme-support), [CSS Color Adjustment](https://www.w3.org/TR/css-color-adjust-1/#color-scheme-prop).
- **Cobertura parcial:** tarjetas, formularios, vistas de importación, modales de asignación y páginas de rango contienen superficies propias. Implementar solo navegación y asignaciones deja partes claras o texto de poco contraste. [Editor de Semana](../../src/pages/SemanaFormPage.tsx#L434-L512), [modal de asignación](../../src/components/BrotherPickerModal.tsx).
- **Impresión real:** el proyecto usa `print-color-adjust: exact`; esta propiedad expresa una preferencia del autor, no una garantía sobre la impresora o las opciones del usuario. No puede prometerse igualdad física absoluta desde CSS. [Reglas actuales](../../src/styles/s140.css#L13-L26), [especificación de impresión](https://www.w3.org/TR/css-color-adjust-1/#print-color-adjust).

## Verificación propuesta antes de darlo por terminado

| Frontera | Comprobación |
| --- | --- |
| Resolución del tema | Preferencia válida, ausente o inválida; modo explícito frente a sistema; cambio de sistema en vivo; persistencia y arranque sin destello. |
| Interfaz | Todas las rutas, modales y estados en claro/oscuro; foco, teclado, campos y contraste. Conservar colores de Sección en asignaciones y cualquier otro lugar donde ya existan. |
| Documento en pantalla | Mismos datos S-140/S-89, individual y bimestre, con app clara y oscura: texto, fondos, paleta y geometría iguales dentro de la hoja; controles exteriores sí cambian. |
| JPEG | Comparar imágenes generadas de los mismos datos en ambos temas; comprobar fondos y muestras de colores internos, no solamente el fondo del canvas. |
| Impresión/PDF | Comprobar las cuatro rutas en vista previa y PDF; páginas, márgenes, tipografía, bandas, texto y fondos sin cambios entre temas. |
| Navegación | Alternar S-140 ↔ S-89 ↔ UI y cambiar tema antes/después de exportar para detectar fugas de variables y cascada. |
| Tauri empaquetado | Reiniciar y verificar la preferencia, controles de la WebView y, si se incluye, tema de ventana/diálogos en las plataformas soportadas. Un navegador con IPC simulado no demuestra este comportamiento. |

No se ejecutaron pruebas visuales ni exportaciones para esta investigación: todavía no existe la implementación del tema. La propuesta no requiere cambiar reglas de elegibilidad, importación, datos de Semana ni generar nuevas versiones de los formularios.
