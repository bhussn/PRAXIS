import { getSupabase, Env } from "./supabase";
import { fetchRSS } from "./rss";
import {
  selectTopArticles,
  generatePersonalizedAnalysis,
} from "./claude";

const MAX_ARTICLES_PER_SOURCE = 15;
const MAX_SOURCES_PER_RUN = 8;

interface AnalysisRequestBody {
  user_id: string;
  profile: Record<string, unknown>;

  article: {
    id: number;
    title: string;
    source: string;
    url: string;
    description: string | null;
    category: string | null;
    topics: string[] | null;
    published_at: string | null;
  };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ) {
    await runPipeline(env);
  },

  async fetch(
    request: Request,
    env: Env
  ) {
    try {
      const url = new URL(request.url);

      // ============================================================
      // CORS PREFLIGHT
      // ============================================================

      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        });
      }

      // ============================================================
      // ARTICLE ANALYSIS ENDPOINT
      // ============================================================

      if (
        url.pathname === "/analyze" &&
        request.method === "POST"
      ) {
        console.log(
          "Received /analyze request"
        );

        const body =
          (await request.json()) as AnalysisRequestBody;

        // ----------------------------------------------------------
        // Validate request
        // ----------------------------------------------------------

        if (!body.user_id) {
          throw new Error(
            "Missing user_id in analysis request"
          );
        }

        if (!body.profile) {
          throw new Error(
            "Missing profile in analysis request"
          );
        }

        if (!body.article) {
          throw new Error(
            "Missing article in analysis request"
          );
        }

        if (!body.article.id) {
          throw new Error(
            "Missing article ID in analysis request"
          );
        }

        console.log(
          `Generating analysis for article ${body.article.id}`
        );

        console.log(
          `Article title: ${body.article.title}`
        );

        console.log(
          `Article category: ${body.article.category}`
        );

        console.log(
          `User ID: ${body.user_id}`
        );

        // ----------------------------------------------------------
        // Generate personalized Claude analysis
        // ----------------------------------------------------------

        const result =
          await generatePersonalizedAnalysis(
            env,
            body.profile,
            body.article
          );

        console.log(
          `Successfully generated analysis for article ${body.article.id}`
        );

        // ==========================================================
        // SAVE ANALYSIS
        // ==========================================================

        const supabase =
          getSupabase(env);

        console.log(
          `Saving analysis for article ${body.article.id} and user ${body.user_id}`
        );

        const analysisData = {
          article_id:
            body.article.id,

          user_id:
            body.user_id,

          summary:
            result.summary,

          plain_english:
            result.plain_english,

          why_it_matters:
            result.why_it_matters,

          what_it_means_for_you:
            result.what_it_means_for_you,

          key_takeaway:
            result.key_takeaway,
        };

        // ----------------------------------------------------------
        // Check whether this user already has an analysis
        // ----------------------------------------------------------

        const {
          data: existingAnalysis,
          error: existingError,
        } = await supabase
          .from("article_analyses")
          .select("id")
          .eq(
            "article_id",
            body.article.id
          )
          .eq(
            "user_id",
            body.user_id
          )
          .maybeSingle();

        if (existingError) {
          console.error(
            "Failed checking existing article analysis:",
            existingError
          );

          throw new Error(
            `Failed checking existing article analysis: ${existingError.message}`
          );
        }

        let savedAnalysis;

        // ==========================================================
        // UPDATE EXISTING ANALYSIS
        // ==========================================================

        if (existingAnalysis) {
          console.log(
            `Updating existing analysis ${existingAnalysis.id}`
          );

          const {
            data,
            error: updateError,
          } = await supabase
            .from("article_analyses")
            .update({
              summary:
                analysisData.summary,

              plain_english:
                analysisData.plain_english,

              why_it_matters:
                analysisData.why_it_matters,

              what_it_means_for_you:
                analysisData.what_it_means_for_you,

              key_takeaway:
                analysisData.key_takeaway,
            })
            .eq(
              "id",
              existingAnalysis.id
            )
            .select()
            .single();

          if (updateError) {
            console.error(
              "Failed to update article analysis:",
              updateError
            );

            throw new Error(
              `Failed to update article analysis: ${updateError.message}`
            );
          }

          savedAnalysis = data;
        }

        // ==========================================================
        // INSERT NEW ANALYSIS
        // ==========================================================

        else {
          console.log(
            `Creating new analysis for article ${body.article.id}`
          );

          const {
            data,
            error: insertError,
          } = await supabase
            .from("article_analyses")
            .insert(analysisData)
            .select()
            .single();

          if (insertError) {
            console.error(
              "Failed to insert article analysis:",
              insertError
            );

            throw new Error(
              `Failed to insert article analysis: ${insertError.message}`
            );
          }

          savedAnalysis = data;
        }

        console.log(
          `Successfully saved analysis for article ${body.article.id}`
        );

        return new Response(
          JSON.stringify(savedAnalysis),
          {
            status: 200,
            headers: CORS_HEADERS,
          }
        );
      }

      // ============================================================
      // DAILY PIPELINE
      // ============================================================

      await runPipeline(env);

      return new Response(
        "PRAXIS pipeline completed",
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin":
              "*",
          },
        }
      );
    } catch (error) {
      console.error(
        "PRAXIS Worker error:",
        error
      );

      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        }),
        {
          status: 500,
          headers: CORS_HEADERS,
        }
      );
    }
  },
};

// ============================================================
// DAILY PRAXIS PIPELINE
// ============================================================

async function runPipeline(
  env: Env
) {
  const supabase =
    getSupabase(env);

  console.log(
    "Starting PRAXIS pipeline"
  );

  // ==========================================================
  // 1. GET ACTIVE SOURCES
  // ==========================================================

  const {
    data: sources,
    error: sourceError,
  } = await supabase
    .from("sources")
    .select(`
      id,
      name,
      rss_url,
      interest_id,
      interests!sources_interest_id_fkey (
        id,
        name
      )
    `)
    .eq("active", true);

  if (sourceError) {
    throw sourceError;
  }

  console.log(
    `Found ${sources?.length ?? 0} active sources`
  );

  // ==========================================================
  // 2. PROCESS SOURCES
  // ==========================================================

  const sourcesToProcess =
    (sources ?? []).slice(
      0,
      MAX_SOURCES_PER_RUN
    );

  console.log(
    `Processing ${sourcesToProcess.length} sources this run`
  );

  await Promise.all(
    sourcesToProcess.map(
      async (source) => {
        if (!source.rss_url) {
          return;
        }

        try {
          const rssArticles =
            await fetchRSS(
              source.rss_url
            );

          const limitedArticles =
            rssArticles.slice(
              0,
              MAX_ARTICLES_PER_SOURCE
            );

          // ======================================================
          // CATEGORY
          // ======================================================

          const sourceInterest =
            source.interests as unknown as
              | {
                  id: number;
                  name: string;
                }
              | null;

          const categoryName =
            sourceInterest?.name ??
            null;

          console.log(
            `${source.name} -> category: ${categoryName}`
          );

          // ======================================================
          // BUILD ARTICLE ROWS
          // ======================================================

          const rows =
            limitedArticles.map(
              (article) => ({
                title:
                  article.title,

                source:
                  source.name,

                url:
                  article.url,

                description:
                  article.description,

                image_url:
                  article.image_url,

                category:
                  categoryName,

                published_at:
                  article.published_at,
              })
            );

          // ======================================================
          // SAVE ARTICLES TO SUPABASE
          // ======================================================

          if (
            rows.length > 0
          ) {
            const {
              data: savedRows,
              error: saveError,
            } = await supabase
              .from("articles")
              .upsert(rows, {
                onConflict:
                  "url",
              })
              .select(`
                id,
                source,
                url,
                category,
                image_url
              `);

            if (saveError) {
              console.error(
                `Failed saving ${source.name}:`,
                saveError
              );

              throw saveError;
            }

            console.log(
              `${source.name} SAVED ROW DEBUG:`,
              JSON.stringify(
                (
                  savedRows ??
                  []
                ).slice(0, 3)
              )
            );
          }

          console.log(
            `${source.name}: ${limitedArticles.length} articles`
          );
        } catch (error) {
          console.error(
            `Failed ${source.name}`,
            error
          );
        }
      }
    )
  );

  console.log(
    "RSS ingestion completed for this run"
  );

  // ==========================================================
  // 3. DETERMINE YESTERDAY
  // ==========================================================

  const yesterday =
    new Date();

  yesterday.setUTCDate(
    yesterday.getUTCDate() - 1
  );

  const date =
    yesterday
      .toISOString()
      .split("T")[0];

  console.log(
    `Processing articles for ${date}`
  );

  const start =
    `${date}T00:00:00.000Z`;

  const endDate =
    new Date(
      `${date}T00:00:00.000Z`
    );

  endDate.setUTCDate(
    endDate.getUTCDate() + 1
  );

  const end =
    endDate.toISOString();

  // ==========================================================
  // 4. GET YESTERDAY'S ARTICLES
  // ==========================================================

  const {
    data: articles,
    error: articleError,
  } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      source,
      url,
      published_at,
      category
    `)
    .gte(
      "published_at",
      start
    )
    .lt(
      "published_at",
      end
    );

  if (articleError) {
    throw articleError;
  }

  console.log(
    `Found ${articles?.length ?? 0} articles for ${date}`
  );

  // ==========================================================
  // DEBUG ARTICLE CATEGORIES
  // ==========================================================

  console.log(
    "ARTICLE CATEGORY DEBUG:",
    JSON.stringify(
      (
        articles ??
        []
      )
        .slice(0, 20)
        .map(
          (article) => ({
            id:
              article.id,

            source:
              article.source,

            category:
              article.category,

            published_at:
              article.published_at,
          })
        )
    )
  );

  console.log(
    "UNIQUE CATEGORIES:",
    [
      ...new Set(
        (
          articles ??
          []
        ).map(
          (article) =>
            article.category
        )
      ),
    ]
  );

  // ==========================================================
  // 5. GET INTERESTS
  // ==========================================================

  const {
    data: interests,
    error: interestError,
  } = await supabase
    .from("interests")
    .select(
      "id, name"
    );

  if (interestError) {
    throw interestError;
  }

  // ==========================================================
  // 6. CLEAR PREVIOUS DAILY PICKS
  // ==========================================================

  const {
    error: deleteError,
  } = await supabase
    .from("daily_articles")
    .delete()
    .eq(
      "brief_date",
      date
    );

  if (deleteError) {
    throw deleteError;
  }

  // ==========================================================
  // 7. RANK ARTICLES
  // ==========================================================

  await Promise.all(
    (interests ?? []).map(
      async (interest) => {
        const candidates =
          (
            articles ??
            []
          ).filter(
            (article) =>
              article.category ===
              interest.name
          );

        if (
          candidates.length < 3
        ) {
          console.log(
            `Not enough articles for ${interest.name}: ${candidates.length}`
          );

          return;
        }

        console.log(
          `Ranking ${candidates.length} articles for ${interest.name}`
        );

        try {
          const selected =
            await selectTopArticles(
              env,
              interest.name,
              candidates
            );

          if (
            selected.length !== 3
          ) {
            throw new Error(
              `Claude returned ${selected.length} articles for ${interest.name}; expected exactly 3`
            );
          }

          // ==================================================
          // 8. SAVE TOP 3
          // ==================================================

          const rows =
            selected.map(
              (
                articleId,
                index
              ) => ({
                interest_id:
                  interest.id,

                article_id:
                  articleId,

                brief_date:
                  date,

                rank:
                  index + 1,
              })
            );

          const {
            error: dailyError,
          } = await supabase
            .from(
              "daily_articles"
            )
            .insert(rows);

          if (dailyError) {
            throw dailyError;
          }

          console.log(
            `${interest.name}: saved exactly 3 top articles`
          );
        } catch (error) {
          console.error(
            `Failed ranking ${interest.name}`,
            error
          );
        }
      }
    )
  );

  console.log(
    "PRAXIS daily pipeline complete"
  );
}