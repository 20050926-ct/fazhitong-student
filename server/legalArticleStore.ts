import fs from "fs/promises";
import path from "path";
import { createHash } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "legal-articles.json");

export type StoredLegalArticle = {
  id: string;
  title: string;
  url: string;
  category: string;
  scrapedAt: string;
  /** 可选，用于列表展示 */
  date?: string;
};

let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function articleIdFromUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 24);
}

async function readAll(): Promise<StoredLegalArticle[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredLegalArticle[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: StoredLegalArticle[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function listArticles(options: {
  limit?: number;
  category?: string;
}): Promise<StoredLegalArticle[]> {
  let rows = await readAll();
  if (options.category?.trim()) {
    const c = options.category.trim();
    rows = rows.filter((r) => r.category === c);
  }
  rows.sort((a, b) => (a.scrapedAt < b.scrapedAt ? 1 : -1));
  const lim = options.limit;
  if (lim !== undefined && lim > 0 && rows.length > lim) {
    rows = rows.slice(0, lim);
  }
  return rows;
}

export async function getArticleById(id: string): Promise<StoredLegalArticle | null> {
  const rows = await readAll();
  return rows.find((r) => r.id === id) ?? null;
}

export async function importArticles(
  items: Array<Pick<StoredLegalArticle, "title" | "url" | "category" | "scrapedAt">>
): Promise<{ imported: number; skipped: number; total: number }> {
  return withLock(async () => {
    const existing = await readAll();
    const byUrl = new Map(existing.map((r) => [r.url, r]));
    let imported = 0;
    let skipped = 0;
    for (const raw of items) {
      if (!raw.url?.trim() || !raw.title?.trim()) continue;
      const u = raw.url.trim();
      if (byUrl.has(u)) {
        skipped++;
        continue;
      }
      const row: StoredLegalArticle = {
        id: articleIdFromUrl(u),
        title: raw.title.trim(),
        url: u,
        category: raw.category?.trim() || "未分类",
        scrapedAt: raw.scrapedAt || new Date().toISOString(),
        date: (raw.scrapedAt || new Date().toISOString()).slice(0, 10),
      };
      byUrl.set(row.url, row);
      imported++;
    }
    const merged = [...byUrl.values()].sort((a, b) =>
      a.scrapedAt < b.scrapedAt ? 1 : -1
    );
    await writeAll(merged);
    return {
      imported,
      skipped,
      total: merged.length,
    };
  });
}

/** 数据概览：总量与分类分布（用于管理端） */
export async function getArticleStorageSummary(): Promise<{
  total: number;
  categories: { name: string; count: number }[];
}> {
  const rows = await readAll();
  const m = new Map<string, number>();
  for (const r of rows) {
    const c = (r.category || "未分类").trim() || "未分类";
    m.set(c, (m.get(c) ?? 0) + 1);
  }
  const categories = [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 32);
  return { total: rows.length, categories };
}
