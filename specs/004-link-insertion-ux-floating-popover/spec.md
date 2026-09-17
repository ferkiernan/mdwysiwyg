# Feature Specification: Link Insertion UX & Floating Link Popover

**Feature Branch**: `004-link-insertion-ux-floating-popover`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Mejorar la experiencia de insertar y gestionar enlaces: (1) cuando hay texto seleccionado, el diálogo de insertar enlace solo pide la URL y la aplica al texto seleccionado, sin pedir texto adicional; (2) autocompletar el protocolo con 'http://' cuando la URL ingresada no especifica uno (por ejemplo 'www.ejemplo.com' o 'ejemplo.com'); (3) al hacer clic sobre un enlace existente en la vista renderizada, mostrar un popover flotante con 'Ir a la url', 'Copiar url', un separador, y 'Editar url' (que cambia a un modo con input de URL, opción 'Eliminar link', y botón 'Guardar')."

## Contexto

Esta feature se construye sobre `001-markdown-editor` (contrato base del componente) y
`002-toolbar-redesign-insert-pickers` (diálogo de inserción de enlace ya existente, con campos
"URL del enlace" y "Texto del enlace"). No cambia el contrato público del componente
(`MarkdownEditorProps`), el modelo de datos del documento, ni el pipeline de sincronización
Markdown/GFM.

## Clarifications

### Session 2026-09-17

- Q: Si la URL ingresada no empieza con "www" ni con ningún prefijo (ej: "ejemplo.com" a secas),
  ¿qué se hace? → A: Anteponer "http://" siempre que la URL no especifique protocolo (no
  contenga "://"), sin importar si empieza con "www" o no — comportamiento uniforme, no
  condicionado a un patrón textual específico.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aplicar un enlace a texto ya seleccionado (Priority: P1)

Un usuario selecciona una palabra o frase ya escrita en el editor y presiona el botón de insertar
enlace en la barra de herramientas. En lugar de pedirle que vuelva a escribir el texto del enlace,
el editor le pide únicamente la URL de destino y, al confirmar, convierte el texto que ya tenía
seleccionado en un enlace hacia esa URL, sin alterar ni una letra de ese texto.

**Why this priority**: Es el caso de uso más común al enlazar texto ya existente (por ejemplo,
convertir el nombre de un producto ya escrito en un enlace a su página) y el diálogo actual obliga
a retipear el texto innecesariamente, con riesgo de introducir una discrepancia entre el texto
seleccionado original y lo que el usuario tipeó de nuevo.

**Independent Test**: Se puede probar de forma aislada escribiendo texto, seleccionándolo,
presionando el botón de insertar enlace, verificando que el diálogo solo pide la URL, y
confirmando que tras aplicar, el texto original queda convertido en enlace sin cambios en su
contenido textual.

**Acceptance Scenarios**:

1. **Given** el usuario tiene texto seleccionado en el editor, **When** presiona el botón de
   insertar enlace, **Then** el diálogo muestra únicamente un campo de URL, sin campo de texto de
   enlace.
2. **Given** el diálogo de URL está abierto con texto previamente seleccionado, **When** el
   usuario ingresa una URL y confirma, **Then** el texto que estaba seleccionado se convierte en
   un enlace hacia esa URL, permaneciendo textualmente idéntico a como estaba antes.
3. **Given** el usuario no tiene ningún texto seleccionado en el editor, **When** presiona el
   botón de insertar enlace, **Then** el diálogo muestra tanto el campo de URL como el campo de
   texto del enlace, igual que el comportamiento actual.

---

### User Story 2 - Completar automáticamente el protocolo de una URL (Priority: P2)

Un usuario ingresa una URL sin especificar el protocolo (por ejemplo, escribiendo
"www.ejemplo.com" o directamente "ejemplo.com") en cualquier campo donde se ingrese o edite la
URL de un enlace. El sistema completa automáticamente el protocolo faltante para que el enlace
resultante sea válido y funcional, sin que el usuario tenga que recordar escribir "http://" o
"https://" manualmente.

**Why this priority**: Reduce errores comunes de usuarios que asumen que un enlace "funciona" con
solo el dominio, pero mejora la experiencia sin ser indispensable para el funcionamiento básico
(un enlace sin protocolo, aunque roto en algunos contextos, no bloquea el resto del editor).

**Independent Test**: Se puede probar de forma aislada ingresando distintos valores de URL sin
protocolo en el campo correspondiente (diálogo de inserción o edición) y verificando que el
enlace resultante siempre incluye un protocolo.

**Acceptance Scenarios**:

1. **Given** el usuario ingresa "www.ejemplo.com" como URL, **When** confirma la acción, **Then**
   el enlace resultante apunta a "http://www.ejemplo.com".
2. **Given** el usuario ingresa "ejemplo.com" como URL (sin "www" ni protocolo), **When** confirma
   la acción, **Then** el enlace resultante apunta a "http://ejemplo.com".
3. **Given** el usuario ingresa una URL que ya incluye un protocolo explícito (por ejemplo,
   "https://ejemplo.com"), **When** confirma la acción, **Then** el enlace resultante conserva el
   protocolo tal como fue ingresado, sin duplicarlo ni alterarlo.

---

### User Story 3 - Ver y actuar rápido sobre un enlace existente (Priority: P1)

Un usuario hace clic sobre un texto que ya es un enlace, en la vista renderizada, y ve
inmediatamente un panel flotante con las acciones más comunes: ir al destino del enlace, copiar
su URL, o editarlo — sin tener que buscar esas opciones en la barra de herramientas ni adivinar
dónde hacer clic para modificar un enlace ya existente.

**Why this priority**: Es la única forma prevista de gestionar (editar o quitar) un enlace ya
insertado desde la vista renderizada; sin esto, un enlace mal escrito o que cambió de destino no
tendría manera de corregirse sin recurrir a la vista Markdown cruda.

**Independent Test**: Se puede probar de forma aislada insertando un enlace, haciendo clic sobre
él en la vista renderizada, y verificando que aparece el panel con las tres acciones principales
en el orden especificado, y que cada una produce el efecto esperado.

**Acceptance Scenarios**:

1. **Given** el editor muestra un enlace en la vista renderizada, **When** el usuario hace clic
   sobre el texto del enlace, **Then** aparece un panel flotante anclado cerca del enlace, con las
   opciones "Ir a la url", "Copiar url", un separador visual, y "Editar url", en ese orden.
2. **Given** el panel de acciones del enlace está visible, **When** el usuario selecciona "Ir a la
   url", **Then** la URL del enlace se abre en una pestaña o ventana nueva, sin que el editor
   pierda su contenido ni su estado actual.
3. **Given** el panel de acciones del enlace está visible, **When** el usuario selecciona "Copiar
   url", **Then** la URL del enlace queda copiada al portapapeles.
4. **Given** el panel de acciones del enlace está visible, **When** el usuario selecciona "Editar
   url", **Then** el panel cambia a un modo de edición con un campo de texto que muestra la URL
   actual del enlace, una opción "Eliminar link" debajo del campo, y un botón "Guardar".
5. **Given** el panel está en modo de edición, **When** el usuario modifica la URL en el campo y
   presiona "Guardar", **Then** el enlace se actualiza con la nueva URL (aplicando el
   autocompletado de protocolo de la Historia 2 si corresponde) y el panel se cierra.
6. **Given** el panel está en modo de edición, **When** el usuario selecciona "Eliminar link",
   **Then** se quita el formato de enlace del texto, el texto en sí permanece sin cambios, y el
   panel se cierra.
7. **Given** el panel de acciones (en cualquiera de sus dos modos) está visible, **When** el
   usuario hace clic fuera del panel o presiona Escape, **Then** el panel se cierra sin aplicar
   ningún cambio al enlace.

---

### Edge Cases

- ¿Qué ocurre si el usuario selecciona texto que ya incluye parcialmente un enlace (por ejemplo,
  selecciona un fragmento que cruza el límite entre texto enlazado y texto normal)? El
  comportamiento sigue las reglas estándar de aplicación de marcas de texto ya usadas por el
  editor para otros formatos (negrita, cursiva) sobre selecciones mixtas.
- ¿Qué ocurre si el usuario hace clic sobre un enlace mientras el editor está en modo de solo
  lectura (`onlyView`)? El panel de acciones "Ir a la url" y "Copiar url" siguen teniendo sentido
  en modo lectura; la opción "Editar url" (y por lo tanto la posibilidad de modificar o eliminar
  el enlace) no debe estar disponible, consistente con que el modo de solo lectura no permite
  ninguna modificación de contenido.
- ¿Qué ocurre si el usuario deja el campo de URL vacío y presiona "Guardar" en el modo de edición
  del panel? No se aplica ningún cambio con una URL vacía; se espera un valor no vacío para
  guardar (mismo criterio ya usado en el diálogo de inserción de enlace existente).
- ¿Qué ocurre si el usuario presiona "Editar url" y luego cierra el panel sin presionar "Guardar"
  ni "Eliminar link"? El enlace conserva su URL original, sin cambios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cuando el usuario activa el control de insertar enlace con texto seleccionado en el
  editor, el sistema MUST mostrar un diálogo que solicite únicamente la URL de destino, sin campo
  de texto de enlace adicional.
- **FR-002**: Al confirmar el diálogo de la Historia 1, el sistema MUST aplicar el enlace sobre el
  texto que estaba seleccionado, preservando su contenido textual exacto.
- **FR-003**: Cuando el usuario activa el control de insertar enlace sin texto seleccionado, el
  sistema MUST mostrar el diálogo con ambos campos (URL y texto del enlace), igual que el
  comportamiento definido en `002-toolbar-redesign-insert-pickers`.
- **FR-004**: En cualquier campo donde se ingrese o edite la URL de un enlace (diálogo de
  inserción o panel de edición del enlace existente), si el valor ingresado no especifica un
  protocolo (no contiene "://"), el sistema MUST anteponer "http://" antes de aplicarlo como
  destino del enlace.
- **FR-005**: El autocompletado de protocolo (FR-004) MUST aplicarse de forma uniforme sin
  importar el contenido textual específico de la URL (no MUST depender de que la URL comience con
  "www" o cualquier otro patrón particular).
- **FR-006**: Si la URL ingresada ya especifica un protocolo explícito, el sistema MUST NOT
  modificar ni duplicar ese protocolo.
- **FR-007**: En la vista renderizada, al hacer clic sobre un texto que tiene un enlace aplicado,
  el sistema MUST mostrar un panel flotante anclado cerca del enlace, con las opciones "Ir a la
  url", "Copiar url", un separador visual, y "Editar url", en ese orden.
- **FR-008**: Seleccionar "Ir a la url" MUST abrir la URL del enlace en una pestaña o ventana
  nueva, sin alterar el contenido ni el estado del editor.
- **FR-009**: Seleccionar "Copiar url" MUST copiar la URL exacta del enlace al portapapeles.
- **FR-010**: Seleccionar "Editar url" MUST cambiar el panel a un modo de edición que muestre: un
  campo de texto con la URL actual del enlace, una opción "Eliminar link", y un botón "Guardar".
- **FR-011**: En el modo de edición del panel, seleccionar "Eliminar link" MUST quitar el formato
  de enlace del texto correspondiente, preservando el texto en sí sin cambios, y MUST cerrar el
  panel.
- **FR-012**: En el modo de edición del panel, presionar "Guardar" con un valor de URL no vacío
  MUST actualizar el enlace con la nueva URL (aplicando FR-004 si corresponde) y MUST cerrar el
  panel.
- **FR-013**: En el modo de edición del panel, presionar "Guardar" con el campo de URL vacío MUST
  NOT aplicar ningún cambio al enlace.
- **FR-014**: El panel flotante (en cualquiera de sus dos modos) MUST poder cerrarse sin aplicar
  cambios, mediante un clic fuera del panel o la tecla Escape, dejando el enlace sin modificar.
- **FR-015**: Cuando el componente está en modo de solo lectura (`onlyView`), al hacer clic sobre
  un enlace el panel flotante MUST mostrar únicamente "Ir a la url" y "Copiar url" (sin la opción
  "Editar url" ni, por lo tanto, sin acceso a modificar o eliminar el enlace).

### Key Entities

- **Selección de texto activa**: rango de texto seleccionado por el usuario en el momento de
  activar el control de insertar enlace; determina si el diálogo pide uno o dos campos (FR-001,
  FR-003). Es estado transitorio de interacción, no forma parte del documento.
- **Panel de acciones de enlace**: estado de UI transitorio con dos modos (menú de acciones /
  edición), anclado a un enlace específico de la vista renderizada; se descarta al cerrarse sin
  dejar rastro en el documento salvo que el usuario haya confirmado "Guardar" o "Eliminar link".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede convertir texto ya escrito y seleccionado en un enlace ingresando
  únicamente la URL, sin tener que volver a escribir el texto visible del enlace.
- **SC-002**: El 100% de las URLs ingresadas sin protocolo explícito resultan en enlaces con un
  protocolo válido aplicado automáticamente, sin intervención adicional del usuario.
- **SC-003**: Un usuario puede identificar y acceder a las tres acciones principales sobre un
  enlace existente (ir al destino, copiar, editar) en un máximo de dos clics desde que hace clic
  por primera vez sobre el enlace.
- **SC-004**: Un usuario puede eliminar el formato de enlace de un texto sin perder o alterar ese
  texto, en el 100% de los casos de prueba.
- **SC-005**: Cerrar el panel de acciones sin confirmar una acción concreta nunca modifica el
  enlace original, verificado en el 100% de los casos de prueba (clic afuera y tecla Escape).

## Assumptions

- "Ir a la url" abre la URL en una pestaña/ventana nueva del navegador (no navega fuera del
  editor en la misma pestaña), ya que el requisito explícito es que "el editor no debe perder su
  estado" — abrir en la misma pestaña navegaría fuera de la aplicación consumidora.
- El panel flotante se activa con un clic simple sobre el enlace (no doble clic ni combinación de
  teclas), consistente con la descripción literal del pedido ("cuando la persona hace click sobre
  un texto que tiene vinculo").
- El campo de URL del panel de edición (modo "Editar url") sigue la misma regla de autocompletado
  de protocolo que el diálogo de inserción (FR-004), ya que el pedido original así lo especifica
  explícitamente ("aplicando el mismo autocompletado").
- No se define un atajo de teclado adicional para abrir el panel de acciones; el mecanismo de
  activación es exclusivamente el clic sobre el texto enlazado, según lo especificado.
