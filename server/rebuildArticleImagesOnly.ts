import fs from "fs/promises";
import path from "path";
import { createLegalSiteAxios, normalizeArticleFetchUrl } from "./legalHttp";
import { extractArticleFromPage } from "./extractArticleHtml";
import { collectArticleImagesFromHtml } from "./articleImageWhitelist";

type ArticleRow = {
  title: string;
  url: string;
  category: string;
  scrapedAt: string;
};

type ImageRow = {
  id: string;
  url: string;
  scrapedAt: string;
  category?: string;
  source?: string;
};

const ARTICLE_FILE = path.join(process.cwd(), "data", "legal-articles.json");
const IMAGE_FILE = path.join(process.cwd(), "data", "scraped-images.json");

function idFromUrl(url: string): string {
  const hex = Buffer.from(url).toString("base64url");
  return hex.slice(0, 24);
}

async function readArticles(): Promise<ArticleRow[]> {
  try {
    const raw = await fs.readFile(ARTICLE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ArticleRow[]) : [];
  } catch {
    return [];
  }
}

async function writeImages(rows: ImageRow[]) {
  await fs.writeFile(IMAGE_FILE, JSON.stringify(rows, null, 2), "utf-8");
}

async function main() {
  const http = createLegalSiteAxios();
  const articles = await readArticles();
  const urls = new Set<string>();
  const out: ImageRow[] = [];

  for (const row of articles) {
    if (!row.url) continue;
    try {
      const fetchHref = normalizeArticleFetchUrl(new URL(row.url)).href;
      const resp = await http.get(fetchHref);
      const parsed = extractArticleFromPage(String(resp.data), fetchHref);
      const imgs = collectArticleImagesFromHtml(parsed.content || "", fetchHref, 10);
      for (const img of imgs) {
        if (urls.has(img)) continue;
        urls.add(img);
        out.push({
          id: idFromUrl(img),
          url: img,
          scrapedAt: new Date().toISOString(),
          category: "文章配图白名单",
          source: "正文提取",
        });
      }
    } catch {
      // skip broken article pages
    }
  }

  await writeImages(out);
  console.log(JSON.stringify({ imagesKept: out.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

