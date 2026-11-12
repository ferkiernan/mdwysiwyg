/**
 * Modo del componente.
 *
 * - `"default"`: edición normal de un único documento.
 * - `"compare"`: muestra el contenido original (solo lectura) frente a un contenido nuevo (editable) con las
 *   diferencias resaltadas. Requiere además `compareContent` (`compareOrientation` es opcional, por defecto
 *   `"side-to-side"`).
 *
 * @see README del componente, sección «Modo comparación»
 */
export type EditorMode = "default" | "compare";

/**
 * Disposición de los paneles en modo `"compare"`.
 *
 * - `"side-to-side"`: original a la izquierda, nuevo a la derecha.
 * - `"up-and-down"`: original arriba, nuevo abajo.
 */
export type CompareOrientation = "side-to-side" | "up-and-down";

/** Resultado de aceptar o rechazar el cambio en modo `"compare"` (ver `onCompareDecision`). */
export interface CompareDecision {
  /** `"accepted"`: el usuario aceptó el contenido nuevo; `"rejected"`: volvió al original. */
  decision: "accepted" | "rejected";
  /** Markdown que pasa a ser el contenido del componente (el nuevo, con ediciones manuales, o el original). */
  markdown: string;
}

/**
 * Props de `<MarkdownEditor>`. Todas son opcionales.
 *
 * Personalización visual: no hay props de estilo; se usan las variables CSS `--mdw-*` declaradas en la clase
 * que se pasa en `className` o en cualquier ancestro (ver `docs/THEMING.md`).
 */
export interface MarkdownEditorProps {
  /**
   * Contenido Markdown (GFM) con el que se monta el componente. Es también la base de `reset()` e `isModified()`.
   *
   * Solo se lee al montar: para reemplazar el contenido después, usá `ref.current.setMarkdown(markdown)`.
   *
   * @default ""
   * @example
   * <MarkdownEditor initialContent={"# Título\n\nTexto inicial"} />
   */
  initialContent?: string;

  /**
   * Se llama con el Markdown completo tras cada modificación hecha por el usuario (o por `insertMarkdown`,
   * `setMarkdown`, Aceptar/Rechazar/Restaurar en comparación y Confirm en el historial). No se llama al montar, al
   * cambiar de vista sin editar, al navegar el historial ni al cambiar props.
   *
   * @default undefined (sin notificación)
   * @example
   * <MarkdownEditor onChange={(markdown) => setDraft(markdown)} />
   */
  onChange?: (markdown: string) => void;

  /**
   * Ancho del componente: número en píxeles o cualquier longitud CSS (`"100%"`, `"40rem"`). Se puede cambiar en
   * cualquier momento.
   *
   * @default 700
   */
  width?: number | string;

  /**
   * Alto del componente: número en píxeles o cualquier longitud CSS. Con `autoHeight` es el alto **mínimo**.
   * Se puede cambiar en cualquier momento.
   *
   * @default 500
   */
  height?: number | string;

  /**
   * Sanitiza el HTML embebido en el Markdown antes de renderizarlo (quita scripts, manejadores de eventos y
   * URLs peligrosas). Desactivalo solo con contenido de confianza. Cambiarlo recrea el editor (conserva el contenido).
   *
   * @default true
   */
  sanitizeEmbeddedHtml?: boolean;

  /**
   * Clase CSS adicional para el contenedor raíz. Es el punto de entrada del theming por instancia: declará en
   * ella las variables `--mdw-*` que quieras cambiar. Se puede cambiar en cualquier momento.
   *
   * @default undefined
   * @example
   * // CSS: .mi-editor { --mdw-toolbar-fg: #f8fafc; --mdw-content-bg: #0b1220; }
   * <MarkdownEditor className="mi-editor" />
   * @see docs/THEMING.md
   */
  className?: string;

  /**
   * Solo lectura: sin edición y con una barra reducida (vista Markdown/renderizada y Exportar) que muestra
   * `onlyViewNotice`. En comparación, ambos paneles quedan en solo lectura. Desactiva el historial de versiones
   * (`historyUndo`). Se puede cambiar en cualquier momento (recrea el editor conservando el contenido).
   *
   * @default false
   */
  onlyView?: boolean;

  /**
   * Permite redimensionar el componente arrastrando su esquina inferior derecha. Se ignora mientras `autoHeight`
   * esté activo. Se puede cambiar en cualquier momento.
   *
   * @default true
   */
  resizable?: boolean;

  /**
   * Alto automático: el componente crece hacia abajo hasta mostrar todo su contenido, sin barra de
   * desplazamiento vertical interna, y se reduce al borrar contenido. `height` pasa a ser el alto **mínimo**
   * y no se ofrece el tirador de redimensionar (`resizable` se ignora). Funciona en la vista renderizada y en la
   * Markdown, en comparación (alto del panel más alto, o de ambos apilados) y en el historial. Si un contenedor
   * del host limita el alto, manda el contenedor. Se puede cambiar en cualquier momento sin perder contenido,
   * cursor ni historial.
   *
   * @default false
   * @see README del componente, sección «Alto automático»
   */
  autoHeight?: boolean;

  /**
   * Muestra u oculta la barra de herramientas (y con ella la de comparación y el historial). Se puede cambiar en
   * cualquier momento sin perder contenido, cursor ni historial. Tiene prioridad sobre `autoHideBar`.
   *
   * @default true
   * @see README del componente, sección «Mostrar y ocultar la barra»
   */
  showToolbar?: boolean;

  /**
   * Oculta la barra de herramientas mientras el foco no está dentro del componente y la muestra al volver
   * (clic o Tab en el contenido o en la barra). Los menús, diálogos y popovers abiertos desde el componente cuentan
   * como "dentro". Oculta = retirada del layout (el contenido ocupa su espacio) y fuera del orden de tabulación.
   * `showToolbar={false}` tiene prioridad: nunca la muestra. No afecta a la barra de comparación ni a la de
   * historial. Se puede cambiar en cualquier momento.
   *
   * @default false
   * @see README del componente, sección «Ocultar la barra al perder el foco»
   */
  autoHideBar?: boolean;

  /**
   * Texto del aviso que muestra la barra reducida con `onlyView`. Se puede cambiar en cualquier momento.
   *
   * @default "Edición desactivada"
   */
  onlyViewNotice?: string;

  /**
   * `"default"` (edición normal) o `"compare"` (original frente a contenido nuevo). La comparación solo se
   * activa si también se indica `compareContent`; si falta se comporta como
   * `"default"`. El original es el contenido que tenía el componente al entrar en comparación y **solo cambia si
   * el usuario acepta**: si la comparación termina sin decisión (vuelta a `"default"` o `compareContent`
   * retirado), el editor vuelve al original. Se puede cambiar en cualquier momento.
   *
   * @default "default"
   * @example
   * <MarkdownEditor
   *   initialContent={actual}
   *   mode="compare"
   *   compareOrientation="side-to-side"
   *   compareContent={propuesta}
   *   onCompareDecision={({ decision, markdown }) => guardar(markdown)}
   * />
   * @see README del componente, sección «Modo comparación»
   */
  mode?: EditorMode;

  /**
   * Disposición de los dos paneles en modo `"compare"` (`"side-to-side"`: original a la izquierda; `"up-and-down"`:
   * original arriba). Cambiarla conserva las ediciones del panel nuevo.
   *
   * @default "side-to-side"
   */
  compareOrientation?: CompareOrientation;

  /**
   * Markdown nuevo (propuesto) que se muestra en el panel editable en modo `"compare"`. Obligatorio para que la
   * comparación se active. Es la referencia de «Restaurar»; otro valor reemplaza el panel nuevo (descarta sus
   * ediciones) y mantiene el original.
   *
   * @default undefined (sin comparación)
   */
  compareContent?: string;

  /**
   * Se llama una vez cuando el usuario acepta o rechaza el cambio en modo `"compare"`, después de `onChange`.
   * El componente vuelve por sí mismo al modo `"default"` mostrando `markdown`; el host suele pasar
   * `mode="default"` a continuación.
   *
   * @default undefined
   * @example
   * onCompareDecision={({ decision, markdown }) => {
   *   if (decision === "accepted") guardar(markdown);
   *   setMode("default");
   * }}
   */
  onCompareDecision?: (result: CompareDecision) => void;

  /**
   * Activa el historial de versiones: se guarda una versión tras 3 s sin cambios (hasta 200, en memoria) y un
   * icono tras el botón HTML de la barra abre el modo historial (← Undo / Redo →, Confirm, Cancel (back to last
   * version) y una lista de versiones con su hora). Solo en modo `"default"`, sin `onlyView` y con la barra
   * visible. Se puede cambiar en cualquier momento (al desactivarlo se descartan las versiones).
   *
   * @default false
   * @see README del componente, sección «Historial de versiones»
   */
  historyUndo?: boolean;

  /**
   * En modo `"compare"`, mantiene los dos paneles sobre el mismo contenido al desplazarse: el panel que se movió
   * en último lugar guía y el otro lo sigue por contenido coincidente (los tramos que solo existen en un lado se
   * recorren proporcionalmente). Solo desplazamiento vertical. Se puede cambiar en cualquier momento.
   *
   * @default true
   * @see README del componente, sección «Modo comparación»
   */
  compareSyncScroll?: boolean;

  /**
   * Identificador de documento de uso libre para la app consumidora: el componente no lo usa ni lo muestra.
   *
   * @default undefined
   */
  documentId?: string;

  /**
   * Nombre de archivo de uso libre para la app consumidora: el componente no lo usa ni lo muestra.
   *
   * @default undefined
   */
  fileName?: string;

  /**
   * Resuelve el `src` de las imágenes SOLO para mostrarlas (p. ej. ruta relativa → URL servible); el Markdown
   * conserva el `src` original. Debe pasarse desde el montaje; si cambia la función, se usa siempre la última
   * pasada.
   *
   * @default undefined (se muestra el `src` tal cual)
   * @example
   * <MarkdownEditor resolveImageSrc={(src) => new URL(src, baseUrl).href} />
   */
  resolveImageSrc?: (src: string) => string;
}

/**
 * API imperativa expuesta por `ref`.
 *
 * @example
 * const ref = useRef<MarkdownEditorHandle>(null);
 * <MarkdownEditor ref={ref} />
 * ref.current?.setMarkdown("# Nuevo");
 */
export interface MarkdownEditorHandle {
  /**
   * Restablece el contenido al valor con el que se montó el componente, en ambas vistas. En modo normal no
   * llama a `onChange`; en comparación equivale a «Restaurar» (vuelve a `compareContent`).
   */
  reset(): void;
  /**
   * `true` si el contenido actual difiere del original (el de montaje; en comparación, `compareContent`).
   * No notifica nada.
   */
  isModified(): boolean;
  /** Inserta Markdown en la posición del cursor (o reemplaza la selección). Notifica `onChange`. */
  insertMarkdown(markdown: string): void;
  /**
   * Reemplaza todo el contenido como un cambio deshacible en la vista renderizada
   * (Ctrl+Z restaura el anterior). No modifica la base de `isModified()`. Notifica `onChange`.
   */
  setMarkdown(markdown: string): void;
}

/** Vista activa del componente: renderizada (`"wysiwyg"`) o código Markdown (`"markdown"`). Interno. */
export type ViewMode = "wysiwyg" | "markdown";
