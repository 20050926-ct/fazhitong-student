import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "legal-exam-questions.json");

export type LegalExamQuestion = {
  id: string;
  subject: string;
  stem: string;
  options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
  answerKey: "A" | "B" | "C" | "D";
  analysis: string;
  sourceTitle: string;
  sourceUrl: string;
  scrapedAt: string;
};

const DEFAULT_SOURCE_TITLE = "法考综合能力训练（演示题库）";
const DEFAULT_SOURCE_URL = "https://www.12348.gov.cn/#/publicies/sfks/sfks";

function coerceQuestion(raw: unknown): LegalExamQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.subject !== "string" || typeof o.stem !== "string") return null;
  if (!Array.isArray(o.options) || o.options.length !== 4) return null;
  const ak = o.answerKey;
  if (ak !== "A" && ak !== "B" && ak !== "C" && ak !== "D") return null;
  const keySet = new Set<string>();
  const opts: LegalExamQuestion["options"] = [];
  for (const opt of o.options) {
    if (!opt || typeof opt !== "object") return null;
    const k = (opt as { key?: unknown }).key;
    const t = (opt as { text?: unknown }).text;
    if (k !== "A" && k !== "B" && k !== "C" && k !== "D") return null;
    if (typeof t !== "string") return null;
    if (keySet.has(k)) return null;
    keySet.add(k);
    opts.push({ key: k, text: t });
  }

  const sourceUrl = typeof o.sourceUrl === "string" && o.sourceUrl.trim() ? o.sourceUrl.trim() : DEFAULT_SOURCE_URL;
  const sourceTitle =
    typeof o.sourceTitle === "string" && o.sourceTitle.trim() ? o.sourceTitle.trim() : DEFAULT_SOURCE_TITLE;
  const analysis = typeof o.analysis === "string" ? o.analysis : "";
  const scrapedAt =
    typeof o.scrapedAt === "string" && o.scrapedAt.trim() ? o.scrapedAt.trim() : new Date().toISOString();

  return {
    id: o.id,
    subject: o.subject,
    stem: o.stem,
    options: opts as LegalExamQuestion["options"],
    answerKey: ak,
    analysis,
    sourceTitle,
    sourceUrl,
    scrapedAt,
  };
}

async function readAll(): Promise<LegalExamQuestion[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: LegalExamQuestion[] = [];
    for (const item of parsed) {
      const q = coerceQuestion(item);
      if (q) out.push(q);
    }
    return out;
  } catch {
    return [];
  }
}

export async function writeLegalExamQuestions(items: LegalExamQuestion[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function listLegalExamQuestions(options?: {
  limit?: number;
  subject?: string;
}): Promise<LegalExamQuestion[]> {
  const rows = await readAll();
  let out = rows;
  if (options?.subject?.trim()) {
    const s = options.subject.trim();
    out = out.filter((x) => x.subject === s);
  }
  const lim = options?.limit;
  if (lim && lim > 0) {
    out = out.slice(0, lim);
  }
  return out;
}

