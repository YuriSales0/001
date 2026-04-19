"use client"
import { useEffect } from "react"

/**
 * Closes a modal/dialog when the Escape key is pressed.
 * Only binds while `open` is true.
 */
export function useEscapeKey(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])
}
