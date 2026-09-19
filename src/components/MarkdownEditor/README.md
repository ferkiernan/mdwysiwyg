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
| `onlyView` | `boolean` | `false` | Arranca en modo de solo lectura: ninguna vista es editable, la barra muestra "Edición desactivada" y conserva solo el control de exportar. |
| `resizable` | `boolean` | `true` | Permite redimensionar el componente arrastrando su esquina inferior derecha (como un `<textarea>` nativo). Con `false`, el tamaño queda fijo. |
| `onlyViewNotice` | `string` | `"Edición desactivada"` | Texto del aviso mostrado en la barra con `onlyView` activo. Útil para mostrar, por ejemplo, el nombre del archivo. |
| `documentId` | `string` | — | Identificador de documento de uso libre para la app consumidora. El componente lo acepta sin darle un uso propio. |
| `fileName` | `string` | — | Nombre de archivo de uso libre para la app consumidora. No se usa automáticamente como `onlyViewNotice`: pasalo explícitamente si lo querés ahí. |

Tipos exportados: `MarkdownEditorProps`, `MarkdownEditorHandle`.

## API imperativa (`ref`)

El componente acepta una `ref` que expone métodos para controlarlo desde la aplicación:

```tsx
import { useRef } from "react";
import { MarkdownEditor } from "mdwysiwyg";
import type { MarkdownEditorHandle } from "mdwysiwyg";

function Editor() {
  const ref = useRef<MarkdownEditorHandle>(null);

  return (
    <>
      <MarkdownEditor ref={ref} initialContent="# Original" />
      <button onClick={() => ref.current?.reset()}>Descartar cambios</button>
      <button onClick={() => alert(ref.current?.isModified())}>¿Modificado?</button>
    </>
  );
}
```

| Método | Devuelve | Descripción |
| --- | --- | --- |
| `reset()` | `void` | Restablece el contenido al valor con el que se montó el componente, en ambas vistas. |
| `isModified()` | `boolean` | `true` si el contenido actual difiere del original. Vuelve a `false` tras `reset()`. |

## Barra de herramientas

- **Formato**: párrafo, encabezados H1–H6, negrita, cursiva, tachado.
- **Listas**: ordenada, con viñetas, de tareas (checklist), y sangría para anidar. Los botones
  de aumentar/disminuir sangría se ocultan (no solo se deshabilitan) cuando la acción no está
  disponible para la posición actual del cursor.
- **Bloques**: bloque de código con resaltado de sintaxis y selector de lenguaje (JSON, SQL,
  TypeScript, JavaScript, Java u "Otro…" para especificar cualquier otro), cita, línea horizontal.
- **Insertar**: imagen (por URL), enlace, tabla (selector visual de tamaño: cuadrícula 10×10,
  convención columnas × filas — "3 × 4" = 3 columnas y 4 filas), HTML embebido.
- **`</>`**: alterna entre vista renderizada y vista Markdown. Alternar nunca modifica el
  contenido, y el cursor se reposiciona en el punto equivalente de la vista destino.
- **Export** (icono de descarga, alineado al extremo derecho de la barra): copia al portapapeles
  como Markdown o como HTML.

La barra se mantiene en una sola fila: si el espacio disponible es insuficiente, el selector de
encabezado se encoge (hasta 30px de ancho mínimo) antes que cualquier otro control.

### Tablas

Con el cursor ya posicionado dentro de una celda, un **segundo clic sobre esa misma celda** abre
un menú de acciones estructurales:

- **Celda de encabezado** → menú de columna: añadir a la derecha/izquierda, mover a la
  derecha/izquierda, eliminar esta columna.
- **Celda de datos** → menú de fila: añadir arriba/abajo, subir/bajar esta fila, eliminar esta
  fila.

El primer clic solo posiciona el cursor. Si entre ambos clics se hace clic en otra parte, el
siguiente vuelve a contar como "primer clic". Mover una columna/fila más allá del borde de la
tabla no tiene efecto. Si hay contenido seleccionado (por ejemplo, arrastrando el mouse sobre
texto de la celda) el clic no abre el menú, para no interrumpir la selección.

### Diagramas Mermaid

Un bloque de código con lenguaje `mermaid` se renderiza como diagrama en la vista renderizada:

````markdown
```mermaid
graph TD
A-->B
```
````

Con sintaxis inválida, el bloque degrada al texto del código sin romper el documento. Al usar
**Insertar HTML**, si el contenido pegado es en realidad sintaxis Mermaid, se inserta como bloque
de código `mermaid` en lugar de HTML embebido. El renderizado es puramente visual: el Markdown
fuente nunca se altera.

La librería de Mermaid se carga de forma perezosa (solo cuando aparece un diagrama), por lo que no
pesa en el bundle de quien no la usa, y se configura con `securityLevel: "strict"` (HTML escapado
en etiquetas, sin callbacks de clic) por tratarse de contenido potencialmente no confiable.

### Enlaces

Si hay texto seleccionado al presionar "Insertar enlace", el diálogo pide solo la URL y la aplica
sobre ese texto sin modificarlo. Sin selección, pide URL y texto (como cualquier inserción).
Cualquier URL sin protocolo (sin `"://"`) recibe automáticamente el prefijo `http://` — tanto al
insertar como al editar un enlace ya existente.

Hacer clic sobre un enlace en la vista renderizada abre un panel con **Ir a la url**, **Copiar
url**, y **Editar url** (que muestra un campo con la URL actual, **Eliminar link**, y **Guardar**).
En modo `onlyView` el panel solo ofrece "Ir a la url" y "Copiar url" — sin edición.

## Theming (CSS Custom Properties)

El aspecto visual de la barra de herramientas y del fondo del área de contenido se personaliza
con CSS estándar, sin agregar props al componente. Sobreescribí cualquier subconjunto de estas
variables en un selector que apunte al `className` que le pases:

**Barra de herramientas:**

| Variable | Default | Controla |
| --- | --- | --- |
| `--mdw-toolbar-gradient-from` | `#eeeeee` | Color inicial del degradado de la barra |
| `--mdw-toolbar-gradient-via` | `#dcdcdc` | Color intermedio del degradado |
| `--mdw-toolbar-gradient-to` | `#cfcfcf` | Color final del degradado |
| `--mdw-toolbar-fg` | `#222222` | Color de texto e iconos de la barra |
| `--mdw-toolbar-font-family` | `Arial, sans-serif` | Fuente tipográfica de la barra |
| `--mdw-toolbar-select-bg` | `#e9e9e9` | Fondo del selector de nivel de encabezado |
| `--mdw-button-active-bg` | `#c8c8c8` | Fondo de un botón presionado o activo |
| `--mdw-button-hover-gradient-from` | `#ffffff` | Color inicial del degradado de un botón en hover |
| `--mdw-button-hover-gradient-to` | `#d8d8d8` | Color final del degradado de un botón en hover |

**Área de contenido:**

| Variable | Default | Controla |
| --- | --- | --- |
| `--mdw-content-bg` | `var(--mdw-bg)` (blanco) | Fondo del área de contenido (ambas vistas): admite color sólido, degradado o imagen |
| `--mdw-content-wysiwyg-fg` | `var(--mdw-fg)` | Color de texto de la vista renderizada |
| `--mdw-content-wysiwyg-font-family` | `inherit` | Fuente de la vista renderizada |
| `--mdw-content-markdown-fg` | `var(--mdw-fg)` | Color de texto de la vista Markdown |
| `--mdw-content-markdown-font-family` | `ui-monospace, Consolas, monospace` | Fuente de la vista Markdown |

**Tablas y código:**

| Variable | Default | Controla |
| --- | --- | --- |
| `--mdw-table-header-bg` | `var(--mdw-muted)` | Fondo de los encabezados (`th`) de tablas en la vista renderizada |
| `--mdw-code-block-bg` | `var(--mdw-muted)` | Fondo de los bloques de código en la vista renderizada |
| `--mdw-mermaid-bg` | `var(--mdw-muted)` | Fondo del contenedor donde se renderiza un diagrama Mermaid |

**Scroll:**

| Variable | Default | Controla |
| --- | --- | --- |
| `--mdw-scrollbar-thumb` | `#c1c1c1` | Color del "pulgar" de la barra de scroll |
| `--mdw-scrollbar-track` | `transparent` | Color del riel de la barra de scroll |

Los colores de scroll se aplican donde el navegador lo permite (`scrollbar-color` y los
pseudo-elementos `::-webkit-scrollbar-*`), incluyendo el scroll horizontal que aparece
automáticamente en la barra de herramientas cuando es más ancha que el contenedor; en
navegadores sin soporte se ignoran silenciosamente.

`--mdw-content-bg` acepta cualquier valor válido de la propiedad CSS `background` (shorthand
completo: color, `linear-gradient(...)`, o `url(...)` con capas y transparencia combinadas), ya
que se aplica directamente como `background: var(--mdw-content-bg)`.

```css
.mi-editor-oscuro {
  --mdw-toolbar-gradient-from: #1e293b;
  --mdw-toolbar-gradient-via: #0f172a;
  --mdw-toolbar-gradient-to: #020617;
  --mdw-toolbar-fg: #f8fafc;
  --mdw-toolbar-font-family: "Inter", sans-serif;
  --mdw-content-bg: #0b1220;
}

.mi-editor-con-marca-de-agua {
  --mdw-content-bg:
    url("/marca-de-agua.png") center / 200px no-repeat,
    #ffffff;
}
```

```tsx
<MarkdownEditor className="mi-editor-oscuro" />
```

Cualquier variable que no sobreescribas conserva su valor por defecto.

## Ejemplos

```tsx
// Vacío, tamaño propio, notificación de cambios
<MarkdownEditor width="100%" height={400} onChange={save} />

// HTML embebido de confianza sin sanitizar
<MarkdownEditor
  initialContent={'<div class="widget">…</div>'}
  sanitizeEmbeddedHtml={false}
/>

// Visor de solo lectura, sin control de redimensionamiento
<MarkdownEditor
  onlyView
  resizable={false}
  initialContent={documentoExistente}
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
- **Enlaces**: el popover de edición solo está disponible en la vista renderizada; en la vista
  Markdown, un enlace es texto plano y se edita directamente como tal. El autocompletado de
  protocolo (`http://`) no valida que la URL exista ni sea alcanzable, solo su formato.
- **Imágenes**: por referencia (URL). Si la URL no carga, el navegador muestra el `alt`; la
  referencia se conserva en el Markdown.
- **Escala**: pensado para documentos de tamaño típico de notas/documentación personal; no hay
  virtualización para documentos masivos.
- **Persistencia**: fuera del alcance del componente — usa `onChange` para guardar donde decidas.
- **Resaltado de sintaxis**: aplica a los 5 lenguajes del selector (JSON, SQL, TypeScript,
  JavaScript, Java); un lenguaje personalizado no reconocido se muestra en texto plano legible,
  sin error. Es puramente visual — nunca modifica el Markdown fuente ni el fence info string.
- **Redimensionamiento**: el tamaño resultante de arrastrar la esquina es efímero (no se persiste
  entre sesiones); si tu app necesita recordarlo, escuchá el resize por tu cuenta (por ejemplo con
  un `ResizeObserver` externo) y volvé a pasar `width`/`height` en el próximo montaje.
- **Posición del cursor al alternar**: es una correspondencia de mejor esfuerzo. Cuando la
  sintaxis Markdown no tiene reflejo en el texto renderizado (marcadores como `**`, `#`, `|`), el
  cursor cae en la aproximación más cercana, no en una coincidencia exacta de carácter.
- **Mermaid**: los diagramas se renderizan con `securityLevel: "strict"`. La detección al insertar
  HTML usa un filtro de palabras clave antes de validar con el parser de Mermaid, para no cargar
  la librería al pegar HTML común.
- **`reset()` / `isModified()`**: comparan contra el contenido con el que se **montó** el
  componente. `initialContent` no es una prop controlada: cambiarla después del montaje no
  redefine ese valor de referencia.
