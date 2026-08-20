import { useState } from "react";

interface SaveButtonProps {
  articleId: string;
  initialSaved?: boolean;
  onToggle?: (id: string, saved: boolean) => void;
}

export default function SaveButton({ articleId, initialSaved = false, onToggle }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [animating, setAnimating] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAnimating(true);
    const next = !saved;
    setSaved(next);
    onToggle?.(articleId, next);
    setTimeout(() => setAnimating(false), 300);
    // DATABASE: REPLACE THIS — eventually calls saved_articles insert/delete via Supabase
  };

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Unsave article" : "Save article"}
      aria-pressed={saved}
      className={`
        group relative flex items-center justify-center w-8 h-8 rounded-lg
        border transition-all duration-200
        ${saved
          ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
          : "border-[#1E1830] bg-transparent text-[#4A4360] hover:border-[#2D2548] hover:text-[#8B82A0]"
        }
        ${animating ? "scale-90" : "scale-100"}
      `}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-200"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
