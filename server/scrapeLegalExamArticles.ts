import * as cheerio from "cheerio";
import { createLegalSiteAxios } from "./legalHttp";
import { writeLegalExamArticles, type LegalExamArticle } from "./legalExamArticleStore";

const LIST_ENDPOINT = "https://sc.12348.gov.cn/lmtt/findlist.shtml";
const BASE_URL = "https://sc.12348.gov.cn/";
const SCRAPE_SOURCE = "中国法律服务网-法考服务";

const SID_GROUPS = [
  { sid: "sfks-zcfg", label: "政策法规" },
  { sid: "sfks-tzgg", label: "通知公告" },
  { sid: "sfks-skdt", label: "法考动态" },
  { sid: "sfks-cjwt", label: "常见问题" },
];

type Candidate = {
  title: string;
  url: string;
  section: string;
  scrapedAt: string;
};

function toAbs(href: string): string {
  try {
    return new URL(href, BASE_URL).href;
  } catch {
    return href;
  }
}

function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

function extractDate(text: string): string | undefined {
  const m = text.match(/(20\d{2}-\d{2}-\d{2})/);
  return m?.[1];
}

function pickImage($: cheerio.CheerioAPI, pageUrl: string): string | undefined {
  const candidates = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[name="og:image"]').attr("content"),
    $(".content img").first().attr("src"),
    $("article img").first().attr("src"),
    $("img").first().attr("src"),
  ].filter(Boolean) as string[];

  for (const src of candidates) {
    const abs = toAbs(src);
    const l = abs.toLowerCase();
    if (l.includes("logo") || l.endsWith(".svg")) continue;
    if (abs.startsWith("http://") || abs.startsWith("https://")) {
      return abs;
    }
  }
  return undefined;
}

async function fetchListBySid(
  http: ReturnType<typeof createLegalSiteAxios>,
  sid: string,
  section: string
): Promise<Candidate[]> {
  const scrapedAt = new Date().toISOString();
  const form = new URLSearchParams({
    page: "1",
    sid,
    txt: "",
    op: "",
    date1: "",
    date2: "",
    pageSize: "12",
  });
  const res = await http.post(LIST_ENDPOINT, form.toString(), {
    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
  });
  const html = String(res.data);
  const $ = cheerio.load(html);
  const out: Candidate[] = [];
  const seen = new Set<string>();
  $('a[href*="lmtt/page/"]').each((_, el) => {
    const a = $(el);
    const title = normalizeTitle(a.text());
    const href = a.attr("href") || "";
    if (!title || !href) return;
    const url = toAbs(href);
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ title, url, section, scrapedAt });
  });
  return out;
}

async function enrichDetail(
  http: ReturnType<typeof createLegalSiteAxios>,
  c: Candidate
): Promise<LegalExamArticle> {
  try {
    const res = await http.get(c.url);
    const html = String(res.data);
    const $ = cheerio.load(html);
    const text = $.text().replace(/\s+/g, " ");
    const date = extractDate(text);
    const image = pickImage($, c.url);
    return {
      title: c.title,
      url: c.url,
      date,
      image,
      source: `${SCRAPE_SOURCE}-${c.section}`,
      scrapedAt: c.scrapedAt,
    };
  } catch {
    return {
      title: c.title,
      url: c.url,
      source: `${SCRAPE_SOURCE}-${c.section}`,
      scrapedAt: c.scrapedAt,
    };
  }
}

async function main() {
  const http = createLegalSiteAxios();
  const all: Candidate[] = [];
  const seen = new Set<string>();

  for (const g of SID_GROUPS) {
    try {
      const items = await fetchListBySid(http, g.sid, g.label);
      for (const it of items) {
        if (seen.has(it.url)) continue;
        seen.add(it.url);
        all.push(it);
      }
      console.log(`[OK] ${g.label}: ${items.length} 条`);
    } catch (e) {
      console.warn(`[WARN] ${g.label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const top = all.slice(0, 30);
  const enriched: LegalExamArticle[] = [];
  for (const item of top) {
    enriched.push(await enrichDetail(http, item));
  }

  await writeLegalExamArticles(enriched);
  console.log(
    JSON.stringify(
      {
        totalCandidates: all.length,
        written: enriched.length,
        titles: enriched.slice(0, 10).map((x) => x.title),
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

