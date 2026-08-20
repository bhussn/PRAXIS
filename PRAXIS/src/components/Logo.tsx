interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

export default function Logo({ size = "md", showWordmark = true }: LogoProps) {
  const sizes = {
    sm: { symbol: 24, text: "text-lg" },
    md: { symbol: 32, text: "text-xl" },
    lg: { symbol: 48, text: "text-3xl" },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* Symbol: P as forward arrow */}
      <svg
        width={s.symbol}
        height={s.symbol}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <filter id="logo-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Vertical stem of P */}
        <rect
          x="5"
          y="4"
          width="4"
          height="24"
          rx="2"
          fill="url(#logo-grad)"
          filter="url(#logo-glow)"
        />
        {/* Bowl of P / forward arrow */}
        <path
          d="M9 4 L24 4 L28 10 L24 16 L9 16"
          fill="url(#logo-grad)"
          filter="url(#logo-glow)"
        />
        {/* Arrow cutout - inner bowl */}
        <path
          d="M11 7 L21 7 L24 10 L21 13 L11 13"
          fill="#08060D"
        />
        {/* Forward arrow tip */}
        <path
          d="M22 18 L28 10 L28 16 L28 10 L22 18 Z"
          fill="url(#logo-grad)"
          opacity="0.6"
        />
      </svg>

      {showWordmark && (
        <span
          className={`font-bold tracking-tight ${s.text} text-white`}
          style={{ letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif" }}
        >
          PRAXIS
        </span>
      )}
    </div>
  );
}
