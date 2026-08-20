import { Link } from "react-router-dom";
import CategoryBadge from "./CategoryBadge";
import SaveButton from "./SaveButton";
import { mockSavedArticles } from "@/data/mockData";

interface Article {
  id: string;
  title: string;
  category: string;
  source: string;
  publishedAt: string;
  readingTime: string;
  imageUrl: string;
  description: string;
  number: string;
}

interface ArticleCardProps {
  article: Article;
  variant?: "brief" | "grid";
}

export default function ArticleCard({ article, variant = "grid" }: ArticleCardProps) {
  // DATABASE: REPLACE THIS — save state eventually comes from saved_articles query
  const isSaved = mockSavedArticles.includes(article.id);

  if (variant === "brief") {
    return (
      <Link
        to={`/article/${article.id}`}
        className="
          group relative block rounded-2xl overflow-hidden
          border border-[#1E1830] bg-[#120E1C]
          hover:border-[#2D2548] hover:bg-[#181224]
          transition-all duration-300 glow-accent-hover
        "
      >
        <div className="flex flex-col h-full">
          {/* Image */}
          <div className="relative h-44 overflow-hidden bg-[#0F0B18]">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120E1C] via-transparent to-transparent" />
            {/* Number badge */}
            <div className="absolute top-3 left-3">
              <span className="font-mono text-xs font-medium text-[#8B82A0]">{article.number}</span>
            </div>
            {/* Save button */}
            <div className="absolute top-3 right-3">
              <SaveButton articleId={article.id} initialSaved={isSaved} />
            </div>
          </div>

          <div className="flex-1 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CategoryBadge category={article.category} />
              <span className="text-[10px] font-mono text-[#4A4360]">{article.readingTime}</span>
            </div>

            <h3 className="font-bold text-[#F0ECFF] leading-snug mb-2 text-base group-hover:text-white transition-colors line-clamp-2">
              {article.title}
            </h3>

            <p className="text-xs text-[#8B82A0] leading-relaxed line-clamp-2 mb-4">
              {article.description}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] text-[#4A4360] font-mono">{article.source} · {article.publishedAt}</span>
              <span className="text-xs text-violet-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                Read Brief
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link
      to={`/article/${article.id}`}
      className="
        group relative block rounded-2xl overflow-hidden
        border border-[#1E1830] bg-[#120E1C]
        hover:border-[#2D2548] hover:bg-[#181224]
        transition-all duration-300 glow-accent-hover
      "
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#0F0B18]">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120E1C] via-[#120E1C]/20 to-transparent" />
        <div className="absolute top-3 right-3">
          <SaveButton articleId={article.id} initialSaved={isSaved} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <CategoryBadge category={article.category} />
          <span className="text-[10px] font-mono text-[#4A4360]">{article.readingTime}</span>
        </div>

        <h3 className="font-bold text-[#F0ECFF] leading-snug mb-2 text-sm group-hover:text-white transition-colors line-clamp-3">
          {article.title}
        </h3>

        <p className="text-xs text-[#8B82A0] leading-relaxed line-clamp-2 mb-4">
          {article.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#4A4360] font-mono">{article.source}</span>
          <span className="text-xs text-violet-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
            Read
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
