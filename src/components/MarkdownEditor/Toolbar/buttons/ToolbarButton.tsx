import type { ButtonHTMLAttributes } from "react";
import styles from "../../MarkdownEditor.module.css";

export interface ToolbarButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  pressed?: boolean;
}

export function ToolbarButton({
  label,
  pressed,
  children,
  ...rest
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={styles["button"]}
      aria-label={label}
      title={label}
      {...(pressed !== undefined ? { "aria-pressed": pressed } : {})}
      {...rest}
    >
      {children}
    </button>
  );
}
