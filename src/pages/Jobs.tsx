import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "@/components/ui/icon"
import { GrainOverlay } from "@/components/grain-overlay"
import { CustomCursor } from "@/components/custom-cursor"

const JOBS_URL = "https://functions.poehali.dev/54661199-1509-4429-bed4-1c5f48c58ee0"

const LEVELS = [
  { value: "all", label: "Любой уровень" },
  { value: "junior", label: "Junior" },
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" },
]

const FORMATS = [
  { value: "all", label: "Любой формат" },
  { value: "remote", label: "Удалённо" },
  { value: "hybrid", label: "Гибрид" },
  { value: "office", label: "Офис" },
]

const FORMAT_LABELS: Record<string, string> = {
  remote: "Удалённо",
  hybrid: "Гибрид",
  office: "Офис",
}

const LEVEL_COLORS: Record<string, string> = {
  junior: "text-accent border-accent/30 bg-accent/10",
  middle: "text-primary border-primary/30 bg-primary/10",
  senior: "text-purple-400 border-purple-400/30 bg-purple-400/10",
}

type Vacancy = {
  id: number
  company_name: string
  title: string
  description: string
  required_skills: string[]
  matched_skills: string[]
  missing_skills: string[]
  match_score: number
  salary_from: number
  salary_to: number
  format: string
  level: string
  city: string
}

export default function Jobs() {
  const navigate = useNavigate()
  const studentId = localStorage.getItem("skillorbit_student_id")

  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [studentSkills, setStudentSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState("all")
  const [format, setFormat] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [level, format])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (studentId) params.set("student_id", studentId)
      if (level !== "all") params.set("level", level)
      if (format !== "all") params.set("format", format)
      const res = await fetch(`${JOBS_URL}?${params}`)
      const raw = await res.json()
      const data = typeof raw === "string" ? JSON.parse(raw) : raw
      setVacancies(data.vacancies || [])
      setStudentSkills(data.student_skills || [])
    } catch {
      setVacancies([])
    } finally {
      setLoading(false)
    }
  }

  const hasMatching = studentId && studentSkills.length > 0
  const topMatches = vacancies.filter((v) => v.match_score >= 60)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CustomCursor />
      <GrainOverlay />

      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-foreground/10 bg-background/80 px-6 py-4 backdrop-blur-md md:px-12">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/15">
            <span className="font-sans text-lg font-bold text-foreground">S</span>
          </div>
          <span className="font-sans text-lg font-semibold tracking-tight text-foreground">SkillOrbit</span>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/courses")} className="font-mono text-sm text-foreground/60 transition-colors hover:text-foreground">
            Курсы
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="font-mono text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            {studentId ? "Мой кабинет" : "Войти"}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-28 md:px-12">

        {/* Hero */}
        <div className="mb-10">
          <p className="mb-2 font-mono text-xs text-foreground/50">/ HR-матчинг</p>
          <h1 className="mb-3 font-sans text-4xl font-light tracking-tight text-foreground md:text-6xl">
            Вакансии
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-foreground/70 md:text-base">
            {hasMatching
              ? `Подобраны по вашим ${studentSkills.length} навыкам. Чем выше совпадение — тем больше шансов получить оффер.`
              : "Войдите в кабинет, чтобы видеть персональный процент совпадения с вакансиями."}
          </p>
        </div>

        {/* Топ-матчи если есть */}
        {hasMatching && topMatches.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="Sparkles" size={14} className="text-accent" />
              <span className="font-mono text-sm text-accent">Лучшие совпадения для вас</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {topMatches.slice(0, 3).map((v) => (
                <TopMatchCard key={v.id} vacancy={v} onExpand={() => setExpandedId(v.id === expandedId ? null : v.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Не авторизован — баннер */}
        {!studentId && (
          <div className="mb-8 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <Icon name="Zap" size={16} className="text-primary" />
              <span className="text-sm text-foreground/80">
                Войдите, чтобы видеть <span className="text-primary">% совпадения</span> по вашим навыкам
              </span>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="shrink-0 rounded-full bg-primary/20 px-4 py-1.5 font-mono text-xs text-primary transition-colors hover:bg-primary/30"
            >
              Войти
            </button>
          </div>
        )}

        {/* Фильтры */}
        <div className="mb-6 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs transition-all duration-200 ${
                level === l.value
                  ? "border border-foreground/40 bg-foreground/15 text-foreground"
                  : "border border-foreground/15 text-foreground/50 hover:border-foreground/30 hover:text-foreground/70"
              }`}
            >
              {l.label}
            </button>
          ))}
          <span className="mx-1 self-center text-foreground/20">|</span>
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs transition-all duration-200 ${
                format === f.value
                  ? "border border-primary/40 bg-primary/15 text-primary"
                  : "border border-foreground/15 text-foreground/50 hover:border-foreground/30 hover:text-foreground/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Список вакансий */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/80" />
          </div>
        ) : vacancies.length === 0 ? (
          <div className="py-24 text-center font-mono text-sm text-foreground/40">
            Вакансии не найдены. Попробуйте другой фильтр.
          </div>
        ) : (
          <div className="space-y-3">
            {vacancies.map((vacancy) => (
              <VacancyRow
                key={vacancy.id}
                vacancy={vacancy}
                showMatch={!!studentId}
                expanded={expandedId === vacancy.id}
                onToggle={() => setExpandedId(expandedId === vacancy.id ? null : vacancy.id)}
                onGoToCourses={() => navigate("/courses")}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TopMatchCard({ vacancy, onExpand }: { vacancy: Vacancy; onExpand: () => void }) {
  return (
    <button
      onClick={onExpand}
      className="group rounded-2xl border border-accent/20 bg-accent/5 p-4 text-left transition-all hover:border-accent/40 hover:bg-accent/8"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs text-accent">{vacancy.company_name}</span>
        <MatchBadge score={vacancy.match_score} />
      </div>
      <div className="mb-2 font-sans text-sm font-light text-foreground">{vacancy.title}</div>
      <div className="font-mono text-xs text-foreground/40">
        {formatSalary(vacancy.salary_from, vacancy.salary_to)}
      </div>
    </button>
  )
}

function VacancyRow({
  vacancy,
  showMatch,
  expanded,
  onToggle,
  onGoToCourses,
}: {
  vacancy: Vacancy
  showMatch: boolean
  expanded: boolean
  onToggle: () => void
  onGoToCourses: () => void
}) {
  return (
    <div className={`rounded-2xl border transition-all duration-300 ${expanded ? "border-foreground/20 bg-foreground/6" : "border-foreground/10 bg-foreground/3 hover:border-foreground/20"}`}>
      <button className="flex w-full items-center gap-4 px-5 py-4 text-left" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-primary/80">{vacancy.company_name}</span>
            <span className={`rounded-full border px-2 py-0.5 font-mono text-xs ${LEVEL_COLORS[vacancy.level] || "text-foreground/50 border-foreground/20"}`}>
              {vacancy.level}
            </span>
            <span className="font-mono text-xs text-foreground/40">{FORMAT_LABELS[vacancy.format] || vacancy.format}</span>
          </div>
          <div className="font-sans text-base font-light text-foreground">{vacancy.title}</div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden text-right md:block">
            <div className="font-mono text-sm text-foreground/80">{formatSalary(vacancy.salary_from, vacancy.salary_to)}</div>
            <div className="font-mono text-xs text-foreground/40">{vacancy.city}</div>
          </div>
          {showMatch && (
            <MatchBadge score={vacancy.match_score} />
          )}
          <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-foreground/40" />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-foreground/10 px-5 py-5">
          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <div>
              <p className="mb-4 text-sm leading-relaxed text-foreground/70">{vacancy.description}</p>
              <div className="mb-1 font-mono text-xs text-foreground/40">Требуемые навыки</div>
              <div className="flex flex-wrap gap-1.5">
                {vacancy.required_skills.map((skill) => {
                  const isMatched = vacancy.matched_skills?.includes(skill)
                  return (
                    <span
                      key={skill}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs transition-all ${
                        isMatched
                          ? "bg-accent/15 text-accent"
                          : "bg-foreground/8 text-foreground/50"
                      }`}
                    >
                      {isMatched && <Icon name="Check" size={9} />}
                      {skill}
                    </span>
                  )
                })}
              </div>
            </div>

            {showMatch && (
              <div className="space-y-4">
                <MatchDetails vacancy={vacancy} onGoToCourses={onGoToCourses} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-accent/20 text-accent border-accent/30" :
    score >= 50 ? "bg-primary/20 text-primary border-primary/30" :
    score > 0   ? "bg-foreground/10 text-foreground/60 border-foreground/20" :
                  "bg-foreground/5 text-foreground/30 border-foreground/10"

  return (
    <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs ${color}`}>
      <Icon name="Target" size={10} />
      {score}%
    </div>
  )
}

function MatchDetails({ vacancy, onGoToCourses }: { vacancy: Vacancy; onGoToCourses: () => void }) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
      <div className="mb-3 text-center">
        <div className={`font-sans text-4xl font-light ${vacancy.match_score >= 75 ? "text-accent" : vacancy.match_score >= 50 ? "text-primary" : "text-foreground/50"}`}>
          {vacancy.match_score}%
        </div>
        <div className="font-mono text-xs text-foreground/40">совпадение навыков</div>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${vacancy.match_score >= 75 ? "bg-accent" : "bg-primary"}`}
          style={{ width: `${vacancy.match_score}%` }}
        />
      </div>

      {(vacancy.matched_skills || []).length > 0 && (
        <div className="mb-3">
          <div className="mb-1.5 font-mono text-xs text-foreground/40">У вас есть</div>
          <div className="flex flex-wrap gap-1">
            {vacancy.matched_skills.map((s) => (
              <span key={s} className="rounded bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent">{s}</span>
            ))}
          </div>
        </div>
      )}

      {(vacancy.missing_skills || []).length > 0 && (
        <div>
          <div className="mb-1.5 font-mono text-xs text-foreground/40">Не хватает</div>
          <div className="flex flex-wrap gap-1">
            {vacancy.missing_skills.map((s) => (
              <span key={s} className="rounded bg-foreground/8 px-2 py-0.5 font-mono text-xs text-foreground/50">{s}</span>
            ))}
          </div>
          {vacancy.missing_skills.length > 0 && (
            <button
              onClick={onGoToCourses}
              className="mt-3 w-full rounded-lg bg-primary/15 py-1.5 font-mono text-xs text-primary transition-colors hover:bg-primary/25"
            >
              Найти курс по навыкам →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function formatSalary(from: number, to: number): string {
  if (!from && !to) return "По договорённости"
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}к` : String(n)
  if (from && to) return `${fmt(from)} — ${fmt(to)} ₽`
  if (from) return `от ${fmt(from)} ₽`
  return `до ${fmt(to)} ₽`
}
