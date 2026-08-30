import { createLegalSiteAxios, normalizeArticleFetchUrl } from "./legalHttp";
import { runCustomScrape } from "./customScrape";
import { importArticles } from "./legalArticleStore";
import { extractArticleFromPage } from "./extractArticleHtml";
import * as cheerio from "cheerio";

type Source = {
  url: string;
  label: string;
};

type ImportRow = {
  title: string;
  url: string;
  category: string;
  scrapedAt: string;
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

const COLLEGE_KEYWORDS = [
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
  "未成年人",
  "青年",
];

const ACTIVITY_HINTS = ["活动", "宣传周", "启动", "开幕", "大赛", "讲座", "进校园"];
const LAW_ENFORCE_HINTS = ["公安", "法院", "检察", "司法局", "执法", "法治副校长", "普法责任"];
const WORK_HINTS = ["会议", "通报", "方案", "通知", "部署", "推进", "工作"];

function normalizeTitle(title: string): string {
  return title.replace(/[【】\[\]（）()“”"'《》·\s:：,，。.!！？?、\-]/g, "").toLowerCase();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w.toLowerCase()));
}

function isCollegeRelated(title: string): boolean {
  const t = title.toLowerCase();
  return hasAny(t, COLLEGE_KEYWORDS);
}

function classifyCategory(title: string): string {
  const t = title.toLowerCase();
  if (hasAny(t, ACTIVITY_HINTS)) return "普法动态·主题活动";
  if (hasAny(t, LAW_ENFORCE_HINTS)) return "普法动态·谁执法谁普法";
  if (hasAny(t, WORK_HINTS)) return "普法动态·工作交流";
  return "普法动态·普法集锦";
}

async function main() {
  const http = createLegalSiteAxios();
  const byUrl = new Set<string>();
  const byNormTitle = new Set<string>();
  const rows: ImportRow[] = [];

  for (const src of SOURCES) {
    try {
      const result = await runCustomScrape(http, src.url, "articles", 220, "大学生普法动态");
      if (result.kind !== "articles") continue;
      for (const item of result.items) {
        const title = item.title.trim();
        const url = item.url.trim();
        if (!title || !url) continue;
        if (!isCollegeRelated(title)) continue;
        // 仅保留能解析出正文的详情页，减少“无法加载正文”的情况
        try {
          const fetchHref = normalizeArticleFetchUrl(new URL(url)).href;
          const resp = await http.get(fetchHref);
          const parsed = extractArticleFromPage(String(resp.data), fetchHref);
          const plainText = parsed.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (plainText.length < 80) continue;
          const $ = cheerio.load(parsed.content || "");
          const hasImage = $("img[src]").length > 0;
          // 至少满足“有正文”，图片缺失可接受（前端仍可打开原文）
          if (!hasImage && plainText.length < 140) continue;
        } catch {
          continue;
        }
        const norm = normalizeTitle(title);
        if (byUrl.has(url) || byNormTitle.has(norm)) continue;
        byUrl.add(url);
        byNormTitle.add(norm);
        rows.push({
          title,
          url,
          category: classifyCategory(title),
          scrapedAt: item.scrapedAt,
        });
      }
      console.log(`[OK] ${src.label}: ${rows.length} 条累计`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[WARN] ${src.label}: ${msg}`);
    }
  }

  const result = await importArticles(rows);
  console.log(
    JSON.stringify(
      {
        candidates: rows.length,
        imported: result.imported,
        skipped: result.skipped,
        total: result.total,
        categoryBreakdown: rows.reduce<Record<string, number>>((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {}),
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

