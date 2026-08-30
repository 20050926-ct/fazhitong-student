import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type AgentRole,
  AI_AGENT_QUICK_OPTIONS_BY_ROLE,
  AI_CHAT_QUICK_PROMPTS,
  aiAgentThinkingDelayMs,
  buildAiAgentReply,
} from '../data/legalAiFixedReplies';

type ChatMessage = {
  role: 'agent' | 'user';
  content: string;
  time: string;
};

const REMOTE_AGENT_AVATAR = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=128&h=128&fit=crop&crop=faces&auto=format&q=80`;

const LAWYER_AGENTS: Array<{
  id: AgentRole;
  name: string;
  title: string;
  avatar: string;
  initialUnread: number;
  tone: string;
  intro: string;
  quickOptions: string[];
}> = [
  {
    id: 'zhangsan',
    name: '顾言舟 律师',
    title: '犀利论证风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1560250097-0b93528c311a'),
    initialUnread: 2,
    tone: '风格：犀利拆解，先结论后理由',
    intro: '我会先说结论，再带你把证据链做成时间轴，方便谈判与举证。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.zhangsan],
  },
  {
    id: 'linjing',
    name: '宋唯宁 律师',
    title: '实务办案风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1573496359142-b8d87734a5a2'),
    initialUnread: 1,
    tone: '风格：流程导向，按步骤推进',
    intro: '我会把你的问题拆成“取证—沟通—投诉/诉讼”的可执行清单。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.linjing],
  },
  {
    id: 'chenjianguo',
    name: '沈立行 律师',
    title: '调解协商风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1472099645785-5658abf4ff4e'),
    initialUnread: 0,
    tone: '风格：稳妥沟通，优先低成本解决',
    intro: '我优先建议低冲突、低成本的沟通与和解路径，必要时再升级。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.chenjianguo],
  },
  {
    id: 'liufang',
    name: '许知简 律师',
    title: '就业维权风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1580489944761-15a19d654956'),
    initialUnread: 3,
    tone: '风格：学生友好，强调实操',
    intro: '我侧重实习、兼职、三方协议争议，给你可照着做的建议。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.liufang],
  },
  {
    id: 'makai',
    name: '韩牧川 律师',
    title: '网贷风控风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1519085360753-af0119f7cbe7'),
    initialUnread: 0,
    tone: '风格：风险优先，先止损后维权',
    intro: '在校园贷、网贷催收场景下，我会先帮你做止损与自保，再谈维权路径。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.makai],
  },
  {
    id: 'zhaomeiling',
    name: '唐梦舒 律师',
    title: '租房合同风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1438761681033-6461ffad8d80'),
    initialUnread: 0,
    tone: '风格：合同条款导向，证据严谨',
    intro: '面对押金、违约金、合同陷阱，我会从条款与证据两端一起帮你收紧。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.zhaomeiling],
  },
  {
    id: 'zhouxue',
    name: '白星遥 律师',
    title: '消费维权风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1534528741775-53994a69daeb'),
    initialUnread: 4,
    tone: '风格：谈判强势，投诉路径清晰',
    intro: '消费纠纷、平台投诉、退款沟通，我会给你并行推进的材料与话术。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.zhouxue],
  },
  {
    id: 'zhanghaibo',
    name: '陆承渊 律师',
    title: '纠纷谈判风格',
    avatar: REMOTE_AGENT_AVATAR('photo-1507003211169-0a1dd7228f2d'),
    initialUnread: 0,
    tone: '风格：谈判攻防，强调节奏',
    intro: '我会帮你设计“先沟通、再施压、后诉讼”的节奏与话术升级点。',
    quickOptions: [...AI_AGENT_QUICK_OPTIONS_BY_ROLE.zhanghaibo],
  },
];

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AIAgentQA() {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState<AgentRole>('zhangsan');
  const currentAgent = LAWYER_AGENTS.find((agent) => agent.id === activeAgent) || LAWYER_AGENTS[0];
  const [chatMap, setChatMap] = useState<Record<AgentRole, ChatMessage[]>>(() => {
    const map = {} as Record<AgentRole, ChatMessage[]>;
    LAWYER_AGENTS.forEach((agent) => {
      map[agent.id] = [
        {
          role: 'agent',
          content: `你好，我是 ${agent.name}（${agent.title}）。${agent.intro}`,
          time: nowTime(),
        },
      ];
    });
    return map;
  });
  const [unreadMap, setUnreadMap] = useState<Record<AgentRole, number>>(() => {
    const map = {} as Record<AgentRole, number>;
    LAWYER_AGENTS.forEach((agent) => {
      map[agent.id] = agent.initialUnread;
    });
    return map;
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messages = chatMap[activeAgent] || [];

  const canSend = useMemo(() => input.trim().length > 0 && !isTyping, [input, isTyping]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || isTyping) return;

    setChatMap((prev) => ({
      ...prev,
      [activeAgent]: [...(prev[activeAgent] || []), { role: 'user', content: question, time: nowTime() }],
    }));
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      const reply = buildAiAgentReply(activeAgent, question);
      setChatMap((prev) => ({
        ...prev,
        [activeAgent]: [...(prev[activeAgent] || []), { role: 'agent', content: reply, time: nowTime() }],
      }));
      setIsTyping(false);
    }, aiAgentThinkingDelayMs());
  };

  const switchAgent = (nextAgent: AgentRole) => {
    setActiveAgent(nextAgent);
    setUnreadMap((prev) => ({ ...prev, [nextAgent]: 0 }));
    setInput('');
  };

  return (
    <div className="max-w-[1300px] mx-auto px-6 py-10 min-h-[calc(100vh-80px)] bg-white">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back</span> 返回
      </button>

      <div className="bg-white border border-outline-variant rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[330px_1fr] min-h-[680px]">
        <aside className="border-r border-outline-variant bg-surface-container-low">
          <div className="px-4 py-4 border-b border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface">律师智能体会话</h2>
            <p className="text-xs text-on-surface-variant mt-1">类似微信聊天列表</p>
          </div>

          <div className="overflow-y-auto max-h-[620px]">
            {LAWYER_AGENTS.map((agent) => {
              const thread = chatMap[agent.id] || [];
              const lastMessage = thread[thread.length - 1];
              const isActive = activeAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => switchAgent(agent.id)}
                  className={`w-full px-4 py-3 flex items-start gap-3 border-b border-outline-variant/60 text-left transition-colors ${
                    isActive ? 'bg-[#07C160] text-white' : 'hover:bg-white'
                  }`}
                >
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-11 h-11 rounded-full object-cover border border-outline-variant shrink-0"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = '/yonghu.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-on-surface'}`}>{agent.name}</p>
                      <span className={`text-[11px] shrink-0 ${isActive ? 'text-white/90' : 'text-on-surface-variant'}`}>
                        {lastMessage?.time || '--:--'}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-white/95' : 'text-on-surface-variant'}`}>
                      {lastMessage?.content || agent.intro}
                    </p>
                  </div>
                  {unreadMap[agent.id] > 0 ? (
                    <span
                      className={`ml-1 min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center ${
                        isActive ? 'bg-white text-[#07C160]' : 'bg-primary text-white'
                      }`}
                    >
                      {unreadMap[agent.id]}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex flex-col min-w-0">
          <div className="px-5 py-4 border-b border-outline-variant bg-white flex items-center gap-3">
            <img
              src={currentAgent.avatar}
              alt={currentAgent.name}
              className="w-11 h-11 rounded-full object-cover border border-outline-variant"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/yonghu.jpg';
              }}
            />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-on-surface truncate">
                {currentAgent.name} · {currentAgent.title}
              </h1>
              <p className="text-xs text-on-surface-variant truncate">{currentAgent.tone}</p>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-outline-variant flex flex-wrap gap-2 bg-white">
            {AI_CHAT_QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={isTyping}
                className="px-3 py-1.5 text-xs rounded-full border border-outline-variant bg-surface-container-low hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="h-[420px] overflow-y-auto p-5 space-y-4 bg-surface-container-lowest">
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#07C160] text-white rounded-tr-sm'
                      : 'bg-white text-on-surface border border-outline-variant rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[11px] mt-1 ${msg.role === 'user' ? 'text-white/85' : 'text-on-surface-variant'}`}>{msg.time}</p>
                </div>
              </div>
            ))}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-outline-variant flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="px-4 pt-3 pb-2 border-t border-outline-variant bg-white">
            <p className="text-xs text-on-surface-variant mb-2">聊天选项</p>
            <div className="flex flex-wrap gap-2">
              {currentAgent.quickOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => send(option)}
                  disabled={isTyping}
                  className="px-3 py-1.5 text-xs rounded-full border border-outline-variant bg-surface-container-low hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-outline-variant bg-white flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send(input);
              }}
              placeholder={`给 ${currentAgent.name} 发送消息...`}
              className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!canSend}
              className="w-12 h-12 rounded-xl bg-[#07C160] text-white flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
