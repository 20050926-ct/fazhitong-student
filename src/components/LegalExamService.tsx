import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
type LegalExamNewsItem = {
  title: string;
  url: string;
  date?: string;
  source?: string;
};

export default function LegalExamService() {
  const navigate = useNavigate();
  const LEGAL_EXAM_SIGNUP_URL = 'https://nje.examos.cn/EXAMSF/public/index.jsp';
  const LEGAL_EXAM_SOURCE_URL = 'https://www.12348.gov.cn/#/publicies/sfks/sfks';
  const fallbackConsultationItems: LegalExamNewsItem[] = [
    { title: "法考报名条件", date: "04-10", url: LEGAL_EXAM_SOURCE_URL },
    { title: "老人老办法时间节点延长咨询。", date: "04-09", url: LEGAL_EXAM_SOURCE_URL },
    { title: "老人老办法时间节点会延后三年至2021年4月28日之前吗？", date: "04-09", url: LEGAL_EXAM_SOURCE_URL },
    { title: "报考资格咨询", date: "04-08", url: LEGAL_EXAM_SOURCE_URL },
    { title: "客观题成绩保留", date: "04-07", url: LEGAL_EXAM_SOURCE_URL },
    { title: "2017年3月入学电大大专非法学专业", date: "04-06", url: LEGAL_EXAM_SOURCE_URL },
    { title: "关于本科毕业时间在一月份的问题麻烦领导解惑,万分感激领导", date: "04-06", url: LEGAL_EXAM_SOURCE_URL },
    { title: "关于报名放宽政策的咨询", date: "04-04", url: LEGAL_EXAM_SOURCE_URL },
  ];
  /** 列表展示用题量（演示数据，与练习页实际可做题数无关） */
  const questionBankItems = useMemo(() => {
    const titles = ['民法客观题', '刑法客观题', '行政法与行政诉讼法', '商法与经济法', '主观题案例训练', '历年真题模拟'];
    const displayCounts = [586, 542, 418, 463, 328, 612];
    return titles.map((title, i) => ({ title, count: displayCounts[i] ?? 500 }));
  }, []);
  const [consultationItems, setConsultationItems] = useState<LegalExamNewsItem[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/legal-exam-articles?limit=10');
        if (!res.ok) return;
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        if (!alive || !data.length) return;
        const rows = data
          .filter((x): x is LegalExamNewsItem => Boolean(x && typeof x.title === 'string' && typeof x.url === 'string'))
          .slice(0, 10);
        if (rows.length) setConsultationItems(rows);
      } catch {
        // keep fallback list
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const displayConsultationItems = consultationItems.length ? consultationItems : fallbackConsultationItems;

  const toListDate = (raw?: string): string => {
    if (!raw) return "--";
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[2]}-${m[3]}`;
    return raw.slice(0, 10);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Banner */}
      <div className="bg-white py-8 border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="h-[2px] w-12 bg-primary"></div>
            <h1 className="text-4xl font-black text-on-surface tracking-widest">
              大学生法考服务中心
            </h1>
            <div className="h-[2px] w-12 bg-primary"></div>
          </div>
          <p className="text-on-surface-variant font-bold tracking-widest uppercase">College Students Legal Professional Qualification Examination Service Center</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          {/* Section Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-on-surface">法考咨询</h2>
            </div>
            <div className="flex items-center gap-6">
              <a
                href={LEGAL_EXAM_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold flex items-center gap-1 hover:underline"
              >
                更多 <ChevronRight size={18} />
              </a>
            </div>
          </div>

          {/* Consultation List */}
          <div className="divide-y divide-outline-variant">
            {displayConsultationItems.map((item, idx) => (
              <a
                key={idx}
                href={item.url || LEGAL_EXAM_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center px-8 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-primary">•</span>
                  <span className="text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </div>
                <span className="text-on-surface-variant text-sm font-mono">{toListDate(item.date)}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Question Bank */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="flex justify-between items-center px-8 py-6 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-3">
              <BookOpenCheck size={24} className="text-primary" />
              <h2 className="text-2xl font-bold text-on-surface">法考题库</h2>
            </div>
            <button
              onClick={() => navigate('/legal-exam-bank')}
              className="text-primary font-bold flex items-center gap-1 hover:underline"
            >
              进入题库 <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-8 py-6">
            {questionBankItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/legal-exam-bank?subject=${encodeURIComponent(item.title)}`)}
                className="rounded-lg border border-outline-variant px-5 py-4 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <p className="text-on-surface font-bold">{item.title}</p>
                <p className="text-sm text-on-surface-variant mt-2">题量：{item.count} 题</p>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Banner */}
        <div className="mt-12 relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2000&auto=format&fit=crop" 
            alt="Registration" 
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-transparent flex items-center px-12">
            <div className="text-white">
              <h3 className="text-3xl font-black mb-4">考生须知</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30">
                  <p className="text-xs opacity-80">客观题报名时间</p>
                  <p className="text-xl font-bold">6月16日 至 6月30日</p>
                </div>
              </div>
              <a
                href={LEGAL_EXAM_SIGNUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-white text-primary px-8 py-3 rounded-full font-black text-lg items-center gap-3 shadow-xl hover:bg-gray-100 transition-all"
              >
                网上报名 <ExternalLink size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
