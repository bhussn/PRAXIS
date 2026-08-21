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

  const result = await response.json();

  const text =
    result.content?.[0]?.text ?? "";

  // Remove Markdown code fences if Claude adds them
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

  // Must return exactly 3
  if (
    !Array.isArray(selected) ||
    selected.length !== 3
  ) {
    throw new Error(
      `Claude did not return exactly 3 article IDs for ${interest}`
    );
  }

  // Make sure Claude only selected articles
  // that actually exist in the candidate list.
  const validIds = new Set(
    articles.map((article) => article.id)
  );

  const validSelected = selected.filter(
    (id: unknown): id is number =>
      typeof id === "number" &&
      validIds.has(id)
  );

  if (validSelected.length !== 3) {
    throw new Error(
      `Claude returned invalid article IDs for ${interest}`
    );
  }

  // Make sure all 3 are different.
  if (new Set(validSelected).size !== 3) {
    throw new Error(
      `Claude returned duplicate article IDs for ${interest}`
    );
  }

  return validSelected;
}