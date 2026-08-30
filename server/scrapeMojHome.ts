import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

/** Matches Firestore `legal_articles` shape used in DataImport */
export type ScrapedLegalItem = {
  title: string;
  url: string;
  category: string;
  scrapedAt: string;
};

function toAbsolute(href: string, base: string): string | null {
  const t = href.trim();
  if (!t || t.startsWith("#") || t.toLowerCase().startsWith("javascript:")) {
    return null;
  }
  try {
    if (t.startsWith("http://") || t.startsWith("https://")) return t;
    return new URL(t, base).href;
  } catch {
    return null;
  }
}

function pushAnchors(
  $: cheerio.CheerioAPI,
  context: cheerio.Cheerio<AnyNode>,
  anchorSelector: string,
  category: string,
  seen: Set<string>,
  base: string,
  out: ScrapedLegalItem[]
) {
  const scrapedAt = new Date().toISOString();
  context.find(anchorSelector).each((_, el) => {
    const a = $(el);
    const title = a.text().replace(/\s+/g, " ").trim();
    const href = a.attr("href");
    if (!title || !href) return;
    const url = toAbsolute(href, base);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ title, url, category, scrapedAt });
  });
}

/**
 * Parse [中国普法网首页](http://legalinfo.moj.gov.cn/) HTML into link rows
 * (要闻、通知公告、普法动态、法治文化、依法治理、在线学法、法治热评等).
 */
export function scrapeMojHomepage(html: string, pageUrl: string): ScrapedLegalItem[] {
  const $ = cheerio.load(html);
  const base = pageUrl;
  const seen = new Set<string>();
  const out: ScrapedLegalItem[] = [];

  const idBlocks: [string, string][] = [
    ["#doc1_0", "通知公告"],
    ["#doc1_1", "专题·图解"],
    ["#doc2_0", "普法动态·主题活动"],
    ["#doc2_1", "普法动态·谁执法谁普法"],
    ["#doc3_0", "普法动态·普法集锦"],
    ["#doc3_1", "普法动态·工作交流"],
    ["#doc3_2", "普法动态·统筹推进五项工作"],
    ["#doc4_0", "法治文化·名人名言"],
    ["#doc4_1", "法治文化·文艺文萃"],
    ["#doc5_0", "法治文化·法史故事"],
    ["#doc5_1", "法治文化·环球法治"],
    ["#doc5_2", "法治文化·文化阵地"],
    ["#doc8_0", "在线学法·微视频"],
    ["#doc8_1", "在线学法·动漫"],
    ["#doc8_2", "在线学法·漫画"],
    ["#doc11_0", "依法治理·地方依法治理"],
    ["#doc11_1", "依法治理·行业依法治理"],
    ["#doc12_0", "依法治理·基层依法治理"],
    ["#doc12_1", "依法治理·法治创建"],
    ["#doc20_0", "法治热评"],
    ["#doc20_1", "理论文章"],
  ];

  for (const [sel, cat] of idBlocks) {
    const root = $(sel);
    if (root.length) {
      pushAnchors($, root, "a[href]", cat, seen, base, out);
    }
  }

  $(".lawServcent").each((_, el) => {
    const block = $(el);
    const tit = block.find(".reguTit").first().text().replace(/\s/g, "");
    if (tit.includes("要闻")) {
      pushAnchors($, block, "ul.geguLis a[href]", "要闻", seen, base, out);
    }
  });

  $(".lawyer_info_right").each((_, el) => {
    const block = $(el);
    const tit = block.find(".reguTit").first().text().replace(/\s/g, "");
    if (tit.includes("阅读推荐")) {
      pushAnchors($, block, ".geguLis a[href]", "阅读推荐", seen, base, out);
    }
    if (tit.includes("以案释法")) {
      pushAnchors($, block, ".geguLis a[href]", "以案释法", seen, base, out);
    }
  });

  return out;
}

/** 微视频栏目列表页（原 /api/scrape 数据源） */
export function scrapeWspListPage(
  html: string,
  pageUrl: string
): ScrapedLegalItem[] {
  const $ = cheerio.load(html);
  const base = pageUrl;
  const seen = new Set<string>();
  const out: ScrapedLegalItem[] = [];
  const scrapedAt = new Date().toISOString();

  $(".list_right_list li, .list_ul li, .news_list li").each((_, el) => {
    const a = $(el).find("a").first();
    const title = a.text().trim();
    const link = a.attr("href");
    if (!title || !link) return;
    const url = toAbsolute(link, base);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({
      title,
      url,
      category: "微视频",
      scrapedAt,
    });
  });

  return out;
}
