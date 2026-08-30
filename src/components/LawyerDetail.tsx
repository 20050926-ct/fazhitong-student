import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLawyerById } from '../data/lawyers';

export default function LawyerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lawyerId = Number(id);
  const lawyer = getLawyerById(lawyerId);

  if (!lawyer) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[calc(100vh-80px)] bg-white">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 w-fit transition-colors">
          <span className="material-symbols-outlined">arrow_back</span> 返回律师列表
        </button>
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-8 text-center text-on-surface-variant">
          未找到该律师信息
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[calc(100vh-80px)] bg-white">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 w-fit transition-colors">
        <span className="material-symbols-outlined">arrow_back</span> 返回律师列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant text-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-full h-32 primary-gradient opacity-10"></div>
            <img src={lawyer.avatar} alt={lawyer.name} className="w-32 h-32 rounded-full object-cover mx-auto mb-4 relative z-10 border-4 border-white shadow-md" />
            <h1 className="text-2xl font-bold mb-1 relative z-10 text-on-surface">{lawyer.name}</h1>
            <p className="text-primary text-sm font-bold mb-4 relative z-10">执业 {lawyer.experience.replace('经验', '')} | {lawyer.business} 专家</p>
            
            <div className="flex justify-center gap-8 mb-6 relative z-10">
              <div>
                <p className="text-2xl font-black text-primary">{lawyer.rating}</p>
                <p className="text-xs text-on-surface-variant">好评率</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary">{lawyer.consultCount}</p>
                <p className="text-xs text-on-surface-variant">服务人次</p>
              </div>
            </div>

            <button className="w-full primary-gradient py-3 rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform relative z-10">
              立即预约咨询 ({lawyer.price}/次)
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-primary"><span className="material-symbols-outlined">verified</span> 执业认证</h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex justify-between"><span>执业机构：</span> <span className="text-on-surface font-medium">新疆某某律师事务所</span></li>
              <li className="flex justify-between"><span>执业证号：</span> <span className="text-on-surface font-medium">16501201210******</span></li>
              <li className="flex justify-between"><span>所在地区：</span> <span className="text-on-surface font-medium">新疆 - {lawyer.region}</span></li>
            </ul>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-primary">个人简介</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              {lawyer.name}，长期深耕 {lawyer.business} 相关法律服务，{lawyer.desc}
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              执业以来，累计服务 {lawyer.consultCount} 用户，当前好评率 {lawyer.rating}。在学生法律服务场景中，以专业、负责的态度赢得了广泛认可。
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-primary">擅长领域</h2>
            <div className="flex flex-wrap gap-3">
              {['实习兼职纠纷', '劳动仲裁', '试用期辞退维权', '三方协议审查', '薪资拖欠追讨'].map(tag => (
                <span key={tag} className="bg-primary/5 px-4 py-2 rounded-lg text-sm font-medium text-primary border border-primary/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-primary">用户评价 (1.2w+)</h2>
            <div className="space-y-6">
              {[
                { name: '石大某同学', date: '2023-10-15', text: '王律师非常专业！我暑假兼职被中介坑了工资，王律师一步步教我怎么收集证据，最后成功要回了血汗钱，太感谢了！' },
                { name: '匿名用户', date: '2023-09-02', text: '解答很耐心，把复杂的法律条款解释得通俗易懂。关于三方协议违约金的问题给我吃了一颗定心丸。' }
              ].map((review, idx) => (
                <div key={idx} className="border-b border-outline-variant pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-on-surface">{review.name}</span>
                    <span className="text-xs text-on-surface-variant">{review.date}</span>
                  </div>
                  <div className="flex text-primary mb-2">
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
