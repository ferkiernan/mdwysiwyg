# MarkdownEditor

Componente React para visualizar y editar contenido Markdown (GFM) con dos vistas
sincronizadas: **renderizada (WYSIWYG)** y **Markdown/texto fuente**. El Markdown es la única
fuente de verdad: toda edición en cualquiera de las vistas actualiza ambas representaciones.

## Propósito

Editar documentos Markdown sin conocer la sintaxis (vía barra de herramientas) sin perder nunca
el acceso al texto fuente real. Pensado como componente de librería: sin lógica de aplicación,
sin persistencia (la app consumidora decide cómo guardar) y sin dependencias de frameworks de
aplicación.

## Instalación y uso

```tsx
import { MarkdownEditor } from "mdwysiwyg";
import "mdwysiwyg/styles.css";

function App() {
  return (
    <MarkdownEditor
      initialContent={"# Hola\n\nEscribe **aquí**.\n"}
      onChange={(markdown) => console.log(markdown)}
    />
  );
}
```

Sin `initialContent` el editor comienza vacío. Sin `width`/`height` usa 700×500px.

## API (props)

| Prop | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `initialContent` | `string` | `""` | Markdown (GFM) inicial. No es controlado: cambios posteriores de la prop no reinician el editor. |
| `onChange` | `(markdown: string) => void` | — | Invocado con el Markdown actualizado tras **cada** modificación, desde cualquiera de las dos vistas. No se invoca al alternar de vista sin editar. |
| `width` | `number \| string` | `700` | Ancho (número = px, string = CSS). |
| `height` | `number \| string` | `500` | Alto (número = px, string = CSS). |
| `sanitizeEmbeddedHtml` | `boolean` | `true` | Sanitiza el HTML embebido antes de renderizarlo en la vista WYSIWYG (elimina `<script>`, handlers inline y demás vectores XSS). Desactivar solo con contenido de confianza. |
| `className` | `string` | — | Clase adicional para el contenedor raíz. |

Tipos exportados: `MarkdownEditorProps`.

## Barra de herramientas

- **Formato**: párrafo, encabezados H1–H6, negrita, cursiva, tachado.
- **Listas**: ordenada, con viñetas, de tareas (checklist), y sangría para anidar.
- **Bloques**: bloque de código (con selector de lenguaje: JSON, SQL, TypeScript, JavaScript, Java
  u "Otro…" para especificar cualquier otro), cita, línea horizontal.
- **Insertar**: imagen (por URL), enlace, tabla (selector visual de tamaño: cuadrícula 10×10,
  convención columnas × filas — "3 × 4" = 3 columnas y 4 filas), HTML embebido.
- **`</>`**: alterna entre vista renderizada y vista Markdown. Alternar nunca modifica el contenido.
- **Export** (icono de descarga, alineado al extremo derecho de la barra): copia al portapapeles
  como Markdown o como HTML.

La barra se mantiene en una sola fila: si el espacio disponible es insuficiente, el selector de
encabezado se encoge (hasta 30px de ancho mínimo) antes que cualquier otro control.

## Ejemplos

```tsx
// Vacío, tamaño propio, notificación de cambios
<MarkdownEditor width="100%" height={400} onChange={save} />

// HTML embebido de confianza sin sanitizar
<MarkdownEditor
  initialContent={'<div class="widget">…</div>'}
  sanitizeEmbeddedHtml={false}
/>
```

## Casos relevantes y límites conocidos

- **Alternancia sin pérdida**: alternar de vista sin editar preserva el texto fuente byte a byte,
  incluso con formato no canónico (p. ej. `*   item`).
- **Normalización al editar**: tras editar en la vista WYSIWYG, el Markdown se reserializa en
  forma canónica (viñetas `-`, negrita `**`, fences ``` para código). El contenido semántico se
  preserva; el estilo de escritura puede normalizarse.
- **Markdown inválido o incompleto**: la vista Markdown conserva el texto tal cual; la vista
  renderizada muestra la mejor interpretación posible sin bloquear ni perder contenido.
- **HTML embebido**: los bloques HTML (línea propia, separados por líneas en blanco) se preservan
  byte a byte y se muestran sanitizados por defecto. El HTML *inline* dentro de un párrafo se
  degrada a texto visible (no se ejecuta) y puede quedar escapado si se edita en WYSIWYG.
- **Imágenes**: por referencia (URL). Si la URL no carga, el navegador muestra el `alt`; la
  referencia se conserva en el Markdown.
- **Escala**: pensado para documentos de tamaño típico de notas/documentación personal; no hay
  virtualización para documentos masivos.
- **Persistencia**: fuera del alcance del componente — usa `onChange` para guardar donde decidas.
