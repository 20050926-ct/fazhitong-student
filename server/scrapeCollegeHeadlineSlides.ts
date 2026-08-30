import * as cheerio from "cheerio";
import { createLegalSiteAxios, normalizeArticleFetchUrl } from "./legalHttp";
import { runCustomScrape } from "./customScrape";
import { assertAllowedExternalUrl } from "./externalUrlAllowlist";
import { importArticles } from "./legalArticleStore";
import { importScrapedImages } from "./legalImageStore";
import { extractArticleFromPage } from "./extractArticleHtml";
import {
  collectArticleImagesFromHtml,
  isWhitelistedArticleImage,
} from "./articleImageWhitelist";
import {
  writeCollegeHeadlineSlides,
  type CollegeHeadlineSlide,
} from "./collegeHeadlineSlideStore";

type Source = { url: string; label: string };
type Candidate = { title: string; url: string; source: string; scrapedAt: string };

const SOURCES: Source[] = [
  { url: "http://legalinfo.moj.gov.cn/", label: "中国普法网" },
  { url: "http://legalinfo.moj.gov.cn/ttzdxw/", label: "中国普法网-头条要闻" },
  { url: "https://www.moe.gov.cn/", label: "教育部" },
  { url: "https://www.moe.gov.cn/jyb_xwfb/s5147/", label: "教育部-新闻发布" },
  { url: "https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/", label: "教育部-工作动态" },
  { url: "https://www.chinacourt.org/", label: "中国法院网" },
  { url: "https://www.court.gov.cn/", label: "最高法官网" },
  { url: "http://www.legaldaily.com.cn/", label: "法治日报网" },
];

const KEYWORDS = [
  "大学生",
  "高校",
  "校园",
  "学生",
  "实习",
  "就业",
  "兼职",
  "租房",
  "押金",
  "网贷",
  "反诈",
  "诈骗",
  "法治教育",
  "青年",
  "未成年人",
];

const PRIORITY_TITLE_KEYWORDS = ["大学生", "高校", "毕业生", "校园"];

function normalizeTitle(title: string): string {
  return title.replace(/[【】\[\]（）()“”"'《》·\s:：,，。.!！？?、\-]/g, "").toLowerCase();
}

function isCollegeHeadline(title: string): boolean {
  const t = title.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function hasCollegeKeywordInText(text: string): boolean {
  const t = text.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function isGoodImage(url: string): boolean {
  return isWhitelistedArticleImage(url);
}

function isPreferredSlideImage(url: string): boolean {
  const u = url.toLowerCase();
  if (!isGoodImage(url)) return false;
  if (u.includes("scy_jyb_lgo_03.png")) return false;
  if (u.includes("/style/img/")) return false;
  if (u.includes("/logo") || u.includes("logo.")) return false;
  if (u.endsWith(".svg")) return false;
  return true;
}

function titlePriorityScore(title: string): number {
  const t = title.toLowerCase();
  return PRIORITY_TITLE_KEYWORDS.reduce(
    (score, kw) => score + (t.includes(kw.toLowerCase()) ? 1 : 0),
    0
  );
}

function toAbs(src: string, base: string): string | null {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function pickImageFromHtml(html: string, pageUrl: string): string | null {
  const $ = cheerio.load(html);
  const candidates: string[] = [];
  const push = (v?: string | null) => {
    if (!v) return;
    const abs = toAbs(v, pageUrl);
    if (abs && isGoodImage(abs) && !candidates.includes(abs)) candidates.push(abs);
  };

  push($('meta[property="og:image"]').attr("content"));
  push($('meta[name="og:image"]').attr("content"));
  push($('meta[property="twitter:image"]').attr("content"));
  push($('meta[itemprop="image"]').attr("content"));

  $("article img[src], .article img[src], .content img[src], .main img[src], img[src]").each(
    (_, el) => {
      if (candidates.length >= 20) return false;
      push($(el).attr("src"));
    }
  );

  return candidates[0] || null;
}

function pickImageFromArticleContent(html: string, pageUrl: string): string | null {
  const parsed = extractArticleFromPage(html, pageUrl);
  if (!parsed.content) return null;
  const imgs = collectArticleImagesFromHtml(parsed.content, pageUrl, 20);
  return imgs[0] || null;
}

async function main() {
  const http = createLegalSiteAxios();
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const candidates: Candidate[] = [];

  for (const src of SOURCES) {
    try {
      const result = await runCustomScrape(http, src.url, "articles", 220, "要闻");
      if (result.kind !== "articles") continue;
      for (const item of result.items) {
        if (!isCollegeHeadline(item.title)) continue;
        const url = assertAllowedExternalUrl(item.url).href;
        const norm = normalizeTitle(item.title);
        if (seenUrl.has(url) || seenTitle.has(norm)) continue;
        seenUrl.add(url);
        seenTitle.add(norm);
        candidates.push({
          title: item.title.trim(),
          url,
          source: src.label,
          scrapedAt: item.scrapedAt,
        });
      }
      console.log(`[OK] ${src.label}: ${candidates.length} 条累计`);
    } catch (e) {
      console.warn(
        `[WARN] ${src.label}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  const qualified: Candidate[] = [];
  const qualifiedImages = new Map<string, string>();
  for (const c of candidates) {
    try {
      const fetchHref = normalizeArticleFetchUrl(new URL(c.url)).href;
      const res = await http.get(fetchHref);
      const html = String(res.data);
      const parsed = extractArticleFromPage(html, fetchHref);
      const plain = parsed.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (plain.length < 120) continue;
      if (!hasCollegeKeywordInText(c.title) && !hasCollegeKeywordInText(plain)) continue;
      qualified.push(c);
      const image =
        pickImageFromArticleContent(html, fetchHref) || pickImageFromHtml(html, fetchHref);
      if (image) qualifiedImages.set(c.url, image);
    } catch {
      // skip broken page
    }
  }

  const slides: CollegeHeadlineSlide[] = [];
  const seenImage = new Set<string>();
  const rankedSlideCandidates = qualified
    .map((c) => ({ c, image: qualifiedImages.get(c.url) || null }))
    .filter((x): x is { c: Candidate; image: string } => Boolean(x.image))
    .filter((x) => isPreferredSlideImage(x.image))
    .sort((a, b) => {
      const scoreDiff = titlePriorityScore(b.c.title) - titlePriorityScore(a.c.title);
      if (scoreDiff !== 0) return scoreDiff;
      return b.c.scrapedAt.localeCompare(a.c.scrapedAt);
    });

  for (const item of rankedSlideCandidates) {
    if (slides.length >= 4) break;
    if (seenImage.has(item.image)) continue;
    seenImage.add(item.image);
    slides.push({
      title: item.c.title,
      image: item.image,
      url: item.c.url,
      source: item.c.source,
      scrapedAt: item.c.scrapedAt,
    });
  }

  await writeCollegeHeadlineSlides(slides.slice(0, 4));
  const headlineRows = qualified.slice(0, 40).map((c) => ({
    title: c.title,
    url: c.url,
    category: "要闻",
    scrapedAt: c.scrapedAt,
  }));
  const headlineImport = await importArticles(headlineRows);
  const slideImport = await importArticles(
    slides.map((s) => ({
      title: s.title,
      url: s.url,
      category: "要闻",
      scrapedAt: s.scrapedAt,
    }))
  );
  const slideImageImport = await importScrapedImages(
    slides.map((s) => s.image).filter(Boolean),
    { category: "要闻头图", source: "头条轮播抓取" }
  );

  console.log(
    JSON.stringify(
      {
        candidateCount: candidates.length,
        qualifiedCount: qualified.length,
        slideCount: slides.length,
        headlineImport,
        slideImport,
        slideImageImport,
        titles: slides.map((s) => s.title),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

