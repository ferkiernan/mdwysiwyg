import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Editor } from "@tiptap/core";
import styles from "../../MarkdownEditor.module.css";

export type DialogKind = "image" | "link" | "table" | "html";

interface DialogShellProps {
  title: string;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
}

function DialogShell({ title, onSubmit, onClose, children }: DialogShellProps) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("input, textarea");
    first?.focus();
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      ref={ref}
      className={styles["dialog"]}
      role="dialog"
      aria-label={title}
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      {children}
      <div className={styles["dialogActions"]}>
        <button type="button" className={styles["button"]} onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className={styles["button"]}>
          Insertar
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  children: (id: string) => ReactNode;
}

function Field({ label, children }: FieldProps) {
  const id = useId();
  return (
    <div className={styles["dialogField"]}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  );
}

export interface InsertDialogProps {
  kind: DialogKind;
  editor: Editor;
  onClose: () => void;
}

export function InsertDialog({ kind, editor, onClose }: InsertDialogProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [html, setHtml] = useState("");

  const submit = () => {
    const chain = editor.chain().focus();
    if (kind === "image" && url) {
      chain.setImage({ src: url, alt: text }).run();
    } else if (kind === "link" && url) {
      if (editor.state.selection.empty && text) {
        chain
          .insertContent({
            type: "text",
            text,
            marks: [{ type: "link", attrs: { href: url } }],
          })
          .run();
      } else {
        chain.extendMarkRange("link").setLink({ href: url }).run();
      }
    } else if (kind === "table") {
      chain.insertTable({ rows, cols, withHeaderRow: true }).run();
    } else if (kind === "html" && html) {
      chain
        .insertContent({ type: "htmlBlock", attrs: { content: html } })
        .run();
    }
    onClose();
  };

  if (kind === "table") {
    return (
      <DialogShell title="Insertar tabla" onSubmit={submit} onClose={onClose}>
        <Field label="Filas">
          {(id) => (
            <input
              id={id}
              type="number"
              min={1}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
            />
          )}
        </Field>
        <Field label="Columnas">
          {(id) => (
            <input
              id={id}
              type="number"
              min={1}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />
          )}
        </Field>
      </DialogShell>
    );
  }

  if (kind === "html") {
    return (
      <DialogShell
        title="Insertar HTML embebido"
        onSubmit={submit}
        onClose={onClose}
      >
        <Field label="Código HTML">
          {(id) => (
            <textarea
              id={id}
              rows={4}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
            />
          )}
        </Field>
      </DialogShell>
    );
  }

  const isImage = kind === "image";
  return (
    <DialogShell
      title={isImage ? "Insertar imagen" : "Insertar enlace"}
      onSubmit={submit}
      onClose={onClose}
    >
      <Field label={isImage ? "URL de la imagen" : "URL del enlace"}>
        {(id) => (
          <input
            id={id}
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}
      </Field>
      <Field label={isImage ? "Texto alternativo" : "Texto del enlace"}>
        {(id) => (
          <input
            id={id}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </Field>
    </DialogShell>
  );
}
