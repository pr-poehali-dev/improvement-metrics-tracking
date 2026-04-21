import { useState, type FormEvent } from "react"
import Icon from "@/components/ui/icon"

const COURSES_URL = "https://functions.poehali.dev/bf12abb0-2991-4dab-a823-f8a79b267a90"

type Props = {
  open: boolean
  onClose: () => void
}

export function CourseApplicationModal({ open, onClose }: Props) {
  const [form, setForm] = useState({
    provider_name: "",
    provider_type: "employer",
    contact_name: "",
    contact_email: "",
    course_title: "",
    description: "",
    opportunities: "",
    skills: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${COURSES_URL}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      const parsed = typeof data === "string" ? JSON.parse(data) : data
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(parsed.error || "Ошибка отправки")
      }
    } catch {
      setError("Ошибка сети. Попробуйте позже.")
    } finally {
      setLoading(false)
    }
  }

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-foreground/15 bg-background p-6 shadow-2xl md:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-foreground/40 transition-colors hover:text-foreground"
        >
          <Icon name="X" size={18} />
        </button>

        {success ? (
          <div className="py-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <Icon name="CheckCircle" size={28} className="text-accent" />
              </div>
            </div>
            <h3 className="mb-2 font-sans text-xl font-light text-foreground">Заявка отправлена!</h3>
            <p className="text-sm text-foreground/60">Свяжемся с вами в течение 2 рабочих дней.</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-full bg-foreground/10 px-6 py-2 font-mono text-sm text-foreground transition-colors hover:bg-foreground/15"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="mb-1 font-mono text-xs text-foreground/50">/ Партнёрство</p>
              <h3 className="font-sans text-2xl font-light text-foreground">Разместить курс</h3>
              <p className="mt-1 text-sm text-foreground/60">
                Заполните заявку — мы опубликуем курс после проверки.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "employer", label: "Работодатель" },
                  { value: "university", label: "Учебное заведение" },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("provider_type", t.value)}
                    className={`rounded-xl border py-2 font-mono text-xs transition-all ${
                      form.provider_type === t.value
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-foreground/15 text-foreground/50 hover:border-foreground/30"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {[
                { key: "provider_name", label: "Название организации", placeholder: "Яндекс / МФТИ" },
                { key: "contact_name", label: "Контактное лицо", placeholder: "Иван Иванов" },
                { key: "contact_email", label: "Email", placeholder: "hr@company.ru", type: "email" },
                { key: "course_title", label: "Название курса", placeholder: "Frontend на React" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block font-mono text-xs text-foreground/50">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    required
                    value={(form as Record<string, string>)[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none"
                  />
                </div>
              ))}

              {[
                { key: "description", label: "Описание курса", placeholder: "Что будет изучено, формат, длительность..." },
                { key: "opportunities", label: "Возможности после прохождения", placeholder: "Стажировка, оффер, сертификат..." },
                { key: "skills", label: "Навыки (через запятую)", placeholder: "React, TypeScript, Git" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block font-mono text-xs text-foreground/50">{f.label}</label>
                  <textarea
                    rows={f.key === "skills" ? 1 : 2}
                    required={f.key !== "skills"}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none"
                  />
                </div>
              ))}

              {error && <p className="text-center font-mono text-xs text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary/20 py-2.5 font-mono text-sm text-primary transition-all hover:bg-primary/30 disabled:opacity-50"
              >
                {loading ? "Отправка..." : "Отправить заявку"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
