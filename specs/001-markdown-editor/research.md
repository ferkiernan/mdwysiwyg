# Research: Markdown Editor

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-17

## 1. Motor WYSIWYG rich-text

**Decision**: Tiptap (sobre ProseMirror), usando solo las extensiones oficiales necesarias
(`StarterKit` con `codeBlock`/`strike` habilitados, `Table`/`TableRow`/`TableCell`/`TableHeader`,
`TaskList`/`TaskItem`, `Link`, `Image`, `HorizontalRule`).

**Rationale**: Cubre nativamente todo el GFM requerido por la spec (tablas, checklist, tachado,
bloques de código) con manejo de teclado/ARIA razonable de fábrica. Su esquema basado en
ProseMirror permite serializar a/desde Markdown de forma fiable, sosteniendo el requisito de
"Markdown como única fuente de verdad" (FR-020). Bundle ~80–120KB (solo extensiones usadas,
tree-shakeable vía imports individuales), muy por debajo de alternativas todo-en-uno. Cumple
Principio VIII (dependencias minimizadas y justificadas) porque resuelve en una sola librería
edición + esquema + accesibilidad básica, evitando construir eso a mano.

**Alternatives considered**:
- **MDXEditor**: ya integra Markdown↔Lexical y GFM, pero bundle ~564KB gzip (excesivo para un
  componente de librería), accesibilidad de fábrica limitada (`aria-label` no configurable, `id`
  mal asociado al elemento editable), y demasiada abstracción para el control fino que exige la
  sincronización bidireccional exacta y la sanitización de HTML embebido de la spec.
- **Lexical puro**: mejor accesibilidad base y bundle núcleo menor (~22KB), pero sin soporte GFM
  maduro — requeriría construir nodos de tabla/checklist/tachado y el serializer Markdown a mano,
  contradiciendo Principio XV (evitar reinventar lo que una dependencia justificada ya resuelve).
- **Slate.js**: motor demasiado low-level; obligaría a construir esquema, serialización y
  accesibilidad desde cero.

## 2. Parser/serializador Markdown GFM ↔ AST ↔ HTML

**Decision**: unified + remark-parse + remark-gfm + remark-rehype + rehype-stringify.

**Rationale**: Estándar de facto en 2026 para pipelines Markdown↔AST↔HTML, mantenido activamente.
Trabajar sobre AST tipado (mdast/hast) en vez de strings permite exportar a Markdown (FR-012) y a
HTML (FR-013) desde una única representación intermedia consistente, y compone limpiamente con
`rehype-sanitize` en el mismo pipeline sin librerías adicionales.

**Alternatives considered**:
- **markdown-it + plugins GFM de terceros**: más rápido pero el soporte GFM depende de plugins
  dispersos de mantenimiento desigual; trabajar sobre tokens/strings hace más frágil la
  sincronización bidireccional exacta que exige FR-004/FR-006/FR-007.

## 3. Sanitización de HTML embebido

**Decision**: rehype-sanitize (basado en hast-util-sanitize), integrado en el pipeline unified
de la pieza 2, con un schema (allowlist) expuesto como prop tipada para permitir que la app
consumidora lo relaje o desactive explícitamente (FR-023).

**Rationale**: Sanitiza en el AST antes de serializar a HTML, evitando sumar una dependencia
extra (DOMPurify) y un paso DOM separado — una sola librería cubre parseo, sanitización y
serialización (Principio VIII). El schema declarativo hace trivial exponer la opción de
desactivación por prop sin lógica ad-hoc.

**Alternatives considered**:
- **DOMPurify**: más tolerante a HTML malformado porque opera post-parseo DOM real; se reevaluará
  únicamente si, en diseño detallado, Tiptap requiere sanitizar HTML pegado directamente en el
  editor (punto de entrada distinto al pipeline remark/rehype) antes de insertarlo al esquema. Se
  descarta por ahora por redundancia con rehype-sanitize.

## 4. Editor de texto plano (vista Markdown cruda)

**Decision**: `<textarea>` controlado nativo.

**Rationale**: Accesibilidad nativa sin esfuerzo (rol implícito, navegación de teclado, soporte
de lectores de pantalla, asociación trivial de `aria-label`), y cero dependencias nuevas — máximo
cumplimiento de Principio VIII. La spec no exige resaltado de sintaxis ni autocompletado en la
vista Markdown cruda.

**Alternatives considered**:
- **CodeMirror 6**: aporta resaltado de sintaxis pero es una dependencia pesada sin requisito
  funcional que la justifique; además no usa `contenteditable` ni soporta `fromTextArea()` (API
  de CM5), por lo que no es "accesible por defecto" — requeriría trabajo adicional propio para
  igualar lo que un textarea da gratis. Se descarta por Principio XV (YAGNI); reevaluar solo si
  se pide resaltado de sintaxis en el futuro.

## Resumen de dependencias nuevas a introducir

| Dependencia | Propósito | Justificación (Principio VIII) |
|---|---|---|
| `@tiptap/react`, `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-table*`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-horizontal-rule` | Motor WYSIWYG con soporte GFM y accesibilidad base | Evita reimplementar un editor rich-text completo con manejo de esquema, teclado y ARIA |
| `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-stringify` | Pipeline Markdown GFM ↔ AST ↔ HTML para export y sincronización | Necesario para FR-012/FR-013/FR-021; estándar de facto, evita parseo manual de GFM |
| `rehype-sanitize` | Sanitización de HTML embebido (FR-022/FR-023) | Reutiliza el pipeline unified ya justificado; evita sumar DOMPurify como dependencia separada |

Ninguna dependencia de aplicación (routers, estado global, meta-frameworks) se introduce,
consistente con el Principio III.
