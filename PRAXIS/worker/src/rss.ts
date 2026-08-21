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

  const items =
    xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

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

      url: url.trim(),

      description: description
        ? cleanHTML(description)
        : null,

      image_url: null,

      published_at: published
        ? parsePublishedDate(published)
        : null,
    });
  }

  return articles;
}

/*
 * =========================================================
 * EXTRACT RSS FIELD
 * =========================================================
 */

function extract(
  xml: string,
  tag: string
): string | null {
  const regex = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  const match = xml.match(regex);

  return match
    ? decode(match[1].trim())
    : null;
}

/*
 * =========================================================
 * CLEAN HTML
 * =========================================================
 */

function cleanHTML(value: string): string {
  return decode(
    value
      .replace(
        /<!\[CDATA\[([\s\S]*?)\]\]>/g,
        "$1"
      )
      .replace(/<[^>]*>/g, "")
      .trim()
  );
}

/*
 * =========================================================
 * DECODE HTML ENTITIES
 *
 * Handles both named entities and numeric entities.
 *
 * Examples:
 *
 * &#8216;  -> ‘
 * &#8217;  -> ’
 * &#8220;  -> “
 * &#8221;  -> ”
 * &#8211;  -> –
 * &#8212;  -> —
 * &#8230;  -> …
 * &amp;    -> &
 * =========================================================
 */

function decode(value: string): string {
  let decoded = value;

  /*
   * Decode common named HTML entities.
   */

  decoded = decoded
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  /*
   * Decode numeric decimal entities.
   *
   * Example:
   * &#8217; -> ’
   */

  decoded = decoded.replace(
    /&#(\d+);/g,
    (_match, code) => {
      const number = Number(code);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(number);
      } catch {
        return _match;
      }
    }
  );

  /*
   * Decode numeric hexadecimal entities.
   *
   * Example:
   * &#x2019; -> ’
   */

  decoded = decoded.replace(
    /&#x([0-9a-f]+);/gi,
    (_match, code) => {
      const number = parseInt(code, 16);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(number);
      } catch {
        return _match;
      }
    }
  );

  /*
   * Some feeds double-encode entities.
   *
   * Example:
   *
   * &amp;#8217;
   *
   * First pass:
   * &#8217;
   *
   * Second pass:
   * ’
   *
   * Run the named entity replacement again.
   */

  decoded = decoded
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  /*
   * Decode numeric entities again in case the feed
   * double-encoded them.
   */

  decoded = decoded.replace(
    /&#(\d+);/g,
    (_match, code) => {
      const number = Number(code);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(number);
      } catch {
        return _match;
      }
    }
  );

  decoded = decoded.replace(
    /&#x([0-9a-f]+);/gi,
    (_match, code) => {
      const number = parseInt(code, 16);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(number);
      } catch {
        return _match;
      }
    }
  );

  /*
   * Normalize whitespace.
   */

  return decoded
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * =========================================================
 * PARSE PUBLISHED DATE
 * =========================================================
 */

function parsePublishedDate(
  value: string
): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}