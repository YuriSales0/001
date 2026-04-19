"use client"

import { useState } from "react"
import { useLocale } from "@/i18n/provider"
import { Briefcase, Wrench, ArrowRight, CheckCircle2, X, Loader2 } from "lucide-react"

type RecruitRole = "MANAGER" | "CREW"

export function JoinHostMasters() {
  const { t, locale } = useLocale()
  const [openRole, setOpenRole] = useState<RecruitRole | null>(null)

  return (
    <section id="join" className="py-20 sm:py-28" style={{ background: "#071328" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>
            {t("landing.join.badge")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t("landing.join.title")}
          </h2>
          <p className="mt-4 text-gray-400 text-lg">{t("landing.join.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Manager card */}
          <JoinCard
            role="MANAGER"
            icon={Briefcase}
            title={t("landing.join.manager.title")}
            tagline={t("landing.join.manager.tagline")}
            points={[
              t("landing.join.manager.point1"),
              t("landing.join.manager.point2"),
              t("landing.join.manager.point3"),
              t("landing.join.manager.point4"),
            ]}
            cta={t("landing.join.manager.cta")}
            onClick={() => setOpenRole("MANAGER")}
          />
          {/* Crew card */}
          <JoinCard
            role="CREW"
            icon={Wrench}
            title={t("landing.join.crew.title")}
            tagline={t("landing.join.crew.tagline")}
            points={[
              t("landing.join.crew.point1"),
              t("landing.join.crew.point2"),
              t("landing.join.crew.point3"),
              t("landing.join.crew.point4"),
            ]}
            cta={t("landing.join.crew.cta")}
            onClick={() => setOpenRole("CREW")}
          />
        </div>
      </div>

      {openRole && (
        <RecruitModal role={openRole} locale={locale} onClose={() => setOpenRole(null)} />
      )}
    </section>
  )
}

function JoinCard({
  role, icon: Icon, title, tagline, points, cta, onClick,
}: {
  role: RecruitRole
  icon: React.ElementType
  title: string
  tagline: string
  points: string[]
  cta: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-8 border transition-all hover:shadow-lg hover:scale-[1.01] group"
      style={{ background: "#142B4D", borderColor: "rgba(176,138,62,0.2)" }}
    >
      <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(176,138,62,0.15)" }}>
        <Icon className="h-6 w-6" style={{ color: "#B08A3E" }} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#B08A3E" }}>
        {role === "MANAGER" ? "Manager" : "Crew"}
      </p>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-5">{tagline}</p>
      <ul className="space-y-2 mb-6">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#B08A3E" }} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3" style={{ color: "#B08A3E" }}>
        {cta} <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  )
}

function RecruitModal({ role, locale, onClose }: { role: RecruitRole; locale: string; onClose: () => void }) {
  const { t } = useLocale()
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    zone: "",
    languages: [] as string[],
    experience: "",
    skills: [] as string[],
    availability: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name.trim() || !form.email.trim()) {
      setError(t("landing.join.form.required"))
      return
    }
    setSubmitting(true)
    const res = await fetch("/api/recruit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role, locale, source: "landing" }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || t("common.error"))
    }
  }

  const ZONES = ["Almuñécar", "Nerja", "Salobreña", "Maro", "La Herradura", "Torrenueva", "Motril", "Other"]
  const LANGS = [
    { code: "en", label: "English" }, { code: "es", label: "Español" }, { code: "pt", label: "Português" },
    { code: "de", label: "Deutsch" }, { code: "nl", label: "Nederlands" }, { code: "fr", label: "Français" },
    { code: "sv", label: "Svenska" }, { code: "no", label: "Norsk" }, { code: "da", label: "Dansk" },
  ]
  const SKILLS = [
    { code: "CLEANING", label: t("crew.cleaning") || "Cleaning" },
    { code: "MAINTENANCE", label: t("crew.maintenance") || "Maintenance" },
    { code: "CHECK_IN", label: "Check-in" },
    { code: "CHECK_OUT", label: "Check-out" },
    { code: "INSPECTION", label: "Inspection" },
    { code: "HANDYMAN", label: "Handyman" },
    { code: "LAUNDRY", label: "Laundry" },
    { code: "GARDENING", label: "Gardening" },
  ]

  const toggleArray = (field: "languages" | "skills", value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter(v => v !== value) : [...f[field], value],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-8"
        style={{ background: "#0B1E3A", border: "1px solid rgba(176,138,62,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h3 className="text-xl font-bold text-white">
            {role === "MANAGER" ? t("landing.join.manager.formTitle") : t("landing.join.crew.formTitle")}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{t("landing.join.form.thanks")}</h4>
            <p className="text-sm text-gray-400 mb-6">{t("landing.join.form.thanksDesc")}</p>
            <button onClick={onClose} className="rounded-lg bg-[#B08A3E] text-[#0B1E3A] px-6 py-2.5 text-sm font-semibold hover:brightness-110">
              {t("common.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                placeholder={t("common.name")}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-lg border px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
              />
              <input
                required
                type="email"
                placeholder={t("auth.email")}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="rounded-lg border px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
              />
            </div>

            <input
              placeholder={t("common.phone") + " (optional)"}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border px-4 py-3 text-sm"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                {t("landing.join.form.zone")}
              </label>
              <select
                value={form.zone}
                onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                className="w-full rounded-lg border px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
              >
                <option value="" style={{ background: "#0B1E3A" }}>—</option>
                {ZONES.map(z => <option key={z} value={z} style={{ background: "#0B1E3A" }}>{z}</option>)}
              </select>
            </div>

            {role === "MANAGER" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    {t("landing.join.form.languages")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.map(l => (
                      <button
                        type="button"
                        key={l.code}
                        onClick={() => toggleArray("languages", l.code)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border`}
                        style={{
                          background: form.languages.includes(l.code) ? "rgba(176,138,62,0.15)" : "rgba(255,255,255,0.03)",
                          borderColor: form.languages.includes(l.code) ? "#B08A3E" : "rgba(255,255,255,0.08)",
                          color: form.languages.includes(l.code) ? "#B08A3E" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder={t("landing.join.form.experience")}
                  value={form.experience}
                  onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                  maxLength={2000}
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                />
              </>
            )}

            {role === "CREW" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    {t("landing.join.form.skills")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(s => (
                      <button
                        type="button"
                        key={s.code}
                        onClick={() => toggleArray("skills", s.code)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border`}
                        style={{
                          background: form.skills.includes(s.code) ? "rgba(176,138,62,0.15)" : "rgba(255,255,255,0.03)",
                          borderColor: form.skills.includes(s.code) ? "#B08A3E" : "rgba(255,255,255,0.08)",
                          color: form.skills.includes(s.code) ? "#B08A3E" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  value={form.availability}
                  onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                  className="w-full rounded-lg border px-4 py-3 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                >
                  <option value="" style={{ background: "#0B1E3A" }}>{t("landing.join.form.availability")}</option>
                  <option value="full-time" style={{ background: "#0B1E3A" }}>Full-time</option>
                  <option value="part-time" style={{ background: "#0B1E3A" }}>Part-time</option>
                  <option value="weekends" style={{ background: "#0B1E3A" }}>Weekends only</option>
                  <option value="flexible" style={{ background: "#0B1E3A" }}>Flexible</option>
                </select>
              </>
            )}

            <textarea
              rows={3}
              placeholder={t("landing.join.form.message")}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              maxLength={1000}
              className="w-full rounded-lg border px-4 py-3 text-sm"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
            />

            {error && <p className="text-sm text-red-400 rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.1)" }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting || !form.name.trim() || !form.email.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
              style={{ background: "#B08A3E", color: "#0B1E3A" }}
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("auth.creating")}</> : <>{t("landing.join.form.submit")} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
