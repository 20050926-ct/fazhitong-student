import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "legal-exam-articles.json");

export type LegalExamArticle = {
  title: string;
  url: string;
  date?: string;
  image?: string;
  source: string;
  scrapedAt: string;
};

async function readAll(): Promise<LegalExamArticle[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is LegalExamArticle =>
        Boolean(
          x &&
            typeof x === "object" &&
            typeof (x as { title?: unknown }).title === "string" &&
            typeof (x as { url?: unknown }).url === "string" &&
            typeof (x as { source?: unknown }).source === "string" &&
            typeof (x as { scrapedAt?: unknown }).scrapedAt === "string"
        )
    );
  } catch {
    return [];
  }
}

export async function writeLegalExamArticles(items: LegalExamArticle[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function listLegalExamArticles(limit = 20): Promise<LegalExamArticle[]> {
  const rows = await readAll();
  const n = Math.max(1, Math.min(200, Math.floor(limit)));
  return rows.slice(0, n);
}

