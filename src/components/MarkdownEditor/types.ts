/** Modo del componente. */
export type EditorMode = "default" | "compare";

/** Disposición de los paneles en modo de comparación. */
export type CompareOrientation = "side-to-side" | "up-and-down";

/** Resultado de aceptar o rechazar el cambio en modo de comparación. */
export interface CompareDecision {
  decision: "accepted" | "rejected";
  /** Markdown que pasa a ser el contenido del componente. */
  markdown: string;
}

export interface MarkdownEditorProps {
  /** Contenido Markdown (GFM) inicial. Vacío por defecto. */
  initialContent?: string;
  /** Notificado con el Markdown actualizado tras cada modificación. */
  onChange?: (markdown: string) => void;
  /** Ancho del componente. Default: 700 (px). */
  width?: number | string;
  /** Alto del componente. Default: 500 (px). */
  height?: number | string;
  /** Sanitiza el HTML embebido antes de renderizarlo. Default: true. */
  sanitizeEmbeddedHtml?: boolean;
  /** Clase CSS adicional para el contenedor raíz. */
  className?: string;
  /** Arranca en modo de solo lectura (sin edición, toolbar reducida). Default: false. */
  onlyView?: boolean;
  /** Permite redimensionar el componente arrastrando su esquina inferior derecha. Default: true. */
  resizable?: boolean;
  /**
   * Muestra u oculta la barra de herramientas. Se puede cambiar en cualquier momento sin
   * perder contenido, cursor ni historial. Default: true.
   */
  showToolbar?: boolean;
  /** Texto del aviso mostrado en la barra con `onlyView`. Default: "Edición desactivada". */
  onlyViewNotice?: string;
  /**
   * `"default"` (edición normal) o `"compare"` (original frente a contenido nuevo). La comparación solo se
   * activa si también se indican `compareOrientation` y `compareContent`; si no, se comporta como `"default"`.
   * Default: `"default"`.
   */
  mode?: EditorMode;
  /** Disposición de los dos paneles en modo `"compare"`: original a la izquierda/arriba, nuevo a la derecha/abajo. */
  compareOrientation?: CompareOrientation;
  /** Markdown nuevo (propuesto) que se muestra en el panel editable en modo `"compare"`. */
  compareContent?: string;
  /**
   * Se llama una vez cuando el usuario acepta o rechaza el cambio. El componente vuelve por sí mismo
   * al modo `"default"` mostrando `markdown`.
   */
  onCompareDecision?: (result: CompareDecision) => void;
  /**
   * Activa el historial de versiones: se guarda una versión tras 3 s sin cambios y un icono tras el botón HTML
   * de la barra abre el modo historial (Undo / Redo / Confirm / Cancel (back to last version) y una lista de versiones con su
   * hora). Solo en modo `"default"` y sin `onlyView`. Se puede cambiar en cualquier momento. Default: false.
   */
  historyUndo?: boolean;
  /**
   * En modo `"compare"`, mantiene los dos paneles sobre el mismo contenido al desplazarse: el panel que se movió
   * en último lugar guía y el otro lo sigue por contenido coincidente (los tramos que solo existen en un lado se
   * recorren proporcionalmente). Solo desplazamiento vertical. Se puede cambiar en cualquier momento. Default: true.
   */
  compareSyncScroll?: boolean;
  /** Identificador de documento de uso libre para la app consumidora. */
  documentId?: string;
  /** Nombre de archivo de uso libre para la app consumidora. */
  fileName?: string;
  /**
   * Resuelve el `src` de las imágenes SOLO para mostrarlas (p. ej. ruta relativa -> URL
   * servible). El Markdown conserva el `src` original. Debe pasarse desde el montaje.
   */
  resolveImageSrc?: (src: string) => string;
}

/** API imperativa expuesta por `ref` (ver contracts/MarkdownEditor.md de 005). */
export interface MarkdownEditorHandle {
  /** Restablece el contenido al valor con el que se montó el componente. */
  reset(): void;
  /** Indica si el contenido actual difiere del contenido original. */
  isModified(): boolean;
  /** Inserta Markdown en la posición del cursor (o reemplaza la selección). Notifica `onChange`. */
  insertMarkdown(markdown: string): void;
  /**
   * Reemplaza todo el contenido como un cambio deshacible en la vista renderizada
   * (Ctrl+Z restaura el anterior). No modifica la base de `isModified()`. Notifica `onChange`.
   */
  setMarkdown(markdown: string): void;
}

export type ViewMode = "wysiwyg" | "markdown";
