"use client"
import { useEffect, useState } from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

type Toast = { id: number; message: string; variant: "success" | "error" }
let listeners: ((t: Toast) => void)[] = []
let counter = 0

export function showToast(message: string, variant: "success" | "error" = "error") {
  const toast = { id: ++counter, message, variant }
  listeners.forEach(l => l(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    const listener = (t: Toast) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000)
    }
    listeners.push(listener)
    return () => { listeners = listeners.filter(l => l !== listener) }
  }, [])
  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 rounded-lg shadow-lg px-4 py-3 text-sm text-white ${t.variant === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {t.variant === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {t.message}
        </div>
      ))}
    </div>
  )
}
