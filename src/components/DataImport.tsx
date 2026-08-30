import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Loader2,
  Download,
  Database,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Globe,
  Video,
  Link2,
} from 'lucide-react';

/** 当前支持的站点（可扩展更多 key 与后端路由） */
const SITES = [
  {
    id: 'legalinfo',
    name: '中国普法网',
    baseUrl: 'http://legalinfo.moj.gov.cn/',
  },
] as const;

type SiteId = (typeof SITES)[number]['id'];

/** 采集目标：决定调用哪个接口、导入哪个本地文件 */
type ScrapeTarget =
  | 'home-articles'
  | 'wsp-articles'
  | 'home-images';

const TARGETS: {
  id: ScrapeTarget;
  label: string;
  desc: string;
  dest: string;
}[] = [
  {
    id: 'home-articles',
    label: '首页 · 各栏目文章链接',
    desc: '要闻、通知公告、普法动态、法治文化等列表中的链接',
    dest: 'data/legal-articles.json（文章库）',
  },
  {
    id: 'wsp-articles',
    label: '在线学法 · 微视频列表',
    desc: '微视频栏目列表页中的条目',
    dest: 'data/legal-articles.json（文章库）',
  },
  {
    id: 'home-images',
    label: '首页 · 页面配图',
    desc: '首页 HTML 中出现的图片地址（图标、轮播等都会包含）',
    dest: 'data/scraped-images.json（图片库）',
  },
];

interface ScrapedItem {
  title: string;
  url: string;
  category: string;
  scrapedAt?: string;
  date?: string;
  source?: string;
}

type CustomKind = 'articles' | 'images' | 'videos';

interface VideoPreviewRow {
  url: string;
  title: string;
  category: string;
  scrapedAt: string;
}

export type DataImportProps = { embedded?: boolean };

export default function DataImport({ embedded = false }: DataImportProps = {}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);
  const [data, setData] = useState<ScrapedItem[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [videoRows, setVideoRows] = useState<VideoPreviewRow[]>([]);
  const [manualHtml, setManualHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'manual'>('preset');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [siteId, setSiteId] = useState<SiteId>('legalinfo');
  const [scrapeTarget, setScrapeTarget] = useState<ScrapeTarget>('home-articles');
  const [scrapeLimit, setScrapeLimit] = useState(40);

  const [customPageUrl, setCustomPageUrl] = useState('');
  const [customKind, setCustomKind] = useState<CustomKind>('articles');
  const [customCategory, setCustomCategory] = useState('法治动态');
  const [customLimit, setCustomLimit] = useState(40);

  const selectedSite = SITES.find((s) => s.id === siteId)!;
  const selectedTargetMeta = TARGETS.find((t) => t.id === scrapeTarget)!;
  const isArticleTarget = scrapeTarget === 'home-articles' || scrapeTarget === 'wsp-articles';
  const isImageTarget = scrapeTarget === 'home-images';

  const changeScrapeTarget = (id: ScrapeTarget) => {
    setScrapeTarget(id);
    setData([]);
    setImages([]);
    setVideoRows([]);
    setStatus(null);
  };

  const imageImportMeta = (): { category?: string; source: string } => {
    if (activeTab === 'custom' && customKind === 'images') {
      let host = '外部站点';
      try {
        host = new URL(customPageUrl.trim()).hostname;
      } catch {
        /* keep default */
      }
      return {
        category: customCategory.trim() || '自定义收录',
        source: `自定义爬取 · ${host}`,
      };
    }
    return {
      category: '普法网首页配图',
      source: '中国普法网首页图片',
    };
  };

  const videoImportSource = (): string => {
    let host = '外部站点';
    try {
      host = new URL(customPageUrl.trim()).hostname;
    } catch {
      /* keep */
    }
    return `自定义爬取 · ${host}`;
  };

  const runScrape = async () => {
    if (siteId !== 'legalinfo') {
      setStatus({ type: 'error', message: '当前仅接入中国普法网，请选择该站点。' });
      return;
    }

    setLoading(true);
    setStatus(null);
    setData([]);
    setImages([]);
    setVideoRows([]);

    try {
      if (isImageTarget) {
        const response = await fetch('/api/scrape-images');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        setImages(result.data);
        setStatus({
          type: 'success',
          message: `已爬取 ${result.data.length} 张图片 · 将导入至：${selectedTargetMeta.dest}`,
        });
        return;
      }

      const cap = Math.min(500, Math.max(1, Math.floor(scrapeLimit) || 40));
      const params = new URLSearchParams();
      params.set('limit', String(cap));
      if (scrapeTarget === 'wsp-articles') params.set('mode', 'wsp');
      const response = await fetch(`/api/scrape?${params.toString()}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setData(result.data);
      const total = result.meta?.totalAvailable;
      const extra =
        typeof total === 'number' && total > result.data.length
          ? `（全页共 ${total} 条，本次取前 ${result.data.length} 条）`
          : '';
      setStatus({
        type: 'success',
        message: `已爬取 ${result.data.length} 条文章链接 · ${selectedTargetMeta.label} ${extra}。请确认后导入至：${selectedTargetMeta.dest}`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '爬取失败';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleParseManual = async () => {
    if (!manualHtml.trim()) {
      setStatus({ type: 'error', message: '请输入 HTML 源代码' });
      return;
    }
    setLoading(true);
    setStatus(null);
    setImages([]);
    setVideoRows([]);
    try {
      const response = await fetch('/api/parse-html', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: manualHtml,
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setStatus({
          type: 'success',
          message: `解析到 ${result.data.length} 条 · 将导入至 data/legal-articles.json（文章库）`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '解析失败';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const runCustomScrape = async () => {
    const u = customPageUrl.trim();
    if (!u) {
      setStatus({ type: 'error', message: '请输入要采集的页面网址（须为允许的法务/政务类域名）' });
      return;
    }
    setLoading(true);
    setStatus(null);
    setData([]);
    setImages([]);
    setVideoRows([]);
    try {
      const cap = Math.min(500, Math.max(1, Math.floor(customLimit) || 40));
      const response = await fetch('/api/scrape/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: u,
          kind: customKind,
          limit: cap,
          category: customCategory.trim() || '自定义收录',
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      const meta = result.meta as {
        kind: CustomKind;
        pageUrl: string;
        count: number;
        category?: string;
      };
      if (meta.kind === 'articles') {
        setData(result.data as ScrapedItem[]);
        setStatus({
          type: 'success',
          message: `已从 ${meta.pageUrl} 采集 ${meta.count} 条文章链接（启发式，请人工核对）· 导入至文章库`,
        });
      } else if (meta.kind === 'images') {
        setImages(result.data as string[]);
        setStatus({
          type: 'success',
          message: `已采集 ${meta.count} 张图片 · 导入至图片库（含分类：${meta.category || customCategory}）`,
        });
      } else {
        setVideoRows(result.data as VideoPreviewRow[]);
        setStatus({
          type: 'success',
          message: `已采集 ${meta.count} 个视频地址 · 导入至 data/scraped-videos.json`,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '爬取失败';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleImportImagesToLibrary = async () => {
    if (!images.length) return;
    setImageSaving(true);
    setStatus(null);
    try {
      const extra = imageImportMeta();
      const response = await fetch('/api/legal-images/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: images, category: extra.category, source: extra.source }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      const d = result.data as { imported: number; skipped: number; total: number };
      setStatus({
        type: 'success',
        message: `图片库已更新：新增 ${d.imported} 张，跳过 ${d.skipped} 张重复，库中共 ${d.total} 张。文件：data/scraped-images.json`,
      });
      setImages([]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '导入失败';
      setStatus({ type: 'error', message: `图片导入失败: ${msg}` });
    } finally {
      setImageSaving(false);
    }
  };

  const handleImportVideos = async () => {
    if (!videoRows.length) return;
    setVideoSaving(true);
    setStatus(null);
    try {
      const source = videoImportSource();
      const response = await fetch('/api/legal-videos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: videoRows.map((v) => ({ ...v, source })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      const d = result.data as { imported: number; skipped: number; total: number };
      setStatus({
        type: 'success',
        message: `视频库已更新：新增 ${d.imported} 条，跳过 ${d.skipped} 条重复，库中共 ${d.total} 条。文件：data/scraped-videos.json`,
      });
      setVideoRows([]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '导入失败';
      setStatus({ type: 'error', message: `视频导入失败: ${msg}` });
    } finally {
      setVideoSaving(false);
    }
  };

  const handleImportArticles = async () => {
    if (!data.length) return;
    setSaving(true);
    setStatus(null);
    try {
      const rows = data.map((item) => ({
        title: item.title,
        url: item.url,
        category: item.category || item.source || '未分类',
        scrapedAt:
          item.scrapedAt ||
          (item.date ? `${item.date}T12:00:00.000Z` : new Date().toISOString()),
      }));
      const response = await fetch('/api/legal-articles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      const d = result.data as { imported: number; skipped: number; total: number };
      setStatus({
        type: 'success',
        message: `文章库已更新（${selectedSite.name}）：新增 ${d.imported} 条，跳过 ${d.skipped} 条重复，库中共 ${d.total} 条。文件：data/legal-articles.json`,
      });
      setData([]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '导入失败';
      setStatus({ type: 'error', message: `文章导入失败: ${msg}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'max-w-4xl mx-auto'
          : 'max-w-4xl mx-auto p-8 bg-white min-h-screen'
      }
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {embedded ? (
            <>
              <h2 className="text-xl font-black text-on-surface mb-1">采集与导入</h2>
              <p className="text-xs text-on-surface-variant/80">
                写入 <code className="bg-surface-container-high px-1 rounded text-[10px]">data/*.json</code>{' '}
                本地库；统计请在「数据概览」查看。
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-on-surface mb-2">司法数据采集中心</h1>
              <p className="text-xs text-on-surface-variant/80 mb-2">
                <strong>文章库</strong>{' '}
                <code className="bg-surface-container-high px-1 rounded">data/legal-articles.json</code>
                {' · '}
                <strong>图片库</strong>{' '}
                <code className="bg-surface-container-high px-1 rounded">data/scraped-images.json</code>
                {' · '}
                <strong>视频库</strong>{' '}
                <code className="bg-surface-container-high px-1 rounded">data/scraped-videos.json</code>
                <br />
                需运行 <code className="px-1">npm run dev</code>，由本机后端写入。
              </p>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('preset');
              setData([]);
              setImages([]);
              setVideoRows([]);
              setStatus(null);
            }}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'preset' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'}`}
          >
            预设站点
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('custom');
              setData([]);
              setImages([]);
              setVideoRows([]);
              setStatus(null);
            }}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${activeTab === 'custom' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'}`}
          >
            <Link2 size={14} aria-hidden />
            自定义网址
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setData([]);
              setImages([]);
              setVideoRows([]);
              setStatus(null);
            }}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'}`}
          >
            手动 HTML
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 mb-8 p-6 bg-surface-container-low rounded-2xl border border-outline-variant">
        {activeTab === 'preset' ? (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">网站</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={18} />
                  <select
                    value={siteId}
                    onChange={(e) => {
                      setSiteId(e.target.value as SiteId);
                      setData([]);
                      setImages([]);
                      setVideoRows([]);
                      setStatus(null);
                    }}
                    className="pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-bold text-sm min-w-[220px] focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    {SITES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <a
                  href={selectedSite.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:underline mt-1 inline-block"
                >
                  打开官网
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-on-surface-variant mb-2">采集类型（决定爬什么、导入到哪里）</p>
              <div className="grid gap-3 sm:grid-cols-1">
                {TARGETS.map((t) => (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      scrapeTarget === t.id
                        ? 'border-primary bg-white shadow-sm'
                        : 'border-outline-variant bg-white/60 hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scrapeTarget"
                      checked={scrapeTarget === t.id}
                      onChange={() => changeScrapeTarget(t.id)}
                      className="mt-1 mr-3 accent-primary"
                    />
                    <div>
                      <div className="font-bold text-on-surface">{t.label}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{t.desc}</div>
                      <div className="text-[11px] text-primary mt-1 font-mono">→ {t.dest}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {isArticleTarget && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                <label htmlFor="scrape-limit" className="font-medium text-on-surface">
                  文章链接本次最多
                </label>
                <input
                  id="scrape-limit"
                  type="number"
                  min={1}
                  max={500}
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-outline-variant bg-white text-on-surface font-mono text-sm focus:outline-none focus:border-primary"
                />
                <span>条（1–500）</span>
              </div>
            )}

            {isImageTarget && (
              <p className="text-xs text-on-surface-variant bg-white/80 rounded-lg px-3 py-2 border border-outline-variant">
                图片采集为首页全部 <code>&lt;img&gt;</code> 地址，数量可能较多；导入后保存在图片库 JSON，便于后续做图库或筛选。
              </p>
            )}

            <button
              type="button"
              onClick={runScrape}
              disabled={loading || saving || imageSaving || videoSaving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 w-fit"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
              开始爬取
            </button>

            {data.length > 0 && (
              <button
                type="button"
                onClick={handleImportArticles}
                disabled={saving || imageSaving || videoSaving || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 w-fit"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Database size={20} />}
                导入到文章库 ({data.length})
              </button>
            )}

            {images.length > 0 && (
              <button
                type="button"
                onClick={handleImportImagesToLibrary}
                disabled={imageSaving || saving || videoSaving || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 w-fit"
              >
                {imageSaving ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                导入到图片库 ({images.length})
              </button>
            )}
          </>
        ) : activeTab === 'custom' ? (
          <div className="w-full space-y-4">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              输入<strong>列表页或栏目页</strong>的完整 URL（需为允许的域名，如 .gov.cn / .org.cn / .edu.cn 或内置法务站点；更严限制可设环境变量{' '}
              <code className="text-[10px]">LEGAL_SCRAPE_STRICT</code>
              ）。文章模式会抓取同站「像正文链接」的地址（启发式，可能有噪声）；图片为页面内{' '}
              <code>&lt;img&gt;</code>；视频为 <code>video</code> / 直链 <code>.mp4</code> / 常见外链等。
            </p>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">页面网址</label>
              <input
                type="url"
                value={customPageUrl}
                onChange={(e) => setCustomPageUrl(e.target.value)}
                placeholder="https://www.example.gov.cn/xx/index.html"
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white font-mono text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">采集类型</label>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { id: 'articles' as const, label: '文章链接', desc: '→ legal-articles.json' },
                      { id: 'images' as const, label: '配图', desc: '→ scraped-images.json' },
                      { id: 'videos' as const, label: '视频地址', desc: '→ scraped-videos.json' },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm ${
                        customKind === opt.id
                          ? 'border-primary bg-white'
                          : 'border-outline-variant bg-white/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="customKind"
                        checked={customKind === opt.id}
                        onChange={() => {
                          setCustomKind(opt.id);
                          setData([]);
                          setImages([]);
                          setVideoRows([]);
                          setStatus(null);
                        }}
                        className="accent-primary"
                      />
                      <span className="font-bold text-on-surface">{opt.label}</span>
                      <span className="text-[10px] text-primary font-mono">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">栏目 / 分类名称</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="如：地方法规、以案释法"
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">本次最多条数（1–500）</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={customLimit}
                    onChange={(e) => setCustomLimit(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-white font-mono text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={runCustomScrape}
              disabled={loading || saving || imageSaving || videoSaving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 w-fit"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
              开始爬取
            </button>
            {data.length > 0 && customKind === 'articles' && (
              <button
                type="button"
                onClick={handleImportArticles}
                disabled={saving || imageSaving || videoSaving || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 w-fit"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Database size={20} />}
                导入到文章库 ({data.length})
              </button>
            )}
            {images.length > 0 && customKind === 'images' && (
              <button
                type="button"
                onClick={handleImportImagesToLibrary}
                disabled={imageSaving || saving || videoSaving || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 w-fit"
              >
                {imageSaving ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                导入到图片库 ({images.length})
              </button>
            )}
            {videoRows.length > 0 && customKind === 'videos' && (
              <button
                type="button"
                onClick={handleImportVideos}
                disabled={videoSaving || saving || imageSaving || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 w-fit"
              >
                {videoSaving ? <Loader2 className="animate-spin" size={20} /> : <Video size={20} aria-hidden />}
                导入到视频库 ({videoRows.length})
              </button>
            )}
          </div>
        ) : (
          <div className="w-full space-y-4">
            <p className="text-sm text-on-surface-variant">
              无法直连官网时，在浏览器打开页面 → 右键「查看网页源代码」→ 粘贴到下方。解析结果可导入{' '}
              <strong>文章库</strong> <code className="text-xs">legal-articles.json</code>。
            </p>
            <textarea
              value={manualHtml}
              onChange={(e) => setManualHtml(e.target.value)}
              placeholder="在此粘贴 HTML 源代码..."
              className="w-full h-48 p-4 bg-white border-2 border-outline-variant rounded-xl font-mono text-xs focus:outline-none focus:border-primary transition-all"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleParseManual}
                disabled={loading || saving || imageSaving || videoSaving || !manualHtml}
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                解析并预览
              </button>
              {data.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportArticles}
                  disabled={saving || imageSaving || videoSaving || loading}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Database size={20} />}
                  导入到文章库 ({data.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-8 flex items-center gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {status.message}
        </motion.div>
      )}

      {videoRows.length > 0 && (
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden mb-8">
          <div className="px-4 py-2 bg-white border-b border-outline-variant text-xs text-on-surface-variant flex items-center gap-2">
            <Video size={14} className="text-primary shrink-0" aria-hidden />
            预览 · 将写入 <code>scraped-videos.json</code>（{videoRows.length} 条）
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-outline-variant">
                <th className="p-3 font-bold text-sm">标题</th>
                <th className="p-3 font-bold text-sm">分类</th>
                <th className="p-3 font-bold text-sm">链接</th>
              </tr>
            </thead>
            <tbody>
              {videoRows.map((row, index) => (
                <tr key={`${row.url}-${index}`} className="border-b border-outline-variant/50 hover:bg-white text-sm">
                  <td className="p-3 font-medium text-on-surface max-w-[200px]">{row.title}</td>
                  <td className="p-3">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                      {row.category}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] break-all text-primary">
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {row.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden mb-8">
          <div className="px-4 py-2 bg-white border-b border-outline-variant text-xs text-on-surface-variant">
            预览 · 将写入 <code>legal-articles.json</code>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-outline-variant">
                <th className="p-4 font-bold text-sm">标题</th>
                <th className="p-4 font-bold text-sm">分类</th>
                <th className="p-4 font-bold text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b border-outline-variant/50 hover:bg-white transition-colors">
                  <td className="p-4 text-sm font-medium text-on-surface">{item.title}</td>
                  <td className="p-4 text-sm text-on-surface-variant">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/article/view?url=${encodeURIComponent(item.url)}`}
                        className="text-primary font-bold hover:underline"
                      >
                        应用内阅读
                      </Link>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1"
                      >
                        官网原文 <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-4">
          <div className="px-4 py-2 bg-surface-container-low rounded-t-xl border border-b-0 border-outline-variant text-xs text-on-surface-variant">
            预览 · 将写入 <code>scraped-images.json</code>（{images.length} 张）
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-container-low rounded-b-xl border border-outline-variant border-t-0">
            {images.map((url, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl overflow-hidden border border-outline-variant bg-gray-50 group relative"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <p className="text-[10px] text-white break-all text-center">{url}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.length === 0 && images.length === 0 && videoRows.length === 0 && !loading && (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
          <div className="text-on-surface-variant mb-2">暂无预览数据</div>
          <p className="text-xs text-on-surface-variant/70 text-balance max-w-md mx-auto">
            {activeTab === 'preset' && (
              <>
                在上方选择<strong>网站</strong>与<strong>采集类型</strong>，点击「开始爬取」；预览无误后再导入文章库或图片库。
              </>
            )}
            {activeTab === 'custom' && (
              <>
                在「自定义网址」中填写页面 URL、选择文章/图片/视频并填写<strong>分类</strong>，点击「开始爬取」后在此预览并导入对应 JSON 库。
              </>
            )}
            {activeTab === 'manual' && (
              <>粘贴 HTML 后点击「解析并预览」，再导入文章库。</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
