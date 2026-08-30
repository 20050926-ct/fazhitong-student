import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Article = {
  id: string;
  title: string;
  url: string;
  category?: string;
  date?: string;
  scrapedAt?: string;
};

const TREND_CATEGORIES = [
  { key: '普法动态·主题活动', label: '主题活动' },
  { key: '普法动态·普法集锦', label: '普法集锦' },
  { key: '普法动态·工作交流', label: '工作交流' },
];

const COLLEGE_KEYWORDS = [
  '大学生', '高校', '校园', '学生', '实习', '就业', '三方协议', '兼职', '租房', '押金', '网贷', '诈骗', '反诈', '未成年人', '青年',
];

function normalizeTitle(title: string): string {
  return (title || '').replace(/[【】\[\]（）()“”"'《》·\s:：,，。.!！？?、\-]/g, '').toLowerCase();
}

function articleHref(item: Article) {
  if (item.id && item.id !== 'view') {
    return `/article/${item.id}`;
  }
  return `/article/view?url=${encodeURIComponent(item.url)}`;
}

export default function LegalTrendsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(TREND_CATEGORIES[0].key);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/legal-articles?limit=300');
        const json = await res.json();
        const list: Article[] = res.ok && json.success && Array.isArray(json.data)
          ? json.data.map((x: Article) => x)
          : [];
        setRows(list);
      } catch (e) {
        console.error('Load legal trends failed:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeLabel = useMemo(
    () => TREND_CATEGORIES.find((x) => x.key === activeCategory)?.label || '主题活动',
    [activeCategory]
  );

  const filtered = useMemo(() => {
    const hits = rows.filter((x) => {
      if ((x.category || '') !== activeCategory) return false;
      const title = (x.title || '').toLowerCase();
      return COLLEGE_KEYWORDS.some((k) => title.includes(k.toLowerCase()));
    });
    const byUrl = new Set<string>();
    const byTitle = new Set<string>();
    const out: Article[] = [];
    for (const item of hits) {
      const u = (item.url || '').trim();
      const t = normalizeTitle(item.title || '');
      if (u && byUrl.has(u)) continue;
      if (t && byTitle.has(t)) continue;
      if (u) byUrl.add(u);
      if (t) byTitle.add(t);
      out.push(item);
    }
    return out.slice(0, 80);
  }, [rows, activeCategory]);

  return (
    <section className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="text-xs text-on-surface-variant mb-5">
        首页 &gt; 普法动态 &gt; {activeLabel}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 border border-outline-variant rounded-xl bg-white overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-outline-variant text-primary font-bold text-lg">
            普法动态
          </div>
          <div className="p-2">
            {TREND_CATEGORIES.map((item) => {
              const active = item.key === activeCategory;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveCategory(item.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-primary text-white font-bold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-9 border border-outline-variant rounded-xl bg-white p-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-2">
            <h2 className="text-xl font-bold text-primary border-l-4 border-primary pl-3">
              {activeLabel}
            </h2>
            <span className="text-xs text-on-surface-variant">共 {filtered.length} 条</span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-on-surface-variant">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-on-surface-variant">暂无数据</div>
          ) : (
            <ul>
              {filtered.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  onClick={() => navigate(articleHref(item))}
                  className="flex items-center gap-3 py-3 border-b border-dashed border-outline-variant cursor-pointer group"
                >
                  <span className="text-on-surface-variant">▪</span>
                  <span className="flex-1 text-sm text-on-surface group-hover:text-primary line-clamp-1">
                    {item.title}
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      原文
                    </a>
                  )}
                  <span className="text-xs text-on-surface-variant shrink-0">
                    [{(item.date || item.scrapedAt || '').slice(0, 10)}]
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

