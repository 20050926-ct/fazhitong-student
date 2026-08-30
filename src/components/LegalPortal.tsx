import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Megaphone, Newspaper, Loader2 } from 'lucide-react';

const BANNER_AUTO_MS = 5500;

type BannerSlide = {
  image: string;
  title: string;
  /** 点击整张轮播时的跳转（可选） */
  navigateTo?: string;
};

const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    image:
      'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?q=80&w=1400&auto=format&fit=crop',
    title: '学习宣传贯彻习近平法治思想',
    navigateTo: '/ai-chat',
  },
  {
    image:
      'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1400&auto=format&fit=crop',
    title: '宪法宣传周：弘扬宪法精神 建设法治文化',
    navigateTo: '/ai-chat',
  },
  {
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1400&auto=format&fit=crop',
    title: '全民国家安全教育日 · 普法在行动',
    navigateTo: '/ai-chat',
  },
  {
    image:
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1400&auto=format&fit=crop',
    title: '民法典与生活同行',
    navigateTo: '/ai-chat',
  },
];

interface Article {
  id: string;
  title: string;
  url: string;
  date: string;
  category?: string;
}

const STATIC_FALLBACK: Article[] = [
  { id: 'view', title: '习近平在全军高级干部培训班开班式上发表重要讲话', url: 'http://legalinfo.moj.gov.cn/ttzdxw/202604/t20260408_533657.html', date: '2026-04-08' },
  { id: 'view', title: '救护车违反120调度，将患者拉至所属民营医院，深圳卫健委通报', url: 'http://legalinfo.moj.gov.cn/zhfxfzrd/202604/t20260410_533690.html', date: '2026-04-10' },
];

const FALLBACK_ANNOUNCEMENTS = [
  '司法部 全国普法办关于开展2026年全民国家安全教育日海报征集',
  '2026年全民国家安全教育日海报图',
  '食品安全宣传海报来了',
  '野生动物保护宣传海报来了',
  '《2025年全国“宪法宣传周”工作方案》',
  '2025年全国宪法宣传周海报',
];

const FALLBACK_DYNAMICS = [
  '雄安新区组织精准反诈宣传',
  '山西组织最美民警进校园宣讲 为师生送上“开学安全礼”',
  '吉林森林公安开展集中普法宣传',
  '河北保定：“两库一课”守护未成年人健康成长',
  '首都机场开展流动宣传',
  '黔西南开展普法走基层活动',
];

const FALLBACK_RECOMMENDATIONS = [
  '司法部发布2026年全民国家安全教育日普法宣传挂图',
  '最高人民法院发布关于加强知识产权司法保护的意见',
  '如何识别网络诈骗？这份校园反诈指南请收好',
  '实习协议怎么签？法律专家为你解读关键条款',
  '租房遇到“黑中介”？教你用法律武器维护权益',
  '大学生创业法律风险防范手册（2026版）',
  '个人信息保护法：你的数据隐私谁来守护？',
  '民法典进校园：让法治阳光照亮青春之路',
];

const COLLEGE_KEYWORDS = [
  '大学生', '高校', '校园', '学生', '实习', '就业', '三方协议', '兼职', '租房', '押金', '网贷', '诈骗', '反诈', '未成年人', '青年',
];

const TOP_LIST_COUNT = 8;
const DYNAMICS_COUNT = 8;
const RECOMMEND_COUNT = 6;

function ensureCount(items: Article[], fallbackTitles: string[], count: number, prefix: string): Article[] {
  const out = [...items];
  if (out.length >= count) return out.slice(0, count);
  for (let i = 0; out.length < count; i += 1) {
    const title = fallbackTitles[i % fallbackTitles.length];
    out.push({ id: `${prefix}-${i}`, title, url: '', date: '' });
  }
  return out.slice(0, count);
}

function normalizeTitle(title: string): string {
  return (title || '').replace(/[【】\[\]（）()“”"'《》·\s:：,，。.!！？?、\-]/g, '').toLowerCase();
}

function dedupeArticles(items: Article[]): Article[] {
  const byUrl = new Set<string>();
  const byTitle = new Set<string>();
  const out: Article[] = [];
  for (const item of items) {
    const url = (item.url || '').trim();
    const t = normalizeTitle(item.title || '');
    if (url && byUrl.has(url)) continue;
    if (t && byTitle.has(t)) continue;
    if (url) byUrl.add(url);
    if (t) byTitle.add(t);
    out.push(item);
  }
  return out;
}

function articleHref(item: Article) {
  if (item.id && item.id !== 'view') {
    return `/article/${item.id}`;
  }
  return `/article/view?url=${encodeURIComponent(item.url)}`;
}

export default function LegalPortal() {
  const navigate = useNavigate();
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>(DEFAULT_BANNER_SLIDES);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);

  const openArticle = (item: Article) => {
    if (!item.url) {
      navigate('/ai-chat');
      return;
    }
    navigate(articleHref(item));
  };

  const goBanner = useCallback((i: number) => {
    const n = bannerSlides.length;
    if (n === 0) return;
    setBannerIndex(((i % n) + n) % n);
  }, [bannerSlides.length]);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    if (bannerPaused) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = window.setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, BANNER_AUTO_MS);
    return () => window.clearInterval(t);
  }, [bannerPaused, bannerSlides.length]);

  useEffect(() => {
    if (bannerIndex >= bannerSlides.length) {
      setBannerIndex(0);
    }
  }, [bannerIndex, bannerSlides.length]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/legal-articles?limit=200');
        const json = await res.json();
        const list: Article[] = res.ok && json.success && Array.isArray(json.data)
          ? json.data.map(
              (row: { id: string; title: string; url: string; category?: string; scrapedAt?: string; date?: string }) => ({
                id: row.id,
                title: row.title,
                url: row.url,
                category: row.category,
                date: row.date || row.scrapedAt?.slice(0, 10) || '',
              })
            )
          : [];
        if (list.length > 0) {
          setNews(list);
        } else {
          setNews(STATIC_FALLBACK);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        setNews(STATIC_FALLBACK);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/college-headline-slides?limit=4');
        const json = await res.json();
        if (!res.ok || !json.success || !Array.isArray(json.data) || json.data.length === 0) return;
        const slides: BannerSlide[] = json.data
          .map((row: { title?: string; image?: string; url?: string }) => ({
            title: row.title || '',
            image: row.image || '',
            navigateTo: row.url ? `/article/view?url=${encodeURIComponent(row.url)}` : '/ai-chat',
          }))
          .filter((x: BannerSlide) => x.title && x.image);
        if (slides.length > 0) {
          setBannerSlides(slides.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching headline slides:', error);
      }
    };
    fetchSlides();
  }, []);

  const dedupedNews = dedupeArticles(news);
  const headlineNewsBase = (dedupedNews.filter((x) => (x.category || '').includes('要闻')).length
    ? dedupedNews.filter((x) => (x.category || '').includes('要闻'))
    : dedupedNews
  );
  const headlineNews = ensureCount(headlineNewsBase, FALLBACK_RECOMMENDATIONS, TOP_LIST_COUNT, 'head');

  const announcementsBase = (dedupedNews.filter((x) => (x.category || '').includes('通知公告')).length
    ? dedupedNews.filter((x) => (x.category || '').includes('通知公告'))
    : FALLBACK_ANNOUNCEMENTS.map((title, idx) => ({ id: `ann-${idx}`, title, url: '', date: '' }))
  );
  const announcements = ensureCount(announcementsBase, FALLBACK_ANNOUNCEMENTS, TOP_LIST_COUNT, 'ann');

  const dynamicsBase = (dedupedNews.filter((x) => {
    if (!(x.category || '').startsWith('普法动态')) return false;
    const title = (x.title || '').toLowerCase();
    return COLLEGE_KEYWORDS.some((k) => title.includes(k.toLowerCase()));
  }).length
    ? dedupedNews.filter((x) => {
        if (!(x.category || '').startsWith('普法动态')) return false;
        const title = (x.title || '').toLowerCase();
        return COLLEGE_KEYWORDS.some((k) => title.includes(k.toLowerCase()));
      })
    : FALLBACK_DYNAMICS.map((title, idx) => ({ id: `dyn-${idx}`, title, url: '', date: '' }))
  );
  const dynamics = ensureCount(dynamicsBase, FALLBACK_DYNAMICS, DYNAMICS_COUNT, 'dyn');

  const recommendationsBase = (dedupedNews.filter((x) => (x.category || '').includes('大学生法律热点')).length
    ? dedupedNews.filter((x) => (x.category || '').includes('大学生法律热点'))
    : FALLBACK_RECOMMENDATIONS.map((title, idx) => ({ id: `rec-${idx}`, title, url: '', date: '' }))
  );
  const recommendations = ensureCount(
    recommendationsBase,
    FALLBACK_RECOMMENDATIONS,
    RECOMMEND_COUNT,
    'rec'
  );

  return (
    <div className="bg-white">
      <div className="bg-gray-50 py-5 border-b border-outline-variant">
        <div className="max-w-[1400px] mx-auto px-6">
          <h1 className="text-3xl font-black text-center text-on-surface tracking-tight">
            深入学习宣传贯彻习近平法治思想
          </h1>
        </div>
      </div>

      <section className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className="lg:col-span-5 relative group overflow-hidden rounded-lg shadow-lg min-h-[320px] h-full focus-within:ring-2 focus-within:ring-primary/50 outline-none"
            onMouseEnter={() => setBannerPaused(true)}
            onMouseLeave={() => setBannerPaused(false)}
            onFocus={() => setBannerPaused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setBannerPaused(false);
              }
            }}
            role="region"
            aria-roledescription="carousel"
            aria-label="首页轮播"
          >
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{
                transform: `translateX(-${(100 / bannerSlides.length) * bannerIndex}%)`,
                width: `${bannerSlides.length * 100}%`,
              }}
            >
              {bannerSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className="relative h-full shrink-0 overflow-hidden"
                  style={{ width: `${100 / bannerSlides.length}%` }}
                >
                  <img
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 text-white pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  const to = bannerSlides[bannerIndex]?.navigateTo;
                  if (to) navigate(to);
                }}
                className="text-left w-full rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <p className="font-bold text-lg drop-shadow-sm pr-8">
                  {bannerSlides[bannerIndex]?.title}
                </p>
              </button>
              <div className="flex gap-2 mt-3" role="tablist" aria-label="轮播分页">
                {bannerSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === bannerIndex}
                    aria-label={`第 ${i + 1} 张，共 ${bannerSlides.length} 张`}
                    onClick={() => goBanner(i)}
                    className={`h-2 w-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      i === bannerIndex ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-6">
              <h2 className="text-2xl font-bold text-primary border-l-4 border-primary pl-4 flex items-center gap-2">
                <Newspaper size={18} /> 要闻
              </h2>
              <button
                type="button"
                onClick={() => navigate('/headlines')}
                className="text-xs font-bold flex items-center gap-0.5 text-on-surface-variant hover:text-primary transition-colors"
              >
                更多 <ChevronRight size={14} />
              </button>
            </div>
            {loading && news.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              <ul className="space-y-3">
                {headlineNews.map((item, idx) => (
                  <li
                    key={`${item.id}-${idx}`}
                    onClick={() => openArticle(item)}
                    className="flex items-start gap-2 group cursor-pointer hover:bg-surface-container-low p-1 rounded transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                    <span className="text-on-surface text-sm leading-relaxed group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-6">
              <h2 className="text-2xl font-bold text-primary border-l-4 border-primary pl-4 flex items-center gap-2">
                <Megaphone size={18} /> 通知公告
              </h2>
              <button className="text-xs text-on-surface-variant hover:text-primary flex items-center">
                更多 <ChevronRight size={14} />
              </button>
            </div>
            <ul className="space-y-3">
              {announcements.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  onClick={() => openArticle(item)}
                  className="flex items-start gap-2 group cursor-pointer hover:bg-surface-container-low p-1 rounded transition-all"
                >
                  <span className="text-on-surface-variant text-xs mt-1 shrink-0">▪</span>
                  <span className="text-on-surface text-sm leading-relaxed group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="primary-gradient p-4 rounded-lg text-white text-center font-bold text-lg shadow-md cursor-default"
          >
            学习宣传贯彻党的二十届四中全会精神
          </div>
          <div
            className="primary-gradient p-4 rounded-lg text-white text-center font-bold text-lg shadow-md cursor-default"
          >
            学习宣传贯彻习近平法治思想
          </div>
          <div
            className="primary-gradient p-4 rounded-lg text-white text-center font-bold text-lg shadow-md cursor-default"
          >
            习近平法治思想系列讲读
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-primary border-l-4 border-primary pl-4">普法动态</h2>
              </div>
              <button
                onClick={() => navigate('/legal-trends')}
                className="text-xs text-on-surface-variant hover:text-primary flex items-center"
              >
                更多 <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {dynamics.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => openArticle(item)}
                  className="flex items-center gap-3 group cursor-pointer border-b border-dashed border-outline-variant pb-3 hover:bg-surface-container-low transition-all"
                >
                  <span className="text-on-surface-variant text-xs shrink-0">▪</span>
                  <span className="text-on-surface text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="bg-surface-container-low py-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-8">
            <h2 className="text-2xl font-bold text-primary border-l-4 border-primary pl-4">阅读推荐</h2>
            <button className="text-xs text-on-surface-variant hover:text-primary flex items-center">
              更多 <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => openArticle(item)}
                className="flex items-start gap-2 group cursor-pointer hover:bg-white p-2 rounded-lg transition-all"
              >
                <span className="text-primary mt-1 shrink-0">▪</span>
                <span className="text-on-surface text-sm leading-relaxed group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
