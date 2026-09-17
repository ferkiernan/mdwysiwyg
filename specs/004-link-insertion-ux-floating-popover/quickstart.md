# Quickstart: Link Insertion UX & Floating Link Popover

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/MarkdownEditor.md](./contracts/MarkdownEditor.md)

Guía de validación manual/automatizada end-to-end.

## Escenario 1 — Enlazar texto ya seleccionado (US1)

1. Escribir "Visitá nuestro sitio" en el editor.
2. Seleccionar la palabra "sitio".
3. Presionar el botón "Insertar enlace".
4. **Verificar**: el diálogo muestra solo el campo de URL (sin campo de texto).
5. Ingresar `ejemplo.com` y confirmar.
6. **Verificar**: el texto "sitio" ahora es un enlace hacia `http://ejemplo.com`; el resto del
   texto ("Visitá nuestro ") permanece sin cambios.

## Escenario 2 — Diálogo completo sin selección (US1, caso contrario)

1. Colocar el cursor en un punto sin texto seleccionado.
2. Presionar "Insertar enlace".
3. **Verificar**: el diálogo muestra ambos campos (URL y texto del enlace), igual que antes de
   esta feature.

## Escenario 3 — Autocompletado de protocolo (US2)

1. Repetir el Escenario 1 con estos valores de URL, verificando el destino final del enlace en
   cada caso:
   - `www.ejemplo.com` → `http://www.ejemplo.com`
   - `ejemplo.com` → `http://ejemplo.com`
   - `https://ejemplo.com` → `https://ejemplo.com` (sin cambios)

## Escenario 4 — Popover de acciones sobre enlace existente (US3)

1. Insertar un enlace (por ejemplo, con el flujo del Escenario 1).
2. Hacer clic sobre el texto del enlace en la vista renderizada.
3. **Verificar**: aparece un panel con "Ir a la url", "Copiar url", separador, "Editar url", en
   ese orden.
4. Seleccionar "Copiar url" → verificar que el portapapeles contiene la URL exacta del enlace.
5. Volver a hacer clic sobre el enlace, seleccionar "Editar url".
6. **Verificar**: el panel muestra un input con la URL actual, "Eliminar link" debajo, y un botón
   "Guardar".
7. Cambiar el valor del input a `www.otro-sitio.com` y presionar "Guardar".
8. **Verificar**: el enlace ahora apunta a `http://www.otro-sitio.com`; el panel se cierra.
9. Hacer clic sobre el enlace de nuevo, "Editar url", luego "Eliminar link".
10. **Verificar**: el texto permanece igual pero ya no es un enlace (sin marca de estilo/href).

## Escenario 5 — Cerrar sin aplicar cambios (US3, edge case)

1. Hacer clic sobre un enlace, "Editar url", modificar el input, pero presionar Escape (o hacer
   clic fuera del panel) en vez de "Guardar".
2. **Verificar**: el enlace conserva su URL original, sin cambios.

## Escenario 6 — Popover en modo de solo lectura

1. Montar el editor con `onlyView`, con contenido que incluya un enlace.
2. Hacer clic sobre el enlace.
3. **Verificar**: el panel muestra solo "Ir a la url" y "Copiar url" — sin "Editar url".

## Criterio de éxito global

Los 6 escenarios anteriores deben pasar sin intervención manual adicional para considerar la Fase
1 (diseño) validada. La cobertura formal como tests automatizados se desglosa en `tasks.md`
(generado por `/speckit-tasks`).
