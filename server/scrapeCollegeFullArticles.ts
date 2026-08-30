import fs from "fs/promises";
import path from "path";
import { createHash } from "node:crypto";
import { createLegalSiteAxios, normalizeArticleFetchUrl } from "./legalHttp";
import { runCustomScrape } from "./customScrape";
import { assertAllowedExternalUrl } from "./externalUrlAllowlist";
import { extractArticleFromPage } from "./extractArticleHtml";
import { collectArticleImagesFromHtml } from "./articleImageWhitelist";
import { importArticles } from "./legalArticleStore";
import { importScrapedImages } from "./legalImageStore";

type Source = { url: string; label: string };

type FullArticleRow = {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
  scrapedAt: string;
  date?: string;
  content: string;
  images: string[];
};

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
  "三方协议",
  "兼职",
  "租房",
  "押金",
  "网贷",
  "诈骗",
  "反诈",
  "消费维权",
  "青年",
  "未成年人",
];

const STORE_FILE = path.join(process.cwd(), "data", "college-articles-full.json");

function normalizeTitle(title: string): string {
  return (title || "")
    .replace(/[【】\[\]（）()“”"'《》·\s:：,，。.!！？?、\-]/g, "")
    .toLowerCase();
}

function articleId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 24);
}

function isCollegeTopic(title: string): boolean {
  const t = (title || "").toLowerCase();
  return KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function classifyCategory(title: string): string {
  const t = title.toLowerCase();
  if (/(活动|宣传周|启动|开幕|讲座|进校园|实践)/.test(t)) return "普法动态·主题活动";
  if (/(公安|法院|检察|司法局|执法|法治副校长|普法责任)/.test(t)) return "普法动态·谁执法谁普法";
  if (/(会议|通报|方案|通知|部署|推进|工作)/.test(t)) return "普法动态·工作交流";
  return "普法动态·普法集锦";
}

async function writeFullRows(rows: FullArticleRow[]) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(rows, null, 2), "utf-8");
}

async function main() {
  const http = createLegalSiteAxios();
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const fullRows: FullArticleRow[] = [];
  const imagePool = new Set<string>();

  for (const src of SOURCES) {
    try {
      const result = await runCustomScrape(http, src.url, "articles", 240, "大学生法律热点");
      if (result.kind !== "articles") continue;

      for (const item of result.items) {
        if (!isCollegeTopic(item.title)) continue;
        let url: string;
        try {
          url = assertAllowedExternalUrl(item.url).href;
        } catch {
          continue;
        }
        const norm = normalizeTitle(item.title);
        if (seenUrl.has(url) || seenTitle.has(norm)) continue;

        try {
          const fetchHref = normalizeArticleFetchUrl(new URL(url)).href;
          const resp = await http.get(fetchHref);
          const html = String(resp.data);
          const parsed = extractArticleFromPage(html, fetchHref);
          const plain = parsed.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (plain.length < 100) continue;
          const images = collectArticleImagesFromHtml(parsed.content || "", fetchHref, 24);
          images.forEach((img) => imagePool.add(img));

          seenUrl.add(url);
          seenTitle.add(norm);
          fullRows.push({
            id: articleId(url),
            title: parsed.title?.trim() || item.title.trim(),
            url,
            source: src.label,
            category: classifyCategory(item.title),
            scrapedAt: item.scrapedAt,
            date: parsed.date || item.scrapedAt.slice(0, 10),
            content: parsed.content,
            images,
          });
        } catch {
          // skip broken/unreachable pages
        }
      }
      console.log(`[OK] ${src.label}: ${fullRows.length} 篇累计`);
    } catch (e) {
      console.warn(`[WARN] ${src.label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  fullRows.sort((a, b) => (a.scrapedAt < b.scrapedAt ? 1 : -1));
  await writeFullRows(fullRows);

  const articleImport = await importArticles(
    fullRows.map((r) => ({
      title: r.title,
      url: r.url,
      category: r.category,
      scrapedAt: r.scrapedAt,
    }))
  );

  const imageImport = await importScrapedImages([...imagePool], {
    category: "大学生法律热点正文图",
    source: "全文爬取",
  });

  console.log(
    JSON.stringify(
      {
        fullArticleCount: fullRows.length,
        imageCount: imagePool.size,
        articleImport,
        imageImport,
        sampleTitles: fullRows.slice(0, 8).map((x) => x.title),
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

