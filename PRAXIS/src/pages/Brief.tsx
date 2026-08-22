import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

type DailyArticle = {
  id: number;
  article_id: number;
  interest_id: number;
  brief_date: string;
  rank: number;
  created_at?: string | null;
};

// =========================================================
// GET YESTERDAY IN LOCAL TIME
// =========================================================

function getYesterdayLocal() {
  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  return yesterday;
}

// =========================================================
// FORMAT DATE FOR SUPABASE
//
// Example:
// 2026-08-20
// =========================================================

function getDateKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Brief() {
  const [profile, setProfile] =
    useState<ProfileData>({
      name: null,
      major: null,
      concerns: null,
    });

  const [
    briefArticles,
    setBriefArticles,
  ] = useState<Article[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // YESTERDAY
  //
  // IMPORTANT:
  // Use LOCAL time, not UTC.
  // =========================================================

  const yesterday =
    getYesterdayLocal();

  const briefDate =
    getDateKey(yesterday);

  // =========================================================
  // LOAD BRIEF
  // =========================================================

  useEffect(() => {
    const loadBrief =
      async () => {
        setLoading(true);
        setError("");

        try {
          // =====================================================
          // 1. GET LOGGED-IN USER
          // =====================================================

          const {
            data: { user },
            error: userError,
          } =
            await supabase.auth.getUser();

          if (userError) {
            throw userError;
          }

          if (!user) {
            throw new Error(
              "You must be logged in to view your brief."
            );
          }

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS USER"
          );
          console.log(
            "================================="
          );
          console.log(
            user.id
          );

          // =====================================================
          // 2. GET PROFILE
          // =====================================================

          const {
            data: profileData,
            error: profileError,
          } = await supabase
            .from("profiles")
            .select(`
              name,
              concerns,
              major_id
            `)
            .eq(
              "id",
              user.id
            )
            .single();

          if (
            profileError
          ) {
            throw profileError;
          }

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS PROFILE"
          );
          console.log(
            "================================="
          );
          console.log(
            profileData
          );

          // =====================================================
          // 3. GET MAJOR
          // =====================================================

          let majorName:
            | string
            | null = null;

          if (
            profileData.major_id !==
            null
          ) {
            const {
              data: majorData,
              error: majorError,
            } = await supabase
              .from("majors")
              .select("name")
              .eq(
                "id",
                profileData.major_id
              )
              .single();

            if (
              majorError
            ) {
              throw majorError;
            }

            majorName =
              majorData?.name ??
              null;
          }

          setProfile({
            name:
              profileData.name ??
              null,

            major:
              majorName,

            concerns:
              profileData.concerns ??
              null,
          });

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS MAJOR"
          );
          console.log(
            "================================="
          );
          console.log(
            majorName
          );

          // =====================================================
          // 4. GET USER'S SELECTED INTERESTS
          // =====================================================

          const {
            data: userInterests,
            error:
              interestsError,
          } = await supabase
            .from(
              "user_interests"
            )
            .select(
              "interest_id"
            )
            .eq(
              "user_id",
              user.id
            );

          if (
            interestsError
          ) {
            throw interestsError;
          }

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS USER INTERESTS"
          );
          console.log(
            "================================="
          );
          console.log(
            userInterests
          );

          const interestIds =
            userInterests?.map(
              (item) =>
                item.interest_id
            ) ?? [];

          console.log(
            "PRAXIS INTEREST IDS:",
            interestIds
          );

          // =====================================================
          // USER HAS NO INTERESTS
          // =====================================================

          if (
            interestIds.length ===
            0
          ) {
            console.log(
              "PRAXIS: User has no selected interests."
            );

            setBriefArticles(
              []
            );

            return;
          }

          // =====================================================
          // 5. GET INTEREST INFORMATION
          // =====================================================

          const {
            data: interests,
            error:
              interestsLookupError,
          } = await supabase
            .from("interests")
            .select(
              "id, name"
            )
            .in(
              "id",
              interestIds
            );

          if (
            interestsLookupError
          ) {
            throw interestsLookupError;
          }

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS SELECTED INTERESTS"
          );
          console.log(
            "================================="
          );
          console.log(
            interests
          );

          // =====================================================
          // 6. BRIEF DATE
          //
          // Uses LOCAL yesterday.
          //
          // Example:
          //
          // Local date:
          // August 21, 2026
          //
          // briefDate:
          // 2026-08-20
          // =====================================================

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS BRIEF DATE"
          );
          console.log(
            "================================="
          );
          console.log(
            briefDate
          );

          // =====================================================
          // 7. GET DAILY ARTICLES
          // =====================================================

          const {
            data:
              dailyArticles,
            error:
              dailyArticlesError,
          } = await supabase
            .from(
              "daily_articles"
            )
            .select(`
              id,
              article_id,
              interest_id,
              brief_date,
              rank,
              created_at
            `)
            .in(
              "interest_id",
              interestIds
            )
            .eq(
              "brief_date",
              briefDate
            )
            .order(
              "rank",
              {
                ascending:
                  true,
              }
            );

          if (
            dailyArticlesError
          ) {
            throw dailyArticlesError;
          }

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS DAILY ARTICLES"
          );
          console.log(
            "================================="
          );
          console.log(
            dailyArticles
          );

          // =====================================================
          // NO DAILY ARTICLES
          // =====================================================

          if (
            !dailyArticles ||
            dailyArticles.length ===
              0
          ) {
            console.log(
              "PRAXIS: No daily articles found."
            );

            setBriefArticles(
              []
            );

            return;
          }

          // =====================================================
          // 8. GET ARTICLE IDS
          // =====================================================

          const articleIds =
            dailyArticles.map(
              (
                dailyArticle: DailyArticle
              ) =>
                dailyArticle.article_id
            );

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS ARTICLE IDS"
          );
          console.log(
            "================================="
          );
          console.log(
            articleIds
          );

          // =====================================================
          // 9. GET ACTUAL ARTICLES
          // =====================================================

          const {
            data: articles,
            error:
              articlesError,
          } = await supabase
            .from("articles")
            .select(`
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
            `)
            .in(
              "id",
              articleIds
            );

          if (
            articlesError
          ) {
            throw articlesError;
          }

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS ARTICLES FROM DATABASE"
          );
          console.log(
            "================================="
          );
          console.log(
            articles
          );

          if (
            !articles ||
            articles.length ===
              0
          ) {
            console.log(
              "PRAXIS: Article IDs exist but no articles were returned."
            );

            setBriefArticles(
              []
            );

            return;
          }

          // =====================================================
          // 10. CREATE ARTICLE LOOKUP MAP
          // =====================================================

          const articleMap =
            new Map<
              number,
              Article
            >();

          articles.forEach(
            (article) => {
              articleMap.set(
                article.id,
                article as Article
              );
            }
          );

          // =====================================================
          // 11. RESTORE RANK ORDER
          // =====================================================

          const orderedArticles:
            Article[] = [];

          dailyArticles.forEach(
            (
              dailyArticle:
                DailyArticle
            ) => {
              const article =
                articleMap.get(
                  dailyArticle.article_id
                );

              if (article) {
                orderedArticles.push(
                  article
                );
              }
            }
          );

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS ORDERED ARTICLES"
          );
          console.log(
            "================================="
          );
          console.log(
            orderedArticles
          );

          // =====================================================
          // 12. REMOVE DUPLICATES
          // =====================================================

          const uniqueArticles =
            Array.from(
              new Map(
                orderedArticles.map(
                  (article) => [
                    article.id,
                    article,
                  ]
                )
              ).values()
            );

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS UNIQUE ARTICLES"
          );
          console.log(
            "================================="
          );
          console.log(
            uniqueArticles
          );

          // =====================================================
          // 13. GET TOP 3
          // =====================================================

          const topThree =
            uniqueArticles.slice(
              0,
              3
            );

          console.log(
            "================================="
          );
          console.log(
            "PRAXIS FINAL BRIEF"
          );
          console.log(
            "================================="
          );
          console.log(
            topThree
          );

          setBriefArticles(
            topThree
          );
        } catch (error) {
          console.error(
            "================================="
          );
          console.error(
            "PRAXIS BRIEF ERROR"
          );
          console.error(
            "================================="
          );
          console.error(
            error
          );

          if (
            error instanceof Error
          ) {
            setError(
              error.message
            );
          } else {
            setError(
              "Could not load your brief."
            );
          }
        } finally {
          setLoading(
            false
          );
        }
      };

    loadBrief();
  }, [briefDate]);

  // =========================================================
  // DISPLAY DATE
  //
  // Uses the EXACT SAME local yesterday date as the DB query.
  // =========================================================

  const displayDate =
    yesterday.toLocaleDateString(
      "en-US",
      {
        weekday:
          "long",

        month:
          "long",

        day:
          "numeric",

        year:
          "numeric",
      }
    );

  // =========================================================
  // SHORT DISPLAY DATE
  // =========================================================

  const shortDisplayDate =
    yesterday
      .toLocaleDateString(
        "en-US",
        {
          month:
            "short",

          day:
            "numeric",
        }
      )
      .toUpperCase();

  // =========================================================
  // GREETING
  // =========================================================

  const hour =
    new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-[#8B82A0]">
            Building your
            brief...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5">

          <p className="text-sm text-red-400">
            {error}
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="mb-10 animate-fade-in">

        <p className="font-mono text-[10px] tracking-widest text-violet-400 mb-4">
          YOUR DAILY BRIEF
        </p>

        <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-2">

          {greeting}

          {profile.name
            ? `, ${profile.name}.`
            : "."}

        </h1>

        <p className="text-sm text-[#4A4360] font-mono mb-6">
          News from{" "}
          {displayDate}
        </p>

        <p className="text-base text-[#8B82A0] leading-relaxed max-w-lg">
          Yesterday's most
          important stories,
          explained for you.
        </p>

        {/* PERSONALIZATION BADGE */}

        <div className="mt-6 inline-flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1E1830] bg-[#0F0B18]">

          <span className="text-[10px] font-mono text-[#4A4360] tracking-wider">
            BUILT FOR
          </span>

          <span className="w-px h-3 bg-[#1E1830]" />

          {profile.major && (
            <span className="text-[10px] font-mono text-[#8B82A0]">
              {
                profile.major
              }
            </span>
          )}

        </div>
      </div>

      {/* =====================================================
          STORIES
          ===================================================== */}

      <div className="mb-6">

        <div className="flex items-center gap-3 mb-6">

          <h2 className="text-sm font-semibold text-[#8B82A0]">
            Three stories worth
            your attention.
          </h2>

          <div className="flex-1 h-px bg-[#1E1830]" />

          <span className="font-mono text-[10px] text-[#4A4360]">
            {shortDisplayDate}
          </span>

        </div>

        {/* ===================================================
            NO ARTICLES
            =================================================== */}

        {briefArticles.length ===
        0 ? (
          <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] px-6 py-8 text-center">

            <p className="text-sm text-[#8B82A0]">
              Your daily brief
              hasn't been
              generated yet.
            </p>

            <p className="text-xs text-[#4A4360] mt-2">
              Check back soon as
              PRAXIS builds your
              personalized brief.
            </p>

          </div>
        ) : (
          /* =================================================
             ARTICLES
             ================================================= */

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {briefArticles.map(
              (article) => (
                <ArticleCard
                  key={
                    article.id
                  }
                  article={
                    article
                  }
                  variant="brief"
                />
              )
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="mt-12 rounded-2xl border border-[#1E1830] bg-[#0F0B18] px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <Link
          to="/articles"
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
        </Link>

      </div>

    </div>
  );
}