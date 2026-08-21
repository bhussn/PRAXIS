import { useState } from "react";
import { Link } from "react-router-dom";

import CategoryBadge from "./CategoryBadge";
import SaveButton from "./SaveButton";

interface Article {
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

interface ArticleCardProps {
  article: Article;
  variant?: "brief" | "grid";
}

export default function ArticleCard({
  article,
  variant = "grid",
}: ArticleCardProps) {
  const [imageError, setImageError] = useState(false);

  /*
   * =========================================================
   * SOURCE
   * =========================================================
   */

  const sourceName = article.source
    ? article.source
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
    : "Unknown source";

  /*
   * =========================================================
   * DATE
   * =========================================================
   */

  const publishedDate = article.published_at
    ? new Date(article.published_at)
    : null;

  const publishedDateText =
    publishedDate && !Number.isNaN(publishedDate.getTime())
      ? publishedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "";

  /*
   * =========================================================
   * READING TIME
   * =========================================================
   *
   * We don't currently store reading_time in Supabase,
   * so calculate an approximate value from the description.
   */

  const wordCount = article.description
    ? article.description.trim().split(/\s+/).length
    : 0;

  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  /*
   * =========================================================
   * SAVE STATE
   * =========================================================
   *
   * Supabase saved_articles integration comes next.
   */

  const isSaved = false;

  /*
   * =========================================================
   * DESCRIPTION
   * =========================================================
   */

  const description =
    article.description?.trim() ||
    "Read the latest developments and understand what they mean for the industry.";

  /*
   * =========================================================
   * IMAGE
   * =========================================================
   */

  const image = article.image_url && !imageError;

  /*
   * =========================================================
   * BRIEF VARIANT
   * =========================================================
   */

  if (variant === "brief") {
    return (
      <Link
        to={`/article/${article.id}`}
        className="group relative block h-full"
      >
        <article
          className="
            relative flex h-full flex-col overflow-hidden
            rounded-2xl
            border border-[#1E1830]
            bg-[#120E1C]
            transition-all duration-300
            hover:-translate-y-1
            hover:border-violet-500/30
            hover:bg-[#181224]
            hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]
          "
        >
          {/* =================================================
              IMAGE
              ================================================= */}

          <div className="relative h-44 overflow-hidden bg-[#0F0B18]">
            {image ? (
              <img
                src={article.image_url!}
                alt=""
                loading="lazy"
                onError={() => setImageError(true)}
                className="
                  h-full
                  w-full
                  object-cover
                  opacity-75
                  transition-all
                  duration-500
                  group-hover:scale-105
                  group-hover:opacity-90
                "
              />
            ) : (
              <div
                className="
                  flex h-full w-full items-center justify-center
                  bg-gradient-to-br
                  from-[#19132A]
                  via-[#110D19]
                  to-[#0B0910]
                "
              >
                <div className="text-center">
                  <div className="text-xl font-black tracking-tight text-violet-400/40">
                    PRAXIS
                  </div>

                  <div className="mt-1 font-mono text-[8px] tracking-[0.3em] text-[#4A4360]">
                    INDUSTRY INTELLIGENCE
                  </div>
                </div>
              </div>
            )}

            {/* Image gradient */}

            <div
              className="
                absolute inset-0
                bg-gradient-to-t
                from-[#120E1C]
                via-transparent
                to-transparent
              "
            />

            {/* Article number */}

            <div className="absolute left-3 top-3">
              <span className="font-mono text-xs font-medium text-[#8B82A0]">
                {String(article.id).padStart(2, "0")}
              </span>
            </div>

            {/* Save */}

            <div
              className="absolute right-3 top-3"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <SaveButton
                articleId={String(article.id)}
                initialSaved={isSaved}
              />
            </div>
          </div>

          {/* =================================================
              CONTENT
              ================================================= */}

          <div className="flex flex-1 flex-col p-5">
            {/* Category + reading time */}

            <div className="mb-3 flex items-center gap-2">
              {article.category && (
                <CategoryBadge category={article.category} />
              )}

              <span className="font-mono text-[10px] text-[#4A4360]">
                {readingMinutes} min read
              </span>
            </div>

            {/* Title */}

            <h3
              className="
                mb-2
                line-clamp-2
                text-base
                font-bold
                leading-snug
                text-[#F0ECFF]
                transition-colors
                group-hover:text-white
              "
            >
              {article.title}
            </h3>

            {/* Description */}

            <p
              className="
                mb-4
                line-clamp-3
                text-xs
                leading-relaxed
                text-[#8B82A0]
              "
            >
              {description}
            </p>

            {/* Bottom */}

            <div className="mt-auto flex items-center justify-between gap-3">
              <span
                className="
                  min-w-0
                  truncate
                  font-mono
                  text-[10px]
                  text-[#4A4360]
                "
              >
                {sourceName}
                {publishedDateText && ` · ${publishedDateText}`}
              </span>

              <span
                className="
                  flex
                  shrink-0
                  items-center
                  gap-1
                  text-xs
                  font-medium
                  text-violet-400
                  transition-all
                  duration-200
                  group-hover:gap-2
                "
              >
                Read Brief

                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  /*
   * =========================================================
   * GRID VARIANT
   * =========================================================
   */

  return (
    <Link
      to={`/article/${article.id}`}
      className="group relative block h-full"
    >
      <article
        className="
          relative flex h-full flex-col overflow-hidden
          rounded-2xl
          border border-[#1E1830]
          bg-[#120E1C]
          transition-all duration-300
          hover:-translate-y-1
          hover:border-violet-500/30
          hover:bg-[#181224]
          hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]
        "
      >
        {/* =================================================
            IMAGE
            ================================================= */}

        <div className="relative h-48 overflow-hidden bg-[#0F0B18]">
          {image ? (
            <img
              src={article.image_url!}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="
                h-full
                w-full
                object-cover
                opacity-75
                transition-all
                duration-500
                group-hover:scale-105
                group-hover:opacity-90
              "
            />
          ) : (
            <div
              className="
                flex h-full w-full items-center justify-center
                bg-gradient-to-br
                from-[#19132A]
                via-[#110D19]
                to-[#0B0910]
              "
            >
              <div className="text-center">
                <div className="text-2xl font-black tracking-tight text-violet-400/40">
                  PRAXIS
                </div>

                <div className="mt-1 font-mono text-[8px] tracking-[0.3em] text-[#4A4360]">
                  INDUSTRY INTELLIGENCE
                </div>
              </div>
            </div>
          )}

          {/* Image gradient */}

          <div
            className="
              absolute inset-x-0 bottom-0
              h-24
              bg-gradient-to-t
              from-[#120E1C]
              to-transparent
            "
          />

          {/* Category */}

          {article.category && (
            <div className="absolute left-4 top-4">
              <CategoryBadge category={article.category} />
            </div>
          )}

          {/* Save */}

          <div
            className="absolute right-3 top-3"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <SaveButton
              articleId={String(article.id)}
              initialSaved={isSaved}
            />
          </div>
        </div>

        {/* =================================================
            CONTENT
            ================================================= */}

        <div className="flex flex-1 flex-col p-5">
          {/* Source */}

          <div className="mb-3 flex items-center gap-2">
            <span
              className="
                truncate
                font-mono
                text-[10px]
                font-medium
                uppercase
                tracking-wider
                text-violet-400
              "
            >
              {sourceName}
            </span>

            {publishedDateText && (
              <>
                <span className="text-[#302A40]">•</span>

                <span className="shrink-0 font-mono text-[10px] text-[#4A4360]">
                  {publishedDateText}
                </span>
              </>
            )}
          </div>

          {/* Title */}

          <h3
            className="
              line-clamp-3
              text-sm
              font-bold
              leading-[1.35]
              text-[#F0ECFF]
              transition-colors
              group-hover:text-white
            "
          >
            {article.title}
          </h3>

          {/* Description */}

          <p
            className="
              mt-3
              line-clamp-3
              text-xs
              leading-relaxed
              text-[#8B82A0]
            "
          >
            {description}
          </p>

          {/* Topics */}

          {article.topics && article.topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {article.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="
                    rounded-md
                    bg-[#171225]
                    px-2
                    py-1
                    font-mono
                    text-[9px]
                    text-[#6F6780]
                  "
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}

          <div className="mt-auto pt-5">
            <div
              className="
                flex
                items-center
                justify-between
                border-t
                border-[#1E1830]
                pt-4
              "
            >
              <span className="font-mono text-[10px] text-[#4A4360]">
                {readingMinutes} min read
              </span>

              <span
                className="
                  flex
                  items-center
                  gap-1
                  text-xs
                  font-medium
                  text-violet-400
                  transition-all
                  duration-200
                  group-hover:gap-2
                "
              >
                Read Brief

                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}