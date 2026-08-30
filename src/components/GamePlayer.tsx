import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const makeupGameSrc = '/makeup-2d/index.html';
const courtGameSrc = '/court-3d/index.html';

function EmbeddedGameFrame({ title, src, onExit }: { title: string; src: string; onExit: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="h-14 shrink-0 flex items-center px-4 border-b border-white/10 bg-black/90">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-xl">close</span>
          退出游戏
        </button>
      </div>
      <iframe
        title={title}
        src={src}
        className="w-full min-h-0 flex-1 border-0 block bg-black"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
      />
    </div>
  );
}

export default function GamePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const isCourt = id === 'court';
  const isMakeup = id === 'makeup';

  const courtDialogues = [
    { speaker: '法官', text: '原告，请陈述你的诉讼请求。', action: '继续' },
    { speaker: '原告家属', text: '就是他撞倒了我父亲！他如果不撞，为什么要扶？必须赔偿医药费 5 万元！', action: '反驳' },
    { speaker: '你 (辩护律师)', text: '反对！原告方这是典型的有罪推定。我的当事人是出于好心救助，现场有监控录像可以证明。', action: '出示证据' },
  ];

  const exitEmbedded = () => navigate(-1);

  if (isMakeup) {
    return <EmbeddedGameFrame title="网络虚实：美妆的故事" src={makeupGameSrc} onExit={exitEmbedded} />;
  }

  if (isCourt) {
    return <EmbeddedGameFrame title="3D 模拟法庭" src={courtGameSrc} onExit={exitEmbedded} />;
  }

  const currentDialogue = courtDialogues[Math.min(step, courtDialogues.length - 1)];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center px-6 absolute top-0 w-full z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span> 退出游戏
        </button>
      </div>

      <div className="flex-1 relative">
        <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop" alt="" className="w-full h-full object-cover opacity-60" />

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4">
          <div className="bg-white/95 backdrop-blur-md border border-outline-variant rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute -top-4 left-6 bg-primary text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg">
              {currentDialogue.speaker}
            </div>
            <p className="text-on-surface text-xl mt-4 mb-8 leading-relaxed font-medium">
              {currentDialogue.text}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step >= courtDialogues.length - 1}
                className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${step >= courtDialogues.length - 1 ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 hover:scale-105'}`}
              >
                {currentDialogue.action} <span className="material-symbols-outlined text-sm">play_arrow</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
