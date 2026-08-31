import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, ShieldCheck, FileText } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [question, setQuestion] = useState('');
  const notices = [
    {
      title: '法智通平台 3D 游戏正在公测',
      desc: '沉浸式互动普法玩法已上线，欢迎大家抢先体验、反馈建议。',
    },
    {
      title: '大学生常见法律问题热点',
      desc: '聚焦实习协议、租房押金、兼职欠薪、消费维权等高频问题。',
    },
    {
      title: '本周时事热点与校园普法联动',
      desc: '结合最新社会案例，提供更贴近真实场景的法律解读与指引。',
    },
  ];

  useEffect(() => {
    const t = window.setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 4500);
    return () => window.clearInterval(t);
  }, [notices.length]);

  const goToChatWithQuestion = () => {
    const q = question.trim();
    if (!q) {
      navigate('/ai-chat');
      return;
    }
    navigate(`/ai-chat?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative bg-white py-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-10 h-1 bg-primary"></span>
              <span className="text-primary font-black tracking-[0.2em] text-sm uppercase">智慧普法 · 智通未来</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-on-surface leading-[1.1] mb-8">
              法治校园<br/>
              <span className="text-primary">智能法律咨询中心</span>
            </h1>

            <div className="relative max-w-3xl mb-10 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                <Search size={24} />
              </div>
              <input
                type="text"
                placeholder="输入您的法律问题，AI 助手为您实时解答..."
                className="w-full h-16 pl-14 pr-32 bg-surface-container-low border-2 border-outline-variant rounded-2xl text-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goToChatWithQuestion()}
              />
              <button
                onClick={goToChatWithQuestion}
                className="absolute right-3 top-3 bottom-3 px-6 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md"
              >
                立即咨询
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-outline-variant text-sm text-on-surface-variant">
                <ShieldCheck size={16} className="text-primary" /> 权益保障
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-outline-variant text-sm text-on-surface-variant">
                <FileText size={16} className="text-primary" /> 合同审查
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-outline-variant text-sm text-on-surface-variant">
                <MessageSquare size={16} className="text-primary" /> 实时解答
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full min-h-[260px] rounded-2xl border border-outline-variant bg-gradient-to-br from-primary/95 via-primary to-red-700 p-6 text-white shadow-lg flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80 mb-3">平台动态</p>
                <h3 className="text-2xl font-bold leading-snug mb-3">{notices[noticeIndex].title}</h3>
                <p className="text-sm text-white/90 leading-relaxed">{notices[noticeIndex].desc}</p>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => navigate('/interactive-column')}
                  className="px-4 py-2 rounded-lg bg-white text-primary text-sm font-bold hover:bg-white/90 transition-colors"
                >
                  去互动普法
                </button>
                <div className="flex items-center gap-2">
                  {notices.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNoticeIndex(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === noticeIndex ? 'w-6 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`切换到第 ${idx + 1} 条动态`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2"></div>
    </section>
  );
}
