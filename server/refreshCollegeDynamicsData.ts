import fs from "fs/promises";
import path from "path";
import { createLegalSiteAxios } from "./legalHttp";
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

function isCollegeRelated(title: string): boolean {
  const t = (title || "").toLowerCase();
  return COLLEGE_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

async function readRows(): Promise<Row[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as Row[]) : [];
  } catch {
    return [];
  }
}

async function writeRows(rows: Row[]) {
  await fs.writeFile(STORE_FILE, JSON.stringify(rows, null, 2), "utf-8");
}

async function main() {
  const http = createLegalSiteAxios();
  const all = await readRows();
  const keep: Row[] = [];
  let removed = 0;

  for (const row of all) {
    const isDynamics = (row.category || "").startsWith("普法动态");
    if (!isDynamics) {
      keep.push(row);
      continue;
    }
    if (!isCollegeRelated(row.title || "")) {
      removed += 1;
      continue;
    }
    try {
      const resp = await http.get(row.url);
      const parsed = extractArticleFromPage(String(resp.data), row.url);
      const plain = parsed.content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (plain.length < 80) {
        removed += 1;
        continue;
      }
      keep.push(row);
    } catch {
      removed += 1;
    }
  }

  keep.sort((a, b) => (a.scrapedAt < b.scrapedAt ? 1 : -1));
  await writeRows(keep);
  console.log(JSON.stringify({ before: all.length, after: keep.length, removed }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

