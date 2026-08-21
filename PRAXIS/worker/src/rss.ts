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
      extract(item, "description") ||
      extract(item, "content:encoded");

    const published =
      extract(item, "pubDate") ||
      extract(item, "published") ||
      extract(item, "updated");

    if (!title || !url) continue;

    /*
     * =====================================================
     * IMAGE
     * =====================================================
     *
     * RSS feeds store images in several different ways.
     * Check the most common formats.
     */

    const image_url = extractImage(item);

    articles.push({
      title: cleanHTML(title),

      url: url.trim(),

      description: description
        ? cleanHTML(description)
        : null,

      image_url,

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
  const escapedTag = tag.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`,
    "i"
  );

  const match = xml.match(regex);

  return match
    ? decode(match[1].trim())
    : null;
}

/*
 * =========================================================
 * EXTRACT IMAGE
 * =========================================================
 *
 * Supports common RSS image formats:
 *
 * 1. media:content
 * 2. media:thumbnail
 * 3. enclosure
 * 4. <image><url>
 * 5. <img src="..."> inside description/content
 *
 * =========================================================
 */

function extractImage(
  item: string
): string | null {

  /*
   * -------------------------------------------------------
   * 1. media:content
   * -------------------------------------------------------
   */

  const mediaContent =
    extractAttribute(
      item,
      "media:content",
      "url"
    );

  if (
    mediaContent &&
    isImageUrl(mediaContent)
  ) {
    return mediaContent;
  }

  /*
   * -------------------------------------------------------
   * 2. media:thumbnail
   * -------------------------------------------------------
   */

  const mediaThumbnail =
    extractAttribute(
      item,
      "media:thumbnail",
      "url"
    );

  if (
    mediaThumbnail &&
    isImageUrl(mediaThumbnail)
  ) {
    return mediaThumbnail;
  }

  /*
   * -------------------------------------------------------
   * 3. enclosure
   * -------------------------------------------------------
   */

  const enclosureUrl =
    extractAttribute(
      item,
      "enclosure",
      "url"
    );

  const enclosureType =
    extractAttribute(
      item,
      "enclosure",
      "type"
    );

  if (
    enclosureUrl &&
    (
      enclosureType?.toLowerCase().startsWith("image/") ||
      isImageUrl(enclosureUrl)
    )
  ) {
    return enclosureUrl;
  }

  /*
   * -------------------------------------------------------
   * 4. <image><url>
   * -------------------------------------------------------
   */

  const imageBlock =
    extract(item, "image");

  if (imageBlock) {
    const imageUrl =
      extract(imageBlock, "url");

    if (
      imageUrl &&
      isImageUrl(imageUrl)
    ) {
      return imageUrl;
    }
  }

  /*
   * -------------------------------------------------------
   * 5. Image embedded in description/content
   * -------------------------------------------------------
   */

  const content =
    extract(item, "description") ||
    extract(item, "content:encoded");

  if (content) {
    const imageFromHTML =
      extractImageFromHTML(content);

    if (imageFromHTML) {
      return imageFromHTML;
    }
  }

  /*
   * -------------------------------------------------------
   * No image found
   * -------------------------------------------------------
   */

  return null;
}

/*
 * =========================================================
 * EXTRACT ATTRIBUTE
 * =========================================================
 */

function extractAttribute(
  xml: string,
  tag: string,
  attribute: string
): string | null {

  const escapedTag = tag.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  const escapedAttribute = attribute.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `<${escapedTag}\\b[^>]*\\b${escapedAttribute}\\s*=\\s*["']([^"']+)["']`,
    "i"
  );

  const match = xml.match(regex);

  return match
    ? decode(match[1].trim())
    : null;
}

/*
 * =========================================================
 * EXTRACT IMAGE FROM HTML
 * =========================================================
 */

function extractImageFromHTML(
  html: string
): string | null {

  /*
   * Look for:
   *
   * <img src="...">
   */

  const imgRegex =
    /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i;

  const imgMatch =
    html.match(imgRegex);

  if (imgMatch?.[1]) {
    const imageUrl =
      decode(imgMatch[1].trim());

    if (isImageUrl(imageUrl)) {
      return imageUrl;
    }

    /*
     * Some valid image URLs don't end with
     * .jpg/.png/etc because they contain query
     * parameters or are generated dynamically.
     *
     * If it is a normal HTTP URL, still accept it.
     */

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }
  }

  return null;
}

/*
 * =========================================================
 * CHECK IMAGE URL
 * =========================================================
 */

function isImageUrl(
  url: string
): boolean {

  const cleaned =
    url
      .trim()
      .toLowerCase();

  return (
    cleaned.startsWith("http://") ||
    cleaned.startsWith("https://")
  );
}

/*
 * =========================================================
 * CLEAN HTML
 * =========================================================
 */

function cleanHTML(
  value: string
): string {

  return decode(
    value
      .replace(
        /<!\[CDATA\[([\s\S]*?)\]\]>/g,
        "$1"
      )
      .replace(
        /<[^>]*>/g,
        ""
      )
      .trim()
  );
}

/*
 * =========================================================
 * DECODE HTML ENTITIES
 * =========================================================
 *
 * Handles:
 *
 * Named entities
 * Numeric decimal entities
 * Numeric hexadecimal entities
 * Double-encoded entities
 *
 * =========================================================
 */

function decode(
  value: string
): string {

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

      const number =
        Number(code);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(
          number
        );
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

      const number =
        parseInt(code, 16);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(
          number
        );
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
   * Decode numeric entities again.
   */

  decoded = decoded.replace(
    /&#(\d+);/g,
    (_match, code) => {

      const number =
        Number(code);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(
          number
        );
      } catch {
        return _match;
      }
    }
  );

  decoded = decoded.replace(
    /&#x([0-9a-f]+);/gi,
    (_match, code) => {

      const number =
        parseInt(code, 16);

      if (
        Number.isNaN(number) ||
        number < 0 ||
        number > 0x10ffff
      ) {
        return _match;
      }

      try {
        return String.fromCodePoint(
          number
        );
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

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}