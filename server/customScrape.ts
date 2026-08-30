import * as cheerio from "cheerio";
import type { AxiosInstance } from "axios";
import { assertAllowedExternalUrl } from "./externalUrlAllowlist";

export type CustomScrapeKind = "articles" | "images" | "videos";

export type CustomArticleRow = {
  title: string;
  url: string;
  category: string;
  scrapedAt: string;
};

export type CustomVideoRow = {
  url: string;
  title: string;
  category: string;
  scrapedAt: string;
};

const ASSET_EXT =
  /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff2?|ttf|eot|pdf|zip|rar)(\?|$)/i;

function looksLikeArticlePath(abs: string, base: URL): boolean {
  try {
    const u = new URL(abs);
    if (u.hostname !== base.hostname) return false;
  } catch {
    return false;
  }
  if (ASSET_EXT.test(abs)) return false;
  const path = new URL(abs).pathname;
  if (path.length < 6) return false;
  if (/\.(html|shtml|htm|jsp|php|aspx)(\?.*)?$/i.test(abs)) return true;
  if (/\/\d{4}\/\d{1,2}\//.test(path)) return true;
  if (/\/(content|article|news|detail|view)\b/i.test(path)) return true;
  return false;
}

export async function runCustomScrape(
  http: AxiosInstance,
  pageUrlRaw: string,
  kind: CustomScrapeKind,
  limit: number,
  categoryLabel: string
): Promise<
  | { kind: "articles"; items: CustomArticleRow[] }
  | { kind: "images"; items: string[] }
  | { kind: "videos"; items: CustomVideoRow[] }
> {
  const pageUrl = assertAllowedExternalUrl(pageUrlRaw).href;
  const base = new URL(pageUrl);
  const response = await http.get(pageUrl);
  const $ = cheerio.load(response.data);
  const scrapedAt = new Date().toISOString();
  const cat = categoryLabel.trim() || "自定义收录";
  const cap = Math.min(Math.max(1, limit), 500);

  if (kind === "images") {
    const out: string[] = [];
    const seen = new Set<string>();
    $("img[src]").each((_, el) => {
      if (out.length >= cap) return false;
      const src = $(el).attr("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const abs = new URL(src, base).href;
        if (!seen.has(abs)) {
          seen.add(abs);
          out.push(abs);
        }
      } catch {
        /* skip */
      }
    });
    return { kind: "images", items: out };
  }

  if (kind === "videos") {
    const seen = new Set<string>();
    const rows: CustomVideoRow[] = [];

    const push = (url: string, title: string) => {
      const u = url.trim();
      if (!u || seen.has(u) || rows.length >= cap) return;
      seen.add(u);
      rows.push({
        url: u,
        title: (title || "视频").trim().slice(0, 200),
        category: cat,
        scrapedAt,
      });
    };

    $("video source[src], video[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src)
        push(new URL(src, base).href, $(el).closest("video").attr("title") || "页面视频");
    });

    $('a[href*="youtube.com"], a[href*="youtu.be"], iframe[src*="youtube"]').each(
      (_, el) => {
        const href = $(el).attr("href") || $(el).attr("src");
        if (!href) return;
        try {
          const abs = new URL(href, base).href;
          push(abs, $(el).attr("title") || "外链视频");
        } catch {
          /* skip */
        }
      }
    );

    $("a[href]").each((_, el) => {
      if (rows.length >= cap) return false;
      const href = $(el).attr("href");
      if (!href) return;
      if (!/\.(mp4|webm|m3u8|ogg)(\?.*)?$/i.test(href)) return;
      try {
        const abs = new URL(href, base).href;
        push(abs, $(el).text().trim() || "视频文件");
      } catch {
        /* skip */
      }
    });

    return { kind: "videos", items: rows };
  }

  const seen = new Set<string>();
  const articles: CustomArticleRow[] = [];
  $("a[href]").each((_, el) => {
    if (articles.length >= cap) return false;
    const href = $(el).attr("href");
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!href || title.length < 4 || title.length > 300) return;
    let abs: string;
    try {
      abs = new URL(href, base).href;
    } catch {
      return;
    }
    if (seen.has(abs)) return;
    if (!looksLikeArticlePath(abs, base)) return;
    seen.add(abs);
    articles.push({
      title,
      url: abs,
      category: cat,
      scrapedAt,
    });
  });

  return { kind: "articles", items: articles };
}
