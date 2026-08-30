import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { createLegalSiteAxios } from "./legalHttp";
import { writeLegalExamQuestions, type LegalExamQuestion } from "./legalExamQuestionStore";

const LIST_ENDPOINT = "https://sc.12348.gov.cn/lmtt/findlist.shtml";
const BASE_URL = "https://sc.12348.gov.cn/";

const SID_GROUPS = [
  { sid: "sfks-zcfg", label: "政策法规" },
  { sid: "sfks-tzgg", label: "通知公告" },
  { sid: "sfks-skdt", label: "考试动态" },
  { sid: "sfks-cjwt", label: "常见问题" },
];

type ScrapedRow = {
  title: string;
  url: string;
  section: string;
  scrapedAt: string;
};

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function toAbs(href: string): string {
  try {
    return new URL(href, BASE_URL).href;
  } catch {
    return href;
  }
}

function detectSubject(title: string, section: string): string {
  if (/(民法|合同|租赁|侵权|婚姻|继承)/.test(title)) return "民法客观题";
  if (/(刑法|犯罪|刑事|量刑|追诉)/.test(title)) return "刑法客观题";
  if (/(行政|诉讼|公告|资格|管理办法|司法部)/.test(title)) return "行政法与行政诉讼法";
  if (/(公司|企业|商|经济|税|金融)/.test(title)) return "商法与经济法";
  if (/(案例|问答|经验|如何|怎么办)/.test(title)) return "主观题案例训练";
  if (section === "政策法规") return "行政法与行政诉讼法";
  if (section === "通知公告") return "商法与经济法";
  if (section === "考试动态") return "历年真题模拟";
  if (section === "常见问题") return "主观题案例训练";
  const pool = ["民法客观题", "刑法客观题", "历年真题模拟"];
  const idx = parseInt(createHash("md5").update(title).digest("hex").slice(0, 2), 16) % pool.length;
  return pool[idx];
}

const OPTION_TEMPLATES: Array<{
  answerKey: "A" | "B" | "C" | "D";
  options: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
}> = [
  {
    answerKey: "A",
    options: [
      { key: "A", text: "以官方公告和法考服务平台信息为准，按流程及时提交材料" },
      { key: "B", text: "仅根据社交群消息操作，不核对官方来源" },
      { key: "C", text: "先观望到截止后再决定是否办理" },
      { key: "D", text: "交由无资质第三方代办并提供账号密码" },
    ],
  },
  {
    answerKey: "C",
    options: [
      { key: "A", text: "遇到问题先删除聊天记录，避免后续麻烦" },
      { key: "B", text: "只和对方口头沟通，不保留书面证据" },
      { key: "C", text: "先固定证据并核验政策依据，再通过正规渠道办理或维权" },
      { key: "D", text: "通过非官方链接提交个人敏感信息以求快速处理" },
    ],
  },
  {
    answerKey: "B",
    options: [
      { key: "A", text: "相信非官方渠道的“内部消息”即可" },
      { key: "B", text: "结合官方公告、报名条件和时间节点进行合规准备" },
      { key: "C", text: "材料不全先提交，后续再补无需关注时限" },
      { key: "D", text: "将报名资格判断交给陌生中介决定" },
    ],
  },
];

function buildQuestion(row: ScrapedRow): LegalExamQuestion {
  const subject = detectSubject(row.title, row.section);
  const hash = createHash("md5").update(row.title).digest("hex");
  const tIdx = parseInt(hash.slice(0, 2), 16) % OPTION_TEMPLATES.length;
  const tpl = OPTION_TEMPLATES[tIdx];
  const id = createHash("sha256").update(`${row.url}#${row.title}`).digest("hex").slice(0, 24);
  return {
    id,
    subject,
    stem: `根据「${row.title}」所涉及的法考流程与合规要求，以下哪项做法更稳妥？`,
    options: tpl.options,
    answerKey: tpl.answerKey,
    analysis:
      "法考相关事项应以官方发布信息为准，重点关注报名条件、时间节点、材料要求和办理渠道。出现争议时应先固定证据，再通过正式投诉或救济路径处理，避免因信息来源不实造成不必要风险。",
    sourceTitle: row.title,
    sourceUrl: row.url,
    scrapedAt: row.scrapedAt,
  };
}

async function fetchListBySid(
  http: ReturnType<typeof createLegalSiteAxios>,
  sid: string,
  section: string,
  pageSize = 12
): Promise<ScrapedRow[]> {
  const scrapedAt = new Date().toISOString();
  const form = new URLSearchParams({
    page: "1",
    sid,
    txt: "",
    op: "",
    date1: "",
    date2: "",
    pageSize: String(pageSize),
  });
  const res = await http.post(LIST_ENDPOINT, form.toString(), {
    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
  });
  const html = String(res.data);
  const $ = cheerio.load(html);
  const out: ScrapedRow[] = [];
  const seen = new Set<string>();
  $('a[href*="lmtt/page/"]').each((_, el) => {
    const a = $(el);
    const title = normalizeText(a.text());
    const href = a.attr("href") || "";
    if (!title || !href) return;
    const url = toAbs(href);
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ title, url, section, scrapedAt });
  });
  return out;
}

export async function crawlLegalExamQuestions(totalLimit = 40): Promise<LegalExamQuestion[]> {
  const http = createLegalSiteAxios();
  const merged: ScrapedRow[] = [];
  const seen = new Set<string>();
  const perSid = Math.max(6, Math.ceil(totalLimit / SID_GROUPS.length));

  for (const g of SID_GROUPS) {
    try {
      const rows = await fetchListBySid(http, g.sid, g.label, perSid);
      for (const r of rows) {
        const key = `${r.title}@@${r.url}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(r);
      }
      console.log(`[OK] ${g.label}: ${rows.length} 条`);
    } catch (e) {
      console.warn(`[WARN] ${g.label}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const questions = merged.slice(0, totalLimit).map(buildQuestion);
  await writeLegalExamQuestions(questions);
  return questions;
}

async function main() {
  const questions = await crawlLegalExamQuestions(60);
  console.log(
    JSON.stringify(
      {
        total: questions.length,
        subjects: Array.from(new Set(questions.map((q) => q.subject))),
        sample: questions.slice(0, 5).map((q) => ({ stem: q.stem, answerKey: q.answerKey })),
      },
      null,
      2
    )
  );
}

if (process.argv[1]?.includes("scrapeLegalExamQuestions")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

