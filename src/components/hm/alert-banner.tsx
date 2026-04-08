import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"

type AlertLevel = "error" | "warning" | "success" | "info"

interface AlertBannerProps {
  level: AlertLevel
  title: string
  message?: string
  onClose?: () => void
  className?: string
}

const levelConfig = {
  error: {
    bg: "bg-hm-red/10 border-hm-red/30",
    text: "text-hm-red",
    icon: AlertTriangle,
    dot: "bg-hm-red",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    icon: AlertTriangle,
    dot: "bg-amber-500",
  },
  success: {
    bg: "bg-hm-green/10 border-hm-green/30",
    text: "text-hm-green",
    icon: CheckCircle2,
    dot: "bg-hm-green",
  },
  info: {
    bg: "bg-hm-blue/10 border-hm-blue/30",
    text: "text-hm-blue",
    icon: Info,
    dot: "bg-hm-blue",
  },
}

export function AlertBanner({ level, title, message, onClose, className }: AlertBannerProps) {
  const config = levelConfig[level]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-hm border p-4",
        config.bg,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.text)} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-serif font-semibold text-[15px]", config.text)}>{title}</p>
        {message && (
          <p className={cn("text-sm mt-0.5 opacity-80", config.text)}>{message}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn("shrink-0 opacity-60 hover:opacity-100 transition-opacity", config.text)}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
