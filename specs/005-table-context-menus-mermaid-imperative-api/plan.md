# Implementation Plan: Table Context Menus, Mermaid Diagrams, Cursor Preservation, Extended Theming & Imperative API

**Branch**: `005-table-context-menus-mermaid-imperative-api` | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-table-context-menus-mermaid-imperative-api/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Seis capacidades independientes sobre el `MarkdownEditor` existente: (1) texto configurable del
aviso de `onlyView`; (2) menús contextuales de columna/fila en tablas, activados por un segundo
clic sobre una celda ya enfocada, usando comandos de `@tiptap/extension-table` más un intercambio
manual vía `TableMap` para "mover"; (3) preservación aproximada de la posición del cursor al
alternar de vista, reutilizando las posiciones de origen que `remark-parse` ya calcula en el AST;
(4) renderizado de diagramas Mermaid como `NodeView` condicional del bloque de código existente,
con la librería oficial `mermaid` cargada vía `import()` dinámico y `securityLevel: 'strict'`; (5)
extensión del theming vía más CSS Custom Properties; (6) API imperativa (`reset()`,
`isModified()`) vía `forwardRef`/`useImperativeHandle`, más las props `documentId`/`fileName`. Ver
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — sin cambios respecto a features
anteriores.

**Primary Dependencies**: `mermaid` (`^11.10.0+`, cargada vía `import()` dinámico, nunca en el
entry point estático). Sin otras dependencias nuevas: los menús de tabla reutilizan
`@tiptap/extension-table` ya instalada; la preservación de cursor reutiliza el AST de
`remark-parse` ya generado; el theming extendido son CSS Custom Properties nuevas; la API
imperativa usa `forwardRef`/`useImperativeHandle` nativos de React. Ver [research.md](./research.md).

**Storage**: N/A — sin cambios. El "contenido original" para `reset()`/`isModified()` vive en un
`useRef` en memoria, no persistido.

**Testing**: Vitest + React Testing Library, mismo enfoque de comportamiento observable. Los
tests de Mermaid mockean el módulo `mermaid` (carga dinámica) para no depender de renderizado SVG
real en jsdom; los de preservación de cursor verifican la posición resultante del cursor/selección
tras alternar, no la implementación interna del mapeo.

**Target Platform**: Sin cambios — navegadores web modernos, paquete npm. El color de scrollbar
(FR-012) usa `scrollbar-color`/pseudo-elementos `::-webkit-scrollbar-*`, con degradación silenciosa
en navegadores que no lo soporten (no es un requisito bloqueante, ver Assumptions).

**Project Type**: Librería de componentes (mismo paquete `mdwysiwyg`).

**Performance Goals**: El renderizado de Mermaid es asíncrono y no bloquea el hilo principal; se
evita re-renderizar un diagrama en cada transacción del documento que no lo afecte (guard de
"contenido sin cambios" en el `NodeView`, ver research.md §4).

**Constraints**: Ningún prop existente de `MarkdownEditorProps` cambia de comportamiento (FR-019);
el theming extendido no agrega props nuevas (mismo mecanismo de CSS Custom Properties de `003`);
Mermaid se sanitiza por diseño (`securityLevel: 'strict'`) siendo contenido potencialmente no
confiable (insertado vía HTML).

**Scale/Scope**: Cambios acotados a: `MarkdownEditor.tsx` (forwardRef, estado de celda
enfocada/menú de tabla, mapeo de posición al alternar vista), `types.ts` (nuevas props +
`MarkdownEditorHandle`), `Toolbar/buttons/` (nuevos componentes `TableColumnMenu.tsx`/
`TableRowMenu.tsx`), `markdown/tiptapMarkdownBridge.ts` (NodeView Mermaid sobre el bloque de
código existente), `markdown/pipeline.ts` (exposición de posiciones de origen para el mapeo de
cursor), `Toolbar/buttons/InsertDialogs.tsx` (detección Mermaid al insertar HTML), y
`MarkdownEditor.module.css` (nuevas CSS Custom Properties).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Sin lógica de aplicación; todas las capacidades son genéricas del editor | PASS |
| II. TypeScript Estricto | `MarkdownEditorHandle` tipado explícitamente; sin `any` | PASS |
| III. React Moderno | `forwardRef`/`useImperativeHandle` son APIs estándar de React; sin frameworks de aplicación | PASS |
| IV. Composición | Menús de tabla y API imperativa no agrandan la superficie de props (solo 2 props pasivas: `documentId`/`fileName`, y el texto configurable de `onlyView`) | PASS |
| V. API Pública | Se agrega `MarkdownEditorHandle` como segundo tipo exportado (además de `MarkdownEditorProps`), justificado por ser la única forma de exponer una API imperativa en React | PASS |
| VI. Accesibilidad | Menús de tabla siguen el mismo patrón ya accesible de `FloatingPanel`/`role="menu"`; diagramas Mermaid renderizan SVG con `role="img"`/`aria-label` derivado del código fuente cuando sea posible | PASS (verificar en Fase 1) |
| VII. Styling Encapsulado | Nuevas CSS Custom Properties definidas con fallback a los valores actuales, dentro del mismo CSS Module | PASS |
| VIII. Minimización de Dependencias | 1 dependencia nueva (`mermaid`), justificada en research.md, cargada de forma perezosa para no penalizar el bundle base | PASS |
| IX. Testing de Comportamiento | Tests sobre comportamiento observable: menú correcto según tipo de celda y estado de foco previo, posición de cursor tras alternar, diagrama renderizado/fallback, `reset()`/`isModified()` | PASS (a verificar en tasks) |
| X. Documentación | README del componente y README raíz a actualizar con las 6 capacidades nuevas (FR-020, Definition of Done) | PASS |
| XI. Compatibilidad | Sin cambios de empaquetado más allá de que `mermaid` se resuelve como dependencia normal (no peer), cargada perezosamente | PASS |
| XII. Tree Shaking | `mermaid` vía `import()` dinámico: los consumidores que no usan Mermaid no la descargan | PASS |
| XIII. Build Distribuible | tsup ya soporta `import()` dinámico sin configuración adicional; se verifica en Fase de Polish | PASS |
| XIV. Calidad (gate) | Se exige antes de mergear, no antes de planificar | PASS |
| XV. Simplicidad | Mermaid reutiliza el `NodeView` del bloque de código en vez de un nodo nuevo (decisión ya tomada en Clarifications); "mover columna/fila" se resuelve con `TableMap` en vez de una librería de reordenamiento genérica | PASS |

Sin violaciones. No se requiere "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/005-table-context-menus-mermaid-imperative-api/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── types.ts                          # + onlyViewNotice?, documentId?, fileName?; nuevo MarkdownEditorHandle
├── MarkdownEditor.tsx                 # forwardRef + useImperativeHandle; estado de celda de tabla
│                                       # enfocada; mapeo de posición de cursor al alternar vista
├── MarkdownEditor.module.css          # + CSS Custom Properties de theming extendido
├── Toolbar/
│   └── buttons/
│       ├── TableColumnMenu.tsx        # NUEVO — menú de columna (añadir/mover/eliminar)
│       ├── TableRowMenu.tsx           # NUEVO — menú de fila (añadir/mover/eliminar)
│       └── InsertDialogs.tsx          # + detección Mermaid antes de insertar como HtmlBlock
├── markdown/
│   ├── tiptapMarkdownBridge.ts        # + NodeView condicional de Mermaid sobre CodeBlockLowlight
│   ├── pipeline.ts                    # + exposición de posiciones de origen (mdast) para el mapeo
│   └── cursorMapping.ts               # NUEVO — mapeo de posición AST↔ProseMirror al alternar vista
└── README.md                          # + las 6 capacidades nuevas

tests/MarkdownEditor/
├── only-view-notice.test.tsx          # NUEVO — US1
├── table-column-menu.test.tsx         # NUEVO — US2 (columna)
├── table-row-menu.test.tsx            # NUEVO — US2 (fila)
├── cursor-preservation.test.tsx       # NUEVO — US3
├── mermaid.test.tsx                   # NUEVO — US4
├── extended-theming.test.tsx          # NUEVO — US5
└── imperative-api.test.tsx            # NUEVO — US6

README.md                              # (raíz del repo) + mención de las capacidades nuevas
```

**Structure Decision**: Single project, mismo paquete `mdwysiwyg`. Todo el cambio extiende
archivos ya existentes de features anteriores, más un módulo nuevo de utilidades
(`cursorMapping.ts`) y dos componentes de menú de tabla; sin directorios nuevos de nivel superior.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplicable.*
