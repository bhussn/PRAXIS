import ArticleCard from "@/components/ArticleCard";
import CategoryBadge from "@/components/CategoryBadge";
import { mockUser, mockProfile, mockCareers, mockArticles } from "@/data/mockData";

export default function Brief() {
  // AUTH: REPLACE THIS — name comes from Supabase profiles
  const userName = mockUser.name;

  // DYNAMIC: REPLACE THIS — current date
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // DATABASE: REPLACE THIS — articles come from Supabase articles table (today's brief)
  const briefArticles = mockArticles.slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <p className="font-mono text-[10px] tracking-widest text-violet-400 mb-4">YOUR DAILY BRIEF</p>
        <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-2">
          {/* AUTH: REPLACE THIS */}
          {greeting}, {userName}.
        </h1>
        {/* DYNAMIC: REPLACE THIS */}
        <p className="text-sm text-[#4A4360] font-mono mb-6">{today}</p>
        <p className="text-base text-[#8B82A0] leading-relaxed max-w-lg">
          Yesterday's most important stories, explained for you.
        </p>

        {/* Personalization badge */}
        {/* DATABASE: REPLACE THIS — major and careers come from Supabase profiles/user_careers */}
        <div className="mt-6 inline-flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1E1830] bg-[#0F0B18]">
          <span className="text-[10px] font-mono text-[#4A4360] tracking-wider">BUILT FOR</span>
          <span className="w-px h-3 bg-[#1E1830]" />
          <span className="text-[10px] font-mono text-[#8B82A0]">{mockProfile.major}</span>
          {mockCareers.map((c) => (
            <span key={c} className="text-[10px] font-mono text-violet-400">{c}</span>
          ))}
        </div>
      </div>

      {/* Stories section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-sm font-semibold text-[#8B82A0]">Three stories worth your attention.</h2>
          <div className="flex-1 h-px bg-[#1E1830]" />
          <span className="font-mono text-[10px] text-[#4A4360]">AUG 19</span>
        </div>

        {/* DATABASE: REPLACE THIS — articles come from Supabase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {briefArticles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="brief" />
          ))}
        </div>
      </div>

      {/* Footer callout */}
      <div className="mt-12 rounded-2xl border border-[#1E1830] bg-[#0F0B18] px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white mb-1">Explore the full archive</p>
          <p className="text-xs text-[#8B82A0]">Browse every story from the past 30 days.</p>
        </div>
        <a
          href="/articles"
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2D2548] text-[#8B82A0] hover:text-white hover:border-violet-500/30 text-sm font-medium transition-all duration-200"
        >
          View all articles
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
