import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, FileText, Settings, LayoutDashboard,
  Search, Bell, Paperclip, Send, MoreVertical, Phone, Video,
  CheckCircle2, Clock, AlertCircle, Briefcase, ChevronRight,
  FileBadge, Scale, X, Download, Sparkles, Bot, Copy, Check, Loader2
} from 'lucide-react';
import { logout } from '../lib/auth';

// Mock data
const consultations = [
  { id: 1, client: '张同学 (大三)', topic: '实习协议欠薪纠纷', lastMessage: '律师您好，我在某公司实习三个月了，公司一直拖欠工资不发。', time: '10:30', unread: 2, status: 'active', type: '劳动维权', amount: '约 8,000 元', location: 'XX市 高新区', demands: '要求公司按实习协议支付三个月实习津贴，并开具实习证明。', files: [{name: '实习协议.pdf', size: '1.2 MB', type: 'pdf'}, {name: '考勤记录截图.jpg', size: '3.5 MB', type: 'image'}], memo: '1. 确认实习协议中关于津贴的约定条款。\n2. 收集打卡记录、工作周报等证明存在事实劳动关系的证据。\n3. 准备向劳动监察大队投诉。' },
  { id: 2, client: '李同学 (研一)', topic: '校外租房押金不退', lastMessage: '房东以墙面有污渍为由扣除我全部押金，这合理吗？', time: '昨天', unread: 0, status: 'waiting', type: '合同纠纷', amount: '2,500 元', location: '学校周边 某公寓', demands: '要求房东退还合理押金，扣除合理的清洁费用。', files: [{name: '租房合同.pdf', size: '4.1 MB', type: 'pdf'}, {name: '退房视频记录.mp4', size: '12.0 MB', type: 'video'}], memo: '1. 查看合同中关于退租 and 押金扣除的条款。\n2. 对比入住时和退租时的房屋状况照片。\n3. 建议先发律师函警告，不行再起诉。' },
  { id: 3, client: '王同学 (大二)', topic: '校园贷/高利贷咨询', lastMessage: '我不小心点了一个链接，现在每天都被催债电话骚扰。', time: '星期二', unread: 0, status: 'closed', type: '金融诈骗', amount: '涉及金额 15,000 元', location: '校园内', demands: '停止骚扰，确认贷款合同的合法性，协商还款本金。', files: [{name: '催收短信截图.jpg', size: '800 KB', type: 'image'}, {name: '贷款APP界面截图.jpg', size: '1.5 MB', type: 'image'}], memo: '1. 确认该平台是否具备放贷资质。\n2. 计算实际年化利率是否超过法定上限。\n3. 建议报警处理骚扰行为。' },
  { id: 4, client: '陈同学 (大四)', topic: '论文版权被侵权', lastMessage: '我发现我的毕业论文核心观点被某公众号洗稿了。', time: '星期一', unread: 0, status: 'active', type: '知识产权', amount: '暂无 (维权咨询)', location: '网络平台', demands: '要求对方删除稿件，公开道歉，并赔偿经济损失。', files: [{name: '原创论文初稿.docx', size: '2.2 MB', type: 'docx'}, {name: '侵权公众号截图.pdf', size: '1.1 MB', type: 'pdf'}], memo: '1. 确立作品创作完成的时间证据。\n2. 进行侵权内容比对，确认独创性部分的重合度。\n3. 准备版权存证。' },
  { id: 5, client: '赵同学 (大一)', topic: '兼职被骗会员费', lastMessage: '说好的打字兼职，交了500元会员费后就把我拉黑了。', time: '上周', unread: 0, status: 'closed', type: '网络诈骗', amount: '500 元', location: '线上平台', demands: '追回被骗的500元会员费。', files: [{name: '转账记录.png', size: '1.8 MB', type: 'image'}, {name: '聊天记录截图.png', size: '2.5 MB', type: 'image'}], memo: '1. 典型的网络兼职诈骗。\n2. 建议通过支付平台申诉，并向反诈中心举报。' },
];

const mockMessages: Record<number, any[]> = {
  1: [
    { id: 1, sender: 'client', text: '律师您好，我在某公司实习三个月了，公司一直拖欠工资不发。', time: '10:25' },
    { id: 2, sender: 'lawyer', text: '同学你好。请问你入职时有签署正式的实习协议吗？', time: '10:28' },
    { id: 3, sender: 'client', text: '有的，签了一份《实习生培养协议》，上面写着每个月津贴2500元。', time: '10:30' },
    { id: 4, sender: 'lawyer', text: '好的。协议里有没有规定发放津贴的具体日期？另外，你手头有考勤记录或者工作往来的邮件证明你确实在那工作吗？', time: '10:32' },
  ],
  2: [
    { id: 1, sender: 'client', text: '房东以墙面有污渍为由扣除我全部押金，这合理吗？', time: '昨天 14:20' },
    { id: 2, sender: 'lawyer', text: '同学你好。墙面污渍是属于正常使用损耗还是人为破坏？', time: '昨天 14:25' },
    { id: 3, sender: 'client', text: '就是普通的家具靠墙留下的印子，我觉得属于正常损耗。', time: '昨天 14:30' },
    { id: 4, sender: 'lawyer', text: '根据法律规定，正常损耗不应由承租人承担。你退房时有没有拍照留证？', time: '昨天 14:35' },
    { id: 5, sender: 'client', text: '好的，我明天把房产证复印件发给您。', time: '昨天 14:40' },
  ],
  3: [
    { id: 1, sender: 'client', text: '我不小心点了一个链接，现在每天都被催债电话骚扰。', time: '星期二 09:15' },
    { id: 2, sender: 'lawyer', text: '同学别慌。你当时在链接里填写了个人信息和银行卡号吗？', time: '星期二 09:30' },
    { id: 3, sender: 'client', text: '填了，然后卡里就莫名其妙多了2000块，现在要我换5000。', time: '星期二 09:35' },
    { id: 4, sender: 'lawyer', text: '这是典型的“高利贷”陷阱。千万不要按照他们要求的金额还款，保留所有通话录音和截图。', time: '星期二 09:40' },
    { id: 5, sender: 'client', text: '保险公司那边已经联系我了。', time: '星期二 09:45' },
  ],
  4: [
    { id: 1, sender: 'client', text: '我发现我的毕业论文核心观点被某公众号洗稿了。', time: '星期一 10:00' },
    { id: 2, sender: 'lawyer', text: '同学你好。你的论文是否已经发表，或者在学校系统里有过查重记录？', time: '星期一 10:15' },
    { id: 3, sender: 'client', text: '还没发表，但是已经提交给导师了，也有初稿的修改记录。', time: '星期一 10:20' },
    { id: 4, sender: 'lawyer', text: '修改记录是非常重要的原创证据。请先把对方的文章链接和你的初稿发给我。', time: '星期一 10:30' },
    { id: 5, sender: 'client', text: '下周一的会议材料准备好了吗？', time: '星期一 10:35' },
  ],
  5: [
    { id: 1, sender: 'client', text: '说好的打字兼职，交了500元会员费后就把我拉黑了。', time: '上周 15:00' },
    { id: 2, sender: 'lawyer', text: '同学，这是非常典型的兼职诈骗。', time: '上周 15:10' },
    { id: 3, sender: 'client', text: '我还能把钱要回来吗？', time: '上周 15:15' },
    { id: 4, sender: 'lawyer', text: '虽然金额较小，但建议你立即在微信/支付宝投诉该笔转账，并向学校保卫处报备。', time: '上周 15:20' },
    { id: 5, sender: 'client', text: '卖家现在不想卖了，定金能退双倍吗？', time: '上周 15:25' },
  ]
};

function LawyerConsole() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('consultations');
  const [activeChat, setActiveChat] = useState(consultations[0]);
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState(mockMessages);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'lawyer',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage]
    }));

    setInputText('');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#0F172A] text-slate-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <Scale size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-wide">法智通 <span className="text-blue-400 font-normal">律师端</span></span>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">主菜单</div>
          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="工作台" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<MessageSquare size={18} />} label="法律咨询" active={activeTab === 'consultations'} onClick={() => setActiveTab('consultations')} />
            <NavItem icon={<Users size={18} />} label="客户管理" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
            <NavItem icon={<Briefcase size={18} />} label="案件卷宗" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
            <NavItem icon={<FileText size={18} />} label="合同模板" active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
            <NavItem icon={<Sparkles size={18} />} label="智能起草" active={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} />
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800/50">
          <NavItem icon={<Settings size={18} />} label="系统设置" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <div className="mt-4 flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors">
            <div className="relative">
              <img src="/lawyer/chenjianguo.jpg" alt="Lawyer" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0F172A] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">陈建国 律师</div>
              <div className="text-xs text-slate-400 truncate">高级合伙人</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs text-slate-300 hover:text-white"
            >
              退出
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <h1 className="text-lg font-semibold text-slate-800">
            {activeTab === 'consultations' ? '法律咨询' : '工作台'}
          </h1>
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="搜索客户、案件或聊天记录..."
                className="pl-9 pr-4 py-2 bg-slate-100/80 border border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none w-72 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <Bell size={18} />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </header>

        {/* Consultation View */}
        {activeTab === 'consultations' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Chat List */}
            <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-0">
              <div className="p-3 border-b border-slate-100 flex gap-1">
                <FilterButton label="进行中" active={true} count={2} />
                <FilterButton label="待回复" active={false} count={1} />
                <FilterButton label="已结束" active={false} />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {consultations.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`p-4 border-b border-slate-50 cursor-pointer transition-all relative ${
                      activeChat.id === chat.id
                        ? 'bg-blue-50/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {activeChat.id === chat.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                    )}
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${activeChat.id === chat.id ? 'text-blue-900' : 'text-slate-900'}`}>
                          {chat.client}
                        </h3>
                        {chat.type && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            {chat.type}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{chat.time}</span>
                    </div>
                    <div className="text-sm text-slate-800 font-medium mb-1 truncate">{chat.topic}</div>
                    <div className="flex justify-between items-center gap-3">
                      <p className="text-sm text-slate-500 truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#F8FAFC] relative">
              {/* Chat Header */}
              <div className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <img
                    src={`https://picsum.photos/seed/client${activeChat.id}/100/100`}
                    alt="Client"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-800 text-lg">{activeChat.client}</h2>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        <CheckCircle2 size={10} /> 实名认证
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      咨询意向：<span className="text-slate-700">{activeChat.topic}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActionButton icon={<Phone size={18} />} tooltip="语音通话" />
                  <ActionButton icon={<Video size={18} />} tooltip="视频通话" />
                  <div className="w-px h-6 bg-slate-200 mx-2"></div>
                  <ActionButton icon={<MoreVertical size={18} />} tooltip="更多" />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="flex justify-center">
                  <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">今天 10:25</span>
                </div>

                {/* System Message */}
                <div className="flex justify-center">
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                    <AlertCircle size={14} />
                    <span>客户已支付咨询费 199.00 元，咨询时长 30 分钟。</span>
                  </div>
                </div>

                {(chatHistory[activeChat.id] || []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'lawyer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[75%] ${msg.sender === 'lawyer' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                      <img
                        src={msg.sender === 'lawyer' ? '/lawyer/chenjianguo.jpg' : `https://picsum.photos/seed/client${activeChat.id}/100/100`}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`flex flex-col ${msg.sender === 'lawyer' ? 'items-end' : 'items-start'}`}>
                        <div className="text-xs text-slate-400 mb-1.5 mx-1 font-medium">
                          {msg.sender === 'lawyer' ? '我' : activeChat.client} <span className="ml-1 font-normal">{msg.time}</span>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          msg.sender === 'lawyer'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-slate-200 p-4 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                  <QuickReplyButton label="发送合同模板" />
                  <QuickReplyButton label="请求补充证据" />
                  <QuickReplyButton label="预约线下会面" />
                  <QuickReplyButton label="发送收费标准" />
                </div>
                <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0 mb-0.5">
                    <Paperclip size={20} />
                  </button>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="输入专业回复内容..."
                    className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none px-2 py-2 text-sm focus:outline-none resize-none"
                    rows={1}
                  ></textarea>
                  <button
                    onClick={handleSendMessage}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0 mb-0.5 ${
                      inputText.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Case Details */}
            <div className="w-[300px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-0">
              <div className="h-16 border-b border-slate-100 flex items-center px-5 shrink-0">
                <h3 className="font-semibold text-slate-800">咨询详情</h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-5 border-b border-slate-100">
                  <div className="space-y-4">
                    <DetailItem label="咨询类型" value={<span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-sm font-medium border border-blue-100">{activeChat.type}</span>} />
                    <DetailItem label="标的金额" value={activeChat.amount} />
                    <DetailItem label="发生地" value={activeChat.location} />
                    <div>
                      <div className="text-xs text-slate-400 mb-1.5">客户诉求</div>
                      <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {activeChat.demands}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
                      <FileBadge size={16} className="text-slate-400" />
                      证据文件 ({activeChat.files?.length || 0})
                    </h3>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">查看全部</button>
                  </div>
                  <div className="space-y-2.5">
                    {activeChat.files?.map((file: any, index: number) => (
                      <FileItem key={index} name={file.name} size={file.size} type={file.type} />
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
                      <Briefcase size={16} className="text-slate-400" />
                      律师备忘录
                    </h3>
                  </div>
                  <textarea
                    key={activeChat.id}
                    className="w-full h-40 bg-[#FEFCE8] border border-[#FEF08A] rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none shadow-sm"
                    placeholder="在此记录案件关键点、后续跟进事项..."
                    defaultValue={activeChat.memo}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Other Views */}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'cases' && <CasesView />}
        {activeTab === 'templates' && <TemplatesView />}
        {activeTab === 'ai-assistant' && <AIAssistantView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}} />
    </div>
  );
}

// Additional Views

function DashboardView() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard title="进行中维权" value="12" icon={<Briefcase size={24} className="text-blue-500" />} trend="+2" />
        <StatCard title="待回复学生" value="5" icon={<MessageSquare size={24} className="text-orange-500" />} trend="-1" />
        <StatCard title="今日预约" value="3" icon={<Clock size={24} className="text-purple-500" />} />
        <StatCard title="累计帮助学生" value="1,240" icon={<Users size={24} className="text-emerald-500" />} trend="+15%" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">近期咨询预约</h3>
            <button className="text-sm text-blue-600 hover:underline">查看全部</button>
          </div>
          <div className="space-y-4">
            <ScheduleItem time="10:00 AM" title="张同学 - 实习欠薪咨询" type="线上语音" status="即将开始" />
            <ScheduleItem time="14:30 PM" title="李同学 - 租房押金纠纷" type="图文咨询" status="待处理" />
            <ScheduleItem time="16:00 PM" title="王同学 - 校园贷法律援助" type="紧急处理" status="已预约" />
          </div>
        </div>
        <div className="col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">待办任务</h3>
          <div className="space-y-3">
            <TodoItem title="审核陈同学论文维权函" deadline="今天" priority="high" />
            <TodoItem title="回复赵同学兼职诈骗咨询" deadline="今天" priority="medium" />
            <TodoItem title="整理校园普法讲座PPT" deadline="周五" priority="low" />
            <TodoItem title="跟进李同学租房合同进度" deadline="明天" priority="medium" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">维权类型分布</h3>
          <div className="space-y-4">
            <ProgressItem label="实习就业" percentage={45} color="bg-blue-500" />
            <ProgressItem label="校园生活" percentage={30} color="bg-emerald-500" />
            <ProgressItem label="学术科研" percentage={15} color="bg-purple-500" />
            <ProgressItem label="其他咨询" percentage={10} color="bg-slate-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">学生评价反馈</h3>
          <div className="space-y-4">
            <FeedbackItem user="林同学" content="陈律师非常专业，帮我拿回了被拖欠的实习工资，非常感谢！" rating={5} />
            <FeedbackItem user="周同学" content="咨询非常及时，解决了我在租房合同上的疑惑。" rating={5} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressItem({ label, percentage, color }: { label: string, percentage: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function FeedbackItem({ user, content, rating }: { user: string, content: string, rating: number }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-800">{user}</span>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Sparkles key={i} size={12} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'} />
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{content}</p>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-sm text-slate-500 mb-1">{title}</div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        {trend && (
          <div className={`text-xs mt-2 font-medium ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend} 较上月
          </div>
        )}
      </div>
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function ScheduleItem({ time, title, type }: { time: string, title: string, type: string }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
      <div className="w-20 shrink-0 text-sm font-medium text-slate-600">{time}</div>
      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-800">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{type}</div>
      </div>
    </div>
  );
}

function TodoItem({ title, deadline }: { title: string, deadline: string }) {
  return (
    <div className="flex items-start gap-3 p-2">
      <input type="checkbox" className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
      <div>
        <div className="text-sm font-medium text-slate-700">{title}</div>
        <div className="text-xs text-slate-400 mt-0.5">截止: {deadline}</div>
      </div>
    </div>
  );
}

function ClientsView() {
  const [clients, setClients] = useState([
    { id: 1, name: "张同学", phone: "138****1234", type: "大三", status: "活跃", lastContact: "今天 10:30" },
    { id: 2, name: "李同学", phone: "139****5678", type: "研一", status: "活跃", lastContact: "昨天" },
    { id: 3, name: "王同学", phone: "137****9012", type: "大二", status: "跟进中", lastContact: "昨天" },
    { id: 4, name: "陈同学", phone: "135****3456", type: "大四", status: "已结案", lastContact: "上周" },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddClient = (newClient: any) => {
    setClients([{ ...newClient, id: Date.now(), lastContact: '刚刚' }, ...clients]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">客户列表</h3>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + 新增客户
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">客户姓名</th>
              <th className="p-4 font-medium">联系方式</th>
              <th className="p-4 font-medium">客户类型</th>
              <th className="p-4 font-medium">状态</th>
              <th className="p-4 font-medium">最近联系</th>
              <th className="p-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {clients.map(client => (
              <ClientRow key={client.id} {...client} />
            ))}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddClientModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddClient}
        />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onAdd }: { onClose: () => void, onAdd: (client: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: '个人',
    status: '活跃'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">新增客户</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">客户姓名/公司名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="请输入客户姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">联系方式 <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="请输入手机号或座机"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">年级/身份</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
              >
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="研究生">研究生</option>
                <option value="留学生">留学生</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
              >
                <option value="活跃">活跃</option>
                <option value="跟进中">跟进中</option>
                <option value="潜在">潜在</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              保存客户
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientRow({ name, phone, type, status, lastContact }: { name: string, phone: string, type: string, status: string, lastContact: string }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="p-4 font-medium text-slate-800">{name}</td>
      <td className="p-4 text-slate-500">{phone}</td>
      <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{type}</span></td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${status === '活跃' ? 'bg-emerald-50 text-emerald-600' : status === '跟进中' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
          {status}
        </span>
      </td>
      <td className="p-4 text-slate-500">{lastContact}</td>
      <td className="p-4">
        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">查看</button>
      </td>
    </tr>
  );
}

function CasesView() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
      <div className="flex gap-6">
        <CaseColumn title="立案准备" count={2} />
        <CaseColumn title="一审中" count={3} />
        <CaseColumn title="执行阶段" count={1} />
        <CaseColumn title="已结案" count={15} />
      </div>
    </div>
  );
}

function CaseColumn({ title, count }: { title: string, count: number }) {
  return (
    <div className="flex-1 bg-slate-100/50 rounded-xl p-4 border border-slate-200/60">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-3">
        <CaseCard title="张同学实习协议欠薪维权案" client="张同学" date="2023-10-15" type="劳动维权" />
        {count > 1 && <CaseCard title="李同学校外租房押金纠纷案" client="李同学" date="2023-10-20" type="合同纠纷" />}
      </div>
    </div>
  );
}

function CaseCard({ title, client, date, type }: { title: string, client: string, date: string, type: string }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{type}</div>
      <div className="font-medium text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{title}</div>
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span className="flex items-center gap-1"><Users size={12} /> {client}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {date}</span>
      </div>
    </div>
  );
}

const templatesData = [
  { id: 1, title: '大学生实习协议 (标准版)', category: '实习就业', downloads: 1250, size: '25 KB', format: 'DOCX', updateTime: '2023-10-01', content: '大学生实习协议\n\n甲方（实习单位）：\n乙方（实习生）：\n学校：\n\n根据相关法律法规，甲乙双方在平等自愿的基础上，就乙方在甲方实习事宜达成如下协议：\n\n一、 实习期限\n自____年__月__日起至____年__月__日止。\n\n二、 实习内容\n乙方在____部门担任____岗位实习生。\n\n三、 实习津贴\n甲方每月向乙方支付实习津贴人民币____元。\n\n四、 权利与义务\n1. 甲方应为乙方提供必要的工作条件和安全防护。\n2. 乙方应遵守甲方的各项规章制度，保守商业秘密。\n\n五、 协议解除\n（此处省略具体条款...）' },
  { id: 2, title: '兼职劳务合同 (学生专用)', category: '实习就业', downloads: 856, size: '15 KB', format: 'DOCX', updateTime: '2023-09-15', content: '兼职劳务合同\n\n甲方：\n乙方（学生）：\n\n一、 劳务内容\n乙方利用课余时间为甲方提供________劳务服务。\n\n二、 劳务报酬\n按____（小时/件）计算，单价为____元。\n\n三、 支付方式\n甲方应于每月____日前结算上月报酬。\n\n四、 责任声明\n双方确认本合同为劳务合同，不建立劳动关系。' },
  { id: 3, title: '校外租房合同 (学生版)', category: '校园生活', downloads: 432, size: '30 KB', format: 'DOCX', updateTime: '2023-08-20', content: '房屋租赁合同\n\n出租方（甲方）：\n承租方（乙方）：\n\n一、 租赁房屋状况\n房屋位于________________。\n\n二、 租赁期限及租金\n租金每月____元，押金____元。\n\n三、 学生特别条款\n1. 乙方如因学校政策变动需提前退租，应提前____日通知甲方。\n2. 甲方应保证房屋网络设施正常使用。' },
  { id: 4, title: '反校园贷承诺书', category: '校园生活', downloads: 621, size: '28 KB', format: 'DOCX', updateTime: '2023-11-05', content: '理性消费与反校园贷承诺书\n\n本人承诺：\n1. 树立正确的消费观，不盲目攀比。\n2. 远离非法校园贷、套路贷。\n3. 保护个人信息，不随意出借身份证件。\n4. 遇到经济困难及时向学校和家长寻求帮助。' },
  { id: 5, title: '创业团队合伙协议 (学生)', category: '创业创新', downloads: 945, size: '45 KB', format: 'DOCX', updateTime: '2023-07-12', content: '大学生创业团队合伙协议\n\n合伙人：A、B、C\n\n一、 创业项目名称\n________________\n\n二、 出资方式及比例\nA出资____元，占比____%；\nB以技术出资，占比____%。\n\n三、 利润分配与风险承担\n按出资比例分配利润，共同承担风险。' },
  { id: 6, title: '知识产权归属协议 (论文/软件)', category: '学术科研', downloads: 2100, size: '20 KB', format: 'DOCX', updateTime: '2023-12-01', content: '学术成果知识产权协议\n\n甲方（指导教师/实验室）：\n乙方（学生）：\n\n一、 成果定义\n指乙方在参与甲方课题期间完成的论文、软件、专利等。\n\n二、 权利归属\n1. 署名权：乙方享有第一作者署名权。\n2. 著作权/专利权：归____所有。' },
];

function TemplatesView() {
  const [activeCategory, setActiveCategory] = useState('全部模板');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const filteredTemplates = templatesData.filter(t =>
    (activeCategory === '全部模板' || t.category === activeCategory) &&
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
      <div className="w-64 bg-white border-r border-slate-200 p-4 shrink-0 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">模板分类</h3>
        <ul className="space-y-1">
          <TemplateCategory active={activeCategory === '全部模板'} label="全部模板" count={128} onClick={() => setActiveCategory('全部模板')} />
          <TemplateCategory active={activeCategory === '实习就业'} label="实习就业" count={24} onClick={() => setActiveCategory('实习就业')} />
          <TemplateCategory active={activeCategory === '校园生活'} label="校园生活" count={15} onClick={() => setActiveCategory('校园生活')} />
          <TemplateCategory active={activeCategory === '创业创新'} label="创业创新" count={45} onClick={() => setActiveCategory('创业创新')} />
          <TemplateCategory active={activeCategory === '学术科研'} label="学术科研" count={18} onClick={() => setActiveCategory('学术科研')} />
        </ul>
      </div>
      <div className="flex-1 p-6 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">{activeCategory}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="搜索模板名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none w-64 transition-all"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map(template => (
            <TemplateCard key={template.id} {...template} onClick={() => setSelectedTemplate(template)} />
          ))}
        </div>
        {filteredTemplates.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>未找到匹配的模板</p>
          </div>
        )}
      </div>

      {selectedTemplate && (
        <TemplatePreviewModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
      )}
    </div>
  );
}

function TemplateCategory({ label, count, active, onClick }: { label: string, count: number, active?: boolean, onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
        <span>{label}</span>
        <span className={`text-xs ${active ? 'text-blue-500' : 'text-slate-400'}`}>{count}</span>
      </button>
    </li>
  );
}

function TemplateCard({ title, category, downloads, size, format, updateTime, onClick }: { title: string, category: string, downloads: number, size: string, format: string, updateTime: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
          <FileText size={20} />
        </div>
        <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded">{format}</span>
      </div>
      <h4 className="font-medium text-slate-800 mb-2 line-clamp-2 flex-1">{title}</h4>
      <div className="text-xs text-slate-500 mb-4 space-y-1">
        <div className="flex justify-between"><span>分类:</span> <span>{category}</span></div>
        <div className="flex justify-between"><span>大小:</span> <span>{size}</span></div>
        <div className="flex justify-between"><span>更新:</span> <span>{updateTime}</span></div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <FileBadge size={12} /> {downloads} 次下载
        </span>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity">
          下载
        </button>
      </div>
    </div>
  );
}

function TemplatePreviewModal({ template, onClose }: { template: any, onClose: () => void }) {
  if (!template) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{template.title}</h2>
              <div className="text-xs text-slate-500 flex gap-3 mt-0.5">
                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{template.category}</span>
                <span className="flex items-center gap-1"><FileBadge size={12}/> {template.size}</span>
                <span className="flex items-center gap-1"><Clock size={12}/> {template.updateTime}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm">
              <Download size={16} /> 下载文档
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
          <div className="max-w-3xl mx-auto bg-white p-12 shadow-sm border border-slate-200 min-h-full rounded-sm">
            <h1 className="text-2xl font-bold text-center mb-10 text-slate-800">{template.title}</h1>
            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-loose font-serif">
              {template.content || '模板内容加载中...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">系统设置</h2>
          <p className="text-sm text-slate-500 mt-1">管理您的个人信息和系统偏好</p>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">个人资料</h3>
            <div className="flex items-center gap-6 mb-6">
              <img src="/lawyer/chenjianguo.jpg" alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-slate-200" />
              <div>
                <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  更换头像
                </button>
                <p className="text-xs text-slate-500 mt-2">支持 JPG, PNG 格式，最大 5MB</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                <input type="text" defaultValue="陈建国" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">执业证号</label>
                <input type="text" defaultValue="14403201010******" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
                <input type="text" defaultValue="13800138000" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">电子邮箱</label>
                <input type="email" defaultValue="chenjianguo@lawfirm.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
            </div>
          </div>
          <hr className="border-slate-200" />
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">通知偏好</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">新咨询提醒</div>
                  <div className="text-xs text-slate-500">有新学生发起咨询时发送通知</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-800">日程提醒</div>
                  <div className="text-xs text-slate-500">普法讲座、学生面谈等日程提前通知</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents

function NavItem({ icon, label, badge, active, onClick }: { icon: React.ReactNode, label: string, badge?: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white text-blue-600' : 'bg-slate-700 text-slate-300'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function FilterButton({ label, active, count }: { label: string, active: boolean, count?: number }) {
  return (
    <button className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
      active
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
    }`}>
      {label}
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white text-slate-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ActionButton({ icon, tooltip }: { icon: React.ReactNode, tooltip: string }) {
  return (
    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={tooltip}>
      {icon}
    </button>
  );
}

function QuickReplyButton({ label }: { label: string }) {
  return (
    <button className="text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-full transition-all whitespace-nowrap shadow-sm">
      {label}
    </button>
  );
}

function DetailItem({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}

function FileItem({ name, size, type }: { name: string, size: string, type: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer border border-slate-100 transition-colors group">
      <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
        <FileText size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">{name}</div>
        <div className="text-xs text-slate-400">{size}</div>
      </div>
    </div>
  );
}

export default LawyerConsole;

function AIAssistantView() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedContent('');

    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedContent(`基于您的描述，为您生成如下协议草案：

# 协议书

**甲方（出让方/出租方/等）：** [请填写甲方姓名/公司名称]
**统一社会信用代码/身份证号：** [请填写]
**联系地址：** [请填写]

**乙方（受让方/承租方/等）：** [请填写乙方姓名/公司名称]
**统一社会信用代码/身份证号：** [请填写]
**联系地址：** [请填写]

鉴于：
${prompt}

经甲乙双方友好协商，本着平等自愿、诚实信用的原则，达成如下协议，以资共同遵守：

**第一条 核心条款**
1.1 双方同意按照上述背景描述的内容履行各自的权利和义务。
1.2 具体标的、金额、期限等以本协议约定为准。

**第二条 权利与义务**
2.1 甲方应按约定提供相关资源或服务，保障乙方合法权益。
2.2 乙方应按约定支付相关款项，并合理使用相关资源。

**第三条 违约责任**
3.1 任何一方违反本协议约定的，应向守约方承担违约责任，赔偿因此给守约方造成的全部损失。
3.2 若逾期付款/交付，违约方应按日万分之五的标准向守约方支付违约金。

**第四条 争议解决**
4.1 因本协议引起的或与本协议有关的任何争议，双方应首先通过友好协商解决。
4.2 协商不成的，任何一方均有权向本协议签订地有管辖权的人民法院提起诉讼。

**第五条 其他**
5.1 本协议自双方签字（或盖章）之日起生效。
5.2 本协议一式两份，甲乙双方各执一份，具有同等法律效力。

（以下无正文）

甲方（签字/盖章）：____________________
日期：______年____月____日

乙方（签字/盖章）：____________________
日期：______年____月____日

> 💡 **AI 提示**：此为系统自动生成的草案模板，请根据您的具体业务场景和实际需求，对括号内及空白处的信息进行补充和修改。建议在正式签署前由专业律师进行最终审核。`);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#F8FAFC]">
      {/* Left panel: Input */}
      <div className="w-full lg:w-1/3 bg-white border-r border-slate-200 p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="text-blue-600" size={24} />
          AI 智能起草
        </h2>
        <p className="text-sm text-slate-500 mb-6">描述您的需求，AI 将为您自动生成专业的法律文书草案。</p>
        <textarea
          className="flex-1 w-full border border-slate-200 rounded-xl p-4 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          placeholder="例如：帮我起草一份大学生实习协议，包含三个月实习期，每月津贴3000元，需注明实习证明开具条款..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {isGenerating ? '正在生成中...' : '开始生成'}
        </button>
      </div>
      {/* Right panel: Output */}
      <div className="flex-1 p-6 flex flex-col bg-slate-50">
        {generatedContent ? (
          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-medium text-slate-700 flex items-center gap-2">
                <Bot size={18} className="text-blue-600" />
                生成结果
              </h3>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  {isCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  {isCopied ? '已复制' : '复制内容'}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download size={16} />
                  导出文档
                </button>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 leading-loose font-serif">
              {generatedContent}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Bot size={64} className="mb-4 opacity-20" />
            <p>AI 助手已就绪，等待您的指令</p>
          </div>
        )}
      </div>
    </div>
  );
}
