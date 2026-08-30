import * as cheerio from "cheerio";

/**
 * 从司法部中国普法网 / 司法部主站等文章页 HTML 中提取标题、日期、正文。
 * 正文常见容器：#zhengwen、.TRS_Editor（政务发布系统）。
 */
export function extractArticleFromPage(html: string, pageHref: string): {
  title: string;
  date: string;
  content: string;
} {
  const $ = cheerio.load(html);
  const pageUrl = new URL(pageHref);

  let title = $("title").first().text().trim();
  title = title
    .replace(/[_＿][^_＿]+$/, "")
    .replace(/[-–—]\s*智慧普法平台.*$/i, "")
    .replace(/_智慧普法平台$/i, "")
    .trim();

  let bestHeading = "";
  $(".nwdetlHed").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > bestHeading.length && t.length < 500) {
      bestHeading = t;
    }
  });
  if (bestHeading.length > 4) {
    title = bestHeading;
  }

  const h1 = $("h1").first().text().replace(/\s+/g, " ").trim();
  if (h1.length > 8 && h1.length > title.length * 0.5) {
    title = h1;
  }

  const date = pickBestDate($);

  let content = "";
  if (isLegalDailyHost(pageUrl.hostname)) {
    const enp = extractLegalDailyEnpContent(html);
    const cleaned = sanitizeContentFragment(enp);
    if (estimateReadableTextLength(cleaned) >= 40) {
      content = cleaned;
    }
  }

  const preferredContainers = [
    "#zhengwen .TRS_Editor",
    "#zhengwen",
    ".TRS_Editor",
    ".Custom_UnionStyle",
    "#detail",
    ".detail",
    ".news_content",
    ".article-content",
    ".article-content-left",
    ".article",
    ".content",
    "#content",
    "main article",
    "article",
    "main",
  ];

  if (estimateReadableTextLength(content) < 80) {
    for (const sel of preferredContainers) {
      const raw = $(sel).first().html() || "";
      const cleaned = sanitizeContentFragment(raw);
      if (estimateReadableTextLength(cleaned) >= 80) {
        content = cleaned;
        break;
      }
    }
  }

  if (estimateReadableTextLength(content) < 80) {
    const scored = pickBestContentByScoring($);
    if (estimateReadableTextLength(scored) > estimateReadableTextLength(content)) {
      content = scored;
    }
  }

  if (estimateReadableTextLength(content) < 30) {
    content = buildFallbackSummaryContent($, title);
  }

  content = absolutizeResourceUrls(content, pageUrl);

  return { title: title || "无标题", date, content: content || "" };
}

function isLegalDailyHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "legaldaily.com.cn" || h.endsWith(".legaldaily.com.cn");
}

/** 法治网 / 部分政务站点使用的方正发布注释块 */
function extractLegalDailyEnpContent(html: string): string {
  const m = html.match(/<!--\s*enpcontent\s*-->([\s\S]*?)<!--\s*\/enpcontent\s*-->/i);
  if (m?.[1]) return m[1].trim();
  const m2 = html.match(/<!--\s*enpcontent\s*-->([\s\S]*?)(?=<!--\s*\/enpcontent\s*-->|$)/i);
  return (m2?.[1] || "").trim();
}

function pickBestDate($: cheerio.CheerioAPI): string {
  const dateCandidates: string[] = [];

  const pushDate = (text?: string | null) => {
    if (!text) return;
    const normalized = extractDateFromText(text);
    if (normalized) dateCandidates.push(normalized);
  };

  $(".nwdetIntro span, .nwdetIntro .cen_font, .news_date, .pubtime, .h-time, .time, .date, .info, .h-info")
    .each((_, el) => pushDate($(el).text()));

  $(".content-two .title div span, .details-left .title div span").each((_, el) =>
    pushDate($(el).text())
  );

  pushDate($('meta[name="PubDate"]').attr("content"));
  pushDate($('meta[name="publishdate"]').attr("content"));
  pushDate($('meta[name="publish_time"]').attr("content"));
  pushDate($('meta[name="article:published_time"]').attr("content"));
  pushDate($('meta[property="article:published_time"]').attr("content"));

  if (dateCandidates.length) return dateCandidates[0];

  const allText = $("body").text().slice(0, 4000);
  return extractDateFromText(allText) || "";
}

function extractDateFromText(text: string): string {
  const t = (text || "").replace(/\s+/g, " ");
  const m = t.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function estimateReadableTextLength(fragment: string): number {
  const plain = (fragment || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length;
}

function sanitizeContentFragment(rawHtml: string): string {
  if (!rawHtml) return "";
  const $clean = cheerio.load(`<div id="__c">${rawHtml}</div>`, null, false);
  $clean("#__c script, #__c style, #__c iframe, #__c noscript, #__c form").remove();
  $clean("#__c .share, #__c .sharebox, #__c .editor, #__c .copyright, #__c .left, #__c .right, #__c .advertisement, #__c .ads").remove();
  $clean("#__c img").each((_, el) => {
    const node = $clean(el);
    const src = (node.attr("src") || "").toLowerCase();
    const cls = (node.attr("class") || "").toLowerCase();
    const id = (node.attr("id") || "").toLowerCase();
    const w = Number(node.attr("width") || 0);
    const h = Number(node.attr("height") || 0);
    const looksLikeQrOrShare =
      /qrcode|qr-code|erweima|wxcode|weixin|share|fenxiang|二维码|扫码|关注/.test(
        `${src} ${cls} ${id}`
      );
    const isTinyIcon = (w > 0 && w <= 120) || (h > 0 && h <= 120);
    if (looksLikeQrOrShare || isTinyIcon) {
      node.remove();
    }
  });
  return $clean("#__c").html() || "";
}

function pickBestContentByScoring($: cheerio.CheerioAPI): string {
  const selector =
    "article, main, .article, .content, .detail, #detail, #content, [class*='article'], [class*='content'], [class*='detail'], [id*='article'], [id*='content'], [id*='detail']";
  let bestHtml = "";
  let bestScore = -Infinity;

  $(selector).each((_, el) => {
    const html = sanitizeContentFragment($(el).html() || "");
    if (!html) return;
    const root = cheerio.load(`<div id="__s">${html}</div>`, null, false);
    const text = root("#__s").text().replace(/\s+/g, " ").trim();
    const textLen = text.length;
    if (textLen < 80) return;
    const pCount = root("#__s p").length;
    const imgCount = root("#__s img").length;
    const linkTextLen = root("#__s a")
      .toArray()
      .map((a) => root(a).text().replace(/\s+/g, " ").trim().length)
      .reduce((sum, n) => sum + n, 0);
    const linkDensity = textLen > 0 ? linkTextLen / textLen : 0;
    const noisePenalty = /导航|相关阅读|责任编辑|分享到|返回首页/.test(text) ? 40 : 0;
    const score = textLen + pCount * 20 + imgCount * 10 - linkDensity * 200 - noisePenalty;
    if (score > bestScore) {
      bestScore = score;
      bestHtml = html;
    }
  });

  return bestHtml;
}

function buildFallbackSummaryContent($: cheerio.CheerioAPI, title: string): string {
  const desc =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";
  if (desc) {
    return `<p>${escapeHtml(desc)}</p>`;
  }
  const ps = $("body p")
    .toArray()
    .map((p) => $(p).text().replace(/\s+/g, " ").trim())
    .filter((x) => x.length >= 20)
    .slice(0, 6);
  if (ps.length) {
    return ps.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  }
  return title ? `<p>${escapeHtml(title)}</p>` : "";
}

function escapeHtml(text: string): string {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absolutizeResourceUrls(fragment: string, base: URL): string {
  if (!fragment?.trim()) return "";
  const $ = cheerio.load(`<div id="__root">${fragment}</div>`, null, false);

  $("#__root [src]").each((_, el) => {
    const node = $(el);
    const src = node.attr("src");
    if (!src || src.startsWith("data:") || /^https?:\/\//i.test(src)) return;
    try {
      node.attr("src", new URL(src, base).href);
    } catch {
      /* ignore */
    }
  });

  $("#__root img").each((_, el) => {
    const node = $(el);
    const src = node.attr("src");
    if (src && src.trim()) return;
    const lazy =
      node.attr("data-src") ||
      node.attr("data-original") ||
      node.attr("data-url") ||
      node.attr("data-echo");
    if (!lazy) return;
    try {
      node.attr("src", new URL(lazy, base).href);
    } catch {
      /* ignore */
    }
  });

  $("#__root [href]").each((_, el) => {
    const node = $(el);
    const href = node.attr("href");
    if (!href || href.startsWith("#") || href.toLowerCase().startsWith("javascript:")) return;
    if (/^https?:\/\//i.test(href)) return;
    try {
      node.attr("href", new URL(href, base).href);
    } catch {
      /* ignore */
    }
  });

  return $("#__root").html() || "";
}
