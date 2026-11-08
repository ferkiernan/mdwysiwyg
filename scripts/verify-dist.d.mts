export interface DistCheckInput {
  esm: string;
  cjs: string;
  css: string;
}

export interface DistCheckResult {
  ok: boolean;
  problems: string[];
  /** CSS Module class maps found in the ESM output. */
  maps: number;
  /** Total classes across those maps. */
  classes: number;
}

export function checkDist(input: DistCheckInput): DistCheckResult;
