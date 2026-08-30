import express, { Router, type Response } from "express";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { LEGAL_SCRAPE_LIST_URL, LEGAL_SITE_ORIGIN } from "./config";
import {
  assertLegalArticleUrl,
  createLegalSiteAxios,
  normalizeArticleFetchUrl,
} from "./legalHttp";
import { extractArticleFromPage } from "./extractArticleHtml";
import { scrapeMojHomepage, scrapeWspListPage } from "./scrapeMojHome";
import {
  getArticleById,
  getArticleStorageSummary,
  importArticles,
  listArticles,
} from "./legalArticleStore";
import { getImageStorageSummary, importScrapedImages, listScrapedImages } from "./legalImageStore";
import {
  getVideoById,
  getVideoStorageSummary,
  importScrapedVideos,
  listScrapedVideos,
  publishCreatorVideo,
  type VideoSourceKind,
} from "./legalVideoStore";
import { getLegalVideoSection, setLegalVideoSectionTitle } from "./legalVideoSectionStore";
import {
  crawlLegalVideosFromPages,
  DEFAULT_LEGAL_VIDEO_PAGE_URLS,
} from "./crawlDefaultLegalVideoPages";
import { MOJ_ZHFX_WSP_LIST_URL } from "./scrapeMojZhfxWspVideos";
import { assertAllowedExternalUrl } from "./externalUrlAllowlist";
import { runCustomScrape, type CustomScrapeKind } from "./customScrape";
import { listCollegeHeadlineSlides } from "./collegeHeadlineSlideStore";
import { listLegalExamArticles } from "./legalExamArticleStore";
import { crawlLegalExamQuestions } from "./scrapeLegalExamQuestions";
import { listLegalExamQuestions } from "./legalExamQuestionStore";
import {
  collectArticleImagesFromHtml,
} from "./articleImageWhitelist";
import {
  GEMINI_MODEL,
  LEGAL_ASSISTANT_SYSTEM_INSTRUCTION,
} from "../src/lib/gemini";

const http = createLegalSiteAxios();
const FULL_ARTICLE_STORE_FILE = path.join(process.cwd(), "data", "college-articles-full.json");

function jsonError(res: Response, status: number, message: string) {
  res.status(status).json({ success: false, error: message });
}

function normalizeLookupUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    return u.href.replace(/\/$/, "");
  } catch {
    return raw.trim().replace(/\/$/, "");
  }
}

type FullArticleFallbackRow = {
  title?: string;
  url?: string;
  date?: string;
  content?: string;
  images?: string[];
};

async function findFullArticleFallback(url: string): Promise<FullArticleFallbackRow | null> {
  try {
    const raw = await fs.readFile(FULL_ARTICLE_STORE_FILE, "utf-8");
    const rows = JSON.parse(raw) as unknown;
    if (!Array.isArray(rows)) return null;
    const target = normalizeLookupUrl(url);
    const hit = rows.find((x) => {
      if (!x || typeof x !== "object") return false;
      const rowUrl = typeof (x as { url?: unknown }).url === "string" ? (x as { url: string }).url : "";
      return normalizeLookupUrl(rowUrl) === target;
    });
    if (!hit || typeof hit !== "object") return null;
    return hit as FullArticleFallbackRow;
  } catch {
    return null;
  }
}

const SCRAPE_LIMIT_MAX = 500;

/** 正整数则截取前 N 条；缺省或无效表示不限制 */
function parseScrapeLimit(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = typeof s === "string" ? parseInt(s, 10) : Number(s);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(Math.floor(n), SCRAPE_LIMIT_MAX);
}

function applyScrapeLimit<T>(items: T[], limit: number | undefined): { data: T[]; total: number } {
  const total = items.length;
  if (limit === undefined || limit >= total) {
    return { data: items, total };
  }
  return { data: items.slice(0, limit), total };
}

type ImportItem = {
  title: string;
  url: string;
  category: string;
  scrapedAt: string;
};

function parseImportBody(body: unknown): ImportItem[] | null {
  if (!body || typeof body !== "object") return null;
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const out: ImportItem[] = [];
  for (const x of items) {
    if (!x || typeof x !== "object") continue;
    const title = (x as { title?: unknown }).title;
    const url = (x as { url?: unknown }).url;
    if (typeof title !== "string" || typeof url !== "string") continue;
    const category = (x as { category?: unknown }).category;
    const scrapedAt = (x as { scrapedAt?: unknown }).scrapedAt;
    out.push({
      title: title.trim(),
      url: url.trim(),
      category: typeof category === "string" && category.trim() ? category.trim() : "未分类",
      scrapedAt:
        typeof scrapedAt === "string" && scrapedAt.trim()
          ? scrapedAt.trim()
          : new Date().toISOString(),
    });
  }
  return out.length ? out : null;
}

function parseImageImportBody(body: unknown): {
  urls: string[];
  category?: string;
  source?: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const urls = (body as { urls?: unknown }).urls;
  if (!Array.isArray(urls) || urls.length === 0) return null;
  const out: string[] = [];
  for (const x of urls) {
    if (typeof x !== "string" || !x.trim()) continue;
    out.push(x.trim());
    if (out.length >= 3000) break;
  }
  if (!out.length) return null;
  const category = (body as { category?: unknown }).category;
  const source = (body as { source?: unknown }).source;
  return {
    urls: out,
    category: typeof category === "string" && category.trim() ? category.trim() : undefined,
    source: typeof source === "string" && source.trim() ? source.trim() : undefined,
  };
}

type VideoImportItem = {
  url: string;
  title: string;
  category: string;
  scrapedAt: string;
  source?: string;
  description?: string;
  tag?: string;
  posterUrl?: string;
  sourceKind?: VideoSourceKind;
  author?: string;
};

function parseVideoImportBody(body: unknown): VideoImportItem[] | null {
  if (!body || typeof body !== "object") return null;
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const out: VideoImportItem[] = [];
  for (const x of items) {
    if (!x || typeof x !== "object") continue;
    const url = (x as { url?: unknown }).url;
    if (typeof url !== "string" || !url.trim()) continue;
    const titleRaw = (x as { title?: unknown }).title;
    const title =
      typeof titleRaw === "string" && titleRaw.trim()
        ? titleRaw.trim().slice(0, 300)
        : "视频";
    const category = (x as { category?: unknown }).category;
    const scrapedAt = (x as { scrapedAt?: unknown }).scrapedAt;
    const source = (x as { source?: unknown }).source;
    const description = (x as { description?: unknown }).description;
    const tag = (x as { tag?: unknown }).tag;
    const posterUrl = (x as { posterUrl?: unknown }).posterUrl;
    const author = (x as { author?: unknown }).author;
    const sourceKindRaw = (x as { sourceKind?: unknown }).sourceKind;
    const sourceKind =
      sourceKindRaw === "creator" || sourceKindRaw === "scrape" ? sourceKindRaw : undefined;
    out.push({
      url: url.trim(),
      title,
      category: typeof category === "string" && category.trim() ? category.trim() : "未分类",
      scrapedAt:
        typeof scrapedAt === "string" && scrapedAt.trim()
          ? scrapedAt.trim()
          : new Date().toISOString(),
      source: typeof source === "string" && source.trim() ? source.trim() : undefined,
      description:
        typeof description === "string" && description.trim()
          ? description.trim().slice(0, 2000)
          : undefined,
      tag: typeof tag === "string" && tag.trim() ? tag.trim().slice(0, 40) : undefined,
      posterUrl:
        typeof posterUrl === "string" && posterUrl.trim() ? posterUrl.trim().slice(0, 2000) : undefined,
      author: typeof author === "string" && author.trim() ? author.trim().slice(0, 80) : undefined,
      sourceKind,
    });
    if (out.length >= 2000) break;
  }
  return out.length ? out : null;
}

type ChatRole = "user" | "ai";

type ChatMessage = { role: ChatRole; content: string };

function parseChatBody(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if (role !== "user" && role !== "ai") return null;
    if (typeof content !== "string" || !content.trim()) return null;
    if (content.length > 12_000) return null;
    out.push({ role, content: content.trim() });
  }
  if (out.length > 40) return null;
  return out;
}

export function createApiRouter(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        ok: true,
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
        openAiCompatibleConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
        time: new Date().toISOString(),
      },
    });
  });

  /** 本地「数据库」：data 目录下 JSON 库的条目统计与分类分布 */
  router.get("/legal-storage/summary", async (_req, res) => {
    try {
      const [articles, images, videos] = await Promise.all([
        getArticleStorageSummary(),
        getImageStorageSummary(),
        getVideoStorageSummary(),
      ]);
      res.json({
        success: true,
        data: {
          engine: "json",
          description:
            "当前使用项目目录 data/ 下的 JSON 文件作为轻量持久化存储（无需单独安装数据库服务）。",
          stores: [
            {
              key: "articles",
              label: "文章库",
              file: "data/legal-articles.json",
              total: articles.total,
              categories: articles.categories,
            },
            {
              key: "images",
              label: "图片库",
              file: "data/scraped-images.json",
              total: images.total,
              categories: images.categories,
            },
            {
              key: "videos",
              label: "视频库",
              file: "data/scraped-videos.json",
              total: videos.total,
              categories: videos.categories,
            },
          ],
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Summary failed";
      console.error("[/api/legal-storage/summary]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.post("/legal-articles/import", async (req, res) => {
    try {
      const parsed = parseImportBody(req.body);
      if (!parsed) {
        return jsonError(
          res,
          400,
          "Expected JSON body { items: [{ title, url, category?, scrapedAt? }, ...] }"
        );
      }
      const result = await importArticles(parsed);
      res.json({ success: true, data: result });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Import failed";
      console.error("[/api/legal-articles/import]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-articles", async (req, res) => {
    try {
      const lim = parseScrapeLimit(req.query.limit) ?? 100;
      const limit = Math.min(lim, 500);
      const category =
        typeof req.query.category === "string" && req.query.category.trim()
          ? req.query.category.trim()
          : undefined;
      const data = await listArticles({ limit, category });
      res.json({ success: true, data, meta: { count: data.length } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "List failed";
      console.error("[/api/legal-articles]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-articles/:id", async (req, res) => {
    try {
      const row = await getArticleById(req.params.id);
      if (!row) {
        return jsonError(res, 404, "Article not found");
      }
      res.json({ success: true, data: row });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lookup failed";
      console.error("[/api/legal-articles/:id]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.post("/legal-images/import", async (req, res) => {
    try {
      const parsed = parseImageImportBody(req.body);
      if (!parsed) {
        return jsonError(
          res,
          400,
          'Expected JSON body { urls: ["https://..."], category?: string, source?: string }'
        );
      }
      const result = await importScrapedImages(parsed.urls, {
        category: parsed.category,
        source: parsed.source,
      });
      res.json({ success: true, data: result });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Image import failed";
      console.error("[/api/legal-images/import]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-images", async (req, res) => {
    try {
      const lim = parseScrapeLimit(req.query.limit) ?? 200;
      const limit = Math.min(lim, 2000);
      const category =
        typeof req.query.category === "string" && req.query.category.trim()
          ? req.query.category.trim()
          : undefined;
      const data = await listScrapedImages({ limit, category });
      res.json({ success: true, data, meta: { count: data.length } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Image list failed";
      console.error("[/api/legal-images]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.post("/legal-videos/import", async (req, res) => {
    try {
      const parsed = parseVideoImportBody(req.body);
      if (!parsed) {
        return jsonError(
          res,
          400,
          "Expected JSON body { items: [{ url, title?, category?, scrapedAt?, source?, description?, tag?, posterUrl?, sourceKind?, author? }, ...] }"
        );
      }
      const result = await importScrapedVideos(parsed);
      res.json({ success: true, data: result });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Video import failed";
      console.error("[/api/legal-videos/import]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.post("/legal-videos/publish", async (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object") {
        return jsonError(res, 400, "需要 JSON 请求体");
      }
      const playUrl = typeof (body as { playUrl?: unknown }).playUrl === "string" ? (body as { playUrl: string }).playUrl : "";
      const title = typeof (body as { title?: unknown }).title === "string" ? (body as { title: string }).title : "";
      const description =
        typeof (body as { description?: unknown }).description === "string"
          ? (body as { description: string }).description
          : undefined;
      const tag =
        typeof (body as { tag?: unknown }).tag === "string" ? (body as { tag: string }).tag : undefined;
      const author =
        typeof (body as { author?: unknown }).author === "string" ? (body as { author: string }).author : undefined;
      const posterUrl =
        typeof (body as { posterUrl?: unknown }).posterUrl === "string"
          ? (body as { posterUrl: string }).posterUrl
          : undefined;
      if (!playUrl.trim() || !title.trim()) {
        return jsonError(res, 400, "请填写 playUrl 与 title");
      }
      const row = await publishCreatorVideo({
        playUrl: playUrl.trim(),
        title: title.trim(),
        description,
        tag,
        author,
        posterUrl,
      });
      res.json({ success: true, data: row });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "发布失败";
      console.error("[/api/legal-videos/publish]", msg);
      if (msg.includes("请填写") || msg.includes("无效") || msg.includes("仅支持")) {
        return jsonError(res, 400, msg);
      }
      jsonError(res, 500, msg);
    }
  });

  /** 从允许域名内的列表页自动发现并导入视频链接（与 Data 中心「自定义爬取」同源逻辑） */
  router.post("/legal-videos/crawl-pages", async (req, res) => {
    try {
      const body = req.body;
      const urlsRaw = body && typeof body === "object" ? (body as { urls?: unknown }).urls : undefined;
      const catRaw = body && typeof body === "object" ? (body as { category?: unknown }).category : undefined;
      const categoryLabel =
        typeof catRaw === "string" && catRaw.trim() ? catRaw.trim() : "普法收录";
      let pageUrls: string[] | undefined;
      if (Array.isArray(urlsRaw)) {
        pageUrls = urlsRaw.filter((u): u is string => typeof u === "string" && u.trim().length > 0).map((u) => u.trim());
      }
      const data = await crawlLegalVideosFromPages(http, pageUrls, categoryLabel);
      res.json({
        success: true,
        data,
        meta: {
          mojMicroVideoList: MOJ_ZHFX_WSP_LIST_URL,
          defaultPages: DEFAULT_LEGAL_VIDEO_PAGE_URLS,
          hint: "每次会先收录司法部智慧普法「微视频」直链；可选 urls 覆盖其它列表页。",
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "爬取失败";
      console.error("[/api/legal-videos/crawl-pages]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-videos", async (req, res) => {
    try {
      const lim = parseScrapeLimit(req.query.limit) ?? 200;
      const limit = Math.min(lim, 2000);
      const category =
        typeof req.query.category === "string" && req.query.category.trim()
          ? req.query.category.trim()
          : undefined;
      const skRaw = req.query.sourceKind;
      const sourceKind =
        skRaw === "creator" || skRaw === "scrape" ? (skRaw as VideoSourceKind) : undefined;
      const data = await listScrapedVideos({ limit, category, sourceKind });
      res.json({ success: true, data, meta: { count: data.length } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Video list failed";
      console.error("[/api/legal-videos]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-videos/:id", async (req, res) => {
    try {
      const row = await getVideoById(req.params.id);
      if (!row) {
        return jsonError(res, 404, "视频不存在");
      }
      res.json({ success: true, data: row });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lookup failed";
      console.error("[/api/legal-videos/:id]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-video-section", async (_req, res) => {
    try {
      const data = await getLegalVideoSection();
      res.json({ success: true, data });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Read failed";
      console.error("[/api/legal-video-section]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.put("/legal-video-section", async (req, res) => {
    try {
      const body = req.body;
      const title =
        body && typeof body === "object" && typeof (body as { title?: unknown }).title === "string"
          ? (body as { title: string }).title
          : "";
      if (!title.trim()) {
        return jsonError(res, 400, "需要 JSON { title: string }");
      }
      const data = await setLegalVideoSectionTitle(title);
      res.json({ success: true, data });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "保存失败";
      console.error("[/api/legal-video-section]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/college-headline-slides", async (req, res) => {
    try {
      const lim = parseScrapeLimit(req.query.limit) ?? 4;
      const data = await listCollegeHeadlineSlides(Math.min(lim, 10));
      res.json({ success: true, data, meta: { count: data.length } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Slide list failed";
      console.error("[/api/college-headline-slides]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-exam-articles", async (req, res) => {
    try {
      const lim = parseScrapeLimit(req.query.limit) ?? 20;
      const data = await listLegalExamArticles(Math.min(lim, 100));
      res.json({ success: true, data, meta: { count: data.length } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Legal exam list failed";
      console.error("[/api/legal-exam-articles]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.get("/legal-exam-questions", async (req, res) => {
    try {
      const lim = parseScrapeLimit(req.query.limit) ?? 80;
      const subject =
        typeof req.query.subject === "string" && req.query.subject.trim()
          ? req.query.subject.trim()
          : undefined;
      const data = await listLegalExamQuestions({
        limit: Math.min(lim, 200),
        subject,
      });
      res.json({ success: true, data, meta: { count: data.length } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Question list failed";
      console.error("[/api/legal-exam-questions]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.post("/legal-exam-questions/refresh", async (req, res) => {
    try {
      const lim = parseScrapeLimit(req.query.limit) ?? 60;
      const data = await crawlLegalExamQuestions(Math.min(lim, 120));
      res.json({ success: true, data, meta: { count: data.length } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Question refresh failed";
      console.error("[/api/legal-exam-questions/refresh]", msg);
      jsonError(res, 500, msg);
    }
  });

  router.post("/ai/chat", async (req, res) => {
    const parsed = parseChatBody(req.body);
    if (!parsed) {
      return jsonError(res, 400, "Invalid messages payload");
    }

    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    /** OpenAI 兼容（sk-…）：支持官方 API 与国内兼容 BASE（见 .env.example） */
    if (openaiKey) {
      const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
      const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: LEGAL_ASSISTANT_SYSTEM_INSTRUCTION },
        ...parsed.map((m) => ({
          role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
      ];
      try {
        const { data } = await axios.post<{
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string };
        }>(
          `${base}/chat/completions`,
          { model, messages },
          {
            timeout: 120_000,
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        const errMsg = data.error?.message;
        if (errMsg) {
          return jsonError(res, 502, errMsg);
        }
        const text =
          data.choices?.[0]?.message?.content?.trim() || "抱歉，我暂时无法回答这个问题。";
        return res.json({ success: true, data: { text, provider: "openai-compatible" } });
      } catch (e: unknown) {
        const ax = axios.isAxiosError(e);
        const msg = ax
          ? (e.response?.data as { error?: { message?: string } })?.error?.message ||
            e.message
          : e instanceof Error
            ? e.message
            : "OpenAI-compatible request failed";
        console.error("[/api/ai/chat] openai", msg);
        return jsonError(res, 502, String(msg));
      }
    }

    if (!geminiKey) {
      return jsonError(
        res,
        503,
        "未配置 AI：请在服务器环境设置 OPENAI_API_KEY（OpenAI 兼容）或 GEMINI_API_KEY（Google）"
      );
    }

    const contents = parsed.map((m) => ({
      role: m.role === "ai" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: LEGAL_ASSISTANT_SYSTEM_INSTRUCTION,
        },
      });
      const text = response.text?.trim() || "抱歉，我暂时无法回答这个问题。";
      res.json({ success: true, data: { text, provider: "gemini" } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gemini request failed";
      console.error("[/api/ai/chat]", msg);
      jsonError(res, 502, msg);
    }
  });

  router.get("/scrape", async (req, res) => {
    try {
      const mode =
        typeof req.query.mode === "string" ? req.query.mode : "home";
      const limit = parseScrapeLimit(req.query.limit);

      if (mode === "wsp") {
        const response = await http.get(LEGAL_SCRAPE_LIST_URL);
        const full = scrapeWspListPage(String(response.data), LEGAL_SCRAPE_LIST_URL);
        const { data, total } = applyScrapeLimit(full, limit);
        return res.json({
          success: true,
          data,
          meta: {
            mode: "wsp",
            sourceUrl: LEGAL_SCRAPE_LIST_URL,
            count: data.length,
            totalAvailable: total,
            limit: limit ?? null,
          },
        });
      }

      if (mode !== "home") {
        return jsonError(res, 400, 'Invalid mode; use "home" (default) or "wsp"');
      }

      const response = await http.get(LEGAL_SITE_ORIGIN);
      const axReq = response.request as { res?: { responseUrl?: string } } | undefined;
      const pageUrl = axReq?.res?.responseUrl ?? LEGAL_SITE_ORIGIN;
      const full = scrapeMojHomepage(String(response.data), pageUrl);
      const { data, total } = applyScrapeLimit(full, limit);
      res.json({
        success: true,
        data,
        meta: {
          mode: "home",
          sourceUrl: LEGAL_SITE_ORIGIN,
          count: data.length,
          totalAvailable: total,
          limit: limit ?? null,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Scrape failed";
      console.error("[/api/scrape]", message);
      jsonError(res, 500, message);
    }
  });

  router.get("/scrape-images", async (_req, res) => {
    try {
      const response = await http.get(LEGAL_SITE_ORIGIN);
      const $ = cheerio.load(response.data);
      const images: string[] = [];

      $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (src) {
          const fullUrl = src.startsWith("http")
            ? src
            : new URL(src, LEGAL_SITE_ORIGIN).href;
          if (!images.includes(fullUrl)) images.push(fullUrl);
        }
      });

      res.json({ success: true, data: images });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Image scrape failed";
      console.error("[/api/scrape-images]", message);
      jsonError(res, 500, message);
    }
  });

  /** 手动输入允许域名内的页面 URL，按类型采集文章链接 / 图片 / 视频 */
  router.post("/scrape/custom", async (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object") {
        return jsonError(res, 400, "需要 JSON 请求体");
      }
      const pageUrlRaw = typeof body.pageUrl === "string" ? body.pageUrl.trim() : "";
      const kindRaw = (body as { kind?: unknown }).kind;
      if (!pageUrlRaw) {
        return jsonError(res, 400, "缺少 pageUrl");
      }
      if (kindRaw !== "articles" && kindRaw !== "images" && kindRaw !== "videos") {
        return jsonError(res, 400, 'kind 须为 "articles"、"images" 或 "videos"');
      }
      const kind = kindRaw as CustomScrapeKind;
      const defaultLimit = kind === "images" ? 150 : kind === "videos" ? 50 : 50;
      const limit =
        parseScrapeLimit((body as { limit?: unknown }).limit) ?? defaultLimit;
      const catRaw = (body as { category?: unknown }).category;
      const categoryLabel =
        typeof catRaw === "string" && catRaw.trim() ? catRaw.trim() : "自定义收录";

      let pageHref: string;
      try {
        pageHref = assertAllowedExternalUrl(pageUrlRaw).href;
      } catch (e) {
        return jsonError(
          res,
          400,
          e instanceof Error ? e.message : "URL 校验失败"
        );
      }

      const scraped = await runCustomScrape(http, pageHref, kind, limit, categoryLabel);

      if (scraped.kind === "articles") {
        return res.json({
          success: true,
          data: scraped.items,
          meta: {
            kind: "articles",
            pageUrl: pageHref,
            count: scraped.items.length,
            limit,
            category: categoryLabel,
          },
        });
      }
      if (scraped.kind === "images") {
        return res.json({
          success: true,
          data: scraped.items,
          meta: {
            kind: "images",
            pageUrl: pageHref,
            count: scraped.items.length,
            limit,
            category: categoryLabel,
          },
        });
      }
      return res.json({
        success: true,
        data: scraped.items,
        meta: {
          kind: "videos",
          pageUrl: pageHref,
          count: scraped.items.length,
          limit,
          category: categoryLabel,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "自定义爬取失败";
      console.error("[/api/scrape/custom]", message);
      if (
        message.includes("域名") ||
        message.includes("URL") ||
        message.includes("无效") ||
        message.includes("允许范围")
      ) {
        return jsonError(res, 400, message);
      }
      jsonError(res, 500, message);
    }
  });

  router.post(
    "/parse-html",
    express.text({ limit: "10mb", type: ["text/plain", "text/html"] }),
    async (req, res: Response) => {
      try {
        const html = typeof req.body === "string" ? req.body : "";

        if (!html) {
          return jsonError(res, 400, "No HTML content provided");
        }

        const $ = cheerio.load(html);
        const scrapedAt = new Date().toISOString();
        const results: Array<{
          title: string;
          url: string;
          date: string;
          source: string;
          category: string;
          scrapedAt: string;
        }> = [];

        $(".list-item, .news-item, li").each((_, el) => {
          const title = $(el).find("a").text().trim();
          const link = $(el).find("a").attr("href");
          const date = $(el).find(".date, span:last-child").text().trim();

          if (title && link) {
            const base = "http://legalinfo.moj.gov.cn";
            const url = link.startsWith("http")
              ? link
              : `${base}${link.startsWith("/") ? "" : "/"}${link}`;
            results.push({
              title,
              url,
              date: date || new Date().toISOString().split("T")[0],
              source: "Manual Import",
              category: "手动解析",
              scrapedAt,
            });
          }
        });

        res.json({ success: true, data: results });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Parse failed";
        console.error("[/api/parse-html]", message);
        jsonError(res, 500, message);
      }
    }
  );

  router.get("/article-content", async (req, res) => {
    try {
      const raw = req.query.url;
      if (!raw || typeof raw !== "string") {
        return jsonError(res, 400, "URL is required");
      }

      let target: URL;
      try {
        target = assertLegalArticleUrl(raw);
      } catch (e) {
        return jsonError(
          res,
          400,
          e instanceof Error ? e.message : "Invalid URL"
        );
      }

      const fetchUrl = normalizeArticleFetchUrl(target);
      const response = await http.get(fetchUrl.href);
      const finalHref =
        (response.request as { res?: { responseUrl?: string } } | undefined)?.res
          ?.responseUrl || fetchUrl.href;
      const html = String(response.data);
      let parsed = extractArticleFromPage(html, finalHref);
      let contentImages = collectArticleImagesFromHtml(parsed.content || "", finalHref, 20);
      let coverImage = contentImages[0] || "";

      const plainText = (parsed.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (plainText.length < 30) {
        const fallback = (await findFullArticleFallback(finalHref)) || (await findFullArticleFallback(target.href));
        if (fallback?.content?.trim()) {
          parsed = {
            title: fallback.title?.trim() || parsed.title,
            date: fallback.date?.trim() || parsed.date,
            content: fallback.content,
          };
          contentImages = collectArticleImagesFromHtml(parsed.content || "", finalHref, 20);
          if (!contentImages.length && Array.isArray(fallback.images)) {
            contentImages = fallback.images.filter((x) => typeof x === "string" && x.trim());
          }
          coverImage = contentImages[0] || coverImage;
        }
      }
      res.json({
        success: true,
        data: {
          ...parsed,
          coverImage,
          images: contentImages,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Article fetch failed";
      console.error("[/api/article-content]", message);
      jsonError(res, 500, message);
    }
  });

  router.use((_req, res) => {
    jsonError(res, 404, "API route not found");
  });

  return router;
}
