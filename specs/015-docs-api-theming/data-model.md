# Data Model: Self-Documented API, Complete Documentation and Clear CSS Customization

No runtime data. The entities are documentation and styling artifacts.

## Setting (prop / callback / ref method / exported type)

| Field | Source | Rule |
|---|---|---|
| name | `types.ts` | unique |
| description | JSDoc summary + details | required (FR-001/003/004) |
| default | `@default` | required for props (FR-001) |
| runtime-change | JSDoc text | stated (FR-001) |
| relationships | JSDoc text | stated when any (FR-002) |
| example | `@example` | for modes, callbacks, `resolveImageSrc`, compare, history (FR-005) |
| guide link | `@see` | section name (FR-026) |

## Public token

| Field | Rule |
|---|---|
| name | `--mdw-<area>-<role>`; never declared by the control |
| default | today's value; private token `--_mdw-<same>` = `var(--mdw-…, default)` |
| area | base, toolbar, content, tables/code, syntax, quote, controls, floating panels, comparison, history, scroll |
| value type | color / `background` shorthand / font-family / length / shadow |

Relationships: derived defaults reference base private tokens (e.g. `--_mdw-popover-bg: var(--mdw-popover-bg, var(--_mdw-bg))`).

## Documentation set

| Document | Language | Must contain |
|---|---|---|
| `types.ts` JSDoc | Spanish | every setting (above) |
| `src/components/MarkdownEditor/README.md` | Spanish | full props table with defaults, features, link to guide |
| `docs/THEMING.md` | Spanish | token table (all), levels, precedence, recipes, supported/unsupported, troubleshooting, strategies, print/forced-colors |
| `README.md` | English | features (all), getting started, links to props reference, guide, demo |
| `llms.txt` | English | every prop with default, theming summary with link |
| `CHANGELOG.md` | English | entries for 013, 014, 015 |
| `playground/main.tsx` | Spanish | control per prop, full theme panel, copy CSS |

## Check warning

`{ kind, name, where }`, kinds: `prop-undocumented`, `prop-no-default`, `prop-missing`, `prop-unknown`, `token-missing`,
`token-unknown`. Never fatal.
