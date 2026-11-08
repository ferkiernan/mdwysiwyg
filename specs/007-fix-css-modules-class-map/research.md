# Research: Mapa de clases CSS Modules en el paquete publicado

**Fecha**: 2026-11-08 | **Spec**: [spec.md](spec.md)

## R1. Causa raíz — Verificado

- `tsup` (esbuild) enruta cada `.css` por su plugin interno de PostCSS, que devuelve el contenido con el
  loader configurado en `loader[".css"]` o, por defecto, `css`. Con `css` los CSS Modules se empaquetan como CSS
  **global**: `dist/index.css` conserva `.root`, `.toolbar`… y el JS exporta `var MarkdownEditor_default = {}`.
- En tiempo de ejecución `styles["root"]` es `undefined` ⇒ `className` sin clase del módulo ⇒ el componente se
  ve sin estilos en cualquier consumidor del paquete.
- No se detectó antes porque: (a) el demo compila el código fuente con Vite (que sí procesa CSS Modules);
  (b) Vitest procesa los CSS Modules con `generateScopedName: "[name]__[local]"`; (c) ninguna prueba mira
  `dist/`.

## R2. Decisión: loader `local-css` en `tsup`

- **Decisión**: `loader: { ".css": "local-css" }` en `tsup.config.ts`.
- **Justificación**: es la opción nativa de esbuild para CSS Modules; genera nombres con prefijo del archivo
  (`MarkdownEditor_root`), respeta `:global(...)` y renombra `@keyframes`; no agrega dependencias (Principio
  VIII) y es un cambio de una línea (Principio XV).
- **Verificado**: construido y renderizado en una aplicación real (Tauri/WebView2): toolbar con iconos y
  degradado, tablas y código con su estilo, temas `--mdw-*` aplicados; 180 tests de la librería pasan.
- **Alternativas**: (a) `esbuildOptions.loader[".module.css"]` — no tiene efecto porque el plugin de PostCSS de
  `tsup` intercepta `.css` antes; (b) plugin `esbuild-css-modules-plugin` o `postcss-modules` — dependencia
  adicional sin necesidad; (c) dejar de usar CSS Modules — reescritura grande; (d) pasar a Vite en modo
  librería — cambio de herramienta fuera de alcance.

## R3. Barrera de regresión

- **Decisión**: (1) script `scripts/verify-dist.mjs` sin dependencias que inspecciona `dist/index.js`,
  `dist/index.cjs` y `dist/index.css`; (2) prueba Vitest que construye el paquete y renderiza el componente
  desde `dist/`; (3) `prepublishOnly` encadena tipos, tests, build y verificación.
- **Reglas de la verificación**: ningún mapa `*_default` de CSS Module vacío; cada valor del mapa es un
  selector de clase presente en `index.css`; ESM y CJS exponen los mismos valores.
- **Justificación**: Principios IX (testing de comportamiento), XIII (build distribuible) y XIV (calidad como
  puerta de salida): el artefacto que se publica es lo que debe verificarse, no solo el código fuente.
- **Alternativas**: solo prueba en Vitest (no cubre `npm publish` manual); solo `prepublishOnly` (no cubre CI);
  prueba E2E con navegador (pesada; el render en jsdom desde `dist/` es suficiente para detectar este defecto).

## R4. Versionado

- Parche **0.3.1** (corrección sin cambios de API; SemVer). Un `^0.3.0` en los consumidores lo recibe con
  `npm update`.
- CHANGELOG en el formato existente; commit `chore(release): bump to 0.3.1`; etiqueta `v0.3.1`.

## R5. Publicación

- `npm publish` ejecuta `prepublishOnly`. Requiere sesión de npm válida del propietario del paquete (la sesión
  de este equipo respondía 401 al inicio; ver tareas). Se hace `npm publish --dry-run` antes para revisar el
  contenido del tarball (`files: ["dist"]`).

## Unknowns

Ninguno pendiente: R2 verificado de extremo a extremo; la publicación depende de la sesión de npm.
