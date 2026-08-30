import * as cheerio from "cheerio";
import type { AxiosInstance } from "axios";
import { assertAllowedExternalUrl } from "./externalUrlAllowlist";
import type { VideoImportRow } from "./legalVideoStore";

/** 司法部智慧普法平台「在线学法 · 微视频」栏目（列表 + 详情内嵌 mp4） */
export const MOJ_ZHFX_WSP_LIST_URL =
  "http://legalinfo.moj.gov.cn/pub/sfbzhfx/zhfxzxxf/zxxfwsp/";

function extractPlayUrlFromDetailHtml(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates: string[] = [];

  $("embed[src]").each((_, el) => {
    const s = $(el).attr("src");
    if (s) candidates.push(s);
  });
  $("embed[OLDSRC]").each((_, el) => {
    const s = $(el).attr("OLDSRC");
    if (s) candidates.push(s);
  });
  $("video[src]").each((_, el) => {
    const s = $(el).attr("src");
    if (s) candidates.push(s);
  });
  $("video source[src]").each((_, el) => {
    const s = $(el).attr("src");
    if (s) candidates.push(s);
  });

  for (const raw of candidates) {
    const t = raw.trim();
    if (!t || t.startsWith("data:")) continue;
    try {
      const abs = new URL(t, pageUrl).href;
      if (/\.(mp4|webm|m3u8)(\?.*)?$/i.test(abs)) return abs;
    } catch {
      /* skip */
    }
  }

  const m = html.match(/src="\.\/([^"]+\.(?:mp4|m3u8))"/i);
  if (m?.[1]) {
    try {
      return new URL(`./${m[1]}`, pageUrl).href;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 抓取智慧普法「微视频」列表，进入每条详情解析 embed/video 中的直链，供本站 HTML5 播放。
 */
export async function scrapeMojZhfxWspMicroVideos(
  http: AxiosInstance,
  listUrlRaw?: string,
  options?: { maxDetails?: number }
): Promise<VideoImportRow[]> {
  const listUrl = assertAllowedExternalUrl(listUrlRaw || MOJ_ZHFX_WSP_LIST_URL).href;
  const listRes = await http.get(listUrl);
  const $ = cheerio.load(listRes.data);
  const scrapedAt = new Date().toISOString();
  const maxDetails = Math.min(Math.max(1, options?.maxDetails ?? 25), 50);

  const listItems: { detailHref: string; title: string }[] = [];
  $(".rightSide_list li a").each((_, el) => {
    if (listItems.length >= maxDetails) return false;
    const href = $(el).attr("href");
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!href || title.length < 4) return;
    let abs: string;
    try {
      abs = new URL(href, listUrl).href;
    } catch {
      return;
    }
    const host = new URL(abs).hostname.toLowerCase();
    if (host !== "legalinfo.moj.gov.cn") return;
    listItems.push({ detailHref: abs, title: title.slice(0, 300) });
  });

  const rows: VideoImportRow[] = [];
  const seenPlay = new Set<string>();

  for (const { detailHref, title } of listItems) {
    try {
      const d = await http.get(detailHref);
      const play = extractPlayUrlFromDetailHtml(String(d.data), detailHref);
      if (!play || seenPlay.has(play)) continue;
      seenPlay.add(play);
      rows.push({
        url: play,
        title,
        category: "智慧普法微视频",
        scrapedAt,
        source: "moj-legalinfo-zhfx-wsp",
        description: `来源：司法部智慧普法平台「微视频」\n${detailHref}`,
        tag: "司法部",
        sourceKind: "scrape",
      });
    } catch {
      /* 单条详情失败则跳过 */
    }
  }

  return rows;
}
