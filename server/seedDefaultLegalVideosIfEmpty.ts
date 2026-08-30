import { getVideoStorageSummary, importScrapedVideos, type VideoImportRow } from "./legalVideoStore";

/** 首次启动且 data/scraped-videos.json 为空时写入，便于本地直接可播放演示（可自行删除或覆盖）。 */
const BOOTSTRAP_ROWS: VideoImportRow[] = [
  {
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    title: "《实习生的维权之路》",
    category: "普法示例",
    scrapedAt: new Date().toISOString(),
    tag: "热门",
    description: "AI 模拟真实实习纠纷，手把手教你避坑。（内置示例片源，可在数据中心替换为真实收录）",
    source: "bootstrap",
    sourceKind: "scrape",
  },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "《租房押金保卫战》",
    category: "普法示例",
    scrapedAt: new Date().toISOString(),
    tag: "精选",
    description: "沉浸式体验租房纠纷调解过程。（内置示例片源）",
    source: "bootstrap",
    sourceKind: "scrape",
  },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "《网络借贷的陷阱》",
    category: "普法示例",
    scrapedAt: new Date().toISOString(),
    tag: "新剧",
    description: "揭秘校园贷背后的法律风险。（内置示例片源）",
    source: "bootstrap",
    sourceKind: "scrape",
  },
];

export async function seedDefaultLegalVideosIfEmpty(): Promise<void> {
  try {
    const { total } = await getVideoStorageSummary();
    if (total > 0) return;
    await importScrapedVideos(BOOTSTRAP_ROWS);
    console.log("[legal-videos] Seeded default demo entries (empty store).");
  } catch (e) {
    console.warn("[legal-videos] Bootstrap seed skipped:", e instanceof Error ? e.message : e);
  }
}
