# Implementation Plan: Only-View Mode, Resizable Editor, Toolbar Theming & Code Syntax Highlighting

**Branch**: `003-onlyview-resize-theming-syntax-highlight` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-onlyview-resize-theming-syntax-highlight/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Cuatro capacidades independientes añadidas sobre el `MarkdownEditor` existente: (1) modo de solo
lectura vía la opción nativa `editable` de Tiptap más renderizado condicional de la toolbar; (2)
redimensionamiento manual vía la propiedad CSS nativa `resize: both`; (3) theming de la toolbar vía
CSS Custom Properties con prefijo `--mdw-toolbar-*`; (4) resaltado de sintaxis en bloques de código
vía `@tiptap/extension-code-block-lowlight` en el editor y `rehype-highlight` en el pipeline de
exportación, ambos sobre el mismo motor `lowlight`/`highlight.js`. Ver [research.md](./research.md)
para el detalle de decisiones y alternativas descartadas.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — sin cambios respecto a
`001-markdown-editor`.

**Primary Dependencies**: `@tiptap/extension-code-block-lowlight` + `lowlight` (resaltado en el
editor, reemplaza la `CodeBlock` de `starter-kit`); `rehype-highlight` (resaltado en el HTML
exportado, mismo motor `lowlight`). Sin dependencias nuevas para el modo de solo lectura
(`editable` nativo de Tiptap), el redimensionamiento (`resize` nativo de CSS) ni el theming (CSS
Custom Properties nativas). Ver [research.md](./research.md).

**Storage**: N/A — sin cambios. El tamaño resultante de un redimensionamiento es efímero (estado
de layout del navegador vía CSS `resize`, no estado de React ni prop controlada) y no se persiste,
conforme al alcance definido en la spec.

**Testing**: Vitest + React Testing Library, mismo enfoque de comportamiento observable que
features anteriores. Los tests de resaltado de sintaxis verifican la presencia de clases
`hljs-*`/tokens de color, no una paleta de colores exacta (Assumption de la spec).

**Target Platform**: Sin cambios — navegadores web modernos, paquete npm. `resize: both` es
soportado por todos los navegadores evergreen (Chrome, Firefox, Safari, Edge).

**Project Type**: Librería de componentes (mismo paquete `mdwysiwyg`).

**Performance Goals**: Sin cambios respecto a features anteriores. El registro selectivo de
lenguajes en `lowlight` (solo 5, no las ~190 gramáticas totales) mantiene el bundle acotado.

**Constraints**: Ningún prop existente (`initialContent`, `onChange`, `width`, `height`,
`sanitizeEmbeddedHtml`, `className`) cambia de comportamiento (FR-021); el theming no agrega props
nuevas (Principio V, FR-014); cero dependencias de frameworks de aplicación (Principio III).

**Scale/Scope**: Cambios acotados a: `MarkdownEditor.tsx` (props `onlyView`/`resizable`,
`editable`), `Toolbar.tsx` (renderizado condicional en modo solo lectura), `MarkdownEditor.module.css`
(CSS Custom Properties de la toolbar, `resize: both`), `tiptapMarkdownBridge.ts` (extensión de
code block con lowlight), `markdown/pipeline.ts` (`rehype-highlight` + ajuste de schema de
`rehype-sanitize`), y `types.ts` (dos props booleanas nuevas).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Las 4 capacidades son configurables por props/CSS, sin lógica de ninguna app concreta | PASS |
| II. TypeScript Estricto | Props nuevas (`onlyView`, `resizable`) tipadas como `boolean`; sin `any` | PASS |
| III. React Moderno | `editable` vía `useEditor`; sin frameworks de aplicación nuevos | PASS |
| IV. Composición | Theming vía CSS (no props de configuración adicionales); `onlyView`/`resizable` son las únicas 2 props nuevas, ambas con default que preserva el comportamiento actual | PASS |
| V. API Pública | Superficie pública crece en solo 2 props booleanas; el theming se resuelve fuera de la API de props (CSS Custom Properties), manteniéndola mínima | PASS |
| VI. Accesibilidad | En modo solo lectura, la barra debe seguir siendo perceptible por lectores de pantalla (texto "Edición desactivada" en vez de controles ocultos sin anuncio); el resaltado de sintaxis no debe depender solo del color (se preserva el texto real, no solo class de color) | PASS (verificar en Fase 1) |
| VII. Styling Encapsulado | Nuevas CSS Custom Properties definidas con prefijo `--mdw-toolbar-*` dentro del propio CSS Module, con fallback a los valores actuales — no dependen de estilos globales de la app consumidora para funcionar | PASS |
| VIII. Minimización de Dependencias | 3 dependencias nuevas, todas justificadas en research.md (extensión oficial de Tiptap + su motor + su equivalente en la familia rehype ya usada); 0 dependencias para las otras 3 capacidades | PASS |
| IX. Testing de Comportamiento | Tests sobre comportamiento observable: intento de edición bloqueado, presencia/ausencia de controles, aplicación de estilos personalizados, presencia de clases de resaltado | PASS (a verificar en tasks) |
| X. Documentación | README a actualizar con las 2 props nuevas y las variables CSS de theming (Definition of Done, no bloquea planning) | PASS |
| XI. Compatibilidad | Sin cambios de empaquetado ni de estructura del repo | PASS |
| XII. Tree Shaking | Sin cambios en la superficie de exports; `lowlight` se importa con registro selectivo de lenguajes | PASS |
| XIII. Build Distribuible | Sin cambios en el pipeline de build (tsup) | PASS |
| XIV. Calidad (gate) | Se exige antes de mergear, no antes de planificar | PASS |
| XV. Simplicidad | `resize` nativo de CSS y `editable` nativo de Tiptap evitan reimplementar mecanismos ya resueltos por la plataforma/librería; CSS Custom Properties evitan una API de theming a medida | PASS |

Sin violaciones. No se requiere "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/003-onlyview-resize-theming-syntax-highlight/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── types.ts                          # + onlyView?, resizable? en MarkdownEditorProps
├── MarkdownEditor.tsx                 # editable=!onlyView; resize:both condicional; onlyView → Toolbar
├── MarkdownEditor.module.css          # CSS Custom Properties --mdw-toolbar-*; .root--resizable
├── Toolbar/
│   └── Toolbar.tsx                    # Modo "Edición desactivada" + solo ExportMenu cuando onlyView
├── markdown/
│   ├── tiptapMarkdownBridge.ts        # CodeBlockLowlight en vez de CodeBlock de starter-kit
│   └── pipeline.ts                    # + rehype-highlight; schema de rehype-sanitize permite `class`
└── README.md                          # + onlyView, resizable, variables CSS de theming

tests/MarkdownEditor/
├── only-view.test.tsx                 # NUEVO — US1
├── resizable.test.tsx                 # NUEVO — US2
├── toolbar-theming.test.tsx           # NUEVO — US3
└── syntax-highlight.test.tsx          # NUEVO — US4
```

**Structure Decision**: Single project, mismo paquete `mdwysiwyg`. No se crean directorios nuevos
de nivel superior; los cambios extienden archivos ya existentes de `001-markdown-editor` y
`002-toolbar-redesign-insert-pickers`, más 4 archivos de test nuevos organizados por historia de
usuario.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplicable.*
