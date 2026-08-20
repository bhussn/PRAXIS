import { Link } from "react-router-dom";
import ArticleCard from "@/components/ArticleCard";
import { mockArticles, mockSavedArticles } from "@/data/mockData";

export default function Saved() {
  // DATABASE: REPLACE THIS — saved articles come from saved_articles joined with articles in Supabase
  const savedArticles = mockArticles.filter((a) => mockSavedArticles.includes(a.id));

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-black text-white mb-2">Saved Articles</h1>
        <p className="text-sm text-[#8B82A0]">Stories you want to come back to.</p>
      </div>

      {savedArticles.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl border border-[#1E1830] bg-[#120E1C] flex items-center justify-center mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A4360" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No saved stories yet.</h2>
          <p className="text-sm text-[#8B82A0] max-w-xs mb-8 leading-relaxed">
            When a story is worth coming back to, save it here.
          </p>
          <Link
            to="/brief"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Back to Brief
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-xs text-[#4A4360]">{savedArticles.length} saved</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* DATABASE: REPLACE THIS */}
            {savedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="grid" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
