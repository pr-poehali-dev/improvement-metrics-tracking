import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Icon from "@/components/ui/icon"
import { GrainOverlay } from "@/components/grain-overlay"
import { CustomCursor } from "@/components/custom-cursor"
import { CourseApplicationModal } from "@/components/course-application-modal"

const COURSES_URL = "https://functions.poehali.dev/bf12abb0-2991-4dab-a823-f8a79b267a90"

const CATEGORIES = [
  { value: "all", label: "Все" },
  { value: "development", label: "Разработка" },
  { value: "design", label: "Дизайн" },
  { value: "data", label: "Data Science" },
  { value: "management", label: "Менеджмент" },
]

const LEVELS = [
  { value: "all", label: "Любой уровень" },
  { value: "beginner", label: "Начинающий" },
  { value: "intermediate", label: "Средний" },
  { value: "advanced", label: "Продвинутый" },
]

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Начинающий",
  intermediate: "Средний",
  advanced: "Продвинутый",
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  employer: "Работодатель",
  university: "Учебное заведение",
}

type Course = {
  id: number
  title: string
  provider_name: string
  provider_type: string
  description: string
  opportunities: string
  skills: string[]
  duration_weeks: number
  category: string
  level: string
  status: string
}

export default function Courses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [level, setLevel] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [category, level])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== "all") params.set("category", category)
      if (level !== "all") params.set("level", level)
      const res = await fetch(`${COURSES_URL}?${params}`)
      const data = await res.json()
      const parsed = typeof data === "string" ? JSON.parse(data) : data
      setCourses(parsed.courses || [])
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const studentId = localStorage.getItem("skillorbit_student_id")

  const handleEnroll = async (courseId: number) => {
    if (!studentId) {
      navigate("/dashboard")
      return
    }
    try {
      const res = await fetch(`${COURSES_URL}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, student_id: Number(studentId) }),
      })
      const data = await res.json()
      const parsed = typeof data === "string" ? JSON.parse(data) : data
      if (res.ok || res.status === 409) {
        navigate("/dashboard")
      } else {
        alert(parsed.error || "Ошибка записи")
      }
    } catch {
      alert("Ошибка сети")
    }
  }

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
            onClick={() => navigate("/dashboard")}
            className="font-mono text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            {studentId ? "Мой кабинет" : "Войти"}
          </button>
          <button
            onClick={() => setApplyOpen(true)}
            className="rounded-full border border-foreground/30 px-4 py-1.5 font-mono text-xs text-foreground/80 transition-all hover:border-foreground/60 hover:text-foreground"
          >
            Подать заявку на курс
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-28 md:px-12">
        <div className="mb-10">
          <p className="mb-2 font-mono text-xs text-foreground/50">/ Каталог</p>
          <h1 className="mb-4 font-sans text-4xl font-light tracking-tight text-foreground md:text-6xl">
            Курсы
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-foreground/70 md:text-base">
            Программы от работодателей и учебных заведений с реальными проектами и гарантиями трудоустройства.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full px-4 py-1.5 font-mono text-xs transition-all duration-200 ${
                  category === c.value
                    ? "bg-foreground/15 text-foreground border border-foreground/40"
                    : "border border-foreground/15 text-foreground/50 hover:border-foreground/30 hover:text-foreground/70"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`rounded-full px-4 py-1.5 font-mono text-xs transition-all duration-200 ${
                  level === l.value
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "border border-foreground/15 text-foreground/50 hover:border-foreground/30 hover:text-foreground/70"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/80" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-24 text-center font-mono text-sm text-foreground/40">
            Курсы не найдены. Попробуйте другой фильтр.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                expanded={expandedId === course.id}
                onToggle={() => setExpandedId(expandedId === course.id ? null : course.id)}
                onEnroll={() => handleEnroll(course.id)}
                isLoggedIn={!!studentId}
              />
            ))}
          </div>
        )}
      </main>

      <CourseApplicationModal open={applyOpen} onClose={() => setApplyOpen(false)} />
    </div>
  )
}

function CourseCard({
  course,
  expanded,
  onToggle,
  onEnroll,
  isLoggedIn,
}: {
  course: Course
  expanded: boolean
  onToggle: () => void
  onEnroll: () => void
  isLoggedIn: boolean
}) {
  return (
    <div
      className={`group flex flex-col rounded-2xl border border-foreground/10 bg-foreground/5 p-5 transition-all duration-300 hover:border-foreground/20 hover:bg-foreground/8 ${
        expanded ? "border-foreground/20" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <span className="mb-1 inline-block rounded-full bg-foreground/10 px-2.5 py-0.5 font-mono text-xs text-foreground/60">
            {PROVIDER_TYPE_LABELS[course.provider_type] || course.provider_type}
          </span>
          <div className="font-mono text-xs text-primary/80">{course.provider_name}</div>
        </div>
        <span className="shrink-0 rounded-full border border-foreground/15 px-2 py-0.5 font-mono text-xs text-foreground/50">
          {LEVEL_LABELS[course.level] || course.level}
        </span>
      </div>

      <h3 className="mb-2 font-sans text-lg font-light leading-snug text-foreground">{course.title}</h3>

      <p className={`mb-3 text-sm leading-relaxed text-foreground/70 ${expanded ? "" : "line-clamp-2"}`}>
        {course.description}
      </p>

      {expanded && (
        <div className="mb-4 space-y-3">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Icon name="Star" size={12} className="text-accent" />
              <span className="font-mono text-xs text-accent">Возможности после курса</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{course.opportunities}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(course.skills || []).slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-md bg-foreground/8 px-2 py-0.5 font-mono text-xs text-foreground/60">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1 font-mono text-xs text-foreground/40">
          <Icon name="Clock" size={11} />
          <span>{course.duration_weeks} нед.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="rounded-full border border-foreground/20 px-3 py-1 font-mono text-xs text-foreground/60 transition-all hover:border-foreground/40 hover:text-foreground"
          >
            {expanded ? "Свернуть" : "Подробнее"}
          </button>
          <button
            onClick={onEnroll}
            className="rounded-full bg-primary/20 px-3 py-1 font-mono text-xs text-primary transition-all hover:bg-primary/30"
          >
            {isLoggedIn ? "Записаться" : "Войти"}
          </button>
        </div>
      </div>
    </div>
  )
}
