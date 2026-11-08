# Feature Specification: El paquete publicado debe verse con estilos (mapa de clases CSS Modules)

**Feature Branch**: `007-fix-css-modules-class-map`

**Created**: 2026-11-08

**Status**: Implemented

**Input**: User description: "La versión publicada en npm (0.3.0) se ve sin estilos en las aplicaciones que la consumen: la barra de herramientas aparece como botones pelados sin iconos ni degradado, y las tablas, los bloques de código y los gráficos no tienen su estilo. En el demo se ve bien. Corregir el build, evitar que vuelva a ocurrir y publicar una nueva versión."

## Contexto

Esta feature corrige un defecto de **empaquetado** detectado al integrar `mdwysiwyg` 0.3.0 en una aplicación
de escritorio (MD Desktop). No cambia la API pública, las props ni el comportamiento del componente. Se apoya
en `001-markdown-editor` … `006-trailing-line-after-blocks`.

**Causa raíz** (verificada): el empaquetador procesa `MarkdownEditor.module.css` como CSS global. En
`dist/index.css` las clases quedan sin renombrar (`.root`, `.toolbar`, …) pero el JavaScript publicado contiene un
mapa de clases **vacío** (`var MarkdownEditor_default = {}`), de modo que `styles["root"]` vale `undefined` y
ningún elemento recibe su clase. El demo no lo sufre porque se compila desde el código fuente con Vite, y los
tests tampoco, porque Vitest procesa los CSS Modules con su propio generador de nombres.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consumir el paquete publicado y ver el editor con estilos (Priority: P1)

Una persona instala `mdwysiwyg` desde npm en una aplicación nueva, importa el componente y su hoja de estilos
(`mdwysiwyg/styles.css`) y renderiza el editor. La barra de herramientas, el área de contenido, las tablas, los
bloques de código y los gráficos se ven tal como en el demo.

**Why this priority**: Sin esto el paquete publicado es inutilizable visualmente; es el defecto reportado.

**Independent Test**: Construir el paquete, instalarlo desde el `.tgz` en una app de ejemplo, renderizar el
componente y comprobar que el elemento raíz y la barra de herramientas tienen clases que existen en la hoja de
estilos publicada.

**Acceptance Scenarios**:

1. **Given** el paquete construido, **When** se renderiza `MarkdownEditor` desde `dist/`, **Then** el elemento
   raíz lleva una clase del módulo CSS que está definida en `dist/index.css`.
2. **Given** el mismo render, **When** se inspecciona la barra de herramientas, **Then** tiene su clase del
   módulo y su degradado/colores se aplican (no se ve como botones sin estilo).
3. **Given** una aplicación que sobreescribe las variables `--mdw-*` mediante su propio `className`, **When** se
   renderiza el editor, **Then** el tema personalizado se sigue aplicando como documenta el README.

---

### User Story 2 - Que el build publicado no pueda volver a salir roto (Priority: P1)

Quien mantiene el paquete ejecuta el flujo de publicación. Si el artefacto de `dist/` tuviera mapas de clases
CSS vacíos o clases del JavaScript que no existen en la hoja de estilos, la publicación se detiene con un mensaje
claro.

**Why this priority**: La causa del defecto fue que ninguna comprobación miraba el artefacto publicado; sin una
barrera, el problema reaparecerá con cualquier cambio de herramientas.

**Independent Test**: Ejecutar la verificación sobre un `dist/` correcto (pasa) y sobre uno con mapa vacío
(falla con un mensaje que nombra el módulo afectado).

**Acceptance Scenarios**:

1. **Given** un `dist/` correcto, **When** se ejecuta la verificación, **Then** termina con éxito.
2. **Given** un `dist/` con un mapa de clases vacío, **When** se ejecuta, **Then** falla indicando el módulo.
3. **Given** un mapa que referencia una clase ausente en `index.css`, **When** se ejecuta, **Then** falla
   indicando la clase.
4. **Given** el comando de publicación, **When** se ejecuta `npm publish`, **Then** antes se corren tipos,
   tests, build y verificación del artefacto.

---

### User Story 3 - Publicar la corrección como nueva versión (Priority: P2)

El mantenedor publica la versión 0.3.1 con su entrada de CHANGELOG, y las aplicaciones que dependían de
`^0.3.0` reciben la corrección con un `npm update`.

**Why this priority**: Es el cierre operativo; depende de las historias anteriores.

**Independent Test**: Tras publicar, instalar `mdwysiwyg@0.3.1` en un proyecto limpio y comprobar la Historia 1.

**Acceptance Scenarios**:

1. **Given** el árbol de trabajo con la corrección, **When** se publica, **Then** `npm view mdwysiwyg version`
   devuelve 0.3.1 y el repositorio tiene el commit de release y su etiqueta.

---

### Edge Cases

- Selectores `:global(...)` del CSS fuente (ProseMirror, resaltado de código) deben seguir sin renombrarse.
- Variables CSS personalizadas (`--mdw-*`) y valores por defecto no deben cambiar de nombre ni de valor.
- Las salidas ESM y CJS deben llevar el mismo mapa de clases.
- Los nombres de clase generados no deben colisionar con clases de la aplicación consumidora (por eso van con
  prefijo del módulo).
- `@keyframes`/animaciones declaradas en el módulo deben seguir funcionando tras el renombrado.
- El demo (GitHub Pages) y los tests existentes siguen funcionando sin cambios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El build de distribución MUST generar para cada CSS Module un mapa de clases no vacío en el
  JavaScript (ESM y CJS) cuyos valores existan como selectores en `dist/index.css`.
- **FR-002**: El elemento raíz y la barra de herramientas del componente construido MUST recibir sus clases del
  módulo al renderizarse desde `dist/`.
- **FR-003**: Los selectores `:global(...)` MUST conservarse sin renombrar, y las variables `--mdw-*` MUST
  mantener nombres y valores por defecto.
- **FR-004**: El proyecto MUST incluir una verificación automática del artefacto `dist/` (mapas vacíos, clases
  huérfanas) ejecutable por separado y como parte de la publicación.
- **FR-005**: El proyecto MUST incluir una prueba que construya el paquete y renderice el componente desde
  `dist/`, para detectar esta clase de defecto en CI.
- **FR-006**: La publicación (`npm publish`) MUST ejecutar tipos, tests, build y verificación del artefacto
  antes de subir.
- **FR-007**: La API pública (props, handle, exports) MUST permanecer sin cambios; el CHANGELOG MUST registrar
  la corrección y la versión pasar a 0.3.1.

### Key Entities

- **Artefacto de distribución**: contenido de `dist/` (`index.js`, `index.cjs`, `index.css`, `.d.ts`).
- **Mapa de clases**: objeto del JavaScript publicado que traduce el nombre local de una clase (`root`) a su
  nombre real en `index.css` (`MarkdownEditor_root`).
- **Verificación de artefacto**: comprobación que compara los mapas de clases del JavaScript con `index.css`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una instalación limpia del paquete publicado, el 100 % de los elementos con clase de módulo
  (raíz, barra de herramientas, área de contenido) reciben su clase y su estilo.
- **SC-002**: La verificación de artefacto falla en el 100 % de los casos con mapa vacío o clase huérfana y pasa
  con el `dist/` correcto.
- **SC-003**: `npm publish` no sube nada si falla alguno de: tipos, tests, build, verificación.
- **SC-004**: 0 cambios en la API pública y 0 tests existentes modificados para pasar.
- **SC-005**: La suite completa (tests + tipos + build) pasa en menos de 3 minutos.

## Assumptions

- La causa es la configuración del empaquetador (CSS Modules tratados como globales); no se requiere cambiar el
  CSS fuente ni el componente.
- El nombre de clase generado puede ser `Módulo_clase` (hash legible por archivo y nombre local).
- Se publica como parche (0.3.1) por ser una corrección sin cambios de API.
- El mantenedor es el propietario del paquete en npm y del repositorio; la publicación usa su sesión de npm.
- Fuera de alcance: rediseño del tema, nuevas props, cambios en el demo.
