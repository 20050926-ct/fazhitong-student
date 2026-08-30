import fs from "fs/promises";
import path from "path";
import { createLegalSiteAxios, normalizeArticleFetchUrl } from "./legalHttp";
import { extractArticleFromPage } from "./extractArticleHtml";

type Row = {
  id: string;
  title: string;
  url: string;
  category: string;
  scrapedAt: string;
  date?: string;
};

const STORE_FILE = path.join(process.cwd(), "data", "legal-articles.json");
const TARGET_CATEGORIES = ["通知公告", "普法动态", "大学生法律热点"];

function normalizeTitle(title: string): string {
  return (title || "")
    .replace(/[【】\[\]（）()“”"'《》·\s:：,，。.!！？?、\-]/g, "")
    .toLowerCase();
}

function shouldVerify(category: string): boolean {
  return TARGET_CATEGORIES.some((c) => category.includes(c));
}

async function readAll(): Promise<Row[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Row[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: Row[]) {
  await fs.writeFile(STORE_FILE, JSON.stringify(rows, null, 2), "utf-8");
}

async function main() {
  const http = createLegalSiteAxios();
  const all = await readAll();
  const keep: Row[] = [];
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  let removedBad = 0;
  let removedDup = 0;

  for (const row of all) {
    const title = (row.title || "").trim();
    const url = (row.url || "").trim();
    if (!title || !url) {
      removedBad += 1;
      continue;
    }

    const norm = normalizeTitle(title);
    if (seenUrl.has(url) || seenTitle.has(norm)) {
      removedDup += 1;
      continue;
    }

    if (shouldVerify(row.category || "")) {
      try {
        const fetchHref = normalizeArticleFetchUrl(new URL(url)).href;
        const resp = await http.get(fetchHref);
        const parsed = extractArticleFromPage(String(resp.data), fetchHref);
        const plain = parsed.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (plain.length < 80) {
          removedBad += 1;
          continue;
        }
      } catch {
        removedBad += 1;
        continue;
      }
    }

    seenUrl.add(url);
    seenTitle.add(norm);
    keep.push(row);
  }

  keep.sort((a, b) => (a.scrapedAt < b.scrapedAt ? 1 : -1));
  await writeAll(keep);

  console.log(
    JSON.stringify(
      {
        before: all.length,
        after: keep.length,
        removedBad,
        removedDup,
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

