import fs from "fs/promises";
import path from "path";
import { createHash } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "scraped-videos.json");

export type VideoSourceKind = "scrape" | "creator";

export type StoredScrapedVideo = {
  id: string;
  /** 可播放地址：直链 mp4/webm/m3u8，或 YouTube/B站 等页面链接（前端按类型选择 video / iframe） */
  url: string;
  title: string;
  category: string;
  scrapedAt: string;
  source?: string;
  description?: string;
  /** 卡片角标，如 热门 / 精选 */
  tag?: string;
  posterUrl?: string;
  sourceKind?: VideoSourceKind;
  author?: string;
};

export type VideoImportRow = Pick<StoredScrapedVideo, "url" | "title" | "category" | "scrapedAt"> & {
  source?: string;
  description?: string;
  tag?: string;
  posterUrl?: string;
  sourceKind?: VideoSourceKind;
  author?: string;
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

export function videoIdFromUrl(url: string, title: string): string {
  return createHash("sha256")
    .update(url + "\0" + title)
    .digest("hex")
    .slice(0, 24);
}

function normalizeRow(x: StoredScrapedVideo): StoredScrapedVideo {
  return {
    ...x,
    title: (x.title || "视频").trim().slice(0, 300),
    category: (x.category || "未分类").trim() || "未分类",
  };
}

async function readAll(): Promise<StoredScrapedVideo[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as StoredScrapedVideo[]).map((r) => normalizeRow(r));
  } catch {
    return [];
  }
}

async function writeAll(items: StoredScrapedVideo[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function getVideoById(id: string): Promise<StoredScrapedVideo | null> {
  const rows = await readAll();
  return rows.find((r) => r.id === id) ?? null;
}

export async function listScrapedVideos(options: {
  limit?: number;
  category?: string;
  sourceKind?: VideoSourceKind;
}): Promise<StoredScrapedVideo[]> {
  let rows = await readAll();
  const cat = options.category?.trim();
  if (cat) {
    rows = rows.filter((r) => r.category === cat);
  }
  const sk = options.sourceKind;
  if (sk) {
    rows = rows.filter((r) => (r.sourceKind ?? "scrape") === sk);
  }
  rows.sort((a, b) => (a.scrapedAt < b.scrapedAt ? 1 : -1));
  const lim = options.limit;
  if (lim !== undefined && lim > 0 && rows.length > lim) {
    rows = rows.slice(0, lim);
  }
  return rows;
}

function rowFromImport(raw: VideoImportRow): StoredScrapedVideo {
  const u = raw.url.trim();
  const title = (raw.title || "视频").trim().slice(0, 300);
  const base: StoredScrapedVideo = {
    id: videoIdFromUrl(u, title),
    url: u,
    title,
    category: raw.category?.trim() || "未分类",
    scrapedAt: raw.scrapedAt || new Date().toISOString(),
    source: raw.source,
    description: raw.description?.trim() || undefined,
    tag: raw.tag?.trim() || undefined,
    posterUrl: raw.posterUrl?.trim() || undefined,
    sourceKind: raw.sourceKind ?? "scrape",
    author: raw.author?.trim() || undefined,
  };
  return normalizeRow(base);
}

export async function importScrapedVideos(
  items: VideoImportRow[]
): Promise<{ imported: number; skipped: number; total: number }> {
  return withLock(async () => {
    const existing = await readAll();
    const byKey = new Map(existing.map((r) => [`${r.url}\0${r.title}`, r]));
    let imported = 0;
    let skipped = 0;

    for (const raw of items) {
      const u = raw.url?.trim();
      const title = (raw.title || "视频").trim().slice(0, 300);
      if (!u || !/^https?:\/\//i.test(u)) continue;
      const key = `${u}\0${title}`;
      if (byKey.has(key)) {
        skipped++;
        continue;
      }
      const row = rowFromImport({ ...raw, url: u, title });
      byKey.set(key, row);
      imported++;
    }

    const merged = [...byKey.values()].sort((a, b) =>
      a.scrapedAt < b.scrapedAt ? 1 : -1
    );
    await writeAll(merged);
    return { imported, skipped, total: merged.length };
  });
}

export type CreatorPublishInput = {
  playUrl: string;
  title: string;
  description?: string;
  tag?: string;
  author?: string;
  posterUrl?: string;
};

export async function publishCreatorVideo(input: CreatorPublishInput): Promise<StoredScrapedVideo> {
  const playUrl = input.playUrl?.trim();
  if (!playUrl || !/^https?:\/\//i.test(playUrl)) {
    throw new Error("请填写有效的 http(s) 播放或作品页面链接");
  }
  if (/^\s*javascript:/i.test(playUrl)) {
    throw new Error("无效的链接");
  }
  const title = (input.title || "未命名作品").trim().slice(0, 200);
  if (!title) {
    throw new Error("请填写标题");
  }
  const row: VideoImportRow = {
    url: playUrl,
    title,
    category: "创作者投稿",
    scrapedAt: new Date().toISOString(),
    description: input.description?.trim().slice(0, 500) || undefined,
    tag: (input.tag?.trim() || "原创").slice(0, 20),
    posterUrl: input.posterUrl?.trim() || undefined,
    sourceKind: "creator",
    author: (input.author?.trim() || "匿名创作者").slice(0, 40),
    source: "creator-publish",
  };
  await importScrapedVideos([row]);
  const created = await getVideoById(videoIdFromUrl(playUrl, title));
  if (!created) {
    throw new Error("写入失败");
  }
  return created;
}

export async function getVideoStorageSummary(): Promise<{
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
    .slice(0, 24);
  return { total: rows.length, categories };
}
