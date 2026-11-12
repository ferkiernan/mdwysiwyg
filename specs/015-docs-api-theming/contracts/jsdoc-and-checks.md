# Contract: JSDoc blocks and documentation checks

## JSDoc (Spanish) per item kind

**Prop**

```ts
/**
 * <Qué hace, una línea.>
 *
 * <Valores aceptados / opciones del enumerado.> <Si se puede cambiar con el componente montado o solo al montar.>
 * <Relación con otras props: dependencia, precedencia, exclusión.>
 *
 * @default <valor>
 * @example <solo si el uso no es obvio>
 * @see README del componente, sección «<sección>» / docs/THEMING.md
 */
```

**Callback**: when it is called, what it receives, relation to `onChange`. **`ref` method**: what it does, return value, whether
it calls `onChange`. **Exported type**: meaning + one line per field.

Every prop has `@default` (props without a value default use `@default undefined` plus the behavior when absent).

## `scripts/check-docs.mjs` output

```text
WARN docs: prop-undocumented <name> — src/components/MarkdownEditor/types.ts
WARN docs: prop-no-default <name> — types.ts
WARN docs: prop-missing <name> — <document>
WARN docs: prop-unknown <name> — <document>
WARN docs: token-missing <--mdw-x> — docs/THEMING.md
WARN docs: token-unknown <--mdw-x> — docs/THEMING.md
check-docs: <n> warning(s)
```

Exit code is always 0 (non-blocking). Commands: `npm run check:docs`; also run at the end of `prepublishOnly`.
Documents checked for props: `src/components/MarkdownEditor/README.md` (props table), `llms.txt`. The root README lists
features rather than every prop; it is checked only for the presence of a link to the props reference and to the guide.
