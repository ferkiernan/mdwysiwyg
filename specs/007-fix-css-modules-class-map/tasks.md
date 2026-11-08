---

description: "Lista de tareas: mapa de clases CSS Modules en el paquete publicado"
---

# Tasks: Mapa de clases CSS Modules en el paquete publicado

**Input**: documentos en `/specs/007-fix-css-modules-class-map/`

**Tests**: incluidos (Principio IX). Se escriben antes de la implementación y deben fallar con el build actual.

## Phase 1: Verificación del artefacto (US2) — pruebas primero

- [x] T001 [P] [US2] Tests de `checkDist` (mapa vacío, clase huérfana, ESM≠CJS, correcto, `index.css` ausente) y de la CLI en `tests/build/verify-dist.test.ts`
- [x] T002 [US2] Implementar `checkDist` y la CLI en `scripts/verify-dist.mjs`

## Phase 2: Arreglo del build (US1)

- [x] T003 [P] [US1] Prueba de paquete: construir, verificar y renderizar `MarkdownEditor` desde `dist/` comprobando que raíz y barra de herramientas tienen clases presentes en `dist/index.css`, en `tests/build/package-build.test.tsx`
- [x] T004 [US1] Loader `local-css` en `tsup.config.ts` (con comentario de causa raíz)
- [x] T005 [US1] Comprobar que `:global(...)` y `--mdw-*` quedan intactos en `dist/index.css`

## Phase 3: Barrera de publicación y documentación (US2/US3)

- [x] T006 [US2] Scripts `verify:dist` y `prepublishOnly` en `package.json`
- [x] T007 [P] [US3] CHANGELOG 0.3.1 y nota en `CONTRIBUTING.md`

## Phase 4: Calidad y release (US3)

- [x] T008 Ejecutar `typecheck`, `test`, `build`, `verify:dist` y `npm publish --dry-run`
- [ ] T009 Verificar el tarball en una app consumidora real (estilos presentes)
- [ ] T010 Versión 0.3.1, commit de release, etiqueta `v0.3.1`, `npm publish` y push

## Dependencias

T001→T002; T003 falla antes de T004; T004→T005→T006; T008 requiere todo lo anterior; T010 al final.
