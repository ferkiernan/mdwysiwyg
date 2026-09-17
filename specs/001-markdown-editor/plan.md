# Implementation Plan: Markdown Editor

**Branch**: `001-markdown-editor` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-markdown-editor/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Componente React `MarkdownEditor` de doble vista (WYSIWYG y Markdown/texto crudo) sobre GFM como
fuente de verdad única. Enfoque técnico: Tiptap (ProseMirror) como motor WYSIWYG con extensiones
GFM oficiales, un pipeline `unified`/`remark`/`rehype` para serializar a Markdown y HTML y para
sanitizar HTML embebido, y un `<textarea>` controlado nativo para la vista de texto crudo. Ver
[research.md](./research.md) para el detalle de decisiones y alternativas descartadas.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 18+ (peer dependency)

**Primary Dependencies**: `@tiptap/react` + extensiones oficiales GFM (`starter-kit`, `table`,
`task-list`, `task-item`, `link`, `image`, `horizontal-rule`); `unified` + `remark-parse` +
`remark-gfm` + `remark-rehype` + `rehype-stringify` + `rehype-sanitize` para el pipeline
Markdown↔HTML y sanitización. Ver [research.md](./research.md).

**Storage**: N/A — el componente no persiste nada; el estado vive en memoria (React state) y el
Markdown se expone vía callback `onChange` a la aplicación consumidora (FR-018, FR-019).

**Testing**: Vitest + React Testing Library (comportamiento observable: interacción de usuario,
contenido resultante, accesibilidad de elementos interactivos), consistente con Principio IX
(tests de comportamiento, no de implementación interna).

**Target Platform**: Navegadores web modernos (evergreen), como paquete npm consumido por
proyectos React independientes (Principio XI).

**Project Type**: Librería de componentes (single package), no aplicación.

**Performance Goals**: Edición fluida sin retraso perceptible en documentos de tamaño típico de
notas/documentación personal (hasta varios miles de palabras) — SC-006. Sin objetivo de
rendimiento para documentos de escala masiva (fuera de alcance, sin virtualización).

**Constraints**: Cero dependencias de frameworks de aplicación (Principio III); estilos
encapsulados sin fugas globales (Principio VII); tree-shakeable vía exports individuales
(Principio XII); `peerDependencies` para React/ReactDOM, nunca `dependencies` (Distribution &
Packaging Constraints).

**Scale/Scope**: Un único componente público (`MarkdownEditor`) con su tipos asociados
(`MarkdownEditorProps`, tipo de la referencia/ref si aplica). Sin sub-rutas de navegación ni
backend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | El componente no contiene lógica de negocio de ninguna app; todo el contenido y callbacks entran por props | PASS |
| II. TypeScript Estricto | `strict: true`, sin `any`; tipos de Tiptap/unified ya son TS-first | PASS |
| III. React Moderno | Componente funcional + hooks; Tiptap se integra vía `@tiptap/react` (hooks); sin routers/estado global/meta-frameworks | PASS |
| IV. Composición | API expone un único componente con props de configuración (contenido inicial, tamaño, callbacks, opción de sanitización); no se añaden props especulativas más allá de lo requerido por la spec | PASS |
| V. API Pública | Un solo componente exportado (`MarkdownEditor`) + tipos de props exportados desde el entry point | PASS |
| VI. Accesibilidad | Tiptap provee manejo de teclado/ARIA base en la vista WYSIWYG; la vista Markdown usa `<textarea>` nativo (accesible por defecto); toolbar usa botones semánticos con `aria-label`/`aria-pressed` donde aplique | PASS (verificar en Fase 1 quickstart) |
| VII. Styling Encapsulado | CSS Modules para estilos del componente y la toolbar, sin selectores globales | PASS |
| VIII. Minimización de Dependencias | 3 dependencias nuevas justificadas en research.md (Tiptap, unified/remark/rehype, rehype-sanitize); ninguna es redundante entre sí | PASS |
| IX. Testing de Comportamiento | Tests con Vitest + RTL sobre comportamiento observable (edición, alternancia de vista, export) | PASS (a verificar en tasks) |
| X. Documentación | Pendiente de producir en fase de implementación (propósito, API, ejemplos); no bloquea el plan | PASS (gate de Definition of Done, no de planning) |
| XI. Compatibilidad | Sin rutas relativas a la estructura del repo; consumible como paquete npm independiente | PASS |
| XII. Tree Shaking | Export nombrado único del componente; `sideEffects` a declarar en package.json en fase de implementación | PASS |
| XIII. Build Distribuible | Build ESM+CJS con `.d.ts` a configurar en fase de implementación (tooling estándar, p. ej. tsup/vite library mode) | PASS |
| XIV. Calidad (gate) | Se exige antes de mergear, no antes de planificar; sin violaciones anticipadas | PASS |
| XV. Simplicidad | Se descartaron opciones más pesadas (MDXEditor) y más elaboradas (CodeMirror, DOMPurify separado) a favor de las mínimas suficientes | PASS |

Sin violaciones. No se requiere "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/001-markdown-editor/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── components/
    └── MarkdownEditor/
        ├── MarkdownEditor.tsx          # Componente público principal
        ├── MarkdownEditor.module.css   # Estilos encapsulados (CSS Modules)
        ├── types.ts                    # Tipos públicos (props, ref) exportados
        ├── index.ts                    # Export nombrado individual (tree-shaking)
        ├── Toolbar/
        │   ├── Toolbar.tsx
        │   ├── Toolbar.module.css
        │   └── buttons/                # Botones de formato/inserción individuales
        ├── views/
        │   ├── RenderedView.tsx        # Vista WYSIWYG (Tiptap)
        │   └── MarkdownSourceView.tsx  # Vista Markdown cruda (textarea controlado)
        ├── markdown/
        │   ├── pipeline.ts             # unified/remark/rehype: MD↔AST↔HTML, sanitización
        │   └── tiptapMarkdownBridge.ts # Serialización Tiptap doc ↔ Markdown
        └── README.md                   # Documentación pública (Principio X)

src/
└── index.ts                            # Entry point del paquete (reexporta componentes públicos)

tests/
└── MarkdownEditor/
    ├── view-toggle.test.tsx            # US2: alternancia de vista sin pérdida de contenido
    ├── wysiwyg-formatting.test.tsx      # US1: formato desde la barra en vista renderizada
    ├── insert-elements.test.tsx         # US3: inserción de imagen/enlace/tabla/HR/código/HTML
    ├── export.test.tsx                  # US4: exportar Markdown/HTML
    └── accessibility.test.tsx           # Principio VI: teclado/ARIA en elementos interactivos
```

**Structure Decision**: Single project (paquete de librería único). No hay separación
frontend/backend ni múltiples apps — es un único componente distribuible bajo `src/components/`,
con su entry point de paquete en `src/index.ts` para soportar exports individuales (Principio
XII). Los tests están organizados por historia de usuario para reflejar el criterio de "Independent
Test" de cada una en la spec.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplicable.*
