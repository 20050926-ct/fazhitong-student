import { createLegalSiteAxios } from "./legalHttp";
import { runCustomScrape } from "./customScrape";
import { importArticles } from "./legalArticleStore";
import { importScrapedImages } from "./legalImageStore";

type Source = {
  url: string;
  label: string;
};

const SOURCES: Source[] = [
  { url: "http://legalinfo.moj.gov.cn/", label: "中国普法网" },
  { url: "https://legal.people.com.cn/", label: "人民网法治频道" },
  { url: "https://www.moe.gov.cn/", label: "教育部" },
  { url: "https://www.court.gov.cn/", label: "最高法" },
];

const KEYWORDS = [
  "大学生",
  "高校",
  "校园",
  "实习",
  "三方协议",
  "租房",
  "押金",
  "兼职",
  "网贷",
  "诈骗",
  "消费维权",
  "未成年人",
];

function hasCollegeKeyword(text: string): boolean {
  const t = text.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

async function main() {
  const http = createLegalSiteAxios();
  const articleRows: Array<{
    title: string;
    url: string;
    category: string;
    scrapedAt: string;
  }> = [];
  const imageUrls: string[] = [];
  const articleSeen = new Set<string>();
  const imageSeen = new Set<string>();

  for (const src of SOURCES) {
    try {
      const articleResult = await runCustomScrape(
        http,
        src.url,
        "articles",
        180,
        "大学生法律热点"
      );
      if (articleResult.kind === "articles") {
        for (const row of articleResult.items) {
          if (!hasCollegeKeyword(row.title)) continue;
          if (articleSeen.has(row.url)) continue;
          articleSeen.add(row.url);
          articleRows.push({
            title: row.title,
            url: row.url,
            category: "大学生法律热点",
            scrapedAt: row.scrapedAt,
          });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[articles] ${src.label} 抓取失败: ${msg}`);
    }

    try {
      const imageResult = await runCustomScrape(
        http,
        src.url,
        "images",
        120,
        "大学生法律热点"
      );
      if (imageResult.kind === "images") {
        for (const u of imageResult.items) {
          if (imageSeen.has(u)) continue;
          imageSeen.add(u);
          imageUrls.push(u);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[images] ${src.label} 抓取失败: ${msg}`);
    }
  }

  const articleImport = await importArticles(articleRows);
  const imageImport = await importScrapedImages(imageUrls, {
    category: "大学生法律热点",
    source: "自动抓取",
  });

  console.log("抓取完成：");
  console.log(
    JSON.stringify(
      {
        articleCandidates: articleRows.length,
        imageCandidates: imageUrls.length,
        articleImport,
        imageImport,
        sampleTitles: articleRows.slice(0, 10).map((x) => x.title),
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

