import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "@/components/ui/icon"
import { GrainOverlay } from "@/components/grain-overlay"
import { CustomCursor } from "@/components/custom-cursor"

const STUDENT_URL = "https://functions.poehali.dev/15f05af8-3d89-4a2d-a0c1-678257ecdbff"
const COURSES_URL = "https://functions.poehali.dev/bf12abb0-2991-4dab-a823-f8a79b267a90"

type Student = { id: number; name: string; email: string; skills: string[]; created_at: string }
type Enrollment = {
  enrollment_id: number
  course_id: number
  title: string
  provider_name: string
  provider_type: string
  category: string
  level: string
  duration_weeks: number
  skills: string[]
  status: string
  progress: number
  enrolled_at: string
}

const SKILL_MAP_TRACKS = [
  { name: "Frontend", skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript"], color: "text-primary" },
  { name: "Backend", skills: ["Python", "SQL", "API", "Docker", "PostgreSQL"], color: "text-accent" },
  { name: "Дизайн", skills: ["Figma", "UX Research", "Прототипирование", "Design Systems"], color: "text-purple-400" },
  { name: "Data", skills: ["Pandas", "scikit-learn", "Matplotlib", "SQL"], color: "text-yellow-400" },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [step, setStep] = useState<"auth" | "dashboard">("auth")
  const [authForm, setAuthForm] = useState({ name: "", email: "" })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [activeTab, setActiveTab] = useState<"courses" | "skillmap">("courses")

  useEffect(() => {
    const saved = localStorage.getItem("skillorbit_student_id")
    const savedName = localStorage.getItem("skillorbit_student_name")
    if (saved && savedName) {
      loadStudent(saved)
    }
  }, [])

  const loadStudent = async (id: string) => {
    setLoadingData(true)
    try {
      const res = await fetch(`${STUDENT_URL}?student_id=${id}`)
      const data = await res.json()
      const parsed = typeof data === "string" ? JSON.parse(data) : data
      if (parsed.student) {
        setStudent(parsed.student)
        setEnrollments(parsed.enrollments || [])
        setStep("dashboard")
      }
    } catch {
      localStorage.removeItem("skillorbit_student_id")
    } finally {
      setLoadingData(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")
    try {
      const res = await fetch(STUDENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email.trim().toLowerCase(), name: authForm.name.trim() }),
      })
      const data = await res.json()
      const parsed = typeof data === "string" ? JSON.parse(data) : data
      if (res.ok && parsed.student) {
        localStorage.setItem("skillorbit_student_id", String(parsed.student.id))
        localStorage.setItem("skillorbit_student_name", parsed.student.name)
        setStudent(parsed.student)
        const res2 = await fetch(`${STUDENT_URL}?student_id=${parsed.student.id}`)
        const data2 = await res2.json()
        const parsed2 = typeof data2 === "string" ? JSON.parse(data2) : data2
        setEnrollments(parsed2.enrollments || [])
        setStep("dashboard")
      } else {
        setAuthError(parsed.error || "Ошибка входа")
      }
    } catch {
      setAuthError("Ошибка сети")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("skillorbit_student_id")
    localStorage.removeItem("skillorbit_student_name")
    setStudent(null)
    setEnrollments([])
    setStep("auth")
  }

  const updateProgress = async (enrollmentId: number, progress: number) => {
    try {
      await fetch(`${STUDENT_URL}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: enrollmentId, progress }),
      })
      setEnrollments((prev) =>
        prev.map((e) =>
          e.enrollment_id === enrollmentId
            ? { ...e, progress, status: progress >= 100 ? "completed" : "active" }
            : e
        )
      )
    } catch {
      // silent
    }
  }

  const allLearnedSkills = enrollments.flatMap((e) => e.skills || [])
  const uniqueSkills = [...new Set([...(student?.skills || []), ...allLearnedSkills])]

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
          <button
            onClick={() => navigate("/courses")}
            className="font-mono text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            Каталог курсов
          </button>
          {student && (
            <button
              onClick={handleLogout}
              className="font-mono text-xs text-foreground/40 transition-colors hover:text-foreground/60"
            >
              Выйти
            </button>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28 md:px-12">
        {loadingData ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/80" />
          </div>
        ) : step === "auth" ? (
          <AuthForm
            form={authForm}
            setForm={setAuthForm}
            onSubmit={handleAuth}
            loading={authLoading}
            error={authError}
          />
        ) : (
          <StudentDashboard
            student={student!}
            enrollments={enrollments}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            uniqueSkills={uniqueSkills}
            onUpdateProgress={updateProgress}
            onGoToCourses={() => navigate("/courses")}
          />
        )}
      </main>
    </div>
  )
}

function AuthForm({
  form,
  setForm,
  onSubmit,
  loading,
  error,
}: {
  form: { name: string; email: string }
  setForm: (f: { name: string; email: string }) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  error: string
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-10">
        <p className="mb-2 font-mono text-xs text-foreground/50">/ Личный кабинет</p>
        <h1 className="mb-2 font-sans text-4xl font-light text-foreground">Войти</h1>
        <p className="text-sm text-foreground/60">
          Введите email — если аккаунт есть, войдёте. Если нет — создадим новый.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block font-mono text-xs text-foreground/50">Имя</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Алексей Петров"
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-xs text-foreground/50">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none"
          />
        </div>
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary/20 py-3 font-mono text-sm text-primary transition-all hover:bg-primary/30 disabled:opacity-50"
        >
          {loading ? "Загрузка..." : "Войти / Зарегистрироваться"}
        </button>
      </form>
    </div>
  )
}

function StudentDashboard({
  student,
  enrollments,
  activeTab,
  setActiveTab,
  uniqueSkills,
  onUpdateProgress,
  onGoToCourses,
}: {
  student: Student
  enrollments: Enrollment[]
  activeTab: "courses" | "skillmap"
  setActiveTab: (t: "courses" | "skillmap") => void
  uniqueSkills: string[]
  onUpdateProgress: (id: number, p: number) => void
  onGoToCourses: () => void
}) {
  const completed = enrollments.filter((e) => e.status === "completed").length
  const active = enrollments.filter((e) => e.status === "active").length

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="mb-1 font-mono text-xs text-foreground/50">/ Личный кабинет</p>
          <h1 className="mb-1 font-sans text-3xl font-light text-foreground md:text-4xl">
            {student.name}
          </h1>
          <p className="font-mono text-sm text-foreground/40">{student.email}</p>
        </div>
        <div className="hidden gap-6 md:flex">
          <Stat value={String(active)} label="Активных курсов" />
          <Stat value={String(completed)} label="Завершено" />
          <Stat value={String(uniqueSkills.length)} label="Навыков" />
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-foreground/10 bg-foreground/5 p-1 w-fit">
        {(["courses", "skillmap"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2 font-mono text-sm transition-all duration-200 ${
              activeTab === tab ? "bg-foreground/15 text-foreground" : "text-foreground/50 hover:text-foreground/70"
            }`}
          >
            {tab === "courses" ? "Мои курсы" : "Skill Map"}
          </button>
        ))}
      </div>

      {activeTab === "courses" && (
        <div>
          {enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-foreground/15 p-12 text-center">
              <Icon name="BookOpen" size={32} className="mx-auto mb-3 text-foreground/20" />
              <p className="mb-4 font-sans text-lg font-light text-foreground/60">Вы ещё не записались ни на один курс</p>
              <button
                onClick={onGoToCourses}
                className="rounded-full bg-primary/20 px-6 py-2 font-mono text-sm text-primary transition-colors hover:bg-primary/30"
              >
                Перейти к каталогу
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.map((e) => (
                <EnrollmentCard key={e.enrollment_id} enrollment={e} onUpdateProgress={onUpdateProgress} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "skillmap" && (
        <SkillMap uniqueSkills={uniqueSkills} onGoToCourses={onGoToCourses} />
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-right">
      <div className="font-sans text-2xl font-light text-foreground">{value}</div>
      <div className="font-mono text-xs text-foreground/40">{label}</div>
    </div>
  )
}

function EnrollmentCard({
  enrollment,
  onUpdateProgress,
}: {
  enrollment: Enrollment
  onUpdateProgress: (id: number, p: number) => void
}) {
  const steps = [0, 25, 50, 75, 100]

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="font-mono text-xs text-primary/70">{enrollment.provider_name}</div>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-xs ${
            enrollment.status === "completed"
              ? "bg-accent/15 text-accent"
              : "bg-foreground/10 text-foreground/50"
          }`}
        >
          {enrollment.status === "completed" ? "Завершён" : "В процессе"}
        </span>
      </div>
      <h3 className="mb-3 font-sans text-base font-light text-foreground">{enrollment.title}</h3>

      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs text-foreground/40">Прогресс</span>
        <span className="font-mono text-xs text-foreground/60">{enrollment.progress}%</span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${enrollment.progress}%` }}
        />
      </div>

      <div className="flex gap-1.5">
        {steps.map((p) => (
          <button
            key={p}
            onClick={() => onUpdateProgress(enrollment.enrollment_id, p)}
            className={`flex-1 rounded-md py-1 font-mono text-xs transition-all ${
              enrollment.progress === p
                ? "bg-primary/25 text-primary"
                : "bg-foreground/8 text-foreground/40 hover:bg-foreground/15"
            }`}
          >
            {p}%
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {(enrollment.skills || []).slice(0, 3).map((s) => (
          <span key={s} className="rounded bg-foreground/8 px-2 py-0.5 font-mono text-xs text-foreground/50">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function SkillMap({ uniqueSkills, onGoToCourses }: { uniqueSkills: string[]; onGoToCourses: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-sans text-lg font-light text-foreground">Ваши навыки</h3>
            <p className="font-mono text-xs text-foreground/40">{uniqueSkills.length} освоено</p>
          </div>
        </div>
        {uniqueSkills.length === 0 ? (
          <p className="text-sm text-foreground/40">Запишитесь на курс, чтобы начать собирать навыки</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {uniqueSkills.map((skill) => (
              <span key={skill} className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-mono text-xs text-primary">
                <Icon name="Check" size={10} />
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SKILL_MAP_TRACKS.map((track) => {
          const owned = track.skills.filter((s) => uniqueSkills.includes(s))
          const pct = Math.round((owned.length / track.skills.length) * 100)
          return (
            <div key={track.name} className="rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className={`font-mono text-sm font-medium ${track.color}`}>{track.name}</span>
                <span className="font-mono text-xs text-foreground/40">{pct}%</span>
              </div>
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full rounded-full bg-current transition-all duration-700" style={{ width: `${pct}%`, color: "inherit" }} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {track.skills.map((skill) => (
                  <span
                    key={skill}
                    className={`rounded-md px-2 py-0.5 font-mono text-xs transition-all ${
                      owned.includes(skill)
                        ? "bg-foreground/15 text-foreground"
                        : "bg-foreground/5 text-foreground/30"
                    }`}
                  >
                    {owned.includes(skill) && <span className="mr-1">✓</span>}
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center">
        <p className="mb-3 text-sm text-foreground/50">Хотите прокачать новые навыки?</p>
        <button
          onClick={onGoToCourses}
          className="rounded-full bg-primary/20 px-6 py-2 font-mono text-sm text-primary transition-colors hover:bg-primary/30"
        >
          Смотреть курсы
        </button>
      </div>
    </div>
  )
}
