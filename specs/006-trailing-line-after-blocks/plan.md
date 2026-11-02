# Implementation Plan: Línea editable tras bloques al final del documento

**Branch**: `006-trailing-line-after-blocks` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-trailing-line-after-blocks/spec.md`

## Summary

Garantizar que, en la vista renderizada, un documento cuyo último elemento es un bloque (tabla,
bloque de código, Mermaid, cita, lista, regla horizontal, imagen) siempre tenga un párrafo vacío
editable después de él, y que un clic en el área libre a la derecha/debajo del último bloque
coloque el cursor ahí. Causa raíz (ver [research.md](./research.md)): la extensión `trailingNode`
de StarterKit solo reacciona tras una transacción que modifica el documento, por lo que un
documento cargado desde `initialContent` que termina en bloque **no** tiene párrafo posterior; y
el clic fuera del bloque (wrapper de tabla / contenedor del editor) lo resuelve ProseMirror hacia
la última celda o el interior del bloque. Solución: (1) asegurar el párrafo final al crear el
editor, sin disparar `onChange` ni historial; (2) manejar `mousedown` sobre áreas libres para
llevar el cursor al párrafo final. Sin props ni dependencias nuevas.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — sin cambios.

**Primary Dependencies**: Sin nuevas. Reutiliza `@tiptap/core`, `@tiptap/pm` (`TextSelection`) y
la extensión `trailingNode` ya incluida en `@tiptap/starter-kit` 3.31.

**Storage**: N/A.

**Testing**: Vitest + React Testing Library + user-event (jsdom). Sin layout real en jsdom: los
tests disparan `mousedown` sobre el contenedor/wrapper y verifican, escribiendo texto, que éste
termina después del bloque (vía `onChange`/Markdown). Round-trip verificado a nivel de pipeline.

**Target Platform**: Navegadores web modernos, paquete npm (sin cambios).

**Project Type**: Librería de componentes (`mdwysiwyg`).

**Performance Goals**: Una transacción extra en la creación del editor; `mousedown` handler O(1)
(solo inspecciona el último hijo del documento).

**Constraints**: No emitir `onChange`/`onUpdate` ni alterar el Markdown por la línea auxiliar
(FR-008); no cambiar el comportamiento de clic dentro de bloques (FR-006); inactivo en `onlyView`
(FR-009).

**Scale/Scope**: 1 módulo nuevo (`markdown/trailingLine.ts`), cambios menores en
`MarkdownEditor.tsx`, estilos mínimos, docs.

## Constitution Check

*GATE: pasa antes de Fase 0 y tras Fase 1.*

| Principio | Estado | Nota |
| --------- | ------ | ---- |
| I Reusabilidad | ✅ | Sin lógica de dominio. |
| II TypeScript estricto | ✅ | Sin `any`. |
| III React moderno | ✅ | Sin cambios de patrón. |
| IV Composición | ✅ | Sin props nuevas. |
| V API pública | ✅ | Sin cambios de API pública. |
| VI Accesibilidad | ✅ | Llegar a la línea por teclado (FR-011) cubierto por flechas/Ctrl+Fin sobre un párrafo siempre presente; test. |
| VII Styling | ✅ | Solo CSS Modules existente (si hace falta). |
| VIII Dependencias | ✅ | Ninguna nueva. |
| IX Testing | ✅ | Tests de comportamiento por tipo de bloque. |
| X Documentación | ✅ | README + CHANGELOG + llms.txt. |
| XI/XII/XIII Paquete/Tree shaking/Build | ✅ | Sin cambios de empaquetado. |
| XIV/XV Calidad / YAGNI | ✅ | Solución mínima, sin plugin genérico. |

Sin violaciones → sin Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-trailing-line-after-blocks/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── editing-behavior.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── MarkdownEditor.tsx            # onCreate → ensureTrailingParagraph; handleDOMEvents.mousedown
└── markdown/
    └── trailingLine.ts           # NUEVO: ensureTrailingParagraph, handleBlankAreaMouseDown

tests/MarkdownEditor/
└── trailing-line.test.tsx        # NUEVO

README.md, CHANGELOG.md, llms.txt, src/components/MarkdownEditor/README.md  # docs
```

**Structure Decision**: Single project (librería). Lógica aislada en un módulo puro bajo
`markdown/`, igual que `tableCommands.ts` y `cursorMapping.ts`; `MarkdownEditor.tsx` solo cablea.
