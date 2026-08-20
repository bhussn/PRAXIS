import { categoryColors } from "@/data/mockData";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const colorClass = categoryColors[category] || "text-slate-400 bg-slate-400/10 border-slate-400/20";

  return (
    <span
      className={`
        inline-flex items-center font-mono font-medium border rounded-md
        ${size === "sm" ? "text-[10px] px-2 py-0.5 tracking-widest" : "text-xs px-2.5 py-1 tracking-wider"}
        ${colorClass}
      `}
    >
      {category.toUpperCase()}
    </span>
  );
}
