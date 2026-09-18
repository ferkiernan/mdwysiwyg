# Feature Specification: Table Context Menus, Mermaid Diagrams, Cursor Preservation, Extended Theming & Imperative API

**Feature Branch**: `005-table-context-menus-mermaid-imperative-api`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "(1) El texto de la barra en modo `onlyView` ('Edición desactivada') debe ser configurable, por ejemplo para mostrar el nombre del archivo editado. (2) En la vista renderizada, un segundo clic sobre una celda de encabezado ya enfocada abre un menú de columna (añadir a la derecha/izquierda, mover a la derecha/izquierda, eliminar columna); un segundo clic sobre una celda de datos ya enfocada abre un menú de fila (añadir arriba/abajo, mover arriba/abajo, eliminar fila). (3) Al alternar entre vista renderizada y vista Markdown, el cursor debe posicionarse en el punto correspondiente a donde estaba en la vista anterior. (4) Soporte para diagramas Mermaid: un bloque ```mermaid``` en el Markdown se renderiza como diagrama; contenido Mermaid detectado al insertar HTML se trata como bloque de código con lenguaje mermaid en vez de HTML embebido. (5) Ampliar el theming: fuente y color separados para el área de contenido en modo texto vs. modo renderizado, colores de scrollbar, y variables para el fondo del select de párrafo, el fondo de botones presionados, y el fondo (con o sin degradado) de botones en hover. (6) API imperativa vía ref: métodos reset() y isModified(), más las props documentId y fileName. (7) Toda la documentación del proyecto debe reflejar estos cambios."

## Contexto

Esta feature se construye sobre `001-markdown-editor`, `002-toolbar-redesign-insert-pickers`,
`003-onlyview-resize-theming-syntax-highlight` y `004-link-insertion-ux-floating-popover`, ya
implementadas. Extiende el contrato público del componente (nuevas props y, por primera vez, una
API imperativa vía `ref`) y su superficie de personalización visual, sin alterar el comportamiento
por defecto de ninguna capacidad ya existente.

## Clarifications

### Session 2026-09-18

- Q: ¿Qué mecanismo de API se usa para exponer `reset()` e `isModified()` desde fuera del
  componente? → A: Ref imperativo (`forwardRef`), patrón estándar de React (`editorRef.current.reset()`),
  sin agregar props nuevas para esto.
- Q: Al insertar HTML y detectar que el contenido es en realidad un diagrama Mermaid, ¿cómo se
  trata? → A: Como un bloque de código con lenguaje `"mermaid"`, reutilizando el selector de
  lenguaje de bloques de código ya existente — un único mecanismo de renderizado Mermaid en todo
  el editor (el bloque de código), sin un tipo de nodo nuevo separado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personalizar el aviso de modo de solo lectura (Priority: P3)

Una aplicación que muestra un documento en modo de solo lectura personaliza el texto que ve el
usuario en la barra —por ejemplo, mostrando el nombre del archivo en lugar del aviso genérico
"Edición desactivada"— para que el visor comunique qué documento se está mostrando.

**Why this priority**: Es un ajuste de personalización de texto sobre una capacidad ya existente
(`onlyView` de `003`); el componente ya es completamente funcional con el texto por defecto.

**Independent Test**: Se puede probar de forma aislada montando el componente en modo de solo
lectura con un texto personalizado y verificando que la barra muestra ese texto en lugar del
mensaje por defecto; y, por separado, montándolo sin personalización y verificando que conserva
el mensaje "Edición desactivada".

**Acceptance Scenarios**:

1. **Given** el componente está en modo de solo lectura sin personalizar el aviso, **When** se
   observa la barra, **Then** muestra el texto por defecto "Edición desactivada".
2. **Given** el componente está en modo de solo lectura con un texto personalizado (por ejemplo,
   el nombre de un archivo), **When** se observa la barra, **Then** muestra ese texto
   personalizado en lugar del mensaje por defecto.

---

### User Story 2 - Editar la estructura de una tabla desde la vista renderizada (Priority: P1)

Un usuario que trabaja sobre una tabla en la vista renderizada hace clic sobre una celda de
encabezado que ya tenía el cursor posicionado, y ve un menú con las acciones de columna
disponibles (añadir a la derecha o izquierda, mover a la derecha o izquierda, eliminar esta
columna). De forma análoga, al hacer clic sobre una celda de datos que ya tenía el cursor
posicionado, ve un menú con las acciones de fila disponibles (añadir arriba o abajo, mover la fila
subiéndola o bajándola, eliminar esta fila).

**Why this priority**: Sin esto, modificar la estructura de una tabla ya insertada (agregar o
quitar filas/columnas, reordenarlas) no tiene ninguna vía desde la vista renderizada — el usuario
tendría que recurrir a editar el Markdown crudo manualmente, lo cual contradice el propósito
central de un editor WYSIWYG.

**Independent Test**: Se puede probar de forma aislada insertando una tabla, haciendo clic dos
veces sobre una celda de encabezado (primero para posicionar el cursor, luego para abrir el menú)
y verificando las opciones de columna disponibles; y, por separado, repitiendo la prueba sobre una
celda de datos para verificar las opciones de fila.

**Acceptance Scenarios**:

1. **Given** el cursor no está posicionado en ninguna celda de una tabla, **When** el usuario hace
   clic por primera vez sobre una celda de encabezado, **Then** el cursor se posiciona en esa
   celda sin abrir ningún menú.
2. **Given** el cursor ya está posicionado en una celda de encabezado, **When** el usuario hace
   clic nuevamente sobre esa misma celda, **Then** se abre un menú con las opciones: "Añadir
   columna" (con las variantes "a la derecha" y "a la izquierda"), "Mover columna" (con las
   variantes "a la derecha" y "a la izquierda"), y "Eliminar esta columna".
3. **Given** el menú de columna está abierto, **When** el usuario selecciona "Añadir columna a la
   derecha", **Then** se inserta una nueva columna inmediatamente a la derecha de la columna
   actual, con celda de encabezado vacía.
4. **Given** el menú de columna está abierto, **When** el usuario selecciona "Mover columna a la
   izquierda", **Then** la columna actual intercambia su posición con la columna inmediatamente a
   su izquierda (sin efecto visible si ya es la primera columna).
5. **Given** el menú de columna está abierto, **When** el usuario selecciona "Eliminar esta
   columna", **Then** la columna completa (encabezado y todas sus celdas de datos) se elimina de
   la tabla.
6. **Given** el cursor ya está posicionado en una celda de datos (no de encabezado), **When** el
   usuario hace clic nuevamente sobre esa misma celda, **Then** se abre un menú con las opciones:
   "Añadir fila" (con las variantes "arriba" y "abajo"), "Mover fila" (con las
   variantes "subir esta fila" y "bajar esta fila"), y "Eliminar esta fila".
7. **Given** el menú de fila está abierto, **When** el usuario selecciona "Eliminar esta fila",
   **Then** la fila completa se elimina de la tabla.
8. **Given** una tabla tiene una única columna o una única fila de datos, **When** el usuario
   intenta eliminarla desde el menú correspondiente, **Then** la tabla no queda en un estado
   estructuralmente inválido (por ejemplo, sin ninguna columna).

---

### User Story 3 - Conservar la posición del cursor al alternar de vista (Priority: P2)

Un usuario que está editando en un punto específico del documento —ya sea en la vista renderizada
o en la vista Markdown— alterna a la otra vista con el botón `</>`, y encuentra el cursor
posicionado en el lugar del documento que corresponde a donde estaba antes de alternar, en lugar
de tener que volver a ubicarse manualmente.

**Why this priority**: Mejora significativamente la fluidez de edición al alternar entre vistas
con frecuencia, pero el editor ya es funcional sin esto (el contenido se preserva correctamente,
solo el punto de edición se pierde).

**Independent Test**: Se puede probar de forma aislada posicionando el cursor en un punto
específico del contenido en una vista, alternando a la otra vista, y verificando que el cursor (o
el punto de edición activo) corresponde al mismo lugar relativo del documento.

**Acceptance Scenarios**:

1. **Given** el cursor está posicionado dentro de una palabra específica en la vista renderizada,
   **When** el usuario alterna a la vista Markdown, **Then** el cursor en la vista Markdown se
   posiciona en el punto del texto fuente que corresponde a esa misma palabra.
2. **Given** el cursor está posicionado en un punto específico del texto en la vista Markdown,
   **When** el usuario alterna a la vista renderizada, **Then** el cursor en la vista renderizada
   se posiciona en el contenido que corresponde a ese mismo punto.
3. **Given** el usuario edita contenido en la vista renderizada cuya serialización a Markdown
   difiere textualmente del original (por ejemplo, normalización de formato), **When** alterna a
   la vista Markdown, **Then** el cursor se posiciona en la mejor aproximación disponible al mismo
   punto del documento, sin producir un error ni posicionar el cursor fuera del contenido.

---

### User Story 4 - Ver y crear diagramas Mermaid (Priority: P2)

Un usuario que trabaja con documentación técnica ve, en la vista renderizada, que un bloque de
código marcado como Mermaid se muestra como el diagrama que describe (por ejemplo, un diagrama de
flujo o de secuencia) en lugar de mostrarse como texto de código plano. Al insertar contenido
Mermaid a través de la opción de insertar HTML, el sistema reconoce que el contenido pegado es en
realidad la sintaxis de un diagrama Mermaid y lo trata como un bloque de código Mermaid en lugar
de insertarlo como HTML embebido.

**Why this priority**: Es una mejora de valor para casos de uso de documentación técnica
(diagramas de arquitectura, flujos), pero el editor ya es completamente funcional sin soporte de
Mermaid (el contenido, aunque no renderizado visualmente como diagrama, no se pierde ni se
corrompe).

**Independent Test**: Se puede probar de forma aislada insertando un documento con un bloque de
código marcado como Mermaid y verificando que se muestra como diagrama en la vista renderizada; y,
por separado, usando la opción de insertar HTML con contenido de sintaxis Mermaid y verificando
que el resultado es un bloque de código Mermaid, no un bloque de HTML embebido.

**Acceptance Scenarios**:

1. **Given** el Markdown de un documento contiene un bloque de código marcado como Mermaid con una
   sintaxis de diagrama válida, **When** se muestra en la vista renderizada, **Then** el bloque se
   presenta como el diagrama correspondiente, no como texto de código.
2. **Given** un bloque de código Mermaid contiene una sintaxis inválida o no reconocida, **When**
   se muestra en la vista renderizada, **Then** el contenido se presenta de forma legible (por
   ejemplo, como el texto del bloque de código sin renderizar), sin bloquear el resto del
   documento ni perder el contenido.
3. **Given** el usuario usa la opción de insertar HTML e ingresa contenido cuya sintaxis
   corresponde a un diagrama Mermaid, **When** confirma la inserción, **Then** el contenido se
   inserta como un bloque de código con lenguaje Mermaid, y no como un bloque de HTML embebido.
4. **Given** el usuario usa la opción de insertar HTML con contenido que no corresponde a sintaxis
   Mermaid, **When** confirma la inserción, **Then** el contenido se inserta como HTML embebido,
   igual que el comportamiento ya existente.
5. **Given** un bloque de código Mermaid se alterna entre la vista renderizada y la vista
   Markdown, **When** se compara el contenido antes y después, **Then** el Markdown fuente
   permanece exactamente igual (el renderizado del diagrama es puramente presentacional).

---

### User Story 5 - Personalizar visualmente el área de contenido, el scroll y más detalles de la barra (Priority: P3)

Una aplicación que integra el componente ajusta, además de lo ya personalizable, el color y la
fuente del área de contenido de forma independiente para cada vista (texto Markdown crudo vs.
renderizada), el color del scroll cuando aparece, y aspectos de la barra que antes no eran
personalizables (fondo del selector de encabezado, fondo de los botones presionados, y fondo —con
o sin degradado— de los botones al pasar el mouse), todo sin modificar el código fuente del
componente.

**Why this priority**: Amplía la capacidad de theming ya introducida en `003`, pero el componente
ya es completamente utilizable con su apariencia por defecto o con la personalización ya
disponible.

**Independent Test**: Se puede probar de forma aislada aplicando cada una de las nuevas variables
de personalización desde la aplicación consumidora y verificando que el aspecto correspondiente
cambia; y, por separado, verificando que sin personalización, el aspecto por defecto no cambia
respecto a `003`/`004`.

**Acceptance Scenarios**:

1. **Given** una aplicación consumidora personaliza el color y la fuente del área de contenido en
   modo Markdown de forma distinta a la vista renderizada, **When** el usuario alterna entre
   vistas, **Then** cada vista refleja su propio color y fuente personalizados.
2. **Given** el contenido del editor excede el espacio visible y aparece una barra de scroll,
   **When** una aplicación consumidora personaliza el color del scroll, **Then** la barra de
   scroll refleja ese color en los navegadores que lo permiten personalizar.
3. **Given** una aplicación consumidora personaliza el fondo del selector de encabezado, el fondo
   de un botón en estado presionado, y el fondo (con degradado) de un botón en hover, **When** el
   componente se renderiza, **Then** cada uno de esos tres aspectos refleja la personalización
   aplicada.
4. **Given** el componente se monta sin ninguna de estas nuevas personalizaciones, **When** se
   observa su aspecto, **Then** es visualmente idéntico al comportamiento por defecto ya
   establecido en `003` y `004`.

---

### User Story 6 - Controlar el editor y detectar cambios desde la aplicación consumidora (Priority: P1)

Una aplicación que integra el componente necesita, en determinados momentos (por ejemplo, al
cancelar una edición o cambiar de documento), restablecer el contenido del editor a su valor
original sin tener que desmontar y volver a montar el componente. También necesita saber, en
cualquier momento, si el usuario modificó el contenido respecto al valor original, para por
ejemplo advertir antes de cerrar sin guardar. Además, la aplicación puede asociar al editor un
identificador de documento y un nombre de archivo, útiles para su propia lógica (por ejemplo,
mostrar el nombre de archivo en el aviso de solo lectura de la Historia 1).

**Why this priority**: Sin una forma de restablecer el contenido o detectar cambios, cualquier
aplicación que necesite un flujo de "descartar cambios" o "advertir antes de salir" no tiene
ninguna vía para implementarlo con este componente, lo cual limita significativamente su
adopción en aplicaciones reales de edición de documentos.

**Independent Test**: Se puede probar de forma aislada montando el componente, modificando su
contenido, invocando el método de restablecer desde fuera y verificando que el contenido vuelve al
valor original; y, por separado, verificando que el indicador de modificación refleja
correctamente si el contenido actual difiere del original.

**Acceptance Scenarios**:

1. **Given** el componente se montó con un contenido inicial y el usuario lo modificó, **When** la
   aplicación consumidora invoca el método de restablecer desde fuera del componente, **Then** el
   contenido del editor vuelve exactamente al valor con el que se montó originalmente, en ambas
   vistas.
2. **Given** el componente se montó con un contenido inicial y no fue modificado, **When** la
   aplicación consumidora consulta si el contenido fue modificado, **Then** la respuesta indica
   que no hubo modificación.
3. **Given** el usuario modifica el contenido del editor de cualquier forma, **When** la aplicación
   consumidora consulta si el contenido fue modificado, **Then** la respuesta indica que sí hubo
   modificación.
4. **Given** el contenido fue modificado y luego se invoca el método de restablecer, **When** la
   aplicación consumidora vuelve a consultar si el contenido fue modificado, **Then** la respuesta
   indica que no hay modificación (el estado de "modificado" se reinicia junto con el contenido).
5. **Given** una aplicación consumidora monta el componente indicando un identificador de
   documento y un nombre de archivo, **When** se inspecciona el componente, **Then** ambos valores
   quedan disponibles como parte de su configuración, sin que el componente les dé un uso
   obligatorio propio más allá de aceptarlos.

---

### Edge Cases

- ¿Qué ocurre si el usuario hace clic sobre una celda de encabezado, luego hace clic en otra parte
  del documento, y vuelve a hacer clic sobre la misma celda de encabezado? Se considera un primer
  clic nuevo (el cursor no "ya se encontraba allí" de forma continua), por lo que solo reposiciona
  el cursor sin abrir el menú.
- ¿Qué ocurre si se intenta mover una columna o fila en la dirección donde ya no hay más
  columnas/filas (por ejemplo, mover la primera columna hacia la izquierda)? La acción no tiene
  efecto visible; la tabla permanece igual.
- ¿Qué ocurre si el usuario alterna de vista mientras el cursor está dentro de un bloque de código
  Mermaid o de un elemento sin una correspondencia textual directa? El cursor se posiciona en la
  mejor aproximación disponible (por ejemplo, el inicio o el final del bloque correspondiente), sin
  error.
- ¿Qué ocurre si se invoca el método de restablecer mientras el componente está en modo de solo
  lectura (`onlyView`)? El restablecimiento del contenido es una operación de la aplicación
  consumidora sobre el editor, no una edición del usuario final; se ejecuta igualmente.
- ¿Qué ocurre si se llama al método de restablecer sin que el contenido haya sido modificado? No
  produce ningún cambio visible ni notifica una modificación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El componente MUST aceptar un parámetro de inicialización que permita personalizar
  el texto mostrado en la barra cuando el componente está en modo de solo lectura, con el texto
  "Edición desactivada" como valor por defecto si no se especifica.
- **FR-002**: En la vista renderizada, MUST distinguirse entre un clic que posiciona el cursor por
  primera vez sobre una celda de tabla y un clic sobre una celda que ya tenía el cursor
  posicionado.
- **FR-003**: Un clic sobre una celda de encabezado de tabla que ya tenía el cursor posicionado
  MUST abrir un menú con las opciones "Añadir columna" (a la derecha / a la izquierda), "Mover
  columna" (a la derecha / a la izquierda), y "Eliminar esta columna".
- **FR-004**: Un clic sobre una celda de datos de tabla (no de encabezado) que ya tenía el cursor
  posicionado MUST abrir un menú con las opciones "Añadir fila" (arriba / abajo),
  "Mover fila" (subir esta fila / bajar esta fila), y "Eliminar esta fila".
- **FR-005**: Cada acción del menú de columna/fila MUST aplicarse sobre la tabla y MUST reflejarse
  tanto en la vista renderizada como en el Markdown resultante.
- **FR-006**: Al alternar entre la vista renderizada y la vista Markdown (y viceversa), el
  componente MUST posicionar el cursor/punto de edición en la ubicación del documento que
  corresponde a la posición que tenía en la vista de origen, usando la mejor aproximación
  disponible cuando no exista una correspondencia textual exacta.
- **FR-007**: Un bloque de código marcado con el lenguaje Mermaid y con sintaxis de diagrama
  válida MUST renderizarse como el diagrama correspondiente en la vista renderizada, en lugar de
  como texto de código plano.
- **FR-008**: Un bloque de código marcado con el lenguaje Mermaid con sintaxis inválida o no
  reconocida MUST mostrarse de forma legible sin bloquear el resto del documento.
- **FR-009**: Al insertar contenido mediante la opción de insertar HTML, si el contenido ingresado
  corresponde a sintaxis de un diagrama Mermaid, el sistema MUST insertarlo como un bloque de
  código con lenguaje Mermaid en lugar de como HTML embebido.
- **FR-010**: El renderizado de diagramas Mermaid MUST ser exclusivamente presentacional: MUST NOT
  alterar el Markdown fuente del bloque de código al alternar entre vistas.
- **FR-011**: El componente MUST permitir que la aplicación consumidora personalice, mediante el
  mismo mecanismo de variables CSS ya establecido en `003`, el color y la fuente del área de
  contenido de forma independiente para la vista Markdown y para la vista renderizada.
- **FR-012**: El componente MUST permitir personalizar el color de la barra de desplazamiento
  (scroll) del componente, en los entornos donde el navegador lo permita.
- **FR-013**: El componente MUST permitir personalizar, mediante variables CSS, el fondo del
  selector de nivel de encabezado, el fondo de un botón de la barra en estado presionado, y el
  fondo (incluyendo degradado) de un botón de la barra en estado de hover.
- **FR-014**: Si ninguna de las nuevas variables de personalización de las Historias 1 y 5 es
  sobreescrita, el componente MUST conservar el aspecto por defecto ya establecido en `003` y
  `004`.
- **FR-015**: El componente MUST exponer, a través de una referencia (`ref`) al componente, un
  método que restablezca el contenido del editor a su valor inicial (el valor con el que se
  montó, o el más reciente valor aplicado externamente si aplica), reflejándose en ambas vistas.
- **FR-016**: El componente MUST exponer, a través de la misma referencia, un método que indique
  si el contenido actual difiere del contenido original.
- **FR-017**: Tras invocar el método de restablecer contenido, el indicador de modificación MUST
  reflejar que no hay modificación respecto al contenido restablecido.
- **FR-018**: El componente MUST aceptar dos parámetros de inicialización opcionales,
  identificador de documento y nombre de archivo, que la aplicación consumidora puede asociar al
  editor para su propio uso (por ejemplo, como valor por defecto razonable para el texto del modo
  de solo lectura de la Historia 1).
- **FR-019**: Ninguno de los requisitos de esta feature MUST alterar el comportamiento de las
  capacidades ya existentes (`001` a `004`) cuando se usan sin las nuevas capacidades o con sus
  valores por defecto.
- **FR-020**: Toda la documentación del proyecto (documentación de la API del componente y
  documentación de más alto nivel del repositorio) MUST actualizarse para reflejar las
  capacidades nuevas de esta feature antes de considerarla completa.

### Key Entities

- **Estado de foco de celda de tabla**: información transitoria sobre si el cursor ya estaba
  posicionado en una celda específica antes del clic actual; determina si un clic reposiciona el
  cursor o abre el menú de columna/fila correspondiente.
- **Menú de columna** / **Menú de fila**: paneles de acciones transitorios, análogos en
  comportamiento al resto de los menús flotantes ya existentes en el editor, que operan sobre la
  estructura de la tabla (añadir, mover, eliminar) en el punto donde se activaron.
- **Mapeo de posición entre vistas**: correspondencia, calculada al momento de alternar de vista,
  entre una posición del documento en la vista de origen y la posición equivalente (exacta o
  aproximada) en la vista de destino. Es información efímera, no persistida.
- **Bloque de diagrama Mermaid**: un bloque de código cuyo lenguaje asociado es "mermaid";
  reutiliza la entidad "Lenguaje de bloque de código" ya definida en `002`, sin un tipo nuevo.
- **Personalización visual extendida**: continuación de la "Personalización visual de la barra y
  del área de contenido" ya definida en `003`, con variables adicionales para: color/fuente del
  área de contenido por vista, color de scroll, fondo del selector de encabezado, fondo de botón
  presionado, y fondo (degradado) de botón en hover.
- **Contenido original**: el valor de contenido con el que el editor se inicializó (o el último
  valor aplicado externamente reconocido como "original"), usado como referencia tanto para
  restablecer el contenido como para determinar si hubo modificación.
- **Identificador de documento** / **Nombre de archivo**: valores de configuración opcionales que
  la aplicación consumidora asocia al editor; no forman parte del contenido Markdown ni del
  modelo de datos del documento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una aplicación puede mostrar el nombre de un archivo en lugar del aviso genérico de
  solo lectura sin ninguna otra modificación al resto del comportamiento del componente.
- **SC-002**: Un usuario puede añadir, mover y eliminar columnas o filas de una tabla ya insertada
  completamente desde la vista renderizada, sin necesidad de editar el Markdown crudo.
- **SC-003**: En el 100% de los casos de prueba donde existe una correspondencia textual directa,
  alternar de vista posiciona el cursor exactamente en el punto equivalente del documento.
- **SC-004**: Un documento con al menos un diagrama Mermaid válido se muestra visualmente como
  diagrama en la vista renderizada, sin intervención adicional del usuario más allá de que el
  bloque de código tenga el lenguaje correcto.
- **SC-005**: Una aplicación puede personalizar completamente el aspecto del área de contenido
  (ambas vistas), el color de scroll, y los tres aspectos adicionales de la barra, sin modificar
  el código fuente del componente.
- **SC-006**: Una aplicación puede implementar un flujo de "descartar cambios" completo (detectar
  si hay cambios y revertirlos) usando únicamente la referencia del componente, sin desmontarlo ni
  remontarlo.
- **SC-007**: Ninguno de los comportamientos existentes documentados en `001` a `004` se ve
  alterado al usar el componente sin activar ninguna de las capacidades nuevas de esta feature.

## Assumptions

- El "segundo clic" que abre los menús de columna/fila (Historia 2) se interpreta como: el cursor
  del editor ya estaba posicionado dentro de esa celda específica en el momento inmediatamente
  anterior al clic (sin haber estado en otra celda o fuera de la tabla en el ínterin), consistente
  con la descripción literal "si el cursor YA se encontraba anteriormente allí".
- La preservación de la posición del cursor al alternar de vista (Historia 3) es una
  correspondencia de mejor esfuerzo, no garantizada byte-exacta en todos los casos: cuando la
  vista renderizada normaliza el formato del Markdown al serializar (comportamiento ya documentado
  en `001`), la posición resultante en la vista Markdown puede ser una aproximación razonable en
  lugar de una coincidencia exacta de carácter.
- El renderizado de diagramas Mermaid no requiere validación exhaustiva de todos los tipos de
  diagrama Mermaid existentes; basta con soportar los tipos de diagrama estándar más comunes
  (flowchart, sequence, class, state, entre otros ya cubiertos por la sintaxis estándar de
  Mermaid), degradando de forma legible ante sintaxis no reconocida.
- Los métodos `reset()` e `isModified()` (Historia 6) se exponen mediante `forwardRef`, siguiendo
  el patrón estándar de React para APIs imperativas, según lo confirmado con el usuario; no se
  agregan props adicionales para esta capacidad.
- `documentId` y `fileName` (Historia 6) son valores de configuración pasivos: el componente los
  acepta y los deja disponibles, pero no les impone un comportamiento propio obligatorio (por
  ejemplo, no se auto-completa el aviso de solo lectura con `fileName` a menos que la aplicación
  consumidora lo pase explícitamente como el texto personalizado de la Historia 1).
