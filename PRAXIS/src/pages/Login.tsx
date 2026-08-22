import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Invalid email or password.");
      return;
    }

    navigate("/brief");
  };

  return (
    <div className="min-h-screen bg-[#08060D] flex flex-col items-center justify-center px-6 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(109,40,217,0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back.
            </h1>

            <p className="text-sm text-[#8B82A0]">
              Your next briefing is waiting.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-[#8B82A0] mb-1.5"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white placeholder-[#4A4360] text-sm focus:border-violet-500/50 focus:bg-[#151021] transition-all outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[#8B82A0] mb-1.5"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white placeholder-[#4A4360] text-sm focus:border-violet-500/50 focus:bg-[#151021] transition-all outline-none"
                />
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                bg-violet-600 hover:bg-violet-500 disabled:opacity-60
                text-white font-semibold text-sm transition-all duration-200
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
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

                  Signing in...
                </span>
              ) : (
                <>
                  Log in
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
          </form>

          <p className="text-center text-xs text-[#4A4360] mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}