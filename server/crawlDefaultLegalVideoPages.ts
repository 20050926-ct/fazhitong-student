import type { AxiosInstance } from "axios";
import { LEGAL_SITE_ORIGIN } from "./config";
import { assertAllowedExternalUrl } from "./externalUrlAllowlist";
import { runCustomScrape } from "./customScrape";
import { importScrapedVideos, type VideoImportRow } from "./legalVideoStore";
import { MOJ_ZHFX_WSP_LIST_URL, scrapeMojZhfxWspMicroVideos } from "./scrapeMojZhfxWspVideos";

/** 默认在允许域名内尝试抓取的列表页（页面结构变化时可能 0 条，可改用 Data 中心自定义 URL） */
/** 列表页可能改版导致 404；单页失败会跳过，不影响其它 URL。 */
export const DEFAULT_LEGAL_VIDEO_PAGE_URLS: string[] = [
  LEGAL_SITE_ORIGIN,
  "https://www.moj.gov.cn/",
  "https://news.cctv.com/law/",
];

export type CrawlLegalVideosResult = {
  pagesTried: string[];
  /** 含智慧普法微视频直链 + 其它列表页解析结果 */
  found: number;
  imported: number;
  skipped: number;
  total: number;
  microVideoChannel: string;
  microVideoRows: number;
};

/**
 * 从若干法治/媒体列表页提取直链视频、页面 video 源、常见外链，写入 scraped-videos.json。
 */
export async function crawlLegalVideosFromPages(
  http: AxiosInstance,
  pageUrls: string[] | undefined,
  categoryLabel: string
): Promise<CrawlLegalVideosResult> {
  const urls = (pageUrls?.length ? pageUrls : DEFAULT_LEGAL_VIDEO_PAGE_URLS).map((u) => u.trim()).filter(Boolean);
  const seen = new Set<string>();
  const batch: VideoImportRow[] = [];
  const pagesTried: string[] = [];

  let microVideoRows = 0;
  try {
    const mojRows = await scrapeMojZhfxWspMicroVideos(http, MOJ_ZHFX_WSP_LIST_URL, { maxDetails: 30 });
    microVideoRows = mojRows.length;
    for (const row of mojRows) {
      const key = `${row.url}\0${row.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      batch.push(row);
    }
    pagesTried.push(MOJ_ZHFX_WSP_LIST_URL);
  } catch {
    /* 栏目不可用时不影响其它来源 */
  }

  for (const raw of urls) {
    let href: string;
    try {
      href = assertAllowedExternalUrl(raw).href;
    } catch {
      continue;
    }
    pagesTried.push(href);
    try {
      const scraped = await runCustomScrape(http, href, "videos", 40, categoryLabel.trim() || "网络收录");
      if (scraped.kind !== "videos") continue;
      for (const row of scraped.items) {
        const key = `${row.url}\0${row.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
        batch.push({
          ...row,
          source: `crawl:${new URL(href).hostname}`,
          sourceKind: "scrape",
          description: `来源页面：${href}`,
        });
      }
    } catch {
      /* 单页 404 / 超时等不影响其它页面 */
    }
  }

  const result = await importScrapedVideos(batch);
  return {
    pagesTried,
    found: batch.length,
    imported: result.imported,
    skipped: result.skipped,
    total: result.total,
    microVideoChannel: MOJ_ZHFX_WSP_LIST_URL,
    microVideoRows,
  };
}
