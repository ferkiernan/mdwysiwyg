# Research: Self-Documented API, Complete Documentation and Clear CSS Customization

All spec clarifications are resolved; these are design decisions.

## 1. Why host values do not reach the control today

`.root` declares every `--mdw-*` with a concrete value. A declaration on the element itself beats any inherited value, so a
value on an ancestor (`:root`, a wrapper) never applies, and a value on the host class (same element, same specificity as
`.root`) wins or loses depending on stylesheet order. The playground works around it with `!important`.

## 2. Defaults as fallbacks: private tokens

**Decision**: the control never declares a public `--mdw-*`. `.root` declares private tokens:

```css
.root {
  --_mdw-bg: var(--mdw-bg, #ffffff);
  --_mdw-content-bg: var(--mdw-content-bg, var(--_mdw-bg));
}
```

and every rule reads `var(--_mdw-…)`. Public values set by the host on the control's class (same element) or on any ancestor
(inherited) feed the private token; unset → default.

**Precedence (FR-018)**: control's class > nearest ancestor > built-in default — ordinary cascade + inheritance, independent
of load order, no `!important`.

**Derived defaults** (`content-bg` → `bg`, `table-header-bg` → `muted` …) reference the *private* base token, so overriding
`--mdw-muted` still recolors everything derived from it, exactly as today.

**Invalid value on an ancestor**: a custom property holding an invalid value for the target property makes the declaration
invalid at computed-value time (the property falls back to its initial value, not to our default). The guide documents this
(edge case); no runtime validation is added.

**Alternatives**: `:where(.root)` defaults (fixes load order only, not ancestors); `@layer` for defaults (same: declarations on
the element still block inheritance); repeating the default at every use site (`var(--mdw-x, #fff)` in each rule: duplicates
defaults in many places, error-prone).

## 3. New public tokens (FR-025)

Inventory of fixed colors in `MarkdownEditor.module.css` (grep of hex/rgba outside token declarations) grouped into tokens a
theme needs; full list and defaults in [contracts/theming-tokens.md](./contracts/theming-tokens.md). Geometry, spacing and
layout stay non-public. Naming: `--mdw-<area>-<role>`, same as existing.

## 4. Floating panels (portaled to `document.body`)

`FloatingPanel` portals to `body` with `className={styles.root}`; it gets the defaults but not the host's class or a wrapper's
values. **Decision**: on mount, read `getComputedStyle(anchorRoot)` for every public token name and set the defined ones inline
on the portal wrapper (a static list exported from a small `themeTokens.ts`). Page-root values already reach it by inheritance;
the snapshot adds class- and wrapper-level values. Cost: one style read per open.

**Alternatives**: portal inside the control (would be clipped/contained by host transforms); passing `className` (misses
wrapper-level themes).

## 5. JSDoc format and shipping

Spanish JSDoc per item: summary line, details (values, runtime-change, relationships), `@default` for every prop,
`@example` for modes/callbacks/`resolveImageSrc`/compare/history, `@see` with the guide section. tsup (`dts: true`,
rollup-plugin-dts) preserves leading JSDoc in `dist/index.d.ts`; verified in tasks by grepping the built file. Format in
[contracts/jsdoc-and-checks.md](./contracts/jsdoc-and-checks.md).

## 6. Documentation checks (warnings only)

**Decision**: `scripts/check-docs.mjs`, Node ESM, no new dependency:

- Props/methods/types: parse `types.ts` with the `typescript` compiler API; warn on missing JSDoc or missing `@default` on a
  prop.
- Docs consistency: prop names must appear in the props tables of the component README, the root README feature table
  (where applicable) and `llms.txt`; warn on missing / unknown names.
- Tokens: public tokens read via regex `var\(--mdw-[a-z-]+` in the CSS vs. the token table of `docs/THEMING.md`; warn both ways.
- Output: one line per warning (`WARN docs: <kind> <name> — <where>`) and a summary; **exit code 0 always**.

Runs via `npm run check:docs` and is appended to `prepublishOnly` so the publisher sees the warnings. The analyzer functions
are exported and unit-tested; the test never fails because real warnings exist (it only tests the analyzer on fixtures).

## 7. Guide location and language

`docs/THEMING.md`, Spanish (Clarification Q3), linked from the component README (which keeps a short theming summary) and from
the root README (English, by repository URL). `package.json` `files` adds `docs` so it is in the tarball.

## 8. Playground

One control per prop (adds `resizable`, `onlyView`, `onlyViewNotice`, `sanitizeEmbeddedHtml`, sizes, and 013/014 props when
present), a theme panel listing every public token grouped as in the guide, presets (default, dark, brand, flat), copy-CSS of
the result, and live application via a class without `!important` (proving FR-018).

## 9. Validation of the recipes (Clarification Q5)

Each recipe in the guide is copied verbatim into a test fixture and the playground. jsdom's support for computing inherited
custom properties through `getComputedStyle` is limited and not guaranteed, so automated tests check what is deterministic:
(a) the stylesheet declares no public `--mdw-*` and every rule reads a private token whose fallback chain matches the
contract; (b) each recipe only uses public token names from the contract; (c) the floating-panel snapshot copies defined
values. The visual result at the three declaration levels and in both load orders is verified in a real browser (playground
page with both orders), recorded in quickstart.md.
