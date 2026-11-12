import { GUIDE_URL } from "./generators";

/** Enlace a la guía «Cómo implementar estilos en tu host» (se abre en otra pestaña). */
export function StylingGuideLink({ prefix }: { prefix?: string }) {
  return (
    <span style={{ fontSize: 14 }}>
      {prefix !== undefined && <>{prefix} </>}
      <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer">
        Cómo implementar estilos en tu host
        <span aria-hidden="true"> ↗</span>
        <span
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
          }}
        >
          {" "}
          (se abre en una pestaña nueva)
        </span>
      </a>
    </span>
  );
}
