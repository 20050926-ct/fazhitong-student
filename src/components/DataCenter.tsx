import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Database, Loader2, RefreshCw, HardDrive } from 'lucide-react';
import DataImport from './DataImport';

type CategoryRow = { name: string; count: number };

type StoreSummary = {
  key: string;
  label: string;
  file: string;
  total: number;
  categories: CategoryRow[];
};

type SummaryPayload = {
  engine: string;
  description: string;
  stores: StoreSummary[];
};

export default function DataCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'import' ? 'import' : 'overview';

  const setTab = (next: 'overview' | 'import') => {
    if (next === 'import') {
      setSearchParams({ tab: 'import' });
    } else {
      setSearchParams({});
    }
  };

  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/legal-storage/summary');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSummary(json.data as SummaryPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'overview') {
      void loadSummary();
    }
  }, [tab, loadSummary]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary mb-2 flex items-center gap-2">
            <Database className="shrink-0" size={32} aria-hidden />
            普法数据中心
          </h1>
          <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            在此查看本地<strong>数据库存储</strong>（<code className="text-xs bg-surface-container-high px-1 rounded">data/</code>{' '}
            目录 JSON 文件）的统计，并进入采集导入将官网或自定义网址内容写入对应库。
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-outline-variant mb-8">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 -mb-px transition-colors ${
              tab === 'overview'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <HardDrive size={16} aria-hidden />
              数据概览
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('import')}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 -mb-px transition-colors ${
              tab === 'import'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            采集导入
          </button>
        </div>

        {tab === 'overview' ? (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-on-surface-variant">{summary?.description}</p>
              <button
                type="button"
                onClick={() => void loadSummary()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-2 text-sm font-bold text-on-surface hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                刷新统计
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {loading && !summary ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-primary" size={36} />
              </div>
            ) : summary ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  {summary.stores.map((s) => (
                    <div
                      key={s.key}
                      className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm"
                    >
                      <div className="text-xs font-bold text-on-surface-variant mb-1">{s.label}</div>
                      <div className="text-3xl font-black text-primary tabular-nums mb-2">{s.total}</div>
                      <code className="text-[10px] text-on-surface-variant break-all">{s.file}</code>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-outline-variant bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low text-sm font-bold text-on-surface">
                    各库分类分布（前若干项）
                  </div>
                  <div className="divide-y divide-outline-variant/60">
                    {summary.stores.map((s) => (
                      <div key={s.key} className="p-4">
                        <div className="text-xs font-bold text-primary mb-2">{s.label}</div>
                        {s.categories.length === 0 ? (
                          <p className="text-xs text-on-surface-variant">暂无分类数据</p>
                        ) : (
                          <div className="grid gap-1 sm:grid-cols-2">
                            {s.categories.map((c) => (
                              <div
                                key={`${s.key}-${c.name}`}
                                className="flex justify-between gap-2 text-xs rounded-lg bg-surface-container-low px-3 py-2"
                              >
                                <span className="text-on-surface truncate" title={c.name}>
                                  {c.name}
                                </span>
                                <span className="font-mono font-bold text-primary shrink-0">{c.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-on-surface-variant">
                  存储引擎：<code className="px-1 bg-surface-container-high rounded">{summary.engine}</code>
                  。后续若需 MySQL / SQLite，可在保留相同 API 的前提下替换后端实现。
                </p>
              </>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
            <DataImport embedded />
          </div>
        )}
      </div>
    </div>
  );
}
