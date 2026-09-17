# Research: Link Insertion UX & Floating Link Popover

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-17

Esta feature no requiere ninguna dependencia nueva: se resuelve enteramente con la API ya
disponible de Tiptap/ProseMirror, React y el DOM. No hay decisiones de terceros que investigar;
las decisiones son de diseño interno, documentadas aquí por transparencia.

## 1. Diálogo condicional según selección activa

**Decision**: Reutilizar `InsertDialog` (`kind === "link"`) ya existente en
`InsertDialogs.tsx`, condicionando qué campos renderiza según `editor.state.selection.empty` en
el momento de abrir el diálogo (se lee una sola vez al montar, no reactivamente).

**Rationale**: El código ya distingue este caso en `submit()` (líneas 98-109 de
`InsertDialogs.tsx`): si hay selección no vacía, aplica `setLink` sobre el rango existente; si no
hay selección, inserta texto nuevo con la marca de enlace. Solo falta que la UI (los campos
mostrados) refleje esa misma distinción en vez de mostrar siempre ambos campos. Cero dependencias
nuevas, cambio acotado a la función de render del componente ya existente.

**Alternatives considered**: Crear un componente de diálogo separado exclusivo para "enlace sobre
selección" — se descarta por duplicar el 90% del `DialogShell`/lógica de envío ya existente
(Principio XV, Simplicidad).

## 2. Autocompletado de protocolo

**Decision**: Función pura `ensureProtocol(url: string): string` que antepone `"http://"` cuando
el valor no contiene `"://"`, ubicada en un módulo compartido (`markdown/links.ts` o similar)
para reutilizarse tanto en `InsertDialogs.tsx` como en el nuevo popover de edición de enlace.

**Rationale**: Es lógica de negocio pura sin dependencias — un `String.includes("://")` y
concatenación condicional. Centralizarla en una función compartida evita duplicar la regla en dos
lugares (diálogo de inserción y panel de edición), cumpliendo FR-004/FR-005 de forma consistente
por construcción, no por disciplina manual.

**Alternatives considered**: Usar el constructor `URL()` nativo para validar/normalizar — se
descarta porque `URL()` lanza excepción con entradas parciales como `"ejemplo.com"` (las
interpreta como protocolo relativo inválido sin una base), complicando el caso exacto que se
quiere resolver de forma simple.

## 3. Detección de clic sobre un enlace existente (popover)

**Decision**: Usar la opción `editorProps.handleClickOn` de Tiptap/ProseMirror, que se invoca con
el nodo y la posición del clic dentro del documento; se inspecciona si la posición cae dentro de
una marca `link` activa (`editor.isActive('link')` en esa posición, o revisando las marcas del
nodo en el click) para decidir si abrir el popover.

**Rationale**: `handleClickOn` es la extensión de punto oficial de ProseMirror/Tiptap para
interceptar clics sobre contenido del documento sin reemplazar el manejo de eventos por defecto
del editor (a diferencia de agregar un listener DOM genérico, que requeriría reimplementar la
traducción de coordenadas de pantalla a posición del documento que ProseMirror ya resuelve).
Reutiliza el `FloatingPanel` ya existente (mismo mecanismo de portal + `position: fixed` usado por
los demás paneles de la toolbar), ahora anclado a un elemento sintético en la posición del clic en
vez de a un botón.

**Alternatives considered**: Escuchar `click` a nivel de `EditorContent`/DOM y usar
`event.target.closest('a')` — funcionalmente posible, pero se aparta del mecanismo ya usado por
Tiptap para todo lo demás en el proyecto (comandos vía `editor.chain()`, estado vía
`editor.isActive()`), y complica obtener la posición exacta del documento (necesaria para
`extendMarkRange('link')` al editar/eliminar) sin pasar por las utilidades de ProseMirror. Se
descarta por consistencia con el resto de la base de código.

## 4. Abrir la URL en pestaña nueva

**Decision**: `window.open(url, "_blank", "noopener,noreferrer")`.

**Rationale**: API nativa del navegador, sin dependencias. `noopener,noreferrer` es la práctica
estándar de seguridad al abrir una URL controlada por el contenido del documento (evita que la
pestaña nueva obtenga una referencia `window.opener` hacia el editor).

## Resumen de dependencias nuevas a introducir

Ninguna. Toda la feature se implementa con la API ya usada de `@tiptap/core`/`@tiptap/react`
(extensión `Link` ya instalada desde `002-toolbar-redesign-insert-pickers`), el `FloatingPanel`
ya existente, y APIs nativas del navegador (`window.open`, `navigator.clipboard`, ya usado por
`ExportMenu.tsx`).
