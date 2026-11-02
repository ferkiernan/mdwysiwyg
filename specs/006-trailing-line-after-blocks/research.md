# Research: Línea editable tras bloques al final del documento

## 1. Causa raíz

- **Hecho verificado**: StarterKit 3.31.3 registra `TrailingNode` (inserta un párrafo vacío si el
  último nodo no es párrafo). Su `appendTransaction` solo corre tras una transacción con
  `docChanged`. Con `content` inicial, el estado se crea sin transacciones.
- **Verificado con sonda (jsdom)**: documentos iniciales terminados en tabla, código, Mermaid,
  cita, lista o `---` renderizan **sin** párrafo final; uno terminado en párrafo no cambia.
- **Serialización**: `editorHtmlToMarkdown` descarta `<p></p>` vacíos finales (probado con
  tabla+`<p></p>` y código+`<p></p><p></p>`): el Markdown es idéntico → FR-008 se cumple sin
  trabajo extra.
- **Clic a la derecha de la tabla**: la tabla (`display: table`) es más estrecha que el wrapper
  `div.tableWrapper` (bloque de ancho completo). El objetivo del evento es el wrapper; ProseMirror
  resuelve la posición hacia la última celda.
- **Clic debajo**: el objetivo es `.ProseMirror` (crece con `flex: 1`); con párrafo final presente
  ProseMirror ya cae cerca de él, pero no de forma determinista.

## 2. Decisiones

### D1 — Asegurar el párrafo final al crear el editor

- **Decision**: en `onCreate` (solo si el editor es editable), si el último hijo del documento no es
  un párrafo, insertar uno vacío al final con `preventUpdate` + `addToHistory: false`.
- **Rationale**: reproduce lo que `trailingNode` hará tras la primera edición, pero desde el inicio;
  sin `onChange` espurio, sin entrada de deshacer, sin cambiar el Markdown ni `isModified()`.
- **Alternatives**: (a) reimplementar un plugin propio con `appendTransaction` — duplica
  `trailingNode`, innecesario (Principio XV); (b) cambiar `initialContent` añadiendo `<p></p>` en el
  HTML — acopla el pipeline Markdown→HTML a un detalle de UI y afecta `setContent` de otras rutas.

### D2 — Clic en áreas libres vía `mousedown`

- **Decision**: `handleDOMEvents.mousedown` en `editorProps`. Se activa solo si el editor es
  editable y: (i) el objetivo es `view.dom` (área libre: padding, debajo del contenido) y el punto
  está en/bajo el último hijo; o (ii) el objetivo es un `.tableWrapper` inmediatamente anterior al
  párrafo final vacío (área a la derecha de la última tabla). Acción: `preventDefault`, selección
  `TextSelection.atEnd(doc)`, `view.focus()`.
- **Rationale**: `mousedown` es donde ProseMirror fija la selección; interceptarlo es determinista.
  Los clics dentro de celdas/código/Mermaid no coinciden con (i)/(ii) y conservan su comportamiento
  (FR-006). Con último párrafo no vacío no se redirige (US4).
- **Alternatives**: `click` (demasiado tarde: la selección ya se movió a la celda); CSS para
  ensanchar el hit-area (no cambia la resolución de posición de ProseMirror); plugin de gapcursor
  (el gapcursor no permite escribir ni Enter sin bloque de texto).

### D3 — Teclado (FR-011)

- Con el párrafo final siempre presente, las flechas desde la última celda/línea de código y
  Ctrl+Fin llegan a él por navegación estándar de ProseMirror. Se cubre con tests, sin código extra.

### D4 — `onlyView`

- Sin párrafo auxiliar ni redirección cuando el editor no es editable (FR-009), evitando una línea
  en blanco visible en vistas de solo lectura.

### D5 — Bloque no final: cursor de hueco (ampliación tras verificación en navegador)

- **Hallazgo**: la primera entrega solo cubría el último bloque. En el caso real (tabla seguida de
  un bloque de código) el clic a la derecha de la tabla caía en el wrapper de la tabla y el margen
  entre bloques en el contenedor del editor; ProseMirror los resolvía hacia una celda o el código.
- **Decision**: `mousedown` calcula la **frontera** entre bloques de nivel superior que
  corresponde al clic (derecha o margen de una tabla; hueco entre bloques si alguno no admite texto;
  bajo el contenido) y coloca allí la selección: dentro de la línea vacía adyacente si existe; si no,
  un `GapCursor` (de `@tiptap/pm/gapcursor`, ya incluido en StarterKit). Enter sobre un
  `GapCursor` ejecuta `createParagraphNear` (ya en el keymap de Tiptap) e inserta la línea.
- **Rationale**: es el mecanismo estándar de ProseMirror para "cursor entre bloques"; no inserta
  párrafos al hacer clic, de modo que un clic sin escribir no modifica el documento.
- **Alternatives**: insertar un párrafo vacío en cada clic (muta el documento sin que el usuario
  escriba); *dropcursor* (solo para arrastrar).
- **Verificación**: probado en Chrome real con el playground (clic a la derecha de la tabla y en
  el margen entre tabla y código; Enter; escribir). jsdom no calcula layout, por lo que los tests
  simulan geometría con `getBoundingClientRect` simulado.

### D6 — Fuera de alcance

- Tablas anidadas dentro de citas o listas.
