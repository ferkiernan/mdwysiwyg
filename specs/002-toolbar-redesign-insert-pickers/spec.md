# Feature Specification: Toolbar Redesign & Insert Pickers

**Feature Branch**: `002-toolbar-redesign-insert-pickers`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Rediseñar la barra de herramientas del componente MarkdownEditor con un estilo visual clásico de botones de icono, y reemplazar los diálogos de inserción de tabla y de bloque de código por selectores visuales dedicados, manteniendo toda la funcionalidad existente y sin romper la accesibilidad ni la sincronización Markdown ya implementada. Incluye: rediseño visual con botón de Cita nuevo; barra en una sola fila con el selector de encabezado encogible hasta 30px; selector visual de tamaño de tabla (cuadrícula 10×10, convención columnas × filas); selector de lenguaje para bloques de código (JSON/SQL/TypeScript/JavaScript/Java/Otro); botón de exportar con icono de descarga anclado a la derecha; y corrección de tres regresiones de UI detectadas durante el desarrollo (paneles recortados por el scroll de la barra, diálogo de HTML con botones superpuestos, botones de acción con tamaño de icono en vez de tamaño de texto)."

## Contexto

Esta feature se construye sobre `001-markdown-editor` (ya implementado y en producción). No
modifica el modelo de datos, el pipeline Markdown/GFM, ni el contrato público del componente
(`MarkdownEditorProps`) definidos en esa feature — es exclusivamente un rediseño y una extensión
de la superficie visual e interactiva de la barra de herramientas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Usar la barra rediseñada con apariencia clásica (Priority: P1)

Un usuario que ya conoce la barra de herramientas del editor la ve con una apariencia visual de
aplicación de escritorio clásica (botones de icono con relieve, separadores entre grupos), y
encuentra un nuevo botón de "Cita" para citar texto, sin perder ninguna de las funciones de
formato que ya usaba.

**Why this priority**: Es la base visual sobre la que se apoyan el resto de las historias; sin
ella, los nuevos selectores (tabla, código) no tendrían un lugar coherente en la barra.

**Independent Test**: Se puede probar de forma aislada montando el editor y verificando que cada
control de formato existente (negrita, cursiva, tachado, listas, headings, etc.) sigue siendo
operable y que aparece un control de "Cita" que aplica una cita (blockquote) al contenido
seleccionado.

**Acceptance Scenarios**:

1. **Given** el editor está montado, **When** se observa la barra de herramientas, **Then** cada
   control se muestra como un botón de icono cuadrado con separadores visuales entre grupos de
   controles relacionados.
2. **Given** el cursor está sobre un párrafo, **When** el usuario activa el control de "Cita",
   **Then** el párrafo se convierte en una cita (blockquote) tanto en la vista renderizada como en
   el Markdown resultante.
3. **Given** el usuario reduce el ancho disponible del editor, **When** el espacio no alcanza para
   mostrar todos los controles en su tamaño normal, **Then** el selector de nivel de encabezado se
   encoge (hasta un mínimo de 30px de ancho) antes que cualquier otro control de la barra se vea
   afectado, y la barra se mantiene en una sola fila mientras sea posible.

---

### User Story 2 - Elegir el tamaño de una tabla visualmente (Priority: P1)

Un usuario quiere insertar una tabla y, en lugar de escribir manualmente cuántas filas y columnas
necesita, abre un panel con una cuadrícula, pasa el mouse hasta cubrir visualmente el tamaño
deseado (viendo un indicador como "3 × 4"), y confirma con un clic.

**Why this priority**: Es el reemplazo directo de la única forma de insertar tablas que existía
antes (un formulario numérico); sin esta historia, la funcionalidad de insertar tablas retrocede
en usabilidad respecto a la versión anterior.

**Independent Test**: Se puede probar de forma aislada abriendo el selector de tabla, pasando el
mouse por distintas celdas de la cuadrícula y verificando que el resaltado y el texto de tamaño
mostrado corresponden a la celda señalada, y que al hacer clic se inserta una tabla con esa
cantidad exacta de columnas y filas.

**Acceptance Scenarios**:

1. **Given** el selector de tamaño de tabla se acaba de abrir, **When** el usuario aún no movió el
   mouse sobre la cuadrícula, **Then** ninguna celda aparece resaltada.
2. **Given** el selector está abierto, **When** el usuario mueve el mouse hasta la celda de la
   tercera columna y cuarta fila, **Then** se resaltan las primeras 3 columnas y 4 filas de la
   cuadrícula, y se muestra el texto "3 × 4" (convención columnas × filas).
3. **Given** el usuario tiene resaltada una selección de "3 × 4", **When** hace clic sobre esa
   celda, **Then** se inserta una tabla de 3 columnas y 4 filas, y el panel se cierra
   automáticamente.
4. **Given** el usuario había resaltado una selección, **When** mueve el mouse fuera de los límites
   de la cuadrícula sin cerrar el panel, **Then** la última selección resaltada permanece visible
   hasta que el panel se cierra.

---

### User Story 3 - Asociar un lenguaje a un bloque de código (Priority: P2)

Un usuario que inserta o edita un bloque de código quiere indicar en qué lenguaje de programación
está escrito, eligiendo entre los lenguajes más comunes o especificando cualquier otro no
listado.

**Why this priority**: Mejora la utilidad de los bloques de código para casos de documentación
técnica real, pero el editor ya es funcional sin esto (el bloque de código existía previamente sin
metadato de lenguaje).

**Independent Test**: Se puede probar de forma aislada abriendo el selector de lenguaje sobre un
bloque de código, eligiendo un lenguaje predefinido o escribiendo uno personalizado, y verificando
que el bloque de código resultante queda asociado a ese lenguaje tanto en la vista renderizada como
en el Markdown exportado.

**Acceptance Scenarios**:

1. **Given** el usuario crea un bloque de código nuevo, **When** elige "JavaScript" de la lista de
   lenguajes predefinidos, **Then** el bloque de código queda marcado con ese lenguaje.
2. **Given** el usuario crea un bloque de código nuevo, **When** elige la opción "Otro" e ingresa un
   valor personalizado (por ejemplo "graphql"), **Then** el bloque de código queda marcado con el
   lenguaje personalizado ingresado.
3. **Given** un bloque de código ya tiene un lenguaje asignado, **When** el usuario vuelve a abrir
   el selector sobre ese bloque, **Then** el selector muestra preseleccionado el lenguaje
   actualmente asignado.

---

### User Story 4 - Exportar contenido desde un botón reconocible (Priority: P3)

Un usuario identifica de un vistazo el control para exportar el contenido del editor gracias a un
icono de descarga, ubicado siempre en el extremo derecho de la barra sin importar cuántos otros
controles existan.

**Why this priority**: Es un ajuste de reconocibilidad visual sobre una función que ya existía
(exportar como Markdown/HTML); no bloquea ninguna otra funcionalidad.

**Independent Test**: Se puede probar de forma aislada observando que el control de exportar se
representa con un icono (no con la palabra "Export") y verificando que permanece alineado al
extremo derecho de la barra al variar la cantidad de controles a su izquierda.

**Acceptance Scenarios**:

1. **Given** el editor está montado, **When** se observa la barra de herramientas, **Then** el
   control de exportar se muestra como un icono de descarga, sin texto visible.
2. **Given** el usuario activa el control de exportar, **When** se abre el menú de exportación,
   **Then** las opciones de copiar como Markdown y copiar como HTML siguen disponibles y funcionan
   igual que antes.

---

### User Story 5 - Los paneles desplegables no deben interferir con el resto del editor (Priority: P1)

Un usuario abre cualquier panel desplegable de la barra (selector de tabla, selector de lenguaje de
código, diálogos de insertar imagen/enlace/HTML, o el menú de exportar) y lo ve mostrarse
completo, por encima del contenido del editor, sin que quede cortado ni atrapado dentro de la
barra de herramientas; y los botones de acción de esos paneles ("Cancelar", "Insertar", "Aplicar")
se ven correctamente dimensionados según su texto, sin superponerse entre sí.

**Why this priority**: Son correcciones de defectos que, de no cumplirse, hacen inutilizables los
paneles introducidos en las Historias 2, 3 y 4, y afectan también a los diálogos ya existentes de
insertar imagen/enlace/HTML de la feature anterior.

**Independent Test**: Se puede probar de forma aislada abriendo cada uno de los paneles
desplegables de la barra (con la barra en un contenedor de ancho reducido que fuerce scroll
horizontal) y verificando que el panel se muestra completo y sin recortes por encima del área de
edición, y que sus botones de acción no se superponen.

**Acceptance Scenarios**:

1. **Given** la barra de herramientas necesita scroll horizontal para mostrar todos sus controles,
   **When** el usuario abre cualquier panel desplegable, **Then** el panel se muestra completo por
   encima del contenido del editor, sin quedar recortado por el área con scroll de la barra.
2. **Given** el usuario abre el diálogo de insertar HTML embebido, **When** observa los botones
   "Cancelar" e "Insertar", **Then** ambos se muestran como botones de texto separados, sin
   superponerse ni deformarse, sin importar el contenido escrito en el campo de código HTML.
3. **Given** el usuario abre cualquier panel con botones de acción de texto ("Cancelar",
   "Insertar", "Aplicar"), **When** observa esos botones, **Then** cada uno se dimensiona según su
   propio texto, no como un botón cuadrado de icono.

---

### Edge Cases

- ¿Qué ocurre si el usuario abre el selector de tamaño de tabla y lo cierra sin hacer clic sobre
  ninguna celda (por ejemplo presionando Escape)? No debe insertarse ninguna tabla.
- ¿Qué ocurre si el usuario elige "Otro" en el selector de lenguaje de código pero no escribe
  ningún valor? El bloque de código no debe quedar en un estado inconsistente; se espera que se
  requiera un valor no vacío para aplicar un lenguaje personalizado.
- ¿Qué ocurre si el espacio disponible es tan reducido que ni siquiera el selector de encabezado
  encogido a 30px alcanza para mostrar todos los controles en una fila? La barra puede recurrir a
  desplazamiento horizontal dentro de sí misma como último recurso, sin que eso afecte la
  visibilidad completa de los paneles desplegables (Historia 5).
- ¿Qué ocurre si el usuario abre un panel desplegable cerca del borde derecho o inferior de la
  pantalla? El panel debe seguir siendo completamente visible y utilizable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La barra de herramientas MUST presentar cada control de formato/inserción como un
  botón de icono, con estilo visual consistente de relieve (estados normal, hover y activo/presionado
  diferenciados visualmente).
- **FR-002**: La barra de herramientas MUST incluir separadores visuales entre grupos de controles
  relacionados.
- **FR-003**: La barra de herramientas MUST incluir un control de "Cita" que aplique/quite formato
  de cita (blockquote) al contenido seleccionado.
- **FR-004**: La barra de herramientas MUST mantenerse en una sola fila mientras el espacio
  disponible lo permita.
- **FR-005**: Cuando el espacio disponible sea insuficiente para mostrar todos los controles en su
  tamaño normal, el selector de nivel de encabezado MUST ser el primer elemento en reducir su
  ancho, pudiendo encogerse hasta un mínimo de 30px, antes de que se modifique el tamaño de
  cualquier otro control.
- **FR-006**: El control de insertar tabla MUST abrir, al activarse, un panel con una cuadrícula
  de selección de 10 columnas por 10 filas.
- **FR-007**: El panel de selección de tabla MUST iniciar sin ninguna celda resaltada.
- **FR-008**: El panel de selección de tabla MUST resaltar, a medida que el usuario mueve el mouse
  sobre la cuadrícula, todas las celdas correspondientes a la cantidad de columnas y filas hasta la
  posición señalada (movimiento a la derecha aumenta columnas; movimiento hacia abajo aumenta
  filas).
- **FR-009**: El panel de selección de tabla MUST mostrar en todo momento un texto con el tamaño
  actualmente señalado, usando la convención "columnas × filas" (por ejemplo, "3 × 4" significa 3
  columnas y 4 filas).
- **FR-010**: Al hacer clic sobre una celda del panel de selección de tabla, el sistema MUST
  insertar una tabla con la cantidad de columnas y filas correspondiente a esa celda, y MUST cerrar
  el panel automáticamente.
- **FR-011**: Si el usuario mueve el mouse fuera de los límites de la cuadrícula sin cerrar el
  panel, la última selección resaltada MUST permanecer visible hasta que el panel se cierre.
- **FR-012**: El panel de selección de tamaño de tabla MUST implementarse como un componente
  reutilizable y desacoplado del control de la barra que lo invoca: el control de la barra MUST
  únicamente abrir el panel y recibir la dimensión (columnas y filas) elegida por el usuario para
  crear la tabla.
- **FR-013**: El control de bloque de código MUST permitir asociar al bloque un lenguaje de
  programación, ofreciendo como opciones predefinidas al menos: JSON, SQL, TypeScript, JavaScript y
  Java.
- **FR-014**: El selector de lenguaje de bloque de código MUST ofrecer una opción para especificar
  manualmente cualquier lenguaje no incluido en las opciones predefinidas.
- **FR-015**: Al reabrir el selector de lenguaje sobre un bloque de código que ya tiene un lenguaje
  asignado, el selector MUST mostrar ese lenguaje como preseleccionado.
- **FR-016**: El control de exportar contenido MUST representarse mediante un icono (no mediante la
  palabra "Export" u otro texto visible), y MUST conservar su funcionalidad de exportar el
  contenido como Markdown y como HTML.
- **FR-017**: El control de exportar MUST permanecer alineado en el extremo derecho de la barra de
  herramientas, independientemente de la cantidad de controles ubicados a su izquierda.
- **FR-018**: Todo panel desplegable de la barra (selector de tabla, selector de lenguaje de
  código, diálogos de insertar imagen/enlace/HTML, y menú de exportar) MUST mostrarse completo, por
  encima del contenido del editor, sin quedar recortado ni contenido dentro del área con
  desplazamiento propio de la barra de herramientas.
- **FR-019**: Los botones de acción de texto de los paneles desplegables ("Cancelar", "Insertar",
  "Aplicar") MUST dimensionarse según su contenido textual, MUST NOT tratarse como botones
  cuadrados de tamaño fijo de icono, y MUST NOT superponerse entre sí bajo ninguna combinación de
  contenido ingresado en el panel.
- **FR-020**: Ningún requisito de esta feature MUST alterar el comportamiento de sincronización
  Markdown ↔ vista renderizada, ni el contrato público (`MarkdownEditorProps`) establecido por
  `001-markdown-editor`.

### Key Entities

- **Selección de tamaño de tabla**: par de valores (columnas, filas) elegido interactivamente por
  el usuario en el panel de selección; se descarta si el panel se cierra sin confirmación, y se
  traduce en una tabla insertada al confirmarse.
- **Lenguaje de bloque de código**: metadato de texto asociado a un bloque de código, con un
  conjunto de valores predefinidos sugeridos (JSON, SQL, TypeScript, JavaScript, Java) y soporte
  para cualquier valor personalizado no listado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede insertar una tabla de un tamaño específico (por ejemplo, 3 columnas
  por 4 filas) usando únicamente el mouse sobre la cuadrícula de selección, sin necesidad de
  escribir ningún número.
- **SC-002**: El 100% de los controles de formato existentes antes de este rediseño (formato de
  texto, listas, inserciones, exportar) permanecen operables después del rediseño visual de la
  barra.
- **SC-003**: La barra de herramientas se mantiene en una sola fila visible en anchos de contenedor
  reducidos, cediendo únicamente el ancho del selector de encabezado (hasta 30px), antes de recurrir
  a cualquier otro mecanismo de adaptación.
- **SC-004**: En el 100% de los casos de prueba, los paneles desplegables de la barra se muestran
  completos y sin recortes, sin importar el estado de desplazamiento horizontal de la barra de
  herramientas.
- **SC-005**: En el 100% de los casos de prueba, los botones de acción de texto de los paneles no
  se superponen entre sí ni con otros elementos del panel.

## Assumptions

- El estilo visual "clásico" de botones de icono se interpreta como una apariencia consistente de
  relieve (gradiente/sombra) en los estados normal, hover y presionado, sin que la especificación
  prescriba una paleta de colores exacta — el detalle visual final queda a criterio de la
  implementación dentro de ese lineamiento general.
- El tamaño máximo de la cuadrícula de selección de tabla (10×10) se toma como límite superior de
  columnas y filas seleccionables directamente desde el panel; tablas de mayor tamaño quedan fuera
  del alcance del selector visual.
- La lista de lenguajes predefinidos (JSON, SQL, TypeScript, JavaScript, Java) es la mínima
  requerida; no se excluye que en el futuro se amplíe, pero esta feature no exige más que esos
  cinco más la opción personalizada.
- "Icono genérico de descarga" para el control de exportar se interpreta como un símbolo
  reconocible de descarga/exportación, sin dependencia de un set de iconos de terceros específico.
