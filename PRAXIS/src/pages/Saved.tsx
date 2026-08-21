import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

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

export default function Saved() {
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSavedArticles = async () => {
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
            "You must be logged in to view your saved articles."
          );
        }

        console.log("=================================");
        console.log("PRAXIS SAVED — USER");
        console.log("=================================");
        console.log(user.id);

        // =====================================================
        // 2. GET SAVED ARTICLE IDS
        // =====================================================

        const {
          data: savedData,
          error: savedError,
        } = await supabase
          .from("saved_articles")
          .select("article_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (savedError) {
          throw savedError;
        }

        console.log("=================================");
        console.log("PRAXIS SAVED — SAVED ARTICLES");
        console.log("=================================");
        console.log(savedData);

        if (!savedData || savedData.length === 0) {
          setSavedArticles([]);
          return;
        }

        // =====================================================
        // 3. GET ARTICLE IDS
        // =====================================================

        const articleIds = savedData.map(
          (item) => item.article_id
        );

        console.log("Saved article IDs:", articleIds);

        // =====================================================
        // 4. GET ACTUAL ARTICLES
        // =====================================================

        const {
          data: articles,
          error: articlesError,
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
          .in("id", articleIds);

        if (articlesError) {
          throw articlesError;
        }

        console.log("=================================");
        console.log("PRAXIS SAVED — ARTICLES");
        console.log("=================================");
        console.log(articles);

        if (!articles || articles.length === 0) {
          setSavedArticles([]);
          return;
        }

        // =====================================================
        // 5. RESTORE SAVED ORDER
        // =====================================================

        const articleMap = new Map<number, Article>();

        articles.forEach((article) => {
          articleMap.set(article.id, article as Article);
        });

        const orderedArticles: Article[] = [];

        savedData.forEach((saved) => {
          const article = articleMap.get(saved.article_id);

          if (article) {
            orderedArticles.push(article);
          }
        });

        console.log("=================================");
        console.log("PRAXIS SAVED — FINAL");
        console.log("=================================");
        console.log(orderedArticles);

        setSavedArticles(orderedArticles);
      } catch (error) {
        console.error("=================================");
        console.error("PRAXIS SAVED ERROR");
        console.error("=================================");
        console.error(error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Could not load your saved articles.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadSavedArticles();
  }, []);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-[#8B82A0]">
            Loading your saved articles...
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

      {/* Header */}

      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-black text-white mb-2">
          Saved Articles
        </h1>

        <p className="text-sm text-[#8B82A0]">
          Stories you want to come back to.
        </p>
      </div>

      {/* Empty State */}

      {savedArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">

          <div className="w-16 h-16 rounded-2xl border border-[#1E1830] bg-[#120E1C] flex items-center justify-center mb-5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4A4360"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-white mb-2">
            No saved stories yet.
          </h2>

          <p className="text-sm text-[#8B82A0] max-w-xs mb-8 leading-relaxed">
            When a story is worth coming back to, save it here.
          </p>

          <Link
            to="/brief"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Back to Brief

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
      ) : (

        /* Saved Articles */

        <>
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-[#4A4360]">
              {savedArticles.length}{" "}
              {savedArticles.length === 1
                ? "saved story"
                : "saved stories"}
            </span>

            <div className="flex-1 h-px bg-[#1E1830]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={{
                  id: String(article.id),
                  title: article.title,
                  category: article.category ?? "Technology",
                  source: article.source,
                  publishedAt: article.published_at
                    ? new Date(
                        article.published_at
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently",

                  readingTime: "5 min read",

                  imageUrl:
                    article.image_url ??
                    "/placeholder-article.jpg",

                  description:
                    article.description ??
                    "Read this story to learn more.",

                  number: "",
                }}
                variant="grid"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}