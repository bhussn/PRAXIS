import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 flex gap-3 flex-wrap">
      {checks.map((c) => (
        <span
          key={c.label}
          className={`flex items-center gap-1 text-[10px] font-mono ${c.ok ? "text-emerald-400" : "text-[#4A4360]"}`}
        >
          <span>{c.ok ? "✓" : "○"}</span> {c.label}
        </span>
      ))}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AUTH: connect to Supabase Auth signUp
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/onboarding");
  };

  // AUTH: REPLACE THIS — connect to Supabase Auth signInWithOAuth Google
  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/onboarding");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#08060D] flex flex-col items-center justify-center px-6 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(109,40,217,0.12) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1">Build your brief.</h1>
            <p className="text-sm text-[#8B82A0]">Tell PRAXIS what you're studying and where you're headed.</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#2D2548] bg-[#151021] hover:bg-[#1E1830] text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.45 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#1E1830]" />
            <span className="text-xs text-[#4A4360] font-mono">OR</span>
            <div className="flex-1 h-px bg-[#1E1830]" />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-[#8B82A0] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white placeholder-[#4A4360] text-sm focus:border-violet-500/50 transition-all outline-none"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-[#8B82A0] mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white placeholder-[#4A4360] text-sm focus:border-violet-500/50 transition-all outline-none"
                />
                <PasswordStrength password={password} />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-xs font-medium text-[#8B82A0] mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-xl bg-[#120E1C] border text-white placeholder-[#4A4360] text-sm focus:border-violet-500/50 transition-all outline-none ${
                    confirm && confirm !== password ? "border-red-500/40" : "border-[#1E1830]"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin-slow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>
                  Create account
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#4A4360] mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
