import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import CategoryBadge from "@/components/CategoryBadge";
import SaveButton from "@/components/SaveButton";
import AnalysisLoading from "@/components/AnalysisLoading";
import AnalysisError from "@/components/AnalysisError";
import { mockArticles, mockAnalyses, mockSavedArticles, mockProfile, mockCareers } from "@/data/mockData";

function AnalysisBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-mono font-medium text-violet-400 tracking-widest mb-3 uppercase">
        {label}
      </h3>
      <div className="text-[#C4BADC] leading-relaxed text-sm">{children}</div>
    </div>
  );
}

type AnalysisState = "loading" | "ready" | "error";

export default function Article() {
  const { id } = useParams<{ id: string }>();
  // DATABASE: REPLACE THIS — fetch article from Supabase articles table by id
  const article = mockArticles.find((a) => a.id === id);

  // CLAUDE: REPLACE THIS — analysis state simulates Claude API call
  const [analysisState, setAnalysisState] = useState<AnalysisState>("loading");
  const isSaved = id ? mockSavedArticles.includes(id) : false;

  useEffect(() => {
    setAnalysisState("loading");
    // CLAUDE: REPLACE THIS — simulate Claude API latency
    const hasAnalysis = id && mockAnalyses[id];
    const timer = setTimeout(() => {
      setAnalysisState(hasAnalysis ? "ready" : "error");
    }, 1800);
    return () => clearTimeout(timer);
  }, [id]);

  const handleRetry = () => {
    setAnalysisState("loading");
    const timer = setTimeout(() => {
      setAnalysisState(id && mockAnalyses[id] ? "ready" : "error");
    }, 1500);
    return () => clearTimeout(timer);
  };

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8B82A0] mb-4">Article not found.</p>
          <Link to="/articles" className="text-violet-400 text-sm hover:text-violet-300">
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  // CLAUDE: REPLACE THIS — comes from article_analyses table
  const analysis = id ? mockAnalyses[id] : null;

  return (
    <div className="min-h-screen">
      {/* Back nav */}
      <div className="px-6 lg:px-10 pt-6 pb-0 max-w-4xl mx-auto">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 text-xs text-[#4A4360] hover:text-[#8B82A0] transition-colors font-mono"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Articles
        </Link>
      </div>

      {/* Hero image */}
      {/* DATABASE: REPLACE THIS — image_url comes from articles.image_url */}
      <div className="relative h-64 lg:h-80 mt-6 overflow-hidden bg-[#0F0B18]">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08060D] via-[#08060D]/30 to-transparent" />
      </div>

      <div className="px-6 lg:px-10 max-w-4xl mx-auto">
        {/* Article header */}
        <div className="py-8 border-b border-[#1E1830] mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* DATABASE: REPLACE THIS */}
            <CategoryBadge category={article.category} size="md" />
            <span className="text-xs text-[#4A4360] font-mono">{article.readingTime}</span>
            <span className="text-xs text-[#4A4360] font-mono">·</span>
            <span className="text-xs text-[#4A4360] font-mono">{article.publishedAt}</span>
          </div>

          {/* DATABASE: REPLACE THIS — title comes from articles.title */}
          <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {/* DATABASE: REPLACE THIS — source and url come from articles */}
              <span className="text-xs text-[#8B82A0] font-mono">Source: {article.source}</span>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                Read Original Article
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>
            {/* DATABASE: REPLACE THIS — save state comes from saved_articles */}
            <SaveButton articleId={article.id} initialSaved={isSaved} />
          </div>
        </div>

        {/* PRAXIS Analysis section */}
        <div className="mb-12">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-xs tracking-widest text-violet-400 font-medium">PRAXIS ANALYSIS</p>
                {/* CLAUDE: REPLACE THIS — personalized badge */}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-mono text-violet-400 tracking-wider">
                  PERSONALIZED FOR YOU
                </span>
              </div>
              <p className="text-xs text-[#4A4360]">
                Generated for {mockProfile.major} · {mockCareers.slice(0, 2).join(", ")}
                {/* DATABASE: REPLACE THIS + CLAUDE: REPLACE THIS */}
              </p>
            </div>
          </div>

          {/* Analysis states */}
          {analysisState === "loading" && <AnalysisLoading />}

          {analysisState === "error" && (
            <AnalysisError originalUrl={article.url} onRetry={handleRetry} />
          )}

          {analysisState === "ready" && analysis && (
            <div className="rounded-2xl border border-violet-500/15 bg-[#0F0B18] overflow-hidden">
              <div className="p-6 lg:p-8 space-y-0">
                {/* CLAUDE: REPLACE THIS */}
                <AnalysisBlock label="What happened?">
                  {analysis.summary}
                </AnalysisBlock>

                <div className="h-px bg-[#1E1830] mb-8" />

                {/* CLAUDE: REPLACE THIS */}
                <AnalysisBlock label="In plain English">
                  {analysis.plainEnglish}
                </AnalysisBlock>

                <div className="h-px bg-[#1E1830] mb-8" />

                {/* CLAUDE: REPLACE THIS */}
                <AnalysisBlock label="Why it matters">
                  {analysis.whyItMatters}
                </AnalysisBlock>

                <div className="h-px bg-[#1E1830] mb-8" />

                {/* CLAUDE: REPLACE THIS — personalized using major, careers, and concerns */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-mono font-medium text-violet-400 tracking-widest uppercase">
                      What this means for you
                    </h3>
                    <span className="text-[9px] font-mono text-[#4A4360] tracking-wider">BASED ON YOUR GOALS</span>
                  </div>
                  <div className="text-[#C4BADC] leading-relaxed text-sm">{analysis.whatThisMeansForYou}</div>
                </div>

                <div className="h-px bg-[#1E1830] mb-8" />

                {/* CLAUDE: REPLACE THIS — key takeaway */}
                <div className="rounded-xl bg-violet-600/10 border border-violet-500/20 px-6 py-5">
                  <p className="text-[10px] font-mono text-violet-400 tracking-widest mb-3">KEY TAKEAWAY</p>
                  <p className="text-base font-semibold text-white leading-relaxed">
                    "{analysis.keyTakeaway}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related actions */}
        <div className="pb-12 flex flex-col sm:flex-row gap-3">
          <Link
            to="/articles"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2D2548] text-[#8B82A0] hover:text-white text-sm font-medium transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All articles
          </Link>
          <Link
            to="/brief"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/30 bg-violet-600/10 text-violet-300 hover:bg-violet-600/20 text-sm font-medium transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
            </svg>
            Today's brief
          </Link>
        </div>
      </div>
    </div>
  );
}
