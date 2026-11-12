# Data Model: Playground Configuration Builder

## AttributeSpec (generated, `playground/generated/attributes.json`)

| Field | Type | Notes |
|---|---|---|
| name | string | prop name |
| kind | `"switch" \| "options" \| "size" \| "text" \| "function"` | from the TS type |
| options | string[] | for `options` |
| default | boolean \| string \| number \| null | from `@default` |
| summary | string | first JSDoc line (Spanish) |
| dependsOn | string[] | optional, for notes |

## AttributeChoices

`Record<name, value>`; only edited entries stored. Value omitted = default.

## TokenSpec (from 015 `themeTokens`)

`{ name: "--mdw-…", group, kind: "color" | "background" | "font" | "shadow" | "length", default }`.

## ThemeChoices

| Field | Type | Rule |
|---|---|---|
| preset | string | default \| dark \| brand \| flat |
| values | `Record<token, string>` | edits over the preset |
| darkValues | `Record<token, string>` \| null | when "seguir preferencia del sistema" is on |
| scope | `"control" \| "section" \| "page"` | |
| className | string | valid class name; default `mi-editor` |
| wrapperSelector | string | default `.mi-seccion` |
| includeAll | boolean | default false |

## BuilderState (persisted)

`{ version: 1, attributes: AttributeChoices, theme: ThemeChoices, attributesFormat: "jsx" | "object" }`; invalid / old
versions are ignored (fresh state).

## Outputs

- Attributes snippet: string (JSX or object), see [contracts/builder-outputs.md](./contracts/builder-outputs.md).
- Theme CSS: string with instruction comments.
