# Implementation Plan: Mapa de clases CSS Modules en el paquete publicado

**Branch**: `007-fix-css-modules-class-map` | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-fix-css-modules-class-map/spec.md`

## Summary

Corregir la configuración de `tsup` para que los CSS Modules se empaqueten como módulos locales (mapa de
clases poblado y coherente con `dist/index.css`), añadir una verificación automática del artefacto `dist/` y
una prueba que renderice el componente desde `dist/`, encadenar ambas en `prepublishOnly` y publicar el parche
0.3.1. Sin cambios de código fuente del componente ni de la API pública.

## Technical Context

**Language/Version**: TypeScript 5.9 estricto, React ≥ 18 (peer), Node ≥ 20 para scripts

**Primary Dependencies**: ninguna nueva (se usa el loader nativo de esbuild vía `tsup`); script de verificación en Node puro

**Storage**: N/A

**Testing**: Vitest + React Testing Library (jsdom); prueba de build que ejecuta `npm run build`

**Target Platform**: paquete npm (ESM + CJS + tipos) consumido por apps React

**Project Type**: librería de componentes

**Performance Goals**: sin impacto en tiempo de ejecución; suite completa < 3 min

**Constraints**: sin cambios de API; nombres de clase estables y con prefijo; `:global` y `--mdw-*` intactos

**Scale/Scope**: 1 archivo CSS Module, 1 config de build, 1 script, 1–2 archivos de test

## Constitution Check

| Principio | Evaluación |
|---|---|
| I Reusabilidad / V API pública | PASS: sin cambios de API ni de props |
| II TypeScript estricto | PASS: tests en TS estricto; el script `.mjs` queda fuera de `src` y se documenta con JSDoc |
| III–IV, VI Accesibilidad | PASS: sin cambios de componente |
| VII Styling encapsulado | PASS (refuerza): CSS Modules realmente encapsulados en el paquete publicado, con prefijo para evitar colisiones |
| VIII Minimización de dependencias | PASS: 0 dependencias nuevas |
| IX Testing de comportamiento | PASS: prueba que renderiza el artefacto construido y comprueba lo que el usuario ve (clases/estilo aplicados) |
| X Documentación | PASS: CHANGELOG, CONTRIBUTING (`verify:dist`) y esta spec |
| XI Compatibilidad / XII Tree shaking | PASS: `sideEffects` y exports sin cambios; ESM y CJS verificados |
| XIII Build distribuible | PASS (corrige): el build ahora es correcto y verificado |
| XIV Calidad como puerta de salida | PASS: `prepublishOnly` bloquea publicar si algo falla |
| XV Simplicidad y YAGNI | PASS: una línea de configuración + un script pequeño |

Sin violaciones; no hay entradas en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/007-fix-css-modules-class-map/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── contracts/dist-verification.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
tsup.config.ts                          # loader ".css": "local-css"
scripts/verify-dist.mjs                 # verificación del artefacto (CLI + función exportada)
tests/build/package-build.test.tsx      # construye, verifica y renderiza desde dist/
package.json                            # scripts verify:dist, prepublishOnly; versión 0.3.1
CHANGELOG.md  CONTRIBUTING.md           # documentación
```

**Structure Decision**: sin carpetas nuevas salvo `scripts/` y `tests/build/`; el código fuente de `src/` no cambia.

## Complexity Tracking

Sin violaciones que justificar.
