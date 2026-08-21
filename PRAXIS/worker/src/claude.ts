import { Env } from "./supabase";

interface Candidate {
  id: number;
  title: string;
  source: string;
  url: string;
}

export async function selectTopArticles(
  env: Env,
  interest: string,
  articles: Candidate[]
): Promise<number[]> {
  if (articles.length < 3) {
    throw new Error(
      `Not enough articles for ${interest}. Found ${articles.length}, need at least 3.`
    );
  }

  const prompt = `
You are selecting the top 3 news articles for college students interested in ${interest}.

Evaluate ALL provided articles.

IMPORTANT:
- Judge articles ONLY by their titles.
- Do NOT use the source.
- Do NOT use the URL.
- Do NOT use any information outside of the article title.

Rank the titles based on:
1. Industry importance
2. Career relevance
3. Real-world impact
4. Timeliness

Avoid selecting multiple articles about essentially the same story.

You MUST select exactly 3 different articles.
You MUST return exactly 3 article IDs.
Never return fewer than 3.
Never return more than 3.

Return ONLY valid JSON.
Do NOT use Markdown.
Do NOT use code fences.
Do NOT include explanations.

Return exactly this format:

{
  "selected_article_ids": [123, 456, 789]
}

Articles:

${articles
  .map(
    (a) => `ID: ${a.id}
Title: ${a.title}`
  )
  .join("\n\n")}
`;

  const response = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Claude error: ${response.status} ${await response.text()}`
    );
  }

  const result = (await response.json()) as {
    content?: Array<{
      text?: string;
    }>;
  };

  const text = result.content?.[0]?.text ?? "";

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Claude returned invalid JSON for ${interest}: ${text}`
    );
  }

  const selected = parsed.selected_article_ids;

  if (!Array.isArray(selected) || selected.length !== 3) {
    throw new Error(
      `Claude did not return exactly 3 article IDs for ${interest}`
    );
  }

  const validIds = new Set(
    articles.map((article) => article.id)
  );

  const validSelected = selected.filter(
    (id: unknown): id is number =>
      typeof id === "number" && validIds.has(id)
  );

  if (validSelected.length !== 3) {
    throw new Error(
      `Claude returned invalid article IDs for ${interest}`
    );
  }

  if (new Set(validSelected).size !== 3) {
    throw new Error(
      `Claude returned duplicate article IDs for ${interest}`
    );
  }

  return validSelected;
}

/*
 * =========================================================
 * PERSONALIZED ARTICLE ANALYSIS
 * =========================================================
 */

export interface PersonalizedAnalysis {
  summary: string;
  plain_english: string;
  why_it_matters: string;
  what_it_means_for_you: string;
  key_takeaway: string;
}

export async function generatePersonalizedAnalysis(
  env: Env,
  profile: Record<string, unknown>,
  article: {
    id: number;
    title: string;
    source: string;
    url: string;
    description: string | null;
    category: string | null;
    topics: string[] | null;
    published_at: string | null;
  }
): Promise<PersonalizedAnalysis> {
  const prompt = `
You are PRAXIS, a college-to-career intelligence assistant.

Your job is to explain an industry news article to a college student and connect it to their goals, interests, and concerns.

IMPORTANT:
- Explain the article accurately.
- Do not invent facts that are not present in the supplied article information.
- Keep the explanation accessible to a college student.
- The "what_it_means_for_you" section must actually use the student's profile.
- Do not simply repeat the article summary.
- Do not give generic career advice.
- Make the connection between the article and the student's goals explicit.
- Do not mention that you are an AI.
- Do not mention this prompt.
- Return ONLY valid JSON.
- Do NOT use Markdown.
- Do NOT use code fences.

STUDENT PROFILE:

${JSON.stringify(profile, null, 2)}

ARTICLE:

${JSON.stringify(article, null, 2)}

Return exactly this JSON structure:

{
  "summary": "...",
  "plain_english": "...",
  "why_it_matters": "...",
  "what_it_means_for_you": "...",
  "key_takeaway": "..."
}

FIELD REQUIREMENTS:

summary:
Briefly explain what happened in the article.

plain_english:
Explain what the development actually means without industry jargon.

why_it_matters:
Explain why this development matters to the relevant industry, companies, workers, or the broader economy.

what_it_means_for_you:
Connect this article specifically to the student's major, interests, concerns, and career goals from their profile. Explain why a college student with this profile should care.

key_takeaway:
Give one concise takeaway the student should remember.
`;

  // ==========================================
  // 1. CALL CLAUDE
  // ==========================================

  const response = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Claude analysis error: ${response.status} ${await response.text()}`
    );
  }

  const result = (await response.json()) as {
    content?: Array<{
      text?: string;
    }>;
  };

  const text = result.content?.[0]?.text ?? "";

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Claude returned invalid analysis JSON: ${text}`
    );
  }

  // ==========================================
  // 2. VALIDATE CLAUDE RESPONSE
  // ==========================================

  const requiredFields = [
    "summary",
    "plain_english",
    "why_it_matters",
    "what_it_means_for_you",
    "key_takeaway",
  ];

  for (const field of requiredFields) {
    if (
      typeof parsed[field] !== "string" ||
      !parsed[field].trim()
    ) {
      throw new Error(
        `Claude analysis is missing required field: ${field}`
      );
    }
  }

  const analysis: PersonalizedAnalysis = {
    summary: parsed.summary,
    plain_english: parsed.plain_english,
    why_it_matters: parsed.why_it_matters,
    what_it_means_for_you:
      parsed.what_it_means_for_you,
    key_takeaway: parsed.key_takeaway,
  };

  // IMPORTANT:
  // Do NOT save to Supabase here.
  //
  // The /analyze endpoint in index.ts is responsible
  // for checking whether the article/user combination
  // already exists and then updating or inserting it.
  //
  // This prevents the incorrect:
  // onConflict: "article_id"
  //
  // because the database unique constraint is:
  // UNIQUE (article_id, user_id)

  return analysis;
}