import { cn } from "@/lib/utils"

type Plan = "STARTER" | "BASIC" | "MID" | "PREMIUM"

interface PlanBadgeProps {
  plan: Plan | string
  size?: "sm" | "md" | "lg"
  className?: string
}

const planConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  STARTER: {
    label: "Starter",
    bg: "bg-hm-sand",
    text: "text-hm-slate",
    border: "border-hm-border",
  },
  BASIC: {
    label: "Basic",
    bg: "bg-hm-blue/10",
    text: "text-hm-blue",
    border: "border-hm-blue/30",
  },
  MID: {
    label: "Mid",
    bg: "bg-hm-gold/15",
    text: "text-hm-gold-dk",
    border: "border-hm-gold/40",
  },
  PREMIUM: {
    label: "Premium",
    bg: "bg-hm-black",
    text: "text-hm-gold",
    border: "border-hm-black",
  },
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
}

export function PlanBadge({ plan, size = "md", className }: PlanBadgeProps) {
  const config = planConfig[plan] ?? planConfig.STARTER
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-serif font-semibold tracking-wide",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  )
}
