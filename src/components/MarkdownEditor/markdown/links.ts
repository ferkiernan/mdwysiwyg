/**
 * Anteponer "http://" cuando la URL no especifica protocolo. Uniforme: no
 * depende de que el valor empiece con "www" ni de ningún patrón textual
 * particular, solo de la ausencia de "://" (FR-004, FR-005, FR-006).
 */
export function ensureProtocol(url: string): string {
  return url.includes("://") ? url : `http://${url}`;
}
