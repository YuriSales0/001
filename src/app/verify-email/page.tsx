"use client"
import { HmLogo } from "@/components/hm/hm-logo"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type State =
  | { status: "loading" }
  | { status: "ok"; email: string }
  | { status: "error"; message: string }

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const token = params.get("token")
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "Missing confirmation token." })
      return
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) {
          setState({ status: "error", message: d.error ?? "Could not verify email." })
        } else {
          setState({ status: "ok", email: d.email })
        }
      })
      .catch(() => setState({ status: "error", message: "Network error. Try again." }))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B1E3A" }}>
      <div className="absolute inset-0 opacity-30"
           style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><HmLogo size={40} variant="compact" onDark /></Link>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl p-8 text-center"
             style={{ background: "#142B4D", border: "1px solid rgba(201,168,76,0.15)" }}>
          {state.status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-1">Verifying your email…</h1>
              <p className="text-sm text-gray-400">Just a moment.</p>
            </>
          )}

          {state.status === "ok" && (
            <>
              <div className="h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "rgba(34,197,94,0.15)" }}>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Email confirmed</h1>
              <p className="text-sm text-gray-400 mb-6">
                {state.email} is verified. You can now sign in.
              </p>
              <Link
                href="/login?verified=1"
                className="inline-flex items-center justify-center w-full rounded-lg py-3 text-sm font-semibold"
                style={{ background: "#B08A3E", color: "#0B1E3A" }}
              >
                Continue to sign in
              </Link>
            </>
          )}

          {state.status === "error" && (
            <>
              <div className="h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                   style={{ background: "rgba(239,68,68,0.15)" }}>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Couldn&rsquo;t verify</h1>
              <p className="text-sm text-gray-400 mb-6">{state.message}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full rounded-lg py-3 text-sm font-semibold border border-white/20 text-white hover:bg-white/5"
              >
                Back to sign in
              </Link>
              <p className="text-xs text-gray-500 mt-4">
                Need a new link? Request it from the sign-in page.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
