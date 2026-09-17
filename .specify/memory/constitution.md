<!--
Sync Impact Report
==================
Version change: TEMPLATE → 1.0.0
Rationale: Initial ratification (MAJOR) — defines the full governance baseline
  for the project from a template with no prior principles.

Modified principles: N/A (initial adoption)

Added sections:
  - Core Principles I–XV (Reusabilidad, TypeScript, React, Composición,
    API pública, Accesibilidad, Styling, Dependencias, Testing,
    Documentación, Compatibilidad, Tree shaking, Build, Calidad, Simplicidad)
  - Distribution & Packaging Constraints (SECTION_2)
  - Definition of Done (SECTION_3)
  - Governance

Removed sections: N/A (template placeholders only)

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (Constitution
    Check gate is filled dynamically per feature from this file)
  - .specify/templates/spec-template.md ✅ no changes needed (generic,
    principle-agnostic structure)
  - .specify/templates/tasks-template.md ✅ no changes needed (generic
    phase/task structure; principle-driven task types — a11y, tests,
    docs, types — are added per feature by /speckit-tasks)
  - .claude/skills/**/SKILL.md ✅ no agent-specific references requiring
    updates

Follow-up TODOs: none — no fields deferred.
-->

# mdwysiwyg Constitution

## Core Principles

### I. Reusabilidad
Los componentes MUST ser genéricos y reutilizables entre proyectos. MUST NOT
contener lógica de negocio o de dominio específica de una aplicación concreta
(rutas, llamadas a APIs propietarias, textos de negocio, estado global de una
app). Toda dependencia de contexto de aplicación (datos, callbacks, configuración)
MUST entrar por props o composición, nunca hardcodeada.
**Rationale**: es una librería personal de uso transversal; cualquier acoplamiento
a una app concreta rompe el propósito fundacional del proyecto.

### II. TypeScript Estricto
El proyecto MUST usar TypeScript con `strict: true` (incluyendo
`noImplicitAny`, `strictNullChecks`). El uso de `any` MUST evitarse; si es
inevitable, MUST ir acompañado de un comentario `// any: <justificación>`
explicando por qué no es viable un tipo concreto o genérico.
**Rationale**: la librería es consumida por proyectos externos que dependen de
sus tipos para seguridad e IntelliSense; `any` sin control degrada esa garantía
silenciosamente.

### III. React Moderno
Los componentes MUST usar APIs y patrones actuales de React (componentes
funcionales, hooks, forwardRef/ref-as-prop cuando aplique). MUST NOT introducir
dependencias de frameworks de aplicación (routers, gestores de estado global,
frameworks meta como Next.js) dentro del código de librería.
**Rationale**: mantener la librería agnóstica del framework de aplicación que la
consuma es lo que permite reutilizarla en cualquier proyecto React.

### IV. Composición sobre Configuración
Se MUST preferir componentes composables (children, slots, compound
components) frente a componentes con una superficie extensa de props
configurables para cubrir cada variante posible. Una prop nueva SOLO se añade
cuando la composición no resuelve el caso razonablemente.
**Rationale**: las props excesivas crean superficies de API rígidas y difíciles
de versionar; la composición escala mejor a casos de uso no previstos.

### V. API Pública Simple y Predecible
Cada componente MUST exponer una API pública mínima, consistente con el resto
de la librería (naming, orden de props, convenciones de eventos) y predecible.
Todos los tipos públicos (props, tipos exportados, refs) MUST estar definidos
explícitamente y exportados desde el punto de entrada del paquete.
**Rationale**: consistencia entre componentes reduce la curva de aprendizaje y
previene romper consumidores por inconsistencias de diseño de API.

### VI. Accesibilidad
Los componentes interactivos MUST cumplir prácticas de accesibilidad
aplicables (WAI-ARIA cuando corresponda: roles, estados, manejo de foco y
teclado). Se MUST usar HTML semántico como primera opción antes de recurrir a
`div`/`span` con roles ARIA.
**Rationale**: la accesibilidad no es una feature opcional añadible después;
es una propiedad estructural del componente y su coste de retrofit es alto.

### VII. Styling Encapsulado
Los estilos MUST estar encapsulados (CSS Modules, CSS-in-JS con scoping, o
equivalente) de forma que no generen fugas ni colisiones de clases/selectores
en la aplicación consumidora. MUST NOT depender de estilos globales definidos
fuera del componente para su correcto funcionamiento visual básico.
**Rationale**: la librería se instala en aplicaciones con sus propios sistemas
de estilos; cualquier fuga de estilos es un bug de integración para el
consumidor.

### VIII. Minimización de Dependencias
Se MUST minimizar dependencias externas de runtime. Toda dependencia nueva
MUST justificarse explícitamente (en el PR o en la documentación del
componente) con el beneficio concreto que aporta frente a implementarlo
internamente.
**Rationale**: cada dependencia añade peso al bundle del consumidor y superficie
de riesgo (mantenimiento, vulnerabilidades, breaking changes de terceros).

### IX. Testing de Comportamiento
Cada componente MUST tener tests que cubran su comportamiento relevante
(interacción, estados, accesibilidad básica). Los tests MUST priorizar
comportamiento observable por el usuario/consumidor sobre detalles de
implementación interna (evitar testear estructura interna del DOM o nombres de
funciones privadas).
**Rationale**: tests acoplados a implementación se rompen en refactors legítimos
y no protegen realmente el contrato del componente.

### X. Documentación Completa
Cada componente público MUST documentar: propósito, API (props y tipos),
ejemplos de uso, y casos relevantes (variantes, estados de error, edge cases
conocidos). Un componente sin esta documentación NO se considera publicable.
**Rationale**: sin documentación, el coste de reutilización sube tanto que la
librería deja de cumplir su propósito de acelerar proyectos futuros.

### XI. Compatibilidad como Paquete Independiente
La librería MUST poder instalarse y utilizarse desde cualquier proyecto React
independiente sin depender de la estructura interna, rutas relativas, o
configuración específica de este repositorio.
**Rationale**: el objetivo explícito del proyecto es ser consumido por
"distintos proyectos"; cualquier acoplamiento al repo de origen invalida ese
objetivo.

### XII. Tree Shaking / Importación Individual
La librería MUST permitir importar cada componente de forma individual sin
forzar al consumidor a cargar componentes no utilizados. Esto exige exports
nombrados (sin barrels que reexporten todo con efectos colaterales) y
`sideEffects` correctamente declarado en package.json.
**Rationale**: consumidores con requisitos de bundle size no deben pagar el
coste de toda la librería por usar un solo componente.

### XIII. Build Distribuible
El código fuente MUST poder distribuirse como paquete npm, generando salida
JavaScript (ESM, y CJS si se requiere compatibilidad) junto con declaraciones
de tipos TypeScript (`.d.ts`) correspondientes.
**Rationale**: sin un build de distribución correcto, la librería no es
consumible fuera del monorepo de desarrollo, contradiciendo el Principio XI.

### XIV. Calidad como Puerta de Salida
Ningún componente se considera terminado si no cumple simultáneamente los
Principios VI (Accesibilidad), IX (Testing), II (TypeScript estricto) y X
(Documentación). Estos cuatro son condición de "Definition of Done", no
mejoras posteriores opcionales.
**Rationale**: declarar estos principios sin exigirlos como gate los convierte
en aspiraciones incumplidas; deben bloquear el merge/publicación.

### XV. Simplicidad y YAGNI
Se MUST evitar abstracciones prematuras (props polimórficas especulativas,
sistemas de plugins, configuración genérica "por si acaso"). Un componente
SOLO se incorpora a la librería cuando resuelve un problema real ya
identificado en al menos un caso de uso concreto.
**Rationale**: la sobre-generalización anticipada es más costosa de mantener
que añadir capacidad cuando el caso de uso real aparece.

## Distribution & Packaging Constraints

- El paquete MUST declarar `peerDependencies` para `react` y `react-dom` (no
  `dependencies`), evitando múltiples copias de React en el consumidor.
- El punto de entrada del paquete MUST exponer exports individuales por
  componente además de (opcionalmente) un export agregado, para soportar el
  Principio XII.
- El build MUST generar `.d.ts` junto a cada módulo distribuido; un release sin
  tipos generados MUST bloquearse.
- Los estilos MUST poder consumirse sin forzar una configuración de build
  específica en el proyecto consumidor más allá de lo estándar en el
  ecosistema React (soporte CSS estándar o CSS Modules).

## Definition of Done

Un componente o cambio se considera completo únicamente cuando cumple todo lo
siguiente:

1. Tipado estricto sin `any` no justificado (Principio II).
2. Tests de comportamiento pasando (Principio IX).
3. Accesibilidad verificada para elementos interactivos (Principio VI).
4. Documentación de propósito, API, props, ejemplos y casos relevantes
   (Principio X).
5. Build de distribución (JS + `.d.ts`) generado sin errores (Principio XIII).
6. Sin dependencias nuevas no justificadas (Principio VIII).

Un PR que no cumpla estos seis puntos MUST NOT mergearse.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, plantilla o
convención documentada en el repositorio. En caso de conflicto entre esta
constitución y un template (`plan-template.md`, `spec-template.md`,
`tasks-template.md`) u otra guía, la constitución tiene prioridad y el
template/guía MUST actualizarse para alinearse.

**Enmiendas**: cualquier cambio a esta constitución (añadir, eliminar o
redefinir un principio o regla de gobernanza) MUST hacerse mediante el comando
`/speckit-constitution`, documentando el cambio en un Sync Impact Report al
inicio del archivo y actualizando la versión según semver:
- MAJOR: eliminación o redefinición incompatible de un principio existente.
- MINOR: adición de un nuevo principio o expansión material de una sección.
- PATCH: aclaraciones de redacción sin cambio de sentido normativo.

**Cumplimiento**: todo plan (`/speckit-plan`) MUST incluir una verificación
explícita contra el "Constitution Check" antes de la Fase 0 y tras la Fase 1
de diseño. Toda violación MUST justificarse en la sección "Complexity
Tracking" del plan o resolverse simplificando el diseño. Revisiones de PR
MUST verificar cumplimiento de la Definition of Done antes de aprobar merge.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
