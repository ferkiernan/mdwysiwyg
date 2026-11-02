# Quickstart: validar la línea posterior al bloque final

## Prerrequisitos

```bash
npm install
```

## Validación automatizada

```bash
npx vitest run tests/MarkdownEditor/trailing-line.test.tsx   # feature
npm test                                                      # regresión completa
npm run typecheck
npm run build
```

Resultado esperado: todo en verde; build genera ESM, CJS y `.d.ts`.

## Validación manual (playground)

```bash
npm run dev
```

1. Cargar `| a | b |\n| - | - |\n| 1 | 2 |` → clic a la derecha de la tabla, a la altura de la
   última fila → escribir "hola" → aparece **bajo** la tabla, no en una celda.
2. Enter dos veces → se añaden líneas en blanco bajo la tabla.
3. Repetir con un bloque ```` ```js ```` y con un bloque ```` ```mermaid ````: clic a la derecha/debajo →
   cursor fuera del bloque; Enter crea líneas.
4. Documento terminado en párrafo: clic libre debajo → cursor al final del párrafo; Markdown intacto.
5. `onlyView`: sin línea en blanco extra ni cursor editable.

Ver [contracts/editing-behavior.md](./contracts/editing-behavior.md) y
[data-model.md](./data-model.md).
