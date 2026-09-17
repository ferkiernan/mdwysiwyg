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
  className,
  children,
  ...rest
}: ToolbarButtonProps) {
  const buttonClass =
    className === undefined
      ? styles["button"]
      : `${styles["button"]} ${className}`;
  return (
    <button
      type="button"
      className={buttonClass}
      aria-label={label}
      title={label}
      {...(pressed !== undefined ? { "aria-pressed": pressed } : {})}
      {...rest}
    >
      {children}
    </button>
  );
}
