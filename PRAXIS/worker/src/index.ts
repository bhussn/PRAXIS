import { getSupabase, Env } from "./supabase";
import { fetchRSS } from "./rss";
import { selectTopArticles } from "./claude";

const MAX_ARTICLES_PER_SOURCE = 15;
const MAX_SOURCES_PER_RUN = 8;

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
      await runPipeline(env);

      return new Response(
        "PRAXIS pipeline completed",
        { status: 200 }
      );
    } catch (error) {
      console.error(error);

      return new Response(
        "Pipeline failed",
        { status: 500 }
      );
    }
  },
};

async function runPipeline(env: Env) {
  const supabase = getSupabase(env);

  console.log("Starting PRAXIS pipeline");

  // ==========================================
  // 1. GET ACTIVE SOURCES
  // ==========================================

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

  // ==========================================
  // 2. PROCESS 8 SOURCES IN PARALLEL
  // ==========================================

  const sourcesToProcess =
    (sources ?? []).slice(
      0,
      MAX_SOURCES_PER_RUN
    );

  console.log(
    `Processing ${sourcesToProcess.length} sources this run`
  );

  await Promise.all(
    sourcesToProcess.map(async (source) => {
      if (!source.rss_url) return;

      try {
        const rssArticles =
          await fetchRSS(source.rss_url);

        const limitedArticles =
          rssArticles.slice(
            0,
            MAX_ARTICLES_PER_SOURCE
          );

        const rows = limitedArticles.map(
          (article) => ({
            title: article.title,
            source: source.name,
            url: article.url,
            description: article.description,
            image_url: article.image_url,
            category:
              source.interests?.name ?? null,
            published_at:
              article.published_at,
          })
        );

        if (rows.length > 0) {
          const {
            error: saveError,
          } = await supabase
            .from("articles")
            .upsert(rows, {
              onConflict: "url",
              ignoreDuplicates: true,
            });

          if (saveError) {
            throw saveError;
          }
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
    })
  );

  console.log(
    "RSS ingestion completed for this run"
  );

  // ==========================================
  // 3. DETERMINE YESTERDAY
  // ==========================================

  const yesterday = new Date();

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
    new Date(yesterday);

  endDate.setUTCDate(
    endDate.getUTCDate() + 1
  );

  const end =
    endDate.toISOString();

  // ==========================================
  // 4. GET YESTERDAY'S ARTICLES
  // ==========================================

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
    .gte("published_at", start)
    .lt("published_at", end);

  if (articleError) {
    throw articleError;
  }

  console.log(
    `Found ${articles?.length ?? 0} articles for ${date}`
  );

  // ==========================================
  // 5. GET INTERESTS
  // ==========================================

  const {
    data: interests,
    error: interestError,
  } = await supabase
    .from("interests")
    .select("id, name");

  if (interestError) {
    throw interestError;
  }

  // ==========================================
  // 6. CLEAR PREVIOUS DAILY PICKS
  // ==========================================

  const {
    error: deleteError,
  } = await supabase
    .from("daily_articles")
    .delete()
    .eq("brief_date", date);

  if (deleteError) {
    throw deleteError;
  }

  // ==========================================
  // 7. CLAUDE RANKING IN PARALLEL
  // ==========================================

  await Promise.all(
    (interests ?? []).map(async (interest) => {

      const candidates =
        (articles ?? []).filter(
          (article) =>
            article.category === interest.name
        );

      if (candidates.length < 3) {
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

        // MUST SAVE EXACTLY 3
        if (selected.length !== 3) {
          throw new Error(
            `Claude returned ${selected.length} articles for ${interest.name}; expected exactly 3`
          );
        }

        // ======================================
        // 8. SAVE TOP 3
        // ======================================

        const rows =
          selected.map(
            (articleId, index) => ({
              interest_id: interest.id,
              article_id: articleId,
              brief_date: date,
              rank: index + 1,
            })
          );

        const {
          error: dailyError,
        } = await supabase
          .from("daily_articles")
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
    })
  );

  console.log(
    "PRAXIS daily pipeline complete"
  );
}