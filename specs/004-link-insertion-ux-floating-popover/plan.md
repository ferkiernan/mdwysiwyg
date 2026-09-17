# Implementation Plan: Link Insertion UX & Floating Link Popover

**Branch**: `004-link-insertion-ux-floating-popover` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-link-insertion-ux-floating-popover/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Tres mejoras a la gestión de enlaces del `MarkdownEditor`, todas implementadas con la API ya
disponible de Tiptap/React/DOM (cero dependencias nuevas): el diálogo de inserción de enlace
condiciona sus campos según haya o no texto seleccionado; una función pura de autocompletado de
protocolo (`http://`) se reutiliza en el diálogo y en un nuevo popover; y un popover flotante
(reutilizando el `FloatingPanel` ya existente) aparece al hacer clic sobre un enlace en la vista
renderizada, vía `handleClickOn` de Tiptap. Ver [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — sin cambios respecto a features
anteriores.

**Primary Dependencies**: Ninguna dependencia nueva. Reutiliza `@tiptap/extension-link` (ya
instalada desde `002-toolbar-redesign-insert-pickers`), el componente `FloatingPanel` ya existente,
y APIs nativas del navegador (`window.open`, `navigator.clipboard`).

**Storage**: N/A — sin cambios. El estado del popover (abierto/cerrado, modo menú/edición) es
estado de UI efímero, no persistido.

**Testing**: Vitest + React Testing Library, mismo enfoque de comportamiento observable que
features anteriores.

**Target Platform**: Sin cambios — navegadores web modernos, paquete npm.

**Project Type**: Librería de componentes (mismo paquete `mdwysiwyg`).

**Performance Goals**: Sin cambios; la detección de clic sobre enlace usa el mismo ciclo de
eventos que ProseMirror ya procesa, sin overhead adicional perceptible.

**Constraints**: Ningún prop existente de `MarkdownEditorProps` cambia de comportamiento; el
modelo de datos del documento y el pipeline Markdown/GFM no se tocan (fuera de alcance, según
spec.md).

**Scale/Scope**: Cambios acotados a: `InsertDialogs.tsx` (UI condicional del diálogo de enlace),
un módulo nuevo `markdown/links.ts` (función `ensureProtocol`), y un componente nuevo
`Toolbar/buttons/LinkPopover.tsx` (o similar) cableado desde `MarkdownEditor.tsx`/`RenderedView.tsx`
vía `handleClickOn`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Sin lógica de aplicación; toda la funcionalidad es genérica del editor | PASS |
| II. TypeScript Estricto | `ensureProtocol` tipada como función pura `string → string`; sin `any` | PASS |
| III. React Moderno | Componentes funcionales + hooks; `handleClickOn` es una opción estándar de `useEditor` | PASS |
| IV. Composición | El popover reutiliza `FloatingPanel` ya existente en vez de crear un mecanismo de posicionamiento paralelo | PASS |
| V. API Pública | Cero cambios a `MarkdownEditorProps` | PASS |
| VI. Accesibilidad | El popover debe tener `role` apropiado (menu/dialog), foco gestionado igual que los demás paneles, cierre con Escape ya provisto por el patrón existente | PASS (verificar en Fase 1) |
| VII. Styling Encapsulado | Reutiliza clases ya existentes (`.dialog`, `.menu`, `.menuItem`) del CSS Module | PASS |
| VIII. Minimización de Dependencias | Cero dependencias nuevas (research.md) | PASS |
| IX. Testing de Comportamiento | Tests sobre comportamiento observable: qué campos muestra el diálogo, qué URL resulta aplicada, qué acciones hace cada botón del popover | PASS (a verificar en tasks) |
| X. Documentación | README del componente a actualizar con el nuevo comportamiento del diálogo de enlace y el popover | PASS |
| XI. Compatibilidad | Sin cambios de empaquetado | PASS |
| XII. Tree Shaking | Sin cambios en la superficie de exports (el popover es un componente interno) | PASS |
| XIII. Build Distribuible | Sin cambios en el pipeline de build | PASS |
| XIV. Calidad (gate) | Se exige antes de mergear, no antes de planificar | PASS |
| XV. Simplicidad | Se reutiliza `InsertDialog`/`FloatingPanel` existentes en vez de crear componentes paralelos; `ensureProtocol` es la abstracción mínima necesaria para no duplicar la regla en dos lugares | PASS |

Sin violaciones. No se requiere "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/004-link-insertion-ux-floating-popover/
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
├── markdown/
│   └── links.ts                      # NUEVO — ensureProtocol(url): string
├── Toolbar/
│   └── buttons/
│       ├── InsertDialogs.tsx          # Diálogo de enlace condicionado por selección activa
│       └── LinkPopover.tsx            # NUEVO — popover de acciones sobre enlace existente
├── views/
│   └── RenderedView.tsx               # + handleClickOn para detectar clic sobre enlace
└── README.md                          # + comportamiento de enlace actualizado

tests/MarkdownEditor/
├── link-insertion.test.tsx            # NUEVO — US1 y US2 (diálogo condicional + autocompletado)
└── link-popover.test.tsx              # NUEVO — US3 (popover de acciones)
```

**Structure Decision**: Single project, mismo paquete `mdwysiwyg`. Todo el cambio queda contenido
dentro de `Toolbar/buttons/`, `markdown/` y `views/`; no se crean directorios nuevos de nivel
superior.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplicable.*
