import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getLawyerById } from '../data/lawyers';

export default function InternshipZone() {
  const navigate = useNavigate();
  const recommendedLawyers = [1, 6]
    .map((lawyerId) => getLawyerById(lawyerId))
    .filter((lawyer): lawyer is NonNullable<typeof lawyer> => Boolean(lawyer));

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 bg-white">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 w-fit transition-colors">
        <span className="material-symbols-outlined">arrow_back</span> 返回
      </button>

      {/* Hero Section */}
      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex-1 relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold mb-4">
            <span className="material-symbols-outlined text-base">work</span> 大学生专属
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4">实习就业法律专区</h1>
          <p className="text-lg text-on-surface-variant mb-8 max-w-2xl">
            专门针对大学生在实习、签订三方协议、试用期及正式就业过程中遇到的法律问题，提供一站式维权指南与专业律师对接服务。
          </p>
          <button onClick={() => navigate('/ai-chat')} className="primary-gradient px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            智能劳动法咨询
          </button>
        </div>
        <div className="w-48 h-48 shrink-0 bg-white rounded-full flex items-center justify-center border-4 border-primary/10 relative z-10 shadow-sm">
          <span className="material-symbols-outlined text-8xl text-primary">gavel</span>
        </div>
      </div>

      {/* Common Issues Grid */}
      <h2 className="text-2xl font-bold text-on-surface mb-6">高发问题指南</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { title: '三方协议违约金', desc: '企业单方面毁约，或学生想考研/考公如何免除违约金？', icon: 'contract' },
          { title: '试用期被无故辞退', desc: '试用期不是“白用期”，被辞退同样可以主张经济赔偿。', icon: 'person_remove' },
          { title: '实习不发工资/扣工资', desc: '实习生受不受劳动法保护？工资被克扣如何收集证据？', icon: 'money_off' },
        ].map((issue, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all cursor-pointer group shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">{issue.icon}</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">{issue.title}</h3>
            <p className="text-on-surface-variant text-sm">{issue.desc}</p>
          </div>
        ))}
      </div>

      {/* Recommended Lawyers */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-on-surface">专区推荐律师</h2>
        <button onClick={() => navigate('/lawyers')} className="text-primary font-bold hover:underline text-sm">查看更多</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendedLawyers.map((lawyer) => (
          <div key={lawyer.id} className="bg-white rounded-2xl p-6 border border-outline-variant flex gap-6 items-center shadow-sm hover:border-primary transition-all">
            <img src={lawyer.avatar} alt={lawyer.name} className="w-20 h-20 rounded-xl object-cover border border-outline-variant" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-lg font-bold text-on-surface">{lawyer.name}</h4>
                <span className="text-primary font-bold">{lawyer.price}</span>
              </div>
              <p className="text-xs text-primary mb-2 font-medium">{lawyer.business} | {lawyer.experience}</p>
              <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{lawyer.desc}</p>
              <button onClick={() => navigate(`/lawyer/${lawyer.id}`)} className="text-sm font-bold text-primary hover:underline">立即预约</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
