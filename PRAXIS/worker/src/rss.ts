export interface RSSArticle {
  title: string;
  url: string;
  description: string | null;
  image_url: string | null;
  published_at: string | null;
}

export async function fetchRSS(
  rssUrl: string
): Promise<RSSArticle[]> {
  const response = await fetch(rssUrl);

  if (!response.ok) {
    throw new Error(
      `RSS request failed: ${response.status} ${rssUrl}`
    );
  }

  const xml = await response.text();

  const articles: RSSArticle[] = [];

  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const item of items) {
    const title = extract(item, "title");
    const url =
      extract(item, "link") ||
      extract(item, "guid");

    const description =
      extract(item, "description");

    const published =
      extract(item, "pubDate") ||
      extract(item, "published") ||
      extract(item, "updated");

    if (!title || !url) continue;

    articles.push({
      title: cleanHTML(title),
      url,
      description: description
        ? cleanHTML(description)
        : null,
      image_url: null,
      published_at: published
        ? new Date(published).toISOString()
        : null,
    });
  }

  return articles;
}

function extract(xml: string, tag: string): string | null {
  const regex = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  const match = xml.match(regex);

  return match
    ? decode(match[1].trim())
    : null;
}

function cleanHTML(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}