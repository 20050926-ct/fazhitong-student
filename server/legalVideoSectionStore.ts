import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SECTION_FILE = path.join(DATA_DIR, "legal-video-section.json");

export type LegalVideoSectionConfig = {
  /** 首页「虚拟仿真」下方视频板块标题 */
  title: string;
};

const DEFAULT_TITLE = "普法短视频";

function normalizeTitle(raw: string): string {
  const t = raw.trim().slice(0, 40);
  return t || DEFAULT_TITLE;
}

export async function getLegalVideoSection(): Promise<LegalVideoSectionConfig> {
  try {
    const raw = await fs.readFile(SECTION_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && typeof (parsed as { title?: unknown }).title === "string") {
      return { title: normalizeTitle((parsed as { title: string }).title) };
    }
  } catch {
    /* missing or invalid */
  }
  return { title: DEFAULT_TITLE };
}

export async function setLegalVideoSectionTitle(title: string): Promise<LegalVideoSectionConfig> {
  const next = { title: normalizeTitle(title) };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SECTION_FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}
