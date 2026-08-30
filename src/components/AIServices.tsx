import { useNavigate } from 'react-router-dom';

export default function AIServices() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-12 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-primary">智能法律咨询服务</h2>
          <p className="text-on-surface-variant">专业级法律分析，实时在线解答</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* AI Quick Q&A */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant hover:border-primary transition-all flex flex-col items-center text-center shadow-sm h-full">
            <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center mb-6 shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-3xl text-white" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-on-surface min-h-[64px] flex items-center">AI智能体问答</h3>
            <p className="text-on-surface-variant mb-6 min-h-[56px]">以对话方式快速梳理问题，按步骤给出可执行建议（演示版）。</p>
            <div className="bg-surface-container-low w-full p-4 rounded-lg text-left text-sm border border-outline-variant italic mb-6 text-on-surface-variant flex-1">
              "房东不退押金，我应该先沟通还是先起诉？"
            </div>
            <button onClick={() => navigate('/ai-agent-qa')} className="mt-auto text-primary font-bold hover:underline">进入问答</button>
          </div>
          {/* AI Consultant */}
          <div className="bg-white p-8 rounded-2xl border-2 border-primary flex flex-col items-center text-center shadow-xl relative z-10 h-full">
            <div className="absolute -top-4 bg-primary px-4 py-1 rounded-full text-xs font-black text-white">推荐使用</div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/10 shrink-0">
              <span className="material-symbols-outlined text-3xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>gavel</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-primary min-h-[64px] flex items-center">智能法律咨询</h3>
            <p className="text-on-surface-variant mb-6 min-h-[56px]">基于深度法律知识库，提供全方位的智能法律问题解答与专业建议。</p>
            <div className="flex flex-wrap gap-2 mb-6 justify-center min-h-[56px] content-start">
              <span className="bg-surface-container-low border border-outline-variant px-3 py-1 rounded text-xs text-on-surface-variant">合同审核</span>
              <span className="bg-surface-container-low border border-outline-variant px-3 py-1 rounded text-xs text-on-surface-variant">侵权分析</span>
              <span className="bg-surface-container-low border border-outline-variant px-3 py-1 rounded text-xs text-on-surface-variant">合规建议</span>
            </div>
            <button onClick={() => navigate('/ai-chat')} className="mt-auto primary-gradient w-full py-3 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all">开启咨询</button>
          </div>
          {/* Contract Generator */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant hover:border-primary transition-all flex flex-col items-center text-center shadow-sm h-full">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/10 shrink-0">
              <span className="material-symbols-outlined text-3xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>analytics</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-on-surface min-h-[64px] flex items-center">限定词合同生成</h3>
            <p className="text-on-surface-variant mb-6 min-h-[56px]">进入合同界面后可选择学生真实场景模板，并按关键词一键生成完整合同草稿。</p>
            <ul className="text-left w-full space-y-3 mb-6 flex-1">
              <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                校园租房押金纠纷模板
              </li>
              <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                实习岗位/报酬约定模板
              </li>
              <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                学生兼职薪酬保障模板
              </li>
            </ul>
            <button onClick={() => navigate('/contract-builder')} className="mt-auto primary-gradient w-full py-3 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all">打开合同生成界面</button>
          </div>
        </div>
      </div>
    </section>
  );
}
