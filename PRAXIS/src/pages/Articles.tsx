import { useState } from "react";
import ArticleCard from "@/components/ArticleCard";
import { mockArticles } from "@/data/mockData";

// DATABASE: REPLACE THIS — categories come from articles table distinct values
const CATEGORIES = ["All", "AI", "Cybersecurity", "Finance", "Technology"];

export default function Articles() {
  const [activeCategory, setActiveCategory] = useState("All");

  // DATABASE: REPLACE THIS — articles come from Supabase articles table
  const filtered =
    activeCategory === "All"
      ? mockArticles
      : mockArticles.filter((a) => a.category === activeCategory);

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-black text-white mb-2">Articles</h1>
        <p className="text-sm text-[#8B82A0] max-w-lg leading-relaxed">
          Explore the stories shaping the industries you're preparing to enter.
        </p>
      </div>

      {/* Category filters */}
      {/* DATABASE: REPLACE THIS */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${
                activeCategory === cat
                  ? "bg-violet-600/20 border border-violet-500/40 text-violet-300"
                  : "border border-[#1E1830] text-[#8B82A0] hover:border-[#2D2548] hover:text-white"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#4A4360] text-sm">No articles in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* DATABASE: REPLACE THIS */}
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
