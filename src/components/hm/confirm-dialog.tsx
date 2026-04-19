"use client"
import { AlertTriangle } from "lucide-react"

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null
  const confirmBg = variant === "danger" ? "bg-red-600 hover:bg-red-700"
                  : variant === "warning" ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-hm-black hover:bg-hm-black/90"

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {variant !== "default" && (
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          )}
          <h3 className="font-bold text-hm-black text-lg mb-2">{title}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2 bg-gray-50">
          <button onClick={onCancel} className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-100">{cancelLabel}</button>
          <button onClick={onConfirm} className={`rounded-lg ${confirmBg} text-white px-5 py-2 text-sm font-semibold transition-colors`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
