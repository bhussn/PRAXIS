import { useEffect, useState } from "react";

import ArticleCard from "@/components/ArticleCard";
import { supabase } from "@/lib/supabase";

type ProfileData = {
  name: string | null;
  major: string | null;
  concerns: string | null;
};

type Article = {
  id: number;
  title: string;
  source: string;
  url: string;
  image_url: string | null;
  description: string | null;
  category: string | null;
  topics: string[] | null;
  published_at: string | null;
  created_at: string;
};

export default function Brief() {
  const [profile, setProfile] = useState<ProfileData>({
    name: null,
    major: null,
    concerns: null,
  });

  const [briefArticles, setBriefArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBrief = async () => {
      setLoading(true);
      setError("");

      try {
        // ----------------------------------------
        // 1. Get logged-in user
        // ----------------------------------------

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log("USER:", user);

        if (userError || !user) {
          throw new Error("You must be logged in to view your brief.");
        }

        // ----------------------------------------
        // 2. Get profile + major
        // ----------------------------------------

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            name,
            concerns,
            majors (
              name
            )
          `)
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile({
          name: profileData.name,
          major: profileData.majors?.name ?? null,
          concerns: profileData.concerns,
        });

        // ----------------------------------------
        // 3. Get today's personalized brief
        // ----------------------------------------

        const today = new Date().toISOString().split("T")[0];

        const { data: briefData, error: briefError } = await supabase
          .from("user_briefs")
          .select(`
            rank,
            articles (
              id,
              title,
              source,
              url,
              image_url,
              description,
              category,
              topics,
              published_at,
              created_at
            )
          `)
          .eq("user_id", user.id)
          .eq("brief_date", today)
          .order("rank", { ascending: true });

        if (briefError) {
          throw briefError;
        }

        console.log("TODAY'S BRIEF:", briefData);

        // ----------------------------------------
        // 4. Convert joined articles into Article[]
        // ----------------------------------------

        const selectedArticles =
          briefData
            ?.map((item) => item.articles)
            .filter(
              (article): article is Article => article !== null
            ) ?? [];

        setBriefArticles(selectedArticles.slice(0, 3));
      } catch (error) {
        console.error("Error loading brief:", error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Could not load your brief.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadBrief();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  // ----------------------------------------
  // Loading
  // ----------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-[#8B82A0]">
            Building your brief...
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // Error
  // ----------------------------------------

  if (error) {
    return (
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // Page
  // ----------------------------------------

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">

      {/* Header */}

      <div className="mb-10 animate-fade-in">

        <p className="font-mono text-[10px] tracking-widest text-violet-400 mb-4">
          YOUR DAILY BRIEF
        </p>

        <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-2">
          {greeting}, {profile.name}.
        </h1>

        <p className="text-sm text-[#4A4360] font-mono mb-6">
          {today}
        </p>

        <p className="text-base text-[#8B82A0] leading-relaxed max-w-lg">
          Yesterday's most important stories, explained for you.
        </p>

        {/* Personalization badge */}

        <div className="mt-6 inline-flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1E1830] bg-[#0F0B18]">

          <span className="text-[10px] font-mono text-[#4A4360] tracking-wider">
            BUILT FOR
          </span>

          <span className="w-px h-3 bg-[#1E1830]" />

          {profile.major && (
            <span className="text-[10px] font-mono text-[#8B82A0]">
              {profile.major}
            </span>
          )}

        </div>
      </div>

      {/* Stories */}

      <div className="mb-6">

        <div className="flex items-center gap-3 mb-6">

          <h2 className="text-sm font-semibold text-[#8B82A0]">
            Three stories worth your attention.
          </h2>

          <div className="flex-1 h-px bg-[#1E1830]" />

          <span className="font-mono text-[10px] text-[#4A4360]">
            {new Date()
              .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
              .toUpperCase()}
          </span>

        </div>

        {briefArticles.length === 0 ? (

          <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] px-6 py-8 text-center">

            <p className="text-sm text-[#8B82A0]">
              Your daily brief hasn't been generated yet.
            </p>

            <p className="text-xs text-[#4A4360] mt-2">
              Check back soon as PRAXIS builds your personalized brief.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {briefArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="brief"
              />
            ))}

          </div>

        )}

      </div>

      {/* Footer */}

      <div className="mt-12 rounded-2xl border border-[#1E1830] bg-[#0F0B18] px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div>

          <p className="text-sm font-semibold text-white mb-1">
            Explore the full archive
          </p>

          <p className="text-xs text-[#8B82A0]">
            Browse every story from the past 30 days.
          </p>

        </div>

        <a
          href="/articles"
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2D2548] text-[#8B82A0] hover:text-white hover:border-violet-500/30 text-sm font-medium transition-all duration-200"
        >
          View all articles

          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>

        </a>

      </div>

    </div>
  );
}