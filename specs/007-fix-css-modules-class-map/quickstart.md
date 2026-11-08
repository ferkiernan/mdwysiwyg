# Quickstart: validar el arreglo

```bash
npm install
npm run typecheck
npm test                 # incluye tests/build/package-build.test.tsx (construye y renderiza desde dist/)
npm run build && npm run verify:dist
npm pack                 # tarball que se publicaría (solo dist/)
npm publish --dry-run    # ejecuta prepublishOnly y lista el contenido
```

## Comprobación manual en una app consumidora

1. `npm install ../mdwysiwyg/mdwysiwyg-0.3.1.tgz` en un proyecto React.
2. Renderizar `<MarkdownEditor initialContent="# Hola" />` con `import "mdwysiwyg/styles.css"`.
3. Esperado: barra de herramientas con iconos y degradado, contenido con tipografía y tablas/código con estilo
   (idéntico al demo). Antes del arreglo: botones sin estilo.

## Después de publicar

```bash
npm view mdwysiwyg version   # 0.3.1
```
