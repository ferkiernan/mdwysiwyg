# Feature Specification: Only-View Mode, Resizable Editor, Toolbar Theming & Code Syntax Highlighting

**Feature Branch**: `003-onlyview-resize-theming-syntax-highlight`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Añadir un parámetro onlyView (default false) que arranque el editor en modo solo lectura, mostrando 'Edición desactivada' en la barra y dejando solo el botón de exportar. Añadir un parámetro para permitir redimensionar el editor arrastrando desde la esquina inferior derecha (default activado). Permitir personalizar los colores del degradado, texto/iconos y la fuente de la toolbar sin tocar el código fuente, usando el mecanismo más moderno y aceptado para esto (CSS Custom Properties), sin agrandar la superficie de props del componente. Añadir resaltado de sintaxis a los bloques de código en la vista renderizada, consistente con el selector de lenguaje ya existente."

## Contexto

Esta feature se construye sobre `001-markdown-editor` (contrato base del componente) y
`002-toolbar-redesign-insert-pickers` (toolbar rediseñada y selector de lenguaje de código). Los
props existentes (`initialContent`, `onChange`, `width`, `height`, `sanitizeEmbeddedHtml`,
`className`) MUST seguir funcionando exactamente igual que hoy — esta feature únicamente añade
capacidades nuevas, sin alterar el comportamiento por defecto actual del componente.

## Clarifications

### Session 2026-09-17

- Q: ¿Cómo se debe exponer la personalización de colores/fuente de la toolbar (gradiente, texto,
  iconos) en la API pública del componente? → A: CSS Custom Properties — el componente expone
  variables CSS que la aplicación consumidora sobreescribe con CSS estándar, sin agregar props
  nuevas para cada color/fuente individual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mostrar contenido en modo solo lectura (Priority: P1)

Una aplicación que solo necesita mostrar un documento Markdown ya existente, sin permitir que el
usuario final lo edite, inicializa el componente en modo de solo lectura. El usuario final ve el
contenido, pero no puede modificarlo desde ninguna de las dos vistas, y la barra de herramientas
deja claro que la edición está desactivada, conservando únicamente la posibilidad de exportar el
contenido.

**Why this priority**: Es un modo de uso completo y autocontenido (visor de documentos) que amplía
significativamente los contextos donde el componente puede usarse (por ejemplo, mostrar
documentación de solo lectura), y es independiente de las otras tres capacidades de esta feature.

**Independent Test**: Se puede probar de forma aislada montando el componente con el modo de solo
lectura activado y verificando que ningún control de edición está disponible, que la barra muestra
el aviso de edición desactivada, que el botón de exportar sigue funcionando, y que el contenido no
puede modificarse escribiendo directamente sobre ninguna de las dos vistas.

**Acceptance Scenarios**:

1. **Given** el componente se inicializa con el modo de solo lectura activado, **When** se
   observa la barra de herramientas, **Then** se muestra el texto "Edición desactivada" en lugar
   de los controles de formato e inserción, y el control de exportar permanece visible en el
   extremo derecho.
2. **Given** el componente está en modo de solo lectura, **When** el usuario intenta escribir o
   modificar el contenido desde la vista renderizada, **Then** el contenido no cambia.
3. **Given** el componente está en modo de solo lectura, **When** el usuario intenta escribir o
   modificar el contenido desde la vista Markdown, **Then** el contenido no cambia.
4. **Given** el componente está en modo de solo lectura, **When** el usuario activa el control de
   exportar, **Then** puede copiar el contenido como Markdown o como HTML igual que en modo
   normal.
5. **Given** el componente se inicializa sin especificar el modo de solo lectura, **When** se
   observa su comportamiento, **Then** el componente se comporta exactamente igual que antes de
   esta feature (edición habilitada, barra completa).

---

### User Story 2 - Redimensionar el editor manualmente (Priority: P2)

Un usuario que encuentra que el tamaño por defecto (o el tamaño configurado por la aplicación) del
editor no le resulta suficiente, arrastra desde la esquina inferior derecha del componente para
agrandarlo, de la misma forma en que se redimensiona una caja de texto multilínea estándar en un
navegador.

**Why this priority**: Mejora la ergonomía de uso del editor para documentos más extensos, pero el
componente ya es completamente funcional con un tamaño fijo; no bloquea ninguna otra
funcionalidad.

**Independent Test**: Se puede probar de forma aislada montando el componente con el
redimensionamiento habilitado, arrastrando desde su esquina inferior derecha, y verificando que el
componente cambia de tamaño tanto en ancho como en alto según el arrastre; y, por separado,
montándolo con el redimensionamiento deshabilitado y verificando que no aparece ningún control de
arrastre y que el tamaño permanece fijo.

**Acceptance Scenarios**:

1. **Given** el componente se inicializa sin especificar la opción de redimensionamiento, **When**
   se observa su esquina inferior derecha, **Then** existe un control de arrastre que permite
   agrandar el componente (comportamiento activado por defecto).
2. **Given** el redimensionamiento está habilitado, **When** el usuario arrastra la esquina
   inferior derecha hacia la derecha y hacia abajo, **Then** el ancho y el alto del componente
   aumentan en la misma dirección del arrastre.
3. **Given** el componente se inicializa con el redimensionamiento explícitamente deshabilitado,
   **When** se observa su esquina inferior derecha, **Then** no existe ningún control de arrastre y
   el componente conserva el tamaño indicado (por props o por defecto) sin cambios.

---

### User Story 3 - Personalizar la apariencia visual de la toolbar (Priority: P2)

Una aplicación que integra el componente en un producto con su propia identidad visual (colores de
marca, tipografía corporativa) ajusta el aspecto de la barra de herramientas del editor —el
degradado de fondo, el color del texto e iconos, y la fuente tipográfica— para que combine con el
resto de la aplicación, sin necesidad de modificar el código fuente del componente ni de esperar
una nueva versión de la librería que agregue soporte específico para esa personalización.

**Why this priority**: Es una mejora de integración visual que no es indispensable para el
funcionamiento del editor (el aspecto por defecto ya es utilizable), pero es importante para la
adopción del componente en productos con identidad visual propia.

**Independent Test**: Se puede probar de forma aislada aplicando una personalización de colores y
fuente desde la aplicación consumidora (sin tocar el código del componente) y verificando que la
barra de herramientas refleja esos valores; y, por separado, montando el componente sin ninguna
personalización y verificando que conserva el aspecto visual por defecto actual (degradado gris,
texto e iconos oscuros).

**Acceptance Scenarios**:

1. **Given** el componente se monta sin ninguna personalización visual, **When** se observa la
   barra de herramientas, **Then** conserva el aspecto por defecto actual (degradado de gris claro
   a gris oscuro, texto e iconos en color oscuro).
2. **Given** una aplicación consumidora define una personalización de los colores del degradado de
   la barra, **When** el componente se renderiza, **Then** el fondo de la barra refleja los nuevos
   colores en lugar del degradado gris por defecto.
3. **Given** una aplicación consumidora define una personalización del color de texto/iconos y de
   la fuente tipográfica de la barra, **When** el componente se renderiza, **Then** el texto y los
   iconos de la barra reflejan esos valores.
4. **Given** una aplicación consumidora personaliza solo uno de los aspectos visuales (por ejemplo,
   solo el color de texto), **When** el componente se renderiza, **Then** el resto de los aspectos
   no personalizados (por ejemplo, el degradado) conservan su valor por defecto.

---

### User Story 4 - Ver bloques de código con resaltado de sintaxis (Priority: P3)

Un usuario que trabaja con documentación técnica ve, en la vista renderizada, que el contenido de
los bloques de código aparece coloreado según la sintaxis del lenguaje de programación asociado a
ese bloque, en lugar de mostrarse como texto plano de un solo color, facilitando la lectura del
código.

**Why this priority**: Es una mejora de legibilidad sobre una funcionalidad que ya existe (los
bloques de código y su selector de lenguaje, de `002-toolbar-redesign-insert-pickers`); el editor
ya es funcional sin resaltado de sintaxis.

**Independent Test**: Se puede probar de forma aislada insertando un bloque de código, asignándole
un lenguaje mediante el selector ya existente, y verificando que el contenido del bloque se muestra
con distintos colores según los elementos de la sintaxis de ese lenguaje (por ejemplo, palabras
clave, cadenas de texto, comentarios).

**Acceptance Scenarios**:

1. **Given** un bloque de código tiene asignado un lenguaje predefinido (por ejemplo,
   "JavaScript"), **When** se observa en la vista renderizada, **Then** el contenido del bloque
   aparece coloreado reflejando la sintaxis de ese lenguaje.
2. **Given** un bloque de código tiene asignado un lenguaje personalizado no reconocido, **When**
   se observa en la vista renderizada, **Then** el contenido se muestra de forma legible (aunque
   sea sin resaltado específico), sin errores ni contenido faltante.
3. **Given** un bloque de código no tiene ningún lenguaje asignado, **When** se observa en la vista
   renderizada, **Then** el contenido se muestra igual que antes de esta feature (sin resaltado).
4. **Given** un bloque de código con resaltado de sintaxis se alterna entre la vista renderizada y
   la vista Markdown, **When** se compara el contenido antes y después de la alternancia, **Then**
   el Markdown fuente permanece exactamente igual (el resaltado es únicamente una presentación
   visual de la vista renderizada, no altera el contenido).

---

### Edge Cases

- ¿Qué ocurre si se intenta redimensionar el componente por debajo de un tamaño razonable para
  mostrar la barra de herramientas y algo de contenido? El componente debe imponer un tamaño
  mínimo que garantice que la barra de herramientas siga siendo utilizable.
- ¿Qué ocurre si el modo de solo lectura se activa junto con una personalización visual de la
  barra? Ambas capacidades son independientes: la barra en modo solo lectura ("Edición
  desactivada" + botón de exportar) debe seguir respetando la personalización de colores y fuente
  aplicada.
- ¿Qué ocurre si se intenta redimensionar el componente mientras está en modo de solo lectura? El
  redimensionamiento es una capacidad independiente del modo de edición; si está habilitado, debe
  seguir funcionando también en modo de solo lectura.
- ¿Qué ocurre si la aplicación consumidora personaliza la barra con colores de muy bajo contraste
  entre fondo y texto? La especificación no impone una validación de contraste automática; es
  responsabilidad de quien personaliza el aspecto visual mantener una combinación legible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El componente MUST aceptar un parámetro de inicialización booleano que active un
  modo de solo lectura, con valor por defecto `false` (edición habilitada).
- **FR-002**: Cuando el modo de solo lectura está activo, el componente MUST impedir cualquier
  modificación del contenido desde la vista renderizada.
- **FR-003**: Cuando el modo de solo lectura está activo, el componente MUST impedir cualquier
  modificación del contenido desde la vista Markdown.
- **FR-004**: Cuando el modo de solo lectura está activo, la barra de herramientas MUST mostrar el
  texto "Edición desactivada" en lugar de los controles de formato, listas, bloques e inserción.
- **FR-005**: Cuando el modo de solo lectura está activo, la barra de herramientas MUST conservar
  únicamente el control de exportar, en el extremo derecho.
- **FR-006**: Cuando el modo de solo lectura está activo, el control de alternar entre vista
  renderizada y vista Markdown (`</>`) MUST NOT estar disponible en la barra de herramientas.
- **FR-007**: El control de exportar MUST conservar toda su funcionalidad (copiar como Markdown y
  como HTML) mientras el componente está en modo de solo lectura.
- **FR-008**: Cuando el modo de solo lectura está desactivado (valor por defecto), el componente
  MUST comportarse de forma idéntica a como lo hacía antes de esta feature.
- **FR-009**: El componente MUST aceptar un parámetro de inicialización booleano que habilite el
  redimensionamiento manual del componente, con valor por defecto `true` (redimensionamiento
  habilitado).
- **FR-010**: Cuando el redimensionamiento está habilitado, el componente MUST ofrecer un control
  de arrastre en su esquina inferior derecha que permita aumentar tanto el ancho como el alto del
  componente.
- **FR-011**: Cuando el redimensionamiento está deshabilitado, el componente MUST NOT mostrar
  ningún control de arrastre, y MUST mantener el tamaño indicado (por props o por defecto) sin
  cambios.
- **FR-012**: El componente MUST imponer un tamaño mínimo de redimensionamiento que mantenga la
  barra de herramientas y una porción utilizable del área de contenido visibles.
- **FR-013**: El componente MUST permitir que la aplicación consumidora personalice, sin modificar
  el código fuente del componente: los colores del degradado de fondo de la barra de herramientas,
  el color del texto/iconos de la barra, y la fuente tipográfica de la barra.
- **FR-014**: El mecanismo de personalización visual MUST implementarse mediante puntos de
  extensión de estilo estándar (variables CSS) que la aplicación consumidora pueda sobreescribir
  con CSS convencional, sin requerir props adicionales en la API del componente por cada aspecto
  visual personalizable.
- **FR-015**: Si la aplicación consumidora no personaliza ningún aspecto visual de la barra, el
  componente MUST mostrar el aspecto por defecto actual (degradado de gris claro a gris oscuro,
  texto e iconos en color oscuro).
- **FR-016**: La aplicación consumidora MUST poder personalizar cualquier subconjunto de los
  aspectos visuales de la barra (por ejemplo, solo el color de texto) sin verse obligada a
  redefinir los demás, que MUST conservar su valor por defecto.
- **FR-017**: El componente MUST aplicar resaltado de sintaxis al contenido de los bloques de
  código en la vista renderizada, reflejando el lenguaje de programación asociado a cada bloque.
- **FR-018**: El resaltado de sintaxis MUST ser consistente con el conjunto de lenguajes ya
  soportados por el selector de lenguaje de bloques de código (JSON, SQL, TypeScript, JavaScript,
  Java) y MUST degradarse de forma legible (sin resaltado específico, pero sin errores ni pérdida
  de contenido) para lenguajes personalizados no reconocidos.
- **FR-019**: Un bloque de código sin lenguaje asignado MUST mostrarse sin resaltado de sintaxis,
  igual que el comportamiento anterior a esta feature.
- **FR-020**: El resaltado de sintaxis MUST ser exclusivamente una presentación visual de la vista
  renderizada; MUST NOT alterar el contenido Markdown fuente del bloque de código.
- **FR-021**: Ninguno de los requisitos de esta feature MUST alterar el comportamiento de los
  props existentes (`initialContent`, `onChange`, `width`, `height`, `sanitizeEmbeddedHtml`,
  `className`) cuando se usan con sus valores por defecto o de la forma en que ya se usaban antes
  de esta feature.

### Key Entities

- **Modo de solo lectura**: estado de configuración del componente (activado/desactivado) que
  determina si el contenido puede modificarse y qué controles se muestran en la barra de
  herramientas. Se establece al inicializar el componente.
- **Preferencia de redimensionamiento**: estado de configuración del componente
  (habilitado/deshabilitado) que determina si existe un control de arrastre para cambiar el tamaño
  del componente. Se establece al inicializar el componente; el tamaño resultante de un
  redimensionamiento es efímero (no se persiste entre sesiones).
- **Personalización visual de la barra**: conjunto de valores de estilo (colores del degradado,
  color de texto/iconos, fuente tipográfica) que la aplicación consumidora puede sobreescribir
  desde fuera del componente; cualquier valor no personalizado conserva su default.
- **Lenguaje de bloque de código**: entidad ya definida en `002-toolbar-redesign-insert-pickers`;
  esta feature la reutiliza como criterio para determinar el esquema de resaltado de sintaxis
  aplicado a cada bloque.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un componente inicializado en modo de solo lectura no permite ninguna modificación
  de su contenido en el 100% de los intentos de edición desde cualquiera de las dos vistas.
- **SC-002**: Un componente en modo de solo lectura conserva la funcionalidad de exportar el
  contenido en el 100% de los casos de prueba.
- **SC-003**: Un usuario puede aumentar el tamaño visible del componente arrastrando su esquina
  inferior derecha, sin necesidad de ninguna otra acción, cuando el redimensionamiento está
  habilitado (comportamiento por defecto).
- **SC-004**: Una aplicación consumidora puede cambiar completamente el aspecto de la barra de
  herramientas (colores y fuente) sin modificar ni un solo archivo del código fuente del
  componente.
- **SC-005**: El 100% de los aspectos visuales de la barra no personalizados explícitamente
  conservan su apariencia por defecto tras aplicar una personalización parcial.
- **SC-006**: Un bloque de código con un lenguaje predefinido asignado muestra al menos dos colores
  distintos correspondientes a distintos elementos de su sintaxis (por ejemplo, palabras clave y
  cadenas de texto), en lugar de un único color plano.
- **SC-007**: Ninguno de los comportamientos existentes del componente (documentados en
  `001-markdown-editor` y `002-toolbar-redesign-insert-pickers`) se ve alterado al usar el
  componente sin activar ninguna de las capacidades nuevas de esta feature.

## Assumptions

- Cuando el modo de solo lectura está activo, los controles de formato, listas, inserción y
  alternancia de vista se ocultan de la barra de herramientas (no se muestran deshabilitados en
  gris), ya que no cumplen ninguna función mientras la edición está desactivada y ocultarlos evita
  confusión sobre por qué no responden.
- El control de redimensionamiento (esquina inferior derecha) sigue la convención visual estándar
  de un `<textarea>` HTML redimensionable, familiar para la mayoría de los usuarios de interfaces
  web.
- El tamaño mínimo de redimensionamiento (FR-012) se interpreta como una protección funcional
  (evitar que la barra de herramientas o el control de redimensionamiento dejen de ser
  utilizables), no como un valor exacto en píxeles prescrito por esta especificación.
- El mecanismo de personalización visual (FR-014) se implementa mediante variables CSS expuestas
  por el componente, siguiendo la práctica moderna estándar de theming de componentes de librería
  de UI en React (confirmado con el usuario), en lugar de una prop de objeto de tema o de variantes
  predefinidas.
- El resaltado de sintaxis se limita a diferenciar visualmente elementos de la sintaxis del código
  (palabras clave, literales, comentarios, etc.); no se especifica una paleta de colores exacta,
  que queda como detalle de diseño visual coherente con el aspecto por defecto del componente.
