"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Optional class for the wrapper div (button positioning relies on it being relative) */
  wrapperClassName?: string
  /** Aria label for the toggle button (defaults to "Show/hide password") */
  toggleAriaLabel?: string
}

/**
 * Password input with built-in show/hide toggle (eye icon button).
 * Drop-in replacement for `<input type="password" />`.
 *
 * Accepts all standard input props (className, value, onChange, placeholder, etc.).
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, toggleAriaLabel = "Show/hide password", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className={cn("relative", wrapperClassName)}>
        <input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={toggleAriaLabel}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = "PasswordInput"
