import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { viewBox: "0 0 24 24", "aria-hidden": true } as const;

export function IconCode(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 7L4 12L9 17" />
      <path d="M15 7L20 12L15 17" />
      <path d="M14 4L10 20" />
    </svg>
  );
}

export function IconCodeBlock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6L3 12L8 18" />
      <path d="M16 6L21 12L16 18" />
    </svg>
  );
}

export function IconBullets(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
      <path d="M9 6H21" />
      <path d="M9 12H21" />
      <path d="M9 18H21" />
    </svg>
  );
}

export function IconNumbered(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5H5V9" />
      <path d="M3 9H6" />
      <path d="M3 13H6" />
      <path d="M3 17C3 15 6 15 6 17C6 19 3 19 3 19H6" />
      <path d="M10 6H21" />
      <path d="M10 12H21" />
      <path d="M10 18H21" />
    </svg>
  );
}

export function IconChecklist(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="6" height="6" />
      <path d="M4 6L6 8L9 4" />
      <path d="M12 6H21" />
      <rect x="3" y="14" width="6" height="6" />
      <path d="M12 17H21" />
    </svg>
  );
}

export function IconIndent(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6H21" />
      <path d="M11 12H21" />
      <path d="M3 18H21" />
      <path d="M3 9.5L6 12L3 14.5" />
    </svg>
  );
}

export function IconOutdent(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6H21" />
      <path d="M11 12H21" />
      <path d="M3 18H21" />
      <path d="M6 9.5L3 12L6 14.5" />
    </svg>
  );
}

export function IconQuote(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8H4V12H8V8C8 5 6 4 4 4" />
      <path d="M17 8H14V12H18V8C18 5 16 4 14 4" />
    </svg>
  );
}

export function IconTable(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" />
      <path d="M3 10H21" />
      <path d="M3 15H21" />
      <path d="M9 4V20" />
      <path d="M15 4V20" />
    </svg>
  );
}

export function IconLink(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 13C11.5 14.5 14 14.5 15.5 13L18 10.5C20 8.5 20 5.5 18 3.5C16 1.5 13 1.5 11 3.5L9.5 5" />
      <path d="M14 11C12.5 9.5 10 9.5 8.5 11L6 13.5C4 15.5 4 18.5 6 20.5C8 22.5 11 22.5 13 20.5L14.5 19" />
    </svg>
  );
}

export function IconImage(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" />
      <circle cx="8" cy="9" r="2" />
      <path d="M3 17L8 12L12 16L15 13L21 19" />
    </svg>
  );
}

export function IconHr(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12H21" />
      <path d="M6 6H18" opacity="0.35" />
      <path d="M6 18H18" opacity="0.35" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3V15" />
      <path d="M7 10L12 15L17 10" />
      <path d="M4 19H20" />
    </svg>
  );
}
