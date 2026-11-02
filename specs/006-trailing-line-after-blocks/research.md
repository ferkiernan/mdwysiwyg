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

### D5 — Fuera de alcance

- Cursor entre bloques consecutivos intermedios (ya documentado en Assumptions).
