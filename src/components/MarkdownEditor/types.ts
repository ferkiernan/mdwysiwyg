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
}

export type ViewMode = "wysiwyg" | "markdown";
