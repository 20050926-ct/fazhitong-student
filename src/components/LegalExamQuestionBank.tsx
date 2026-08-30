import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LEGAL_EXAM_QUESTIONS_BANK } from '../data/legalExamQuestions';

type Question = {
  id: string;
  subject: string;
  stem: string;
  options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
  answerKey: 'A' | 'B' | 'C' | 'D';
  analysis: string;
  sourceTitle: string;
  sourceUrl: string;
};

function useSubjectFilter() {
  const location = useLocation();
  return useMemo(() => {
    const s = new URLSearchParams(location.search).get('subject')?.trim();
    return s || '';
  }, [location.search]);
}

const PANEL_PAGE_SIZE = 20;

/** 题号面板展示用总题数（不少于真实题量，且为整页对齐），多页翻页更有「大题库」观感 */
function getVirtualQuestionTotal(realCount: number): number {
  if (realCount <= 0) return 0;
  const minimumSlots = 400;
  return Math.ceil(Math.max(realCount, minimumSlots) / PANEL_PAGE_SIZE) * PANEL_PAGE_SIZE;
}

export default function LegalExamQuestionBank() {
  const navigate = useNavigate();
  const subject = useSubjectFilter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  /** 当前展示题号（从 0 起计），可大于真实题库长度，内容按取模映射 */
  const [globalSlot, setGlobalSlot] = useState(0);
  /** 题号面板当前翻到的页（每页 PANEL_PAGE_SIZE 个格子） */
  const [panelViewPage, setPanelViewPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});

  const filterBySubject = (rows: Question[]) => {
    if (!subject) return rows;
    return rows.filter((x) => x.subject === subject);
  };

  const loadQuestions = async () => {
    setLoading(true);
    let rows: Question[] | null = null;

    try {
      const qs = new URLSearchParams();
      qs.set('limit', '120');
      if (subject) qs.set('subject', subject);
      const res = await fetch(`/api/legal-exam-questions?${qs.toString()}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        const data = Array.isArray(json?.data) ? (json.data as Question[]) : [];
        // 接口成功但题库为空（文件未同步、科目无匹配、导入未过服务端校验等）时，必须走本地兜底，否则会一直显示「更新中」。
        if (data.length > 0) rows = data;
      }
    } catch {
      // API 不可用时，静默回退到本地题库 JSON，避免暴露“爬取/导入”过程。
    }

    if (!rows?.length) {
      try {
        const fallbackRes = await fetch('/data/legal-exam-questions.json');
        if (!fallbackRes.ok) throw new Error('fallback_failed');
        const fallbackJson = await fallbackRes.json();
        const parsed = Array.isArray(fallbackJson) ? fallbackJson : [];
        const data = filterBySubject(parsed as Question[]);
        rows = data.slice(0, 120);
      } catch {
        rows = filterBySubject(LEGAL_EXAM_QUESTIONS_BANK as Question[]).slice(0, 120);
      }
    }

    setQuestions(rows ?? []);
    setGlobalSlot(0);
    setPanelViewPage(0);
    setLoading(false);
  };

  useEffect(() => {
    void loadQuestions();
  }, [subject]);

  const virtualTotal = useMemo(() => getVirtualQuestionTotal(questions.length), [questions.length]);
  const totalPanelPages = virtualTotal > 0 ? Math.ceil(virtualTotal / PANEL_PAGE_SIZE) : 1;

  const goToGlobalSlot = (slot: number) => {
    if (virtualTotal <= 0) return;
    const s = Math.max(0, Math.min(virtualTotal - 1, slot));
    setGlobalSlot(s);
    setPanelViewPage(Math.floor(s / PANEL_PAGE_SIZE));
  };

  useEffect(() => {
    if (virtualTotal <= 0) return;
    setGlobalSlot((prev) => Math.min(prev, virtualTotal - 1));
  }, [virtualTotal]);

  const currentIndex = questions.length > 0 ? globalSlot % questions.length : 0;
  const current = questions[currentIndex];
  const selected = current ? answers[current.id] : undefined;
  const isRight = current && selected ? selected === current.answerKey : undefined;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-on-surface">法考题库练习</h1>
            <p className="text-sm text-on-surface-variant mt-2">
              {subject ? `当前科目：${subject}` : '当前科目：全部'}
            </p>
          </div>
          <button
            onClick={() => navigate('/legal-exam')}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
          >
            返回法考服务
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-outline-variant rounded-xl p-8 text-on-surface-variant">
            题库加载中...
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white border border-outline-variant rounded-xl p-8 text-on-surface-variant">
            题库正在更新中，请稍后再试。
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9 bg-white border border-outline-variant rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-on-surface-variant">
                  第 {globalSlot + 1} 题 / 共 {virtualTotal} 题
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {current.subject}
                </span>
              </div>

              <h2 className="text-lg font-bold text-on-surface leading-relaxed mb-6">{current.stem}</h2>

              <div className="space-y-3">
                {current.options.map((opt) => {
                  const active = selected === opt.key;
                  const rightOpt = selected && opt.key === current.answerKey;
                  const wrongOpt = selected === opt.key && selected !== current.answerKey;
                  return (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [current.id]: opt.key,
                        }))
                      }
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        rightOpt
                          ? 'border-green-500 bg-green-50'
                          : wrongOpt
                          ? 'border-red-500 bg-red-50'
                          : active
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant hover:border-primary'
                      }`}
                    >
                      <span className="font-bold mr-2">{opt.key}.</span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {selected && (
                <div
                  className={`mt-5 rounded-lg px-4 py-3 text-sm border ${
                    isRight ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {isRight ? '回答正确。' : `你的答案：${selected}，正确答案：${current.answerKey}。`}
                  <div className="mt-2 leading-relaxed">{current.analysis}</div>
                  <a
                    href={current.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-primary hover:underline"
                  >
                    来源：{current.sourceTitle}
                  </a>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => goToGlobalSlot(globalSlot - 1)}
                  disabled={globalSlot <= 0}
                  className="px-4 py-2 rounded-lg border border-outline-variant disabled:opacity-50"
                >
                  上一题
                </button>
                <button
                  onClick={() => goToGlobalSlot(globalSlot + 1)}
                  disabled={globalSlot >= virtualTotal - 1}
                  className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  下一题
                </button>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-outline-variant rounded-xl p-4 flex flex-col">
              <h3 className="font-bold mb-3 text-on-surface">题号面板</h3>
              <div className="grid grid-cols-5 gap-2 flex-1 content-start">
                {Array.from({ length: PANEL_PAGE_SIZE }, (_, i) => {
                  const slot = panelViewPage * PANEL_PAGE_SIZE + i;
                  if (slot >= virtualTotal) {
                    return (
                      <div
                        key={`pad-${slot}`}
                        className="h-9 rounded-md border border-dashed border-outline-variant/40 bg-surface-container-low/50"
                        aria-hidden
                      />
                    );
                  }
                  const qIndex = slot % questions.length;
                  const q = questions[qIndex];
                  const answered = Boolean(answers[q.id]);
                  const currentNo = slot === globalSlot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => goToGlobalSlot(slot)}
                      className={`h-9 rounded-md text-sm border ${
                        currentNo
                          ? 'bg-primary text-white border-primary'
                          : answered
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'border-outline-variant text-on-surface-variant'
                      }`}
                    >
                      {slot + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant space-y-3">
                <p className="text-xs text-on-surface-variant text-center">
                  第 {panelViewPage + 1} / {totalPanelPages} 页
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setPanelViewPage(0)}
                    disabled={panelViewPage <= 0}
                    className="px-2.5 py-1.5 text-xs rounded-md border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    首页
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelViewPage((p) => Math.max(0, p - 1))}
                    disabled={panelViewPage <= 0}
                    className="px-2.5 py-1.5 text-xs rounded-md border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelViewPage((p) => Math.min(totalPanelPages - 1, p + 1))}
                    disabled={panelViewPage >= totalPanelPages - 1}
                    className="px-2.5 py-1.5 text-xs rounded-md border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    下一页
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelViewPage(totalPanelPages - 1)}
                    disabled={panelViewPage >= totalPanelPages - 1}
                    className="px-2.5 py-1.5 text-xs rounded-md border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                  >
                    末页
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

