import { useCallback, useState } from "react"

/** Copia texto al portapapeles y expone un flag `copied` que se auto-resetea. */
export function useCopy(resetMs = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copy = useCallback(
    async (text: string, key = text) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), resetMs)
      } catch {
        // Clipboard puede fallar sin permiso/HTTPS; lo ignoramos en silencio.
      }
    },
    [resetMs],
  )

  return { copy, copiedKey }
}
