import { getSupabase, Env } from "./supabase";
import { fetchRSS } from "./rss";
import {
  selectTopArticles,
  generatePersonalizedAnalysis,
} from "./claude";

const MAX_ARTICLES_PER_SOURCE = 15;
const MAX_SOURCES_PER_RUN = 18;

/*
 * Number of interests ranked per Worker invocation.
 *
 * Interests themselves are NOT hard-coded.
 * They are loaded from Supabase.
 */
const INTERESTS_PER_BATCH = 3;

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
  // ============================================================
  // SCHEDULED JOBS
  // ============================================================

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ) {
    console.log(
      `PRAXIS scheduled job: ${event.cron}`
    );

    /*
     * 05:00 UTC
     * Ingest RSS feeds.
     */
    if (event.cron === "0 5 * * *") {
      await ingestSources(env);
      return;
    }

    /*
     * 05:10 UTC
     * First 3 interests from Supabase.
     */
    if (event.cron === "10 5 * * *") {
      await rankInterestBatch(
        env,
        0
      );
      return;
    }

    /*
     * 05:20 UTC
     * Next 3 interests from Supabase.
     */
    if (event.cron === "20 5 * * *") {
      await rankInterestBatch(
        env,
        1
      );
      return;
    }

    /*
     * 05:30 UTC
     * Final 3 interests from Supabase.
     */
    if (event.cron === "30 5 * * *") {
      await rankInterestBatch(
        env,
        2
      );
      return;
    }

    console.log(
      `Unknown cron trigger: ${event.cron}`
    );
  },

  // ============================================================
  // HTTP
  // ============================================================

  async fetch(
    request: Request,
    env: Env
  ) {
    try {
      const url =
        new URL(request.url);

      // ============================================================
      // CORS
      // ============================================================

      if (
        request.method ===
        "OPTIONS"
      ) {
        return new Response(
          null,
          {
            status: 204,
            headers:
              CORS_HEADERS,
          }
        );
      }

      // ============================================================
      // ARTICLE ANALYSIS
      // ============================================================

      if (
        url.pathname ===
          "/analyze" &&
        request.method ===
          "POST"
      ) {
        return await handleAnalysis(
          request,
          env
        );
      }

      // ============================================================
      // MANUAL RSS INGEST
      // ============================================================

      if (
        url.pathname ===
        "/ingest"
      ) {
        await ingestSources(
          env
        );

        return new Response(
          "PRAXIS RSS ingestion completed",
          {
            status: 200,
            headers:
              CORS_HEADERS,
          }
        );
      }

      // ============================================================
      // MANUAL RANKING BATCH
      //
      // /rank?batch=1
      // /rank?batch=2
      // /rank?batch=3
      // ============================================================

      if (
        url.pathname ===
        "/rank"
      ) {
        const batchParam =
          url.searchParams.get(
            "batch"
          );

        const batchNumber =
          Number(
            batchParam
          );

        if (
          !Number.isInteger(
            batchNumber
          ) ||
          batchNumber < 1
        ) {
          return new Response(
            JSON.stringify({
              error:
                "batch must be a positive integer",
            }),
            {
              status: 400,
              headers:
                CORS_HEADERS,
            }
          );
        }

        await rankInterestBatch(
          env,
          batchNumber - 1
        );

        return new Response(
          `PRAXIS ranking batch ${batchNumber} completed`,
          {
            status: 200,
            headers:
              CORS_HEADERS,
          }
        );
      }

      // ============================================================
      // STATUS
      // ============================================================

      return new Response(
        JSON.stringify({
          status:
            "PRAXIS Worker ready",

          endpoints: {
            ingest:
              "/ingest",

            rank:
              "/rank?batch=1",

            analyze:
              "POST /analyze",
          },

          ranking:
            "Interests are loaded dynamically from Supabase.",
        }),
        {
          status: 200,
          headers:
            CORS_HEADERS,
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
            error instanceof
            Error
              ? error.message
              : "Unknown error",
        }),
        {
          status: 500,
          headers:
            CORS_HEADERS,
        }
      );
    }
  },
};

// ============================================================
// ARTICLE ANALYSIS
// ============================================================

async function handleAnalysis(
  request: Request,
  env: Env
): Promise<Response> {
  console.log(
    "Received /analyze request"
  );

  const body =
    (await request.json()) as AnalysisRequestBody;

  // ==========================================================
  // VALIDATE
  // ==========================================================

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

  // ==========================================================
  // GENERATE ANALYSIS
  // ==========================================================

  const result =
    await generatePersonalizedAnalysis(
      env,
      body.profile,
      body.article
    );

  const supabase =
    getSupabase(env);

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

  // ==========================================================
  // CHECK EXISTING ANALYSIS
  // ==========================================================

  const {
    data: existingAnalysis,
    error: existingError,
  } = await supabase
    .from(
      "article_analyses"
    )
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

  if (
    existingError
  ) {
    throw existingError;
  }

  let savedAnalysis;

  // ==========================================================
  // UPDATE
  // ==========================================================

  if (
    existingAnalysis
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "article_analyses"
      )
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

    if (error) {
      throw error;
    }

    savedAnalysis =
      data;
  }

  // ==========================================================
  // INSERT
  // ==========================================================

  else {
    const {
      data,
      error,
    } = await supabase
      .from(
        "article_analyses"
      )
      .insert(
        analysisData
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    savedAnalysis =
      data;
  }

  console.log(
    `Successfully saved analysis for article ${body.article.id}`
  );

  return new Response(
    JSON.stringify(
      savedAnalysis
    ),
    {
      status: 200,
      headers:
        CORS_HEADERS,
    }
  );
}

// ============================================================
// RSS INGESTION
// ============================================================

async function ingestSources(
  env: Env
) {
  const supabase =
    getSupabase(env);

  console.log(
    "Starting PRAXIS RSS ingestion"
  );

  // ==========================================================
  // GET ACTIVE SOURCES + THEIR INTEREST
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
    .eq(
      "active",
      true
    );

  if (
    sourceError
  ) {
    throw sourceError;
  }

  const sourcesToProcess =
    (
      sources ??
      []
    ).slice(
      0,
      MAX_SOURCES_PER_RUN
    );

  console.log(
    `Found ${sources?.length ?? 0} active sources`
  );

  console.log(
    `Processing ${sourcesToProcess.length} sources`
  );

  // ==========================================================
  // PROCESS SOURCES
  // ==========================================================

  await Promise.all(
    sourcesToProcess.map(
      async (
        source
      ) => {
        if (
          !source.rss_url
        ) {
          return;
        }

        try {
          // ======================================================
          // FETCH RSS
          // ======================================================

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
          // GET SOURCE INTEREST
          //
          // At runtime Supabase returns this singular FK
          // relationship as an object.
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

          if (
            !categoryName
          ) {
            console.warn(
              `${source.name} has no mapped interest`
            );
          }

          // ======================================================
          // BUILD ARTICLE ROWS
          // ======================================================

          const rows =
            limitedArticles.map(
              (
                article
              ) => ({
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
          // UPSERT ARTICLES
          //
          // Existing URL = update
          // New URL      = insert
          // ======================================================

          if (
            rows.length >
            0
          ) {
            const {
              error:
                saveError,
            } =
              await supabase
                .from(
                  "articles"
                )
                .upsert(
                  rows,
                  {
                    onConflict:
                      "url",
                  }
                );

            if (
              saveError
            ) {
              throw saveError;
            }
          }

          console.log(
            `${source.name}: ${limitedArticles.length} articles saved`
          );
        } catch (
          error
        ) {
          console.error(
            `Failed ${source.name}`,
            error
          );
        }
      }
    )
  );

  console.log(
    "PRAXIS RSS ingestion complete"
  );
}

// ============================================================
// RANK ONE DYNAMIC INTEREST BATCH
// ============================================================

async function rankInterestBatch(
  env: Env,
  batchIndex: number
) {
  const supabase =
    getSupabase(env);

  console.log(
    `Starting PRAXIS ranking batch ${batchIndex + 1}`
  );

  // ==========================================================
  // 1. GET ALL INTERESTS FROM SUPABASE
  //
  // Nothing is hard-coded here.
  // ==========================================================

  const {
    data: allInterests,
    error:
      interestError,
  } = await supabase
    .from(
      "interests"
    )
    .select(
      "id, name"
    )
    .order(
      "id",
      {
        ascending:
          true,
      }
    );

  if (
    interestError
  ) {
    throw interestError;
  }

  if (
    !allInterests ||
    allInterests.length ===
      0
  ) {
    console.log(
      "No interests found in Supabase"
    );

    return;
  }

  console.log(
    `Found ${allInterests.length} interests in Supabase`
  );

  // ==========================================================
  // 2. CREATE BATCH DYNAMICALLY
  // ==========================================================

  const startIndex =
    batchIndex *
    INTERESTS_PER_BATCH;

  const endIndex =
    startIndex +
    INTERESTS_PER_BATCH;

  const batchInterests =
    allInterests.slice(
      startIndex,
      endIndex
    );

  if (
    batchInterests.length ===
    0
  ) {
    console.log(
      `No interests exist for batch ${batchIndex + 1}`
    );

    return;
  }

  console.log(
    `Batch ${batchIndex + 1}: ${batchInterests
      .map(
        (
          interest
        ) =>
          interest.name
      )
      .join(", ")}`
  );

  // ==========================================================
  // 3. DATE RANGE
  // ==========================================================

  const {
    date,
    start,
    end,
  } =
    getYesterdayRange();

  console.log(
    `Processing articles for ${date}`
  );

  // ==========================================================
  // 4. GET CATEGORY NAMES
  // ==========================================================

  const categoryNames =
    batchInterests.map(
      (
        interest
      ) =>
        interest.name
    );

  // ==========================================================
  // 5. GET ARTICLES ONLY FOR THIS BATCH
  // ==========================================================

  const {
    data: articles,
    error:
      articleError,
  } = await supabase
    .from(
      "articles"
    )
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
    )
    .in(
      "category",
      categoryNames
    );

  if (
    articleError
  ) {
    throw articleError;
  }

  console.log(
    `Found ${articles?.length ?? 0} articles for ranking batch ${batchIndex + 1}`
  );

  // ==========================================================
  // 6. DELETE OLD PICKS ONLY FOR THIS BATCH
  //
  // Important:
  //
  // We do NOT delete daily articles belonging to interests
  // processed by the other Worker invocations.
  // ==========================================================

  const interestIds =
    batchInterests.map(
      (
        interest
      ) =>
        interest.id
    );

  const {
    error:
      deleteError,
  } = await supabase
    .from(
      "daily_articles"
    )
    .delete()
    .eq(
      "brief_date",
      date
    )
    .in(
      "interest_id",
      interestIds
    );

  if (
    deleteError
  ) {
    throw deleteError;
  }

  // ==========================================================
  // 7. RANK EACH INTEREST SEQUENTIALLY
  // ==========================================================

  for (
    const interest of
    batchInterests
  ) {
    const candidates =
      (
        articles ??
        []
      ).filter(
        (
          article
        ) =>
          article.category ===
          interest.name
      );

    console.log(
      `${interest.name}: ${candidates.length} candidate articles`
    );

    if (
      candidates.length <
      3
    ) {
      console.log(
        `Not enough articles for ${interest.name}: ${candidates.length}`
      );

      continue;
    }

    console.log(
      `Ranking ${candidates.length} articles for ${interest.name}`
    );

    try {
      // ======================================================
      // CLAUDE RANKING
      // ======================================================

      const selected =
        await selectTopArticles(
          env,
          interest.name,
          candidates
        );

      if (
        selected.length !==
        3
      ) {
        throw new Error(
          `Claude returned ${selected.length} articles for ${interest.name}; expected exactly 3`
        );
      }

      // ======================================================
      // BUILD DAILY ARTICLE ROWS
      // ======================================================

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

      // ======================================================
      // SAVE DAILY ARTICLES
      // ======================================================

      const {
        error:
          dailyError,
      } = await supabase
        .from(
          "daily_articles"
        )
        .insert(rows);

      if (
        dailyError
      ) {
        throw dailyError;
      }

      console.log(
        `${interest.name}: saved exactly 3 top articles`
      );
    } catch (
      error
    ) {
      console.error(
        `Failed ranking ${interest.name}`,
        error
      );
    }
  }

  console.log(
    `PRAXIS ranking batch ${batchIndex + 1} complete`
  );
}

// ============================================================
// YESTERDAY UTC RANGE
// ============================================================

function getYesterdayRange() {
  const yesterday =
    new Date();

  yesterday.setUTCDate(
    yesterday.getUTCDate() -
      1
  );

  const date =
    yesterday
      .toISOString()
      .split("T")[0];

  const start =
    `${date}T00:00:00.000Z`;

  const endDate =
    new Date(
      `${date}T00:00:00.000Z`
    );

  endDate.setUTCDate(
    endDate.getUTCDate() +
      1
  );

  const end =
    endDate.toISOString();

  return {
    date,
    start,
    end,
  };
}