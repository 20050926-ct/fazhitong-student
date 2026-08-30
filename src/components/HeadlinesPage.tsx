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

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function normalizeTitle(title: string): string {
  return (title || '').replace(/[【】\[\]（）()“”"'《》·\s:：,，。.!！？?、\-]/g, '').toLowerCase();
}

function dedupe(items: Article[]): Article[] {
  const byUrl = new Set<string>();
  const byTitle = new Set<string>();
  const out: Article[] = [];
  for (const item of items) {
    const u = (item.url || '').trim();
    const t = normalizeTitle(item.title || '');
    if (u && byUrl.has(u)) continue;
    if (t && byTitle.has(t)) continue;
    if (u) byUrl.add(u);
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

export default function HeadlinesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/legal-articles?limit=500');
        const json = await res.json();
        const list: Article[] = res.ok && json.success && Array.isArray(json.data)
          ? json.data
          : [];
        setRows(list);
      } catch (e) {
        console.error('Load headlines failed:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const headlines = useMemo(() => {
    const filtered = dedupe(rows.filter((x) => (x.category || '').includes('要闻')));
    return (filtered.length > 0 ? filtered : rows).slice(0, 500);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(headlines.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedHeadlines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return headlines.slice(start, start + pageSize);
  }, [headlines, currentPage, pageSize]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const fixedStart = Math.max(1, end - 4);
    const nums: number[] = [];
    for (let i = fixedStart; i <= end; i += 1) nums.push(i);
    return nums;
  }, [currentPage, totalPages]);

  return (
    <section className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="text-xs text-on-surface-variant mb-5">首页 &gt; 要闻</div>
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary border-l-4 border-primary pl-3">全部头条</h2>
          <span className="text-xs text-on-surface-variant">共 {headlines.length} 条</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-on-surface-variant">加载中...</div>
        ) : headlines.length === 0 ? (
          <div className="py-10 text-center text-on-surface-variant">暂无头条数据</div>
        ) : (
          <>
            <ul className="px-4">
              {pagedHeadlines.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  onClick={() => navigate(articleHref(item))}
                  className="flex items-center gap-3 py-3 border-b border-dashed border-outline-variant cursor-pointer group"
                >
                  <span className="text-primary">▪</span>
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

            <div className="px-5 py-4 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-on-surface-variant">
                第 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, headlines.length)} 条 / 共 {headlines.length} 条
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-on-surface-variant">每页</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 rounded border border-outline-variant text-sm bg-white"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded border border-outline-variant text-sm disabled:opacity-40"
                >
                  上一页
                </button>

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`h-8 min-w-8 px-2 rounded border text-sm ${
                      n === currentPage
                        ? 'border-primary bg-primary text-white'
                        : 'border-outline-variant'
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded border border-outline-variant text-sm disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

