/**
 * Copia `text` al portapapeles. Devuelve `false` si no fue posible (permiso
 * denegado, API ausente): el llamador muestra el texto para copiarlo a mano.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || navigator.clipboard === undefined) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
