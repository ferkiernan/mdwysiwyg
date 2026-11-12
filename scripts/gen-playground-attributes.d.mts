export interface GeneratedAttribute {
  name: string;
  kind: "switch" | "options" | "size" | "text" | "function";
  options?: string[];
  default: boolean | string | number | null;
  summary: string;
}

export function generate(source: string): GeneratedAttribute[];
