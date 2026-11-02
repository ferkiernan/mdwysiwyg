# Feature Specification: Línea editable tras bloques al final del documento

**Feature Branch**: `006-trailing-line-after-blocks`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "al hacer click 'fuera' de la tabla, a la derecha, en la ultima linea, debe posicionar el cursor, y permitir hacer 'enter' para dejar una linea en blanco. lo mismo debe suceder con cualquier elemento como mermaid o codigo."

## Contexto

Esta feature se construye sobre `001-markdown-editor` … `005-table-context-menus-mermaid-imperative-api`,
ya implementadas. Corrige una carencia de la vista renderizada: cuando el último elemento del
documento es un bloque (tabla, bloque de código, diagrama Mermaid, etc.), el usuario no tiene una
forma natural de colocar el cursor **después** del bloque para seguir escribiendo. No altera el
comportamiento por defecto de ninguna otra capacidad existente ni agrega props nuevas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Continuar escribiendo después de una tabla final (Priority: P1)

Un usuario que tiene una tabla como último elemento de su documento hace clic en el espacio libre
a la derecha de la tabla, a la altura de su última fila, o debajo de ella. El cursor se posiciona
en una línea vacía situada inmediatamente después de la tabla, y al pulsar Enter obtiene líneas en
blanco adicionales donde puede escribir contenido nuevo.

**Why this priority**: Es el caso reportado. Hoy, una tabla al final del documento "atrapa" el
cursor: el usuario no puede añadir texto después de ella sin recurrir a la vista Markdown, lo que
rompe el flujo de un editor WYSIWYG.

**Independent Test**: Se puede probar de forma aislada insertando una tabla como único (o último)
elemento, haciendo clic en el área vacía a la derecha de la tabla y pulsando Enter, y verificando
que el cursor queda fuera de la tabla y que se generan líneas en blanco editables.

**Acceptance Scenarios**:

1. **Given** el último elemento del documento es una tabla, **When** el usuario hace clic en el
   área vacía a la derecha de la tabla (a la altura de su última fila), **Then** el cursor se
   posiciona en una línea vacía después de la tabla, fuera de cualquier celda.
2. **Given** el cursor está en la línea vacía posterior a la tabla, **When** el usuario pulsa
   Enter, **Then** se crea una nueva línea en blanco debajo y el cursor se mueve a ella.
3. **Given** el cursor está en la línea vacía posterior a la tabla, **When** el usuario escribe
   texto, **Then** el texto aparece después de la tabla y no dentro de ninguna celda.
4. **Given** el último elemento del documento es una tabla, **When** el usuario hace clic en el
   área vacía situada debajo de la tabla, **Then** el cursor se posiciona igualmente en la línea
   posterior a la tabla.

---

### User Story 2 - Continuar escribiendo después de un bloque de código o diagrama Mermaid final (Priority: P1)

Un usuario cuyo documento termina con un bloque de código o con un diagrama Mermaid hace clic en el
espacio libre a la derecha o debajo de ese bloque. El cursor se posiciona en una línea vacía
después del bloque y puede pulsar Enter para dejar líneas en blanco y seguir escribiendo.

**Why this priority**: El usuario pidió explícitamente el mismo comportamiento para código y
Mermaid. Son los otros bloques más habituales que "atrapan" el cursor al final del documento (el
cursor queda dentro del bloque, y Enter solo añade saltos de línea al código en lugar de salir de
él).

**Independent Test**: Se puede probar de forma aislada con un documento que termina en un bloque
de código y, por separado, con otro que termina en un diagrama Mermaid: clic en el área vacía
junto al bloque y Enter, verificando en cada caso que el cursor queda fuera del bloque.

**Acceptance Scenarios**:

1. **Given** el último elemento del documento es un bloque de código, **When** el usuario hace
   clic en el área vacía a la derecha o debajo del bloque, **Then** el cursor se posiciona en una
   línea vacía después del bloque, sin modificar el contenido del bloque.
2. **Given** el último elemento del documento es un diagrama Mermaid renderizado, **When** el
   usuario hace clic en el área vacía a la derecha o debajo del diagrama, **Then** el cursor se
   posiciona en una línea vacía después del diagrama, sin alterar el diagrama ni abrir su edición.
3. **Given** el cursor está en la línea vacía posterior al bloque de código o diagrama, **When** el
   usuario pulsa Enter, **Then** se crea una nueva línea en blanco debajo y el cursor se mueve a
   ella; el contenido del bloque no cambia.

---

### User Story 3 - Mismo comportamiento con cualquier otro bloque final (Priority: P2)

Un usuario cuyo documento termina con cualquier otro elemento que no sea un párrafo de texto
(por ejemplo, una cita, una regla horizontal, una imagen o una lista) puede igualmente posicionar
el cursor después de él haciendo clic en el espacio libre posterior y pulsar Enter para
continuar escribiendo.

**Why this priority**: El usuario pidió que el comportamiento valga para "cualquier elemento".
Es una generalización de las historias 1 y 2; el valor principal ya está cubierto por ellas.

**Independent Test**: Se puede probar de forma aislada con documentos que terminan en cada tipo
de elemento (cita, regla horizontal, imagen, lista) y verificando que clic en el área libre
posterior más Enter permite escribir después del elemento.

**Acceptance Scenarios**:

1. **Given** el último elemento del documento es una regla horizontal, una imagen o una cita,
   **When** el usuario hace clic en el área vacía posterior al elemento, **Then** el cursor se
   posiciona en una línea vacía después de él.
2. **Given** el último elemento es una lista y el cursor está en su último ítem vacío, **When** el
   usuario pulsa Enter, **Then** se conserva el comportamiento habitual de las listas (salir de la
   lista), sin crear estructuras anidadas inesperadas.

---

### User Story 4 - Sin efectos secundarios en documentos que ya terminan en texto (Priority: P2)

Un usuario cuyo documento ya termina en un párrafo de texto sigue editando exactamente igual que
antes: hacer clic en el espacio vacío bajo el último párrafo coloca el cursor al final de ese
párrafo, y no aparecen líneas vacías adicionales ni cambios en el contenido guardado.

**Why this priority**: Protege contra regresiones; el cambio no debe alterar el contenido del
documento ni el comportamiento cotidiano de edición.

**Independent Test**: Se puede probar abriendo un documento que termina en un párrafo, haciendo
clic debajo del último párrafo, y comparando el Markdown resultante con el original.

**Acceptance Scenarios**:

1. **Given** el documento termina en un párrafo de texto, **When** el usuario hace clic en el
   espacio vacío debajo de él, **Then** el cursor queda en ese párrafo (o en su final) y no se
   agrega contenido nuevo.
2. **Given** un documento cuyo último elemento es un bloque y el usuario solo hace clic en el
   espacio libre posterior sin escribir nada, **When** se obtiene el Markdown del documento,
   **Then** el contenido es equivalente al del documento original (la línea vacía auxiliar no
   introduce texto ni marcas visibles en el Markdown).

---

---

### User Story 5 - Añadir una línea entre una tabla y el bloque siguiente (Priority: P1)

Un usuario tiene una tabla seguida de otro bloque (por ejemplo, un bloque de código) en medio del
documento. Hace clic en el espacio libre a la derecha de la tabla, a la altura de su última fila,
o en el hueco entre la tabla y el bloque siguiente, y el cursor queda posicionado justo debajo de
la tabla. Al pulsar Enter se añade una línea en blanco entre la tabla y el bloque siguiente, donde
puede escribir.

**Why this priority**: Es el caso real reportado tras la primera entrega de esta feature: la
tabla no era el último elemento del documento, por lo que no había forma de intercalar texto
entre la tabla y el bloque que le sigue.

**Independent Test**: Se puede probar de forma aislada con un documento `tabla + bloque de código`:
clic a la derecha de la tabla (o en el hueco entre ambos) y Enter, verificando que aparece una
línea en blanco entre los dos bloques y que lo escrito en ella queda entre ambos en el Markdown.

**Acceptance Scenarios**:

1. **Given** una tabla seguida de un bloque de código, **When** el usuario hace clic a la derecha
   de la tabla a la altura de su última fila, **Then** el cursor queda posicionado entre la tabla
   y el bloque, sin entrar en ninguna celda.
2. **Given** el cursor posicionado entre la tabla y el bloque siguiente, **When** el usuario pulsa
   Enter, **Then** se crea una línea en blanco entre ambos y el cursor queda en ella.
3. **Given** el cursor posicionado entre la tabla y el bloque siguiente, **When** el usuario
   escribe texto, **Then** el texto queda entre la tabla y el bloque en el Markdown resultante.
4. **Given** una tabla seguida de un párrafo, **When** el usuario hace clic a la derecha de la
   tabla y pulsa Enter, **Then** se crea una línea en blanco entre la tabla y el párrafo.
5. **Given** una tabla que es el primer elemento del documento, **When** el usuario hace clic en
   su margen superior y pulsa Enter, **Then** puede escribir antes de la tabla.

---

### Edge Cases

- **Documento vacío o con solo un bloque**: si el documento contiene únicamente una tabla, un
  bloque de código o un diagrama, el espacio posterior sigue siendo accesible con el mismo
  comportamiento.
- **Línea posterior ya existente**: si después del bloque ya hay un párrafo (aunque esté vacío), el
  clic en el espacio libre posterior coloca el cursor en ese párrafo existente sin crear uno
  adicional.
- **Clic dentro del bloque**: hacer clic dentro de una celda, del código o del diagrama mantiene su
  comportamiento actual (edición de celda, edición de código, apertura de edición del diagrama);
  solo el clic en el área libre *fuera* del bloque activa el nuevo comportamiento.
- **Varios bloques consecutivos** (por ejemplo, tabla seguida de bloque de código): el espacio libre
  a la derecha de cada tabla y el hueco entre bloques consecutivos dan acceso a una línea nueva
  entre ellos; el espacio libre tras el **último** bloque da acceso a la línea final.
- **Hueco entre dos párrafos**: sin cambios; el comportamiento habitual de clic ya es correcto.
- **Vista Markdown (código fuente)**: este comportamiento aplica solo a la vista renderizada; la
  vista Markdown ya permite colocar el cursor libremente.
- **Modo de solo lectura (`onlyView`)**: no se permite posicionar un cursor editable ni insertar
  líneas.
- **Atajos de teclado hacia la línea posterior**: si el cursor está dentro del último bloque,
  desplazarse con las teclas de flecha/Ctrl+Fin hacia el final del documento también debe poder
  alcanzar la línea posterior.
- **Deshacer/rehacer**: deshacer tras crear líneas en blanco las elimina sin alterar el bloque
  precedente.
- **Exportación y obtención del Markdown**: las líneas en blanco finales no deben generar
  contenido espurio ni cambiar el resultado del Markdown más allá del espaciado estándar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cuando el último elemento del documento en la vista renderizada es un bloque no
  textual (tabla, bloque de código, diagrama Mermaid, cita, regla horizontal, imagen u otro
  similar), el sistema MUST ofrecer siempre una línea vacía editable inmediatamente después de él.
- **FR-002**: Al hacer clic en el área libre situada a la derecha del último bloque del documento
  (a la altura de dicho bloque) o debajo de él, el sistema MUST posicionar el cursor en la línea
  vacía posterior al bloque.
- **FR-003**: Con el cursor en la línea posterior al bloque, el sistema MUST permitir pulsar Enter
  para crear líneas en blanco adicionales y escribir texto fuera del bloque.
- **FR-004**: El comportamiento de FR-001 a FR-003 MUST aplicar a tablas, bloques de código y
  diagramas Mermaid como mínimo, y MUST extenderse a cualquier otro elemento de bloque que pueda
  quedar como último elemento del documento.
- **FR-005**: El sistema MUST NOT modificar el contenido ni el estado de edición del bloque cuando
  el usuario hace clic en el área libre a su lado o pulsa Enter desde la línea posterior.
- **FR-006**: El comportamiento actual al hacer clic *dentro* de un bloque (celda de tabla, código,
  diagrama) MUST conservarse sin cambios.
- **FR-007**: Si ya existe un párrafo posterior al bloque, el sistema MUST reutilizarlo al colocar
  el cursor en lugar de crear uno adicional.
- **FR-008**: La línea vacía auxiliar MUST NOT introducir texto, marcas ni contenido visible
  adicional en el Markdown obtenido del documento mientras el usuario no escriba en ella.
- **FR-009**: En modo de solo lectura (`onlyView`), el sistema MUST NOT permitir posicionar un
  cursor editable ni crear líneas por este mecanismo.
- **FR-010**: Las operaciones de deshacer y rehacer MUST tratar correctamente las líneas creadas
  por este comportamiento sin dañar el bloque precedente.
- **FR-011**: El comportamiento MUST ser accesible por teclado: el usuario MUST poder alcanzar la
  línea posterior al último bloque sin usar el ratón.

- **FR-012**: Al hacer clic en el área libre a la derecha de una tabla (a la altura de cualquiera de sus
  filas) o en su margen inferior, el sistema MUST posicionar el cursor inmediatamente después de la
  tabla, aunque haya otro bloque o texto a continuación; si ya hay una línea vacía a continuación,
  el cursor MUST entrar en ella.
- **FR-013**: Al hacer clic en el hueco entre dos bloques consecutivos de los que alguno no admite
  cursor de texto (tabla, código, diagrama…), el sistema MUST posicionar el cursor entre ambos.
- **FR-014**: Con el cursor posicionado entre dos bloques, Enter MUST insertar una línea en blanco
  en ese punto y colocar el cursor en ella; escribir MUST crear texto en ese punto.
- **FR-015**: Al hacer clic en el margen superior de una tabla, el cursor MUST posicionarse
  inmediatamente antes de ella.

### Key Entities *(include if feature involves data)*

- **Bloque final**: el último elemento del documento cuando no es un párrafo de texto (tabla,
  bloque de código, diagrama Mermaid, cita, regla horizontal, imagen, etc.).
- **Línea posterior**: línea vacía editable situada inmediatamente después del bloque final, donde
  se posiciona el cursor y se puede escribir o pulsar Enter.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100 % de los casos en que el documento termina en una tabla, un bloque de
  código o un diagrama Mermaid, un único clic en el área libre posterior al bloque deja el cursor
  en una línea vacía fuera del bloque.
- **SC-002**: Desde ese punto, el usuario escribe texto nuevo después del bloque sin acciones
  intermedias (sin pasar a la vista Markdown ni insertar el bloque de otra forma): clic + escribir
  en menos de 5 segundos.
- **SC-003**: Pulsar Enter desde la línea posterior crea líneas en blanco adicionales en el 100 %
  de los intentos, sin alterar el contenido del bloque precedente.
- **SC-004**: En documentos que ya terminan en texto, el Markdown obtenido tras hacer clic en el
  espacio libre posterior (sin escribir) es idéntico al original.
- **SC-005**: Ninguna de las pruebas de comportamiento existentes de edición de tablas, código y
  Mermaid deja de pasar tras este cambio.
- **SC-006**: Con una tabla seguida de un bloque de código, un clic a la derecha de la tabla más Enter
  deja una línea en blanco entre ambos en el 100 % de los intentos.

## Assumptions

- El comportamiento aplica únicamente a la **vista renderizada**; la vista Markdown no cambia.
- El alcance cubre el espacio posterior al último elemento, el espacio a la derecha/margen de las
  tablas y el hueco entre bloques consecutivos de nivel superior. Las tablas anidadas dentro de
  otros contenedores (citas, listas) quedan fuera de alcance.
- Las líneas en blanco se entienden como párrafos vacíos en la vista renderizada. El Markdown
  estándar no representa líneas en blanco múltiples de forma semántica, por lo que no se garantiza
  que el número exacto de líneas en blanco adicionales se conserve al volver a cargar el Markdown;
  sí se garantiza que el texto escrito después del bloque se conserva.
- "Última línea" en la descripción del usuario se interpreta como la línea de la última fila de la
  tabla (o la línea equivalente del bloque) y el espacio libre a su derecha, además del espacio
  libre debajo del bloque.
- Se reutilizan los controles, estilos y tema existentes; no se agregan props públicas nuevas ni
  dependencias nuevas.
- Se mantienen los criterios de la constitución del proyecto: tests de comportamiento,
  accesibilidad por teclado, documentación actualizada y build de distribución sin errores.
