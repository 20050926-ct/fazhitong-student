import * as cheerio from "cheerio";

const BAD_KEYWORDS = [
  "logo",
  "icon",
  "qrcode",
  "ewm",
  "weixin",
  "wechat",
  "weibo",
  "xinlang",
  "sina",
  "shoucang",
  "dianzan",
  "thumbsup",
  "share",
  "jiucuo",
  "bottom_",
  "top_",
  "footer",
  "header",
  "nav",
  "banner_small",
];

const ARTICLE_IMAGE_HOST_SUFFIXES = [
  "legalinfo.moj.gov.cn",
  "moj.gov.cn",
  "moe.gov.cn",
  "people.com.cn",
  "chinacourt.org",
  "court.gov.cn",
  "news.cn",
  "xinhuanet.com",
  "legaldaily.com.cn",
];

function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ARTICLE_IMAGE_HOST_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`));
}

export function isWhitelistedArticleImage(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const href = u.href.toLowerCase();
    if (!(u.protocol === "http:" || u.protocol === "https:")) return false;
    if (!hostAllowed(u.hostname)) return false;
    if (href.endsWith(".svg")) return false;
    if (BAD_KEYWORDS.some((k) => href.includes(k))) return false;
    return true;
  } catch {
    return false;
  }
}

export function collectArticleImagesFromHtml(
  htmlFragment: string,
  pageUrl: string,
  max = 20
): string[] {
  const $ = cheerio.load(htmlFragment || "");
  const out: string[] = [];
  $("img[src]").each((_, el) => {
    if (out.length >= max) return false;
    const src = $(el).attr("src");
    if (!src) return;
    try {
      const abs = new URL(src, pageUrl).href;
      if (!isWhitelistedArticleImage(abs)) return;
      if (out.includes(abs)) return;
      out.push(abs);
    } catch {
      // ignore invalid img src
    }
  });
  return out;
}

