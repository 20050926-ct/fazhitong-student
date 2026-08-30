import fs from "fs/promises";
import path from "path";
import { createHash } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "scraped-images.json");

export type StoredScrapedImage = {
  id: string;
  url: string;
  scrapedAt: string;
  /** 栏目/分类，便于筛选 */
  category?: string;
  source?: string;
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

export function imageIdFromUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 24);
}

async function readAll(): Promise<StoredScrapedImage[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredScrapedImage[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: StoredScrapedImage[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function listScrapedImages(options: {
  limit?: number;
  category?: string;
}): Promise<StoredScrapedImage[]> {
  let rows = await readAll();
  const cat = options.category?.trim();
  if (cat) {
    rows = rows.filter((r) => r.category === cat);
  }
  rows.sort((a, b) => (a.scrapedAt < b.scrapedAt ? 1 : -1));
  const lim = options.limit;
  if (lim !== undefined && lim > 0 && rows.length > lim) {
    rows = rows.slice(0, lim);
  }
  return rows;
}

/** 合并写入图片 URL 列表（按 URL 去重） */
export async function importScrapedImages(
  urls: string[],
  opts?: { category?: string; source?: string }
): Promise<{ imported: number; skipped: number; total: number }> {
  return withLock(async () => {
    const existing = await readAll();
    const byUrl = new Map(existing.map((r) => [r.url, r]));
    let imported = 0;
    let skipped = 0;
    const batchTime = new Date().toISOString();
    const category = opts?.category?.trim();
    const source = opts?.source?.trim() || "爬取导入";

    for (const raw of urls) {
      const u = typeof raw === "string" ? raw.trim() : "";
      if (!u || !/^https?:\/\//i.test(u)) continue;
      if (byUrl.has(u)) {
        skipped++;
        continue;
      }
      const row: StoredScrapedImage = {
        id: imageIdFromUrl(u),
        url: u,
        scrapedAt: batchTime,
        source,
        ...(category ? { category } : {}),
      };
      byUrl.set(u, row);
      imported++;
    }

    const merged = [...byUrl.values()].sort((a, b) =>
      a.scrapedAt < b.scrapedAt ? 1 : -1
    );
    await writeAll(merged);
    return { imported, skipped, total: merged.length };
  });
}

export async function getImageStorageSummary(): Promise<{
  total: number;
  categories: { name: string; count: number }[];
}> {
  const rows = await readAll();
  const m = new Map<string, number>();
  for (const r of rows) {
    const c = (r.category?.trim() || "未标注栏目").trim();
    m.set(c, (m.get(c) ?? 0) + 1);
  }
  const categories = [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);
  return { total: rows.length, categories };
}
