# Implementation Plan: Toolbar Redesign & Insert Pickers

**Branch**: `002-toolbar-redesign-insert-pickers` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-toolbar-redesign-insert-pickers/spec.md`

**Note**: Este plan documenta retroactivamente una implementación ya completada e integrada en
`master`. No se re-ejecutan build, typecheck ni tests como parte de este documento — esa
validación ya ocurrió durante el desarrollo iterativo (ver commits `af499c1`, `a867c64`,
`94ea0b8`, `07949ed`).

## Summary

Rediseño visual de la toolbar existente (estilo clásico de botones de icono con relieve) más dos
selectores nuevos reutilizables (`TableSizePicker`, `CodeLanguagePicker`), un `ExportMenu` con
icono, y un mecanismo de posicionamiento flotante (`FloatingPanel`) que resuelve los tres defectos
de recorte/superposición detectados durante el desarrollo. No se tocó el pipeline Markdown/GFM ni
el contrato público del componente.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — sin cambios respecto a
`001-markdown-editor`.

**Primary Dependencies**: Ninguna dependencia nueva de terceros. Se usa `react-dom`'s
`createPortal` (ya parte del peer dependency existente) para `FloatingPanel`.

**Storage**: N/A — sin cambios respecto a `001-markdown-editor`.

**Testing**: Vitest + React Testing Library, mismo enfoque de comportamiento observable que
`001-markdown-editor`. Los paneles portados se consultan vía `screen`/`document` en vez de
`container.querySelector`, dado que ya no viven en el subárbol DOM del componente renderizado.

**Target Platform**: Sin cambios — navegadores web modernos, paquete npm.

**Project Type**: Librería de componentes (mismo paquete `mdwysiwyg`).

**Performance Goals**: Sin cambios respecto a `001-markdown-editor`.

**Constraints**: Cero dependencias nuevas (Principio VIII); estilos siguen encapsulados vía CSS
Modules (Principio VII); el contrato público (`MarkdownEditorProps`) no cambia (Principio XI,
FR-020 de esta spec).

**Scale/Scope**: Cambios acotados a `src/components/MarkdownEditor/Toolbar/**` y a
`MarkdownEditor.module.css`; ningún archivo de `markdown/` (pipeline/bridge) se modificó.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | `TableSizePicker` y `CodeLanguagePicker` no conocen la app consumidora; reciben callbacks (`onSelect`/`onClose`) | PASS |
| II. TypeScript Estricto | Sin `any` nuevo; tipos explícitos para `TableSize`, `CodeLanguageValue`, props de `FloatingPanel` | PASS |
| III. React Moderno | Componentes funcionales + hooks (`useState`, `useLayoutEffect`); `createPortal` es API estándar de `react-dom` | PASS |
| IV. Composición | `FloatingPanel` es un wrapper composable (recibe `children`) reutilizado por 4 paneles distintos en vez de duplicar lógica de posicionamiento | PASS |
| V. API Pública | `MarkdownEditorProps` no cambia; los nuevos subcomponentes son internos (no exportados desde `index.ts`) | PASS |
| VI. Accesibilidad | Botones conservan `aria-label`/`aria-pressed`; paneles con `role="dialog"`/`role="group"`/`role="menu"`; `TableSizePicker` operable por teclado (flechas, Enter, Escape) | PASS |
| VII. Styling Encapsulado | Nuevas clases (`.tablePicker`, `.textButton`, etc.) viven en el mismo CSS Module; `FloatingPanel` reestablece las custom properties del `.root` para el contenido portado | PASS |
| VIII. Minimización de Dependencias | Cero dependencias nuevas — se resolvió con `createPortal`, ya disponible en el peer `react-dom` | PASS |
| IX. Testing de Comportamiento | Tests nuevos (`table-size-picker.test.tsx`) y actualizados verifican comportamiento observable (resaltado, texto "N × M", inserción real), no implementación interna | PASS |
| X. Documentación | README del componente actualizado con el nuevo selector de tabla, lenguaje de código y el layout de una sola fila | PASS |
| XI. Compatibilidad | Sin cambios de empaquetado; sigue siendo consumible como paquete independiente | PASS |
| XII. Tree Shaking | Sin cambios en la superficie de exports | PASS |
| XIII. Build Distribuible | Build ESM+CJS+`.d.ts` ya verificado sin errores durante el desarrollo (no se re-ejecuta aquí) | PASS |
| XIV. Calidad (gate) | Cumplido en su momento: tests, tipado, accesibilidad y documentación verificados antes de cada commit | PASS |
| XV. Simplicidad | `FloatingPanel` es la abstracción mínima necesaria para resolver el problema real de recorte (Principio no violado: no se generalizó más allá de lo que 4 paneles ya necesitaban) | PASS |

Sin violaciones. No se requiere "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/002-toolbar-redesign-insert-pickers/
├── plan.md              # This file
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

No se generan `research.md` ni `contracts/`: no hubo decisiones tecnológicas que investigar (cero
dependencias nuevas) ni cambios al contrato público del componente que documentar como contrato
nuevo — el contrato existente de `001-markdown-editor` sigue vigente sin modificaciones.

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── MarkdownEditor.module.css        # Estilos de toolbar rediseñados + nuevos paneles
├── Toolbar/
│   ├── Toolbar.tsx                  # Layout de una fila, botón Cita, apertura de paneles con anchor
│   └── buttons/
│       ├── icons.tsx                # + IconQuote, IconDownload (nuevos)
│       ├── ToolbarButton.tsx        # + soporte de className para glifos de texto (B/i/S)
│       ├── ExportMenu.tsx           # Icono de descarga; usa FloatingPanel(align="end")
│       ├── TableSizePicker.tsx      # NUEVO — selector visual reutilizable de tamaño de tabla
│       ├── CodeLanguagePicker.tsx   # NUEVO — selector de lenguaje predefinido + "Otro"
│       ├── FloatingPanel.tsx        # NUEVO — portal + position:fixed, resuelve US5
│       └── InsertDialogs.tsx        # Botones de acción con .textButton; ya no maneja "table"

tests/MarkdownEditor/
├── table-size-picker.test.tsx       # NUEVO — US2 aislada
├── insert-elements.test.tsx         # Actualizado: flujo de tabla vía picker, no formulario
├── wysiwyg-formatting.test.tsx      # + test de Cita (blockquote)
└── accessibility.test.tsx           # Cubre foco/Escape del ExportMenu portado
```

**Structure Decision**: Mismo single-project de `001-markdown-editor`. Todo el cambio queda
contenido dentro de `Toolbar/` más un ajuste puntual de `MarkdownEditor.module.css`; no se crearon
nuevos directorios de nivel superior.

## Complexity Tracking

*Sin violaciones de la Constitution Check — sección no aplicable.*
