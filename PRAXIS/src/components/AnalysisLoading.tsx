import { mockProfile, mockCareers } from "@/data/mockData";

// CLAUDE: REPLACE THIS — shown while Claude API generates personalized analysis
export default function AnalysisLoading() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-[#0F0B18] p-8 text-center">
      {/* Pulsing glow orb */}
      <div className="flex justify-center mb-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-violet-600/20 animate-pulse-glow" />
          <div className="absolute inset-2 rounded-full bg-violet-600/30 animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
          <div className="absolute inset-4 rounded-full bg-violet-500/50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <p className="font-mono text-[10px] tracking-widest text-violet-400 mb-2">PRAXIS</p>
        <h3 className="text-xl font-bold text-white mb-1">Connecting the dots</h3>
        <p className="text-sm text-[#8B82A0]">
          We're looking at this story through the lens of your goals.
        </p>
      </div>

      {/* Checklist */}
      <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
        {[
          { label: "Your major", value: mockProfile.major },
          { label: "Your career interests", value: mockCareers.slice(0, 2).join(", ") },
          { label: "Your question about the future", value: "Personalizing..." },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mt-0.5 shrink-0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#4A4360] tracking-wider">{item.label.toUpperCase()}</p>
              <p className="text-xs text-[#8B82A0]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Animated building text */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="text-sm text-[#8B82A0]">Building your brief</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full bg-violet-400 animate-blink"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
