import { useEffect, useMemo, useState } from "react";

import ArticleCard from "@/components/ArticleCard";
import { supabase } from "@/lib/supabase";

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

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD ARTICLES
  // =========================================================

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      setError("");

      try {
        // =====================================================
        // 1. GET LOGGED-IN USER
        // =====================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error(
            "You must be logged in to view your articles."
          );
        }

        console.log(
          "================================="
        );
        console.log(
          "PRAXIS ARTICLES — USER"
        );
        console.log(
          "================================="
        );
        console.log(user.id);

        // =====================================================
        // 2. GET USER'S INTERESTS
        // =====================================================

        const {
          data: userInterests,
          error: interestsError,
        } = await supabase
          .from("user_interests")
          .select("interest_id")
          .eq("user_id", user.id);

        if (interestsError) {
          throw interestsError;
        }

        console.log(
          "================================="
        );
        console.log(
          "PRAXIS ARTICLES — USER INTERESTS"
        );
        console.log(
          "================================="
        );
        console.log(userInterests);

        const interestIds =
          userInterests?.map(
            (item) => item.interest_id
          ) ?? [];

        console.log(
          "Interest IDs:",
          interestIds
        );

        // =====================================================
        // NO INTERESTS
        // =====================================================

        if (interestIds.length === 0) {
          setArticles([]);
          return;
        }

        // =====================================================
        // 3. GET INTEREST NAMES
        // =====================================================

        const {
          data: interests,
          error: interestLookupError,
        } = await supabase
          .from("interests")
          .select("id, name")
          .in("id", interestIds);

        if (interestLookupError) {
          throw interestLookupError;
        }

        console.log(
          "================================="
        );
        console.log(
          "PRAXIS ARTICLES — INTERESTS"
        );
        console.log(
          "================================="
        );
        console.log(interests);

        // =====================================================
        // 4. GET DAILY ARTICLES
        // =====================================================
        //
        // IMPORTANT:
        //
        // We are NOT limiting this to yesterday.
        //
        // The Articles page should show all articles that
        // correspond to the user's selected interests.
        //
        // We therefore retrieve all daily_articles associated
        // with those interests.
        //
        // =====================================================

        const {
          data: dailyArticles,
          error: dailyArticlesError,
        } = await supabase
          .from("daily_articles")
          .select(
            `
              id,
              article_id,
              interest_id,
              brief_date,
              rank,
              created_at
            `
          )
          .in(
            "interest_id",
            interestIds
          )
          .order(
            "brief_date",
            {
              ascending: false,
            }
          )
          .order(
            "rank",
            {
              ascending: true,
            }
          );

        if (dailyArticlesError) {
          throw dailyArticlesError;
        }

        console.log(
          "================================="
        );
        console.log(
          "PRAXIS ARTICLES — DAILY ARTICLES"
        );
        console.log(
          "================================="
        );
        console.log(dailyArticles);

        if (
          !dailyArticles ||
          dailyArticles.length === 0
        ) {
          setArticles([]);
          return;
        }

        // =====================================================
        // 5. GET ARTICLE IDS
        // =====================================================

        const articleIds =
          dailyArticles.map(
            (item) => item.article_id
          );

        console.log(
          "Article IDs:",
          articleIds
        );

        // =====================================================
        // 6. GET ARTICLES
        // =====================================================

        const {
          data: articleData,
          error: articlesError,
        } = await supabase
          .from("articles")
          .select(
            `
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
            `
          )
          .in(
            "id",
            articleIds
          );

        if (articlesError) {
          throw articlesError;
        }

        console.log(
          "================================="
        );
        console.log(
          "PRAXIS ARTICLES — DATABASE ARTICLES"
        );
        console.log(
          "================================="
        );
        console.log(articleData);

        if (
          !articleData ||
          articleData.length === 0
        ) {
          setArticles([]);
          return;
        }

        // =====================================================
        // 7. CREATE ARTICLE MAP
        // =====================================================

        const articleMap =
          new Map<number, Article>();

        articleData.forEach(
          (article) => {
            articleMap.set(
              article.id,
              article as Article
            );
          }
        );

        // =====================================================
        // 8. RESTORE DAILY ARTICLE ORDER
        // =====================================================
        //
        // The .in() query does not guarantee order.
        //
        // We rebuild the order using daily_articles.
        //
        // =====================================================

        const orderedArticles: Article[] =
          [];

        dailyArticles.forEach(
          (dailyArticle) => {
            const article =
              articleMap.get(
                dailyArticle.article_id
              );

            if (article) {
              orderedArticles.push(article);
            }
          }
        );

        // =====================================================
        // 9. REMOVE DUPLICATES
        // =====================================================
        //
        // The same article could potentially be associated
        // with more than one selected interest.
        //
        // We only want to display it once.
        //
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
          "PRAXIS ARTICLES — FINAL"
        );
        console.log(
          "================================="
        );
        console.log(uniqueArticles);

        setArticles(
          uniqueArticles
        );
      } catch (error) {
        console.error(
          "================================="
        );
        console.error(
          "PRAXIS ARTICLES ERROR"
        );
        console.error(
          "================================="
        );
        console.error(error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Could not load your articles."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  // =========================================================
  // BUILD CATEGORIES FROM ACTUAL DATABASE RESULTS
  // =========================================================

  const categories = useMemo(() => {
    const categorySet =
      new Set<string>();

    articles.forEach(
      (article) => {
        if (
          article.category &&
          article.category.trim()
        ) {
          categorySet.add(
            article.category
          );
        }
      }
    );

    return [
      "All",
      ...Array.from(
        categorySet
      ).sort(),
    ];
  }, [articles]);

  // =========================================================
  // FILTER ARTICLES
  // =========================================================

  const filteredArticles =
    activeCategory === "All"
      ? articles
      : articles.filter(
          (article) =>
            article.category ===
            activeCategory
        );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-[#8B82A0]">
            Loading your articles...
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
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-6xl mx-auto">
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
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-6xl mx-auto">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="mb-8 animate-fade-in">

        <h1 className="text-3xl font-black text-white mb-2">
          Articles
        </h1>

        <p className="text-sm text-[#8B82A0] max-w-lg leading-relaxed">
          Explore the stories shaping the
          industries you're preparing to enter.
        </p>

      </div>

      {/* ===================================================
          CATEGORY FILTERS
          =================================================== */}

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">

          {categories.map(
            (category) => (

              <button
                key={category}
                onClick={() =>
                  setActiveCategory(
                    category
                  )
                }
                className={`
                  px-4 py-2 rounded-xl
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    activeCategory ===
                    category
                      ? "bg-violet-600/20 border border-violet-500/40 text-violet-300"
                      : "border border-[#1E1830] text-[#8B82A0] hover:border-[#2D2548] hover:text-white"
                  }
                `}
              >
                {category}
              </button>

            )
          )}

        </div>
      )}

      {/* ===================================================
          ARTICLE COUNT
          =================================================== */}

      {articles.length > 0 && (
        <div className="flex items-center gap-3 mb-6">

          <p className="text-xs font-mono text-[#4A4360]">
            {filteredArticles.length}{" "}
            {filteredArticles.length === 1
              ? "ARTICLE"
              : "ARTICLES"}
          </p>

          <div className="flex-1 h-px bg-[#1E1830]" />

        </div>
      )}

      {/* ===================================================
          EMPTY STATE
          =================================================== */}

      {filteredArticles.length === 0 ? (

        <div className="text-center py-20">

          <p className="text-[#4A4360] text-sm">
            {articles.length === 0
              ? "No articles have been found for your selected interests yet."
              : "No articles in this category yet."}
          </p>

          {articles.length === 0 && (
            <p className="text-[#302A40] text-xs mt-2">
              Your personalized articles will
              appear here once they are available.
            </p>
          )}

        </div>

      ) : (

        /* =================================================
           ARTICLE GRID
           ================================================= */

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {filteredArticles.map(
            (article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="grid"
              />
            )
          )}

        </div>

      )}

    </div>
  );
}