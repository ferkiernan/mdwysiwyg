# Contract: Verificación del artefacto `dist/`

`node scripts/verify-dist.mjs [--dir <dist>]` (por defecto `dist`). Código de salida `0` si todo es correcto;
`1` con un mensaje por problema (`✗ …`) si no; `2` si faltan archivos.

## Entradas

- `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.css`.

## Reglas

1. **Mapas no vacíos**: cada declaración de mapa de CSS Module (`var <Nombre>_default = {…}` en ESM,
   `var <Nombre>_default = {…}` o `__commonJS`-equivalente en CJS) MUST tener al menos una entrada.
2. **Clases existentes**: cada valor del mapa MUST aparecer como selector `.<valor>` en `dist/index.css`.
3. **Coherencia**: ESM y CJS MUST exponer los mismos valores por módulo.
4. **Hoja presente**: `dist/index.css` MUST existir y no estar vacío.

## Salida (ejemplo)

```text
✔ dist verificado: 1 mapa(s) de clases, 23 clase(s), ESM y CJS coherentes
✗ MarkdownEditor: el mapa de clases está vacío (styles["root"] sería undefined)
✗ MarkdownEditor: la clase "MarkdownEditor_root" no existe en index.css
```

## API del módulo

`export function checkDist({ esm, cjs, css }: { esm: string; cjs: string; css: string }): { ok: boolean; problems: string[]; maps: number; classes: number }`
(pura: recibe los textos; la CLI solo lee archivos y llama a esta función).
