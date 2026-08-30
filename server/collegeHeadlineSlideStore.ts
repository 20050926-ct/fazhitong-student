import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "college-headline-slides.json");

export type CollegeHeadlineSlide = {
  title: string;
  image: string;
  url: string;
  source?: string;
  scrapedAt: string;
};

async function readAll(): Promise<CollegeHeadlineSlide[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CollegeHeadlineSlide =>
        Boolean(
          x &&
            typeof x === "object" &&
            typeof (x as { title?: unknown }).title === "string" &&
            typeof (x as { image?: unknown }).image === "string" &&
            typeof (x as { url?: unknown }).url === "string"
        )
    );
  } catch {
    return [];
  }
}

export async function writeCollegeHeadlineSlides(items: CollegeHeadlineSlide[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function listCollegeHeadlineSlides(limit = 4): Promise<CollegeHeadlineSlide[]> {
  const rows = await readAll();
  const n = Math.max(1, Math.min(20, Math.floor(limit)));
  return rows.slice(0, n);
}

