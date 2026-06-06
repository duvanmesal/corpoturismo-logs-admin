// Enmascarado defensivo en la UI. El LogService ya sanitiza, pero NO confiamos:
// volvemos a ocultar claves sensibles antes de renderizar cualquier JSON.

const MASK = "••••••"
const MAX_DEPTH = 8

// Patrones de nombres de campo a ocultar (sobre la clave en minúsculas).
const SENSITIVE = [
  /pass(word)?/,
  /token/, // cubre accessToken, refreshToken, idToken…
  /authorization/,
  /cookie/,
  /api[_-]?key/,
  /secret/,
  /credential/,
]

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase()
  return SENSITIVE.some((re) => re.test(k))
}

/**
 * Devuelve una copia del valor con las claves sensibles enmascaradas.
 * No muta la entrada. Limita la profundidad para evitar estructuras enormes.
 */
export function maskSensitive(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return value

  if (Array.isArray(value)) {
    return value.map((v) => maskSensitive(v, depth + 1))
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? MASK : maskSensitive(val, depth + 1)
    }
    return out
  }

  return value
}

/** JSON enmascarado y formateado, listo para mostrar en un <pre>. */
export function maskedJson(value: unknown): string {
  try {
    return JSON.stringify(maskSensitive(value), null, 2)
  } catch {
    return "// No se pudo serializar el contenido"
  }
}
