# Feature Specification: Markdown Editor

**Feature Branch**: `001-markdown-editor`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Componente React para visualizar y editar contenido Markdown, con vista renderizada (WYSIWYG) y vista Markdown/texto intercambiables mediante un botón `</>`, barra de herramientas para formato (párrafos, headings, negrita, cursiva, tachado), listas (ordenada, no ordenada, anidadas, checklist), bloques de código, inserción de imagen/enlace/tabla/línea horizontal/HTML embebido, y exportación a Markdown o HTML. Ambas vistas comparten el mismo contenido subyacente (Markdown) y se mantienen sincronizadas. Tamaño por defecto 700x500px si no se especifica. Notifica cambios de contenido a la aplicación consumidora. No persiste archivos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar en vista renderizada (WYSIWYG) (Priority: P1)

Un desarrollador integra el componente en su aplicación y un usuario final escribe y da formato a contenido (negrita, headings, listas) directamente en la vista renderizada, sin necesidad de conocer la sintaxis Markdown.

**Why this priority**: Es el caso de uso principal — la mayoría de los usuarios finales de una app que integra este editor no conocen Markdown y esperan una experiencia tipo procesador de texto. Sin esto, el componente no cumple su propósito central de "editor WYSIWYG".

**Independent Test**: Se puede probar de forma aislada montando el componente sin contenido inicial, aplicando formato desde la barra de herramientas (p. ej. negrita a una selección de texto) y verificando que el contenido renderizado refleja el cambio visualmente.

**Acceptance Scenarios**:

1. **Given** el editor está vacío y en vista renderizada, **When** el usuario escribe texto y aplica negrita desde la barra, **Then** el texto se muestra en negrita en la vista renderizada.
2. **Given** el editor tiene contenido con una lista no ordenada, **When** el usuario indenta un ítem desde la barra de herramientas, **Then** el ítem pasa a formar parte de una lista anidada.
3. **Given** el usuario aplica un heading de nivel 2 a un párrafo, **When** se observa el contenido, **Then** el párrafo se muestra con el estilo visual correspondiente a un heading nivel 2.

---

### User Story 2 - Editar en vista Markdown y ver el texto fuente (Priority: P1)

Un usuario con conocimiento de Markdown activa el botón `</>` para editar directamente el texto fuente (por ejemplo, para ajustes finos o pegar contenido Markdown ya formateado), y puede alternar de vuelta a la vista renderizada para verificar el resultado visual.

**Why this priority**: Es el segundo pilar explícito del componente (vista dual) y una de las razones principales para elegir este editor frente a un WYSIWYG puro — el usuario nunca pierde acceso al Markdown real.

**Independent Test**: Se puede probar de forma aislada activando el botón `</>`, editando el texto Markdown directamente (p. ej. escribiendo `**negrita**`), desactivando el botón y verificando que la vista renderizada refleja ese cambio.

**Acceptance Scenarios**:

1. **Given** el editor está en vista renderizada con contenido existente, **When** el usuario activa el botón `</>`, **Then** se muestra el texto Markdown equivalente sin pérdida ni alteración del contenido.
2. **Given** el editor está en vista Markdown, **When** el usuario edita el texto directamente y desactiva el botón `</>`, **Then** la vista renderizada muestra el contenido actualizado correctamente formateado.
3. **Given** el usuario alterna repetidamente entre ambas vistas sin editar, **When** se compara el contenido antes y después de cada cambio, **Then** el contenido permanece idéntico en cada alternancia.

---

### User Story 3 - Insertar elementos estructurados desde la barra de herramientas (Priority: P2)

Un usuario inserta elementos más complejos que texto con formato simple: bloques de código, imágenes, enlaces, tablas, líneas horizontales y HTML embebido, usando los controles de la barra de herramientas en lugar de recordar la sintaxis Markdown.

**Why this priority**: Extiende el editor más allá del formato básico de texto y es necesario para cubrir documentos Markdown reales (documentación técnica, notas con tablas e imágenes), pero un usuario ya obtiene valor del editor solo con las Historias 1 y 2.

**Independent Test**: Se puede probar de forma aislada invocando cada acción de inserción (p. ej. "insertar tabla") desde la barra de herramientas sobre un editor con contenido existente y verificando que el elemento aparece correctamente en ambas vistas.

**Acceptance Scenarios**:

1. **Given** el cursor está posicionado en el editor, **When** el usuario inserta un bloque de código desde la barra, **Then** se crea un bloque de código editable diferenciado visualmente del texto normal.
2. **Given** el cursor está posicionado en el editor, **When** el usuario inserta una imagen indicando su origen, **Then** la imagen se muestra en la vista renderizada y su referencia Markdown aparece en la vista Markdown.
3. **Given** el cursor está posicionado en el editor, **When** el usuario inserta una tabla, **Then** se crea una tabla con filas/columnas editables en la vista renderizada y su sintaxis de tabla equivalente en la vista Markdown.
4. **Given** el cursor está posicionado en el editor, **When** el usuario inserta un enlace sobre texto seleccionado, **Then** el texto seleccionado se convierte en un enlace navegable en la vista renderizada.
5. **Given** el cursor está posicionado en el editor, **When** el usuario inserta una línea horizontal, **Then** se muestra un separador visual en la posición indicada.

---

### User Story 4 - Exportar el contenido (Priority: P3)

Un usuario finaliza su edición y utiliza el botón `Export` para obtener el contenido como texto Markdown o como HTML, para pegarlo o usarlo fuera del componente.

**Why this priority**: Es una funcionalidad de salida/conveniencia; el valor principal del editor (crear y visualizar contenido) ya existe sin ella, pero es requisito explícito para que el contenido producido sea útil fuera del componente.

**Independent Test**: Se puede probar de forma aislada creando contenido en el editor, invocando cada opción de exportación y verificando que el resultado obtenido corresponde fielmente al contenido del editor en el formato solicitado.

**Acceptance Scenarios**:

1. **Given** el editor tiene contenido con formato variado, **When** el usuario selecciona "copiar como Markdown", **Then** el texto Markdown resultante representa fielmente el contenido actual del editor.
2. **Given** el editor tiene contenido con formato variado, **When** el usuario selecciona "copiar como HTML", **Then** el HTML resultante representa fielmente el contenido actual del editor.

---

### Edge Cases

- ¿Qué ocurre si el usuario pega en la vista Markdown un texto que no es Markdown válido o está incompleto (p. ej. una tabla mal formada)? El editor debe conservar el texto tal cual fue introducido en la vista Markdown, y la vista renderizada debe mostrar la mejor interpretación posible sin bloquear la edición ni perder contenido.
- ¿Qué ocurre si el usuario cambia de vista mientras el contenido tiene una sintaxis Markdown ambigua o parcialmente escrita (p. ej. un `**` sin cerrar)? El cambio de vista no debe descartar ni corromper el contenido introducido, aunque el renderizado de esa porción ambigua pueda no reflejar el formato deseado hasta completarse.
- ¿Qué ocurre si se inserta una imagen o enlace con una URL inválida o inaccesible? El editor debe conservar la referencia insertada en el Markdown; la vista renderizada debe manejar el fallo de carga de forma visible pero no bloqueante (p. ej. mostrando un indicador de imagen no disponible).
- ¿Qué ocurre si se intenta anidar listas o checklists más allá de una profundidad razonable? El editor debe seguir permitiendo la edición sin errores, incluso si la profundidad excede la que la mayoría de renderizadores Markdown soportan visualmente.
- ¿Qué ocurre si el componente se usa sin contenido inicial? Debe comportarse como un editor vacío, sin errores, listo para recibir la primera edición.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El componente MUST renderizar el contenido Markdown en una vista con formato visual (WYSIWYG) por defecto.
- **FR-002**: El componente MUST mostrar una barra de herramientas fija en la parte superior del editor.
- **FR-003**: La barra de herramientas MUST incluir un control (botón `</>`) que alterna entre vista renderizada y vista Markdown/texto plano.
- **FR-004**: El cambio entre vista renderizada y vista Markdown MUST preservar el contenido exacto sin pérdida ni alteración de datos.
- **FR-005**: El contenido MUST ser editable tanto desde la vista renderizada como desde la vista Markdown.
- **FR-006**: Toda modificación realizada en la vista renderizada MUST reflejarse en la representación Markdown subyacente.
- **FR-007**: Toda modificación realizada en la vista Markdown MUST reflejarse en la vista renderizada.
- **FR-008**: La barra de herramientas MUST permitir aplicar los siguientes formatos de texto: párrafo, headings (múltiples niveles), negrita, cursiva y tachado.
- **FR-009**: La barra de herramientas MUST permitir crear listas ordenadas, listas no ordenadas, listas anidadas (de ambos tipos) y checklists (listas de tareas con estado marcado/no marcado).
- **FR-010**: La barra de herramientas MUST permitir insertar bloques de código diferenciados visualmente del texto normal.
- **FR-011**: La barra de herramientas MUST permitir insertar: una imagen, un enlace (URL sobre texto), una tabla, una línea horizontal y un bloque de HTML embebido.
- **FR-012**: El componente MUST proveer un control `Export` que permita obtener el contenido actual como texto Markdown.
- **FR-013**: El componente MUST proveer un control `Export` que permita obtener el contenido actual como HTML equivalente.
- **FR-014**: El componente MUST aceptar un contenido Markdown inicial opcional al montarse.
- **FR-015**: El componente MUST poder utilizarse sin contenido inicial, iniciando en estado vacío.
- **FR-016**: El componente MUST usar un ancho por defecto de 700px y un alto por defecto de 500px cuando no se especifica un tamaño.
- **FR-017**: El componente MUST permitir a la aplicación consumidora especificar un ancho y alto distintos de los valores por defecto.
- **FR-018**: El componente MUST notificar a la aplicación consumidora cada vez que el contenido ha sido modificado, incluyendo el contenido Markdown actualizado.
- **FR-019**: El componente MUST NOT ser responsable de persistir o guardar el contenido en el sistema de archivos; esa responsabilidad corresponde a la aplicación consumidora.
- **FR-020**: El componente MUST tratar el Markdown como la única fuente de verdad del contenido, de forma que la vista renderizada sea siempre una proyección derivada de dicho Markdown.

### Key Entities

- **Documento Markdown**: representa el contenido editable gestionado por el componente. Atributos clave: texto Markdown fuente, y su proyección renderizada (derivada, no almacenada de forma independiente).
- **Modo de vista**: estado que determina si el documento se muestra en modo renderizado (WYSIWYG) o en modo Markdown/texto. No forma parte del contenido persistente del documento.
- **Elemento insertable**: un bloque o inline insertado mediante la barra de herramientas (imagen, enlace, tabla, línea horizontal, bloque de código, HTML embebido), representado en el Markdown fuente y proyectado visualmente en la vista renderizada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario sin conocimiento previo de sintaxis Markdown puede crear un documento con al menos tres tipos de formato distintos (p. ej. heading, negrita, lista) usando únicamente la barra de herramientas, sin consultar documentación externa.
- **SC-002**: Alternar entre vista renderizada y vista Markdown en cualquier momento produce cero pérdida o alteración de contenido, verificado en el 100% de los casos de prueba de alternancia.
- **SC-003**: El contenido exportado como Markdown y como HTML corresponde fielmente al contenido visible en el editor en el 100% de los casos de prueba de exportación.
- **SC-004**: La aplicación consumidora recibe una notificación de cambio de contenido dentro de un tiempo imperceptible para el usuario (percibido como instantáneo) tras cada edición.
- **SC-005**: El componente se integra y renderiza correctamente en un proyecto React externo sin contenido inicial y sin tamaño especificado, mostrando el tamaño por defecto de 700x500px.

## Assumptions

- El "HTML embebido" insertable se trata como contenido de confianza proporcionado por el propio usuario del editor (no contenido de terceros no confiable); no se asume una capa de sanitización específica más allá de las prácticas estándar de manejo seguro de HTML en aplicaciones web, ya que definir una política de sanitización es una decisión de la aplicación consumidora según su contexto de seguridad.
- La inserción de imágenes se realiza mediante referencia (URL), consistente con la sintaxis estándar de Markdown para imágenes; la carga/subida de archivos binarios queda fuera del alcance del componente (alineado con "Fuera de alcance": el componente no persiste archivos).
- Los niveles de heading soportados siguen el estándar Markdown común (nivel 1 a 6).
- El checklist se representa con la sintaxis estándar de listas de tareas de Markdown (`- [ ]` / `- [x]`).
- No se especifican requisitos de accesibilidad ni de internacionalización particulares más allá de los ya establecidos como principios del proyecto en la constitución.
