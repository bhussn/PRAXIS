import { Link } from "react-router-dom"
import Logo from "@/components/Logo"
import CategoryBadge from "@/components/CategoryBadge"
import { mockArticles } from "@/data/mockData"

export default function Landing() {
  const previewArticles = mockArticles.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#08060D] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Logo size="md" />
        <nav className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-[#8B82A0] hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse-glow"
            style={{
              background:
                "radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)",
              animation: "pulse-glow 4s ease-in-out infinite 1s",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-blink" />
            <span className="text-xs font-mono text-violet-400 tracking-widest">
              YOUR DAILY INDUSTRY BRIEF
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            College teaches{" "}
            <span className="text-gradient">
              <i>knowledge</i>.
            </span>
            <br />
            Industry requires{" "}
            <span className="text-gradient">
              {" "}
              <i>praxis.</i>{" "}
            </span>
          </h1>

          <p className="text-lg text-[#8B82A0] max-w-2xl mx-auto mb-4 leading-relaxed">
            Praxis —{" "}
            <i>
              {" "}
              the process of putting knowledge, ideas, or theory into practical
              action{" "}
            </i>
            <br />
          </p>
          <p className="text-base text-[#4A4360] max-w-xl mx-auto mb-10">
            Bridge the gap between college and industry before you graduate.
            Yesterday's most important industry news, explained simply and
            connected to the world you're preparing to enter.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="
                group flex items-center gap-2 px-7 py-3.5 rounded-xl
                bg-violet-600 hover:bg-violet-500
                text-white font-semibold text-base
                transition-all duration-200 shadow-lg shadow-violet-900/30
                hover:shadow-violet-900/50 hover:-translate-y-0.5
              "
            >
              Get Started
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="group-hover:translate-x-0.5 transition-transform"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E1830] px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-[#4A4360] font-mono">
            © 2025 PRAXIS. Built for the generation entering the workforce.
          </p>
        </div>
      </footer>
    </div>
  )
}
