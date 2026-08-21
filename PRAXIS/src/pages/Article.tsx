import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";

import { supabase } from "@/lib/supabase";

import CategoryBadge from "@/components/CategoryBadge";
import SaveButton from "@/components/SaveButton";
import AnalysisLoading from "@/components/AnalysisLoading";
import AnalysisError from "@/components/AnalysisError";

interface ArticleData {
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
}

interface ProfileData {
  [key: string]: unknown;
}

interface AnalysisData {
  article_id: number;
  summary: string;
  plain_english: string;
  why_it_matters: string;
  what_it_means_for_you: string;
  key_takeaway: string;
}

function AnalysisBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-mono font-medium text-violet-400 tracking-widest mb-3 uppercase">
        {label}
      </h3>

      <div className="text-[#C4BADC] leading-relaxed text-sm">
        {children}
      </div>
    </div>
  );
}

type AnalysisState =
  | "loading"
  | "ready"
  | "error";

export default function Article() {
  const { id } =
    useParams<{ id: string }>();

  const [article, setArticle] =
    useState<ArticleData | null>(
      null
    );

  const [profile, setProfile] =
    useState<ProfileData | null>(
      null
    );

  const [analysis, setAnalysis] =
    useState<AnalysisData | null>(
      null
    );

  const [userId, setUserId] =
    useState<string | null>(
      null
    );

  const [
    articleLoading,
    setArticleLoading,
  ] = useState(true);

  const [
    analysisState,
    setAnalysisState,
  ] =
    useState<AnalysisState>(
      "loading"
    );

  /*
   * =========================================================
   * LOAD ARTICLE + USER PROFILE
   * =========================================================
   */

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setArticleLoading(
          false
        );

        setAnalysisState(
          "error"
        );

        return;
      }

      try {
        setArticleLoading(
          true
        );

        /*
         * -----------------------------------------------------
         * GET ARTICLE
         * -----------------------------------------------------
         */

        const {
          data: articleData,
          error:
            articleError,
        } = await supabase
          .from("articles")
          .select("*")
          .eq("id", id)
          .single();

        if (
          articleError
        ) {
          throw articleError;
        }

        setArticle(
          articleData
        );

        /*
         * -----------------------------------------------------
         * GET AUTHENTICATED USER
         * -----------------------------------------------------
         */

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
            "You must be signed in."
          );
        }

        /*
         * Store the user ID so analysis
         * can be personalized per user.
         */

        setUserId(
          user.id
        );

        /*
         * -----------------------------------------------------
         * GET USER PROFILE
         * -----------------------------------------------------
         */

        const {
          data: profileData,
          error:
            profileError,
        } = await supabase
          .from("profiles")
          .select("*")
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

        setProfile(
          profileData
        );

        setArticleLoading(
          false
        );
      } catch (error) {
        console.error(
          "Failed to load article/profile:",
          error
        );

        setArticleLoading(
          false
        );

        setAnalysisState(
          "error"
        );
      }
    }

    loadData();
  }, [id]);

  /*
   * =========================================================
   * LOAD EXISTING ANALYSIS OR GENERATE A NEW ONE
   * =========================================================
   *
   * Flow:
   *
   * Article + User + Profile
   *
   *     ↓
   *
   * Check article_analyses
   *
   * article_id + user_id
   *
   *     ↓
   *
   * Existing analysis?
   *
   * YES → display cached analysis
   *
   * NO → call PRAXIS Worker
   *
   *     ↓
   *
   * Claude generates analysis
   *
   *     ↓
   *
   * Worker saves analysis
   *
   *     ↓
   *
   * Worker returns analysis
   *
   *     ↓
   *
   * Display analysis
   * =========================================================
   */

  const loadOrGenerateAnalysis =
    useCallback(
      async () => {
        if (
          !article ||
          !profile ||
          !id ||
          !userId
        ) {
          return;
        }

        try {
          setAnalysisState(
            "loading"
          );

          /*
           * -------------------------------------------------------
           * STEP 1
           *
           * CHECK FOR EXISTING PERSONALIZED ANALYSIS
           * -------------------------------------------------------
           */

          const {
            data:
              existingAnalysis,
            error:
              existingError,
          } = await supabase
            .from(
              "article_analyses"
            )
            .select("*")
            .eq(
              "article_id",
              article.id
            )
            .eq(
              "user_id",
              userId
            )
            .maybeSingle();

          if (
            existingError
          ) {
            throw existingError;
          }

          /*
           * -------------------------------------------------------
           * STEP 2
           *
           * USE EXISTING ANALYSIS
           * -------------------------------------------------------
           */

          if (
            existingAnalysis
          ) {
            console.log(
              "Existing PRAXIS analysis found. Using cached analysis."
            );

            setAnalysis(
              existingAnalysis as AnalysisData
            );

            setAnalysisState(
              "ready"
            );

            return;
          }

          /*
           * -------------------------------------------------------
           * STEP 3
           *
           * BUILD ANALYSIS REQUEST
           * -------------------------------------------------------
           */

          const analysisRequest = {
            /*
             * REQUIRED BY WORKER
             */

            user_id:
              userId,

            /*
             * USER PROFILE
             */

            profile: {
              ...profile,
            },

            /*
             * ARTICLE DATA
             */

            article: {
              id:
                article.id,

              title:
                article.title,

              source:
                article.source,

              url:
                article.url,

              description:
                article.description,

              category:
                article.category,

              topics:
                article.topics,

              published_at:
                article.published_at,
            },
          };

          console.log(
            `No analysis found for article ${article.id}. Generating...`
          );

          console.log(
            "PRAXIS analysis request:",
            analysisRequest
          );

          /*
           * -------------------------------------------------------
           * STEP 4
           *
           * CALL PRAXIS WORKER
           * -------------------------------------------------------
           */

          const response =
            await fetch(
              "https://praxis-news-worker.bhussenxi.workers.dev/analyze",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    analysisRequest
                  ),
              }
            );

          /*
           * -------------------------------------------------------
           * STEP 5
           *
           * HANDLE WORKER ERRORS
           * -------------------------------------------------------
           */

          if (
            !response.ok
          ) {
            const errorText =
              await response.text();

            console.error(
              "PRAXIS Worker returned an error:",
              errorText
            );

            throw new Error(
              `Analysis request failed (${response.status}): ${errorText}`
            );
          }

          /*
           * -------------------------------------------------------
           * STEP 6
           *
           * GET GENERATED ANALYSIS
           * -------------------------------------------------------
           */

          const generatedAnalysis =
            (await response.json()) as AnalysisData;

          /*
           * -------------------------------------------------------
           * STEP 7
           *
           * VALIDATE RESPONSE
           * -------------------------------------------------------
           */

          const requiredFields =
            [
              "summary",
              "plain_english",
              "why_it_matters",
              "what_it_means_for_you",
              "key_takeaway",
            ] as const;

          for (
            const field of
            requiredFields
          ) {
            if (
              typeof generatedAnalysis[
                field
              ] !==
                "string" ||
              !generatedAnalysis[
                field
              ].trim()
            ) {
              throw new Error(
                `Worker returned incomplete analysis. Missing: ${field}`
              );
            }
          }

          /*
           * -------------------------------------------------------
           * STEP 8
           *
           * DISPLAY ANALYSIS
           *
           * Worker already saved it in Supabase.
           * -------------------------------------------------------
           */

          setAnalysis({
            article_id:
              article.id,

            summary:
              generatedAnalysis.summary,

            plain_english:
              generatedAnalysis.plain_english,

            why_it_matters:
              generatedAnalysis.why_it_matters,

            what_it_means_for_you:
              generatedAnalysis.what_it_means_for_you,

            key_takeaway:
              generatedAnalysis.key_takeaway,
          });

          setAnalysisState(
            "ready"
          );

          console.log(
            `Successfully generated PRAXIS analysis for article ${article.id}`
          );
        } catch (error) {
          console.error(
            "Failed to generate PRAXIS analysis:",
            error
          );

          setAnalysisState(
            "error"
          );
        }
      },
      [
        article,
        profile,
        id,
        userId,
      ]
    );

  /*
   * =========================================================
   * START ANALYSIS AFTER ARTICLE + PROFILE + USER LOAD
   * =========================================================
   */

  useEffect(() => {
    if (
      !articleLoading &&
      article &&
      profile &&
      userId
    ) {
      loadOrGenerateAnalysis();
    }
  }, [
    articleLoading,
    article,
    profile,
    userId,
    loadOrGenerateAnalysis,
  ]);

  /*
   * =========================================================
   * RETRY
   * =========================================================
   */

  const handleRetry =
    () => {
      loadOrGenerateAnalysis();
    };

  /*
   * =========================================================
   * ARTICLE LOADING
   * =========================================================
   */

  if (
    articleLoading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          <AnalysisLoading />
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ARTICLE NOT FOUND
   * =========================================================
   */

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8B82A0] mb-4">
            Article not found.
          </p>

          <Link
            to="/articles"
            className="text-violet-400 text-sm hover:text-violet-300"
          >
            ← Back to
            Articles
          </Link>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ARTICLE DISPLAY DATA
   * =========================================================
   */

  const publishedDate =
    article.published_at
      ? new Date(
          article.published_at
        )
      : null;

  const publishedDateText =
    publishedDate &&
    !Number.isNaN(
      publishedDate.getTime()
    )
      ? publishedDate.toLocaleDateString(
          "en-US",
          {
            month:
              "short",

            day:
              "numeric",

            year:
              "numeric",
          }
        )
      : "";

  const wordCount =
    article.description
      ? article.description
          .trim()
          .split(
            /\s+/
          ).length
      : 0;

  const readingMinutes =
    Math.max(
      1,
      Math.ceil(
        wordCount / 200
      )
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen">

      {/* =====================================================
          BACK NAVIGATION
          ===================================================== */}

      <div className="px-6 lg:px-10 pt-6 pb-0 max-w-4xl mx-auto">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 text-xs text-[#4A4360] hover:text-[#8B82A0] transition-colors font-mono"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>

          Back to Articles
        </Link>
      </div>

      {/* =====================================================
          HERO IMAGE
          ===================================================== */}

      <div className="relative h-64 lg:h-80 mt-6 overflow-hidden bg-[#0F0B18]">
        {article.image_url ? (
          <img
            src={
              article.image_url
            }
            alt={
              article.title
            }
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#19132A] via-[#110D19] to-[#0B0910]">
            <div className="text-center">
              <div className="text-3xl font-black tracking-tight text-violet-400/40">
                PRAXIS
              </div>

              <div className="mt-1 font-mono text-[8px] tracking-[0.3em] text-[#4A4360]">
                INDUSTRY
                INTELLIGENCE
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#08060D] via-[#08060D]/30 to-transparent" />
      </div>

      <div className="px-6 lg:px-10 max-w-4xl mx-auto">

        {/* ===================================================
            ARTICLE HEADER
            =================================================== */}

        <div className="py-8 border-b border-[#1E1830] mb-8">

          <div className="flex flex-wrap items-center gap-3 mb-5">

            {article.category && (
              <CategoryBadge
                category={
                  article.category
                }
                size="md"
              />
            )}

            <span className="text-xs text-[#4A4360] font-mono">
              {
                readingMinutes
              }{" "}
              min read
            </span>

            {publishedDateText && (
              <>
                <span className="text-xs text-[#4A4360] font-mono">
                  ·
                </span>

                <span className="text-xs text-[#4A4360] font-mono">
                  {
                    publishedDateText
                  }
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight mb-4">
            {
              article.title
            }
          </h1>

          <div className="flex items-center justify-between gap-4 flex-wrap">

            <div className="flex items-center gap-3">

              <span className="text-xs text-[#8B82A0] font-mono">
                Source:{" "}
                {
                  article.source
                }
              </span>

              <a
                href={
                  article.url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                Read Original
                Article

                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>

            <SaveButton
              articleId={String(
                article.id
              )}
            />
          </div>
        </div>

        {/* ===================================================
            PRAXIS ANALYSIS
            =================================================== */}

        <div className="mb-12">

          <div className="flex items-center gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">

                <p className="font-mono text-xs tracking-widest text-violet-400 font-medium">
                  PRAXIS ANALYSIS
                </p>

                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-mono text-violet-400 tracking-wider">
                  PERSONALIZED
                  FOR YOU
                </span>
              </div>

              <p className="text-xs text-[#4A4360]">
                Generated from
                your PRAXIS
                profile
              </p>
            </div>
          </div>

          {/* =================================================
              LOADING
              ================================================= */}

          {analysisState ===
            "loading" && (
            <AnalysisLoading />
          )}

          {/* =================================================
              ERROR
              ================================================= */}

          {analysisState ===
            "error" && (
            <AnalysisError
              originalUrl={
                article.url
              }
              onRetry={
                handleRetry
              }
            />
          )}

          {/* =================================================
              ANALYSIS
              ================================================= */}

          {analysisState ===
            "ready" &&
            analysis && (
              <div className="rounded-2xl border border-violet-500/15 bg-[#0F0B18] overflow-hidden">

                <div className="p-6 lg:p-8 space-y-0">

                  <AnalysisBlock label="What happened?">
                    {
                      analysis.summary
                    }
                  </AnalysisBlock>

                  <div className="h-px bg-[#1E1830] mb-8" />

                  <AnalysisBlock label="In plain English">
                    {
                      analysis.plain_english
                    }
                  </AnalysisBlock>

                  <div className="h-px bg-[#1E1830] mb-8" />

                  <AnalysisBlock label="Why it matters">
                    {
                      analysis.why_it_matters
                    }
                  </AnalysisBlock>

                  <div className="h-px bg-[#1E1830] mb-8" />

                  <div className="mb-8">

                    <div className="flex items-center gap-2 mb-3">

                      <h3 className="text-xs font-mono font-medium text-violet-400 tracking-widest uppercase">
                        What this
                        means for
                        you
                      </h3>

                      <span className="text-[9px] font-mono text-[#4A4360] tracking-wider">
                        BASED ON
                        YOUR GOALS
                      </span>
                    </div>

                    <div className="text-[#C4BADC] leading-relaxed text-sm">
                      {
                        analysis.what_it_means_for_you
                      }
                    </div>
                  </div>

                  <div className="h-px bg-[#1E1830] mb-8" />

                  <div className="rounded-xl bg-violet-600/10 border border-violet-500/20 px-6 py-5">

                    <p className="text-[10px] font-mono text-violet-400 tracking-widest mb-3">
                      KEY TAKEAWAY
                    </p>

                    <p className="text-base font-semibold text-white leading-relaxed">
                      "
                      {
                        analysis.key_takeaway
                      }
                      "
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* ===================================================
            RELATED ACTIONS
            =================================================== */}

        <div className="pb-12 flex flex-col sm:flex-row gap-3">

          <Link
            to="/articles"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2D2548] text-[#8B82A0] hover:text-white text-sm font-medium transition-all"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M19 12H5M12 19l-7 7 7-7" />
            </svg>

            All articles
          </Link>

          <Link
            to="/brief"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/30 bg-violet-600/10 text-violet-300 hover:bg-violet-600/20 text-sm font-medium transition-all"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
              />

              <path d="M3 9h18M9 21V9" />
            </svg>

            Today's brief
          </Link>
        </div>
      </div>
    </div>
  );
}