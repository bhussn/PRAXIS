import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import Logo from "@/components/Logo"
import { supabase } from "@/lib/supabase"

const TOTAL_STEPS = 4

type Option = {
  id: string
  name: string
}

function ProgressIndicator({
  current,
  total,
}: {
  current: number
  total: number
}) {
  return (
    <div className="flex items-center gap-3 mb-10">
      <span className="font-mono text-xs text-violet-400 tracking-widest">
        {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>

      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-0.5 rounded-full transition-all duration-500 ${
              i < current
                ? "bg-violet-500 w-6"
                : i === current - 1
                  ? "bg-violet-400 w-6"
                  : "bg-[#1E1830] w-3"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function Step1({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-2">
        What should we call you?
      </h1>

      <p className="text-sm text-[#8B82A0] mb-8 leading-relaxed">
        Your name helps PRAXIS make your daily brief feel like yours.
      </p>

      <label
        htmlFor="name"
        className="block text-xs font-medium text-[#8B82A0] mb-3 tracking-wider font-mono"
      >
        FIRST NAME
      </label>

      <input
        id="name"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your name"
        maxLength={50}
        className="w-full px-4 py-3.5 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white placeholder-[#4A4360] text-sm focus:border-violet-500/50 transition-all outline-none"
      />
    </div>
  )
}

function Step2({
  selected,
  onSelect,
  majors,
}: {
  selected: string
  onSelect: (v: string) => void
  majors: Option[]
}) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-2">
        What are you studying?
      </h1>

      <p className="text-sm text-[#8B82A0] mb-8 leading-relaxed">
        Your major helps PRAXIS understand the world you're learning about.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {majors.map((major) => (
          <button
            key={major.id}
            onClick={() => onSelect(major.name)}
            className={`
              px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200
              ${
                selected === major.name
                  ? "border-violet-500/60 bg-violet-600/15 text-violet-300"
                  : "border-[#1E1830] bg-[#120E1C] text-[#8B82A0] hover:border-[#2D2548] hover:text-white"
              }
            `}
          >
            {selected === major.name && (
              <span className="mr-2 text-violet-400">✓</span>
            )}

            {major.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function Step3({
  selected,
  onToggle,
  interests,
}: {
  selected: string[]
  onToggle: (v: string) => void
  interests: Option[]
}) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-2">
        What do you want to know?
      </h1>

      <p className="text-sm text-[#8B82A0] mb-8 leading-relaxed">
        Choose up to 3 topics you're curious about.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {interests.map((interest) => {
          const active = selected.includes(interest.name)

          return (
            <button
              key={interest.id}
              onClick={() => onToggle(interest.name)}
              aria-pressed={active}
              className={`
                px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200
                ${
                  active
                    ? "border-violet-500/60 bg-violet-600/15 text-violet-300"
                    : "border-[#1E1830] bg-[#120E1C] text-[#8B82A0] hover:border-[#2D2548] hover:text-white"
                }
              `}
            >
              {active && (
                <span className="mr-2 text-violet-400">✓</span>
              )}

              {interest.name}
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <p className="mt-4 text-xs text-[#4A4360] font-mono">
          {selected.length} / 3 selected
        </p>
      )}
    </div>
  )
}

function Step4({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const MAX = 500

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-2">
        What's on your mind?
      </h1>

      <p className="text-sm text-[#8B82A0] mb-8 leading-relaxed">
        Tell PRAXIS what you're thinking about as you go from college to your
        career.
      </p>

      <label
        htmlFor="concerns"
        className="block text-xs font-medium text-[#8B82A0] mb-3 tracking-wider font-mono"
      >
        What are your college-to-industry concerns? What do you feel you're
        missing, want to improve, or want to better understand before you
        graduate and enter the workforce?
      </label>

      <textarea
        id="concerns"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        rows={6}
        placeholder="I'm worried about how AI will change entry-level software engineering jobs before I graduate."
        className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white placeholder-[#4A4360] text-sm leading-relaxed focus:border-violet-500/50 transition-all outline-none resize-none"
      />

      <div className="flex justify-end mt-1">
        <span className="text-[10px] font-mono text-[#4A4360]">
          {value.length} / {MAX}
        </span>
      </div>

      <p className="mt-4 text-xs text-[#4A4360] leading-relaxed">
        This helps PRAXIS personalize every article explanation specifically to
        your career situation.
      </p>
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [major, setMajor] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [concerns, setConcerns] = useState("")

  const [majorOptions, setMajorOptions] = useState<Option[]>([])
  const [interestOptions, setInterestOptions] = useState<Option[]>([])

  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load majors and interests from Supabase
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true)
      setError("")

      try {
        const [majorsResult, interestsResult] = await Promise.all([
          supabase
            .from("majors")
            .select("id, name")
            .order("name"),

          supabase
            .from("interests")
            .select("id, name")
            .order("name"),
        ])

        if (majorsResult.error) {
          throw majorsResult.error
        }

        if (interestsResult.error) {
          throw interestsResult.error
        }

        setMajorOptions(majorsResult.data ?? [])
        setInterestOptions(interestsResult.data ?? [])
      } catch (error) {
        console.error("Error loading onboarding options:", error)
        setError("Could not load majors and interests.")
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [])

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      // Deselect
      if (prev.includes(interest)) {
        return prev.filter((x) => x !== interest)
      }

      // Maximum of 3
      if (prev.length >= 3) {
        return prev
      }

      return [...prev, interest]
    })
  }

  const canAdvance = () => {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return !!major
    if (step === 3) return interests.length > 0
    if (step === 4) return concerns.trim().length > 0
    return false
  }

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
      return
    }

    setLoading(true)
    setError("")

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("You must be logged in to complete onboarding.")
      }

      // Find selected major in database
      const { data: majorData, error: majorError } = await supabase
        .from("majors")
        .select("id")
        .eq("name", major)
        .single()

      if (majorError || !majorData) {
        throw new Error("Could not find your selected major.")
      }

      // Save profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: name.trim(),
          major_id: majorData.id,
          concerns: concerns.trim(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        throw profileError
      }

      // Find selected interests in database
      const { data: interestData, error: interestError } = await supabase
        .from("interests")
        .select("id, name")
        .in("name", interests)

      if (interestError) {
        throw interestError
      }

      // Remove existing interests
      const { error: deleteError } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", user.id)

      if (deleteError) {
        throw deleteError
      }

      // Add selected interests
      if (interestData && interestData.length > 0) {
        const rows = interestData.map((interest) => ({
          user_id: user.id,
          interest_id: interest.id,
        }))

        const { error: insertError } = await supabase
          .from("user_interests")
          .insert(rows)

        if (insertError) {
          throw insertError
        }
      }

      navigate("/brief")
    } catch (error) {
      console.error("Onboarding error:", error)

      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Something went wrong saving your profile.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08060D] flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(109,40,217,0.1) 0%, transparent 70%)",
          }}
        />
      </div>

      <header className="relative flex items-center justify-between px-6 py-5 max-w-2xl mx-auto w-full">
        <Logo size="sm" />

        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-xs text-[#4A4360] hover:text-white transition-colors font-medium"
          >
            ← Back
          </button>
        )}
      </header>

      <main className="relative flex-1 flex flex-col justify-center px-6 py-8 max-w-2xl mx-auto w-full">
        <ProgressIndicator current={step} total={TOTAL_STEPS} />

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

          {step === 1 && (
            <Step1
              value={name}
              onChange={setName}
            />
          )}

          {step === 2 && (
            loadingOptions ? (
              <div className="text-sm text-[#8B82A0]">
                Loading majors...
              </div>
            ) : (
              <Step2
                selected={major}
                onSelect={setMajor}
                majors={majorOptions}
              />
            )
          )}

          {step === 3 && (
            loadingOptions ? (
              <div className="text-sm text-[#8B82A0]">
                Loading interests...
              </div>
            ) : (
              <Step3
                selected={interests}
                onToggle={toggleInterest}
                interests={interestOptions}
              />
            )
          )}

          {step === 4 && (
            <Step4
              value={concerns}
              onChange={setConcerns}
            />
          )}

        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={
                      !canAdvance() ||
                      loading ||
                      ((step === 2 || step === 3) && loadingOptions)
                    }
            className="
              flex items-center gap-2 px-7 py-3.5 rounded-xl
              bg-violet-600 hover:bg-violet-500
              disabled:opacity-40 disabled:cursor-not-allowed
              text-white font-semibold text-sm transition-all duration-200
            "
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin-slow"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>

                Building your brief...
              </>
            ) : step < TOTAL_STEPS ? (
              <>
                Continue

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              <>
                Build My Brief

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}