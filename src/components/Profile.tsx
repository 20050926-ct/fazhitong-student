import React from 'react';

export default function Profile() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 bg-white">
      <h1 className="text-3xl font-bold text-primary mb-8">个人中心</h1>
      
      {/* User Header */}
      <div className="bg-surface-container-low p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 mb-8 border border-outline-variant shadow-sm">
        <img 
          src="/yonghu.jpg" 
          alt="Avatar" 
          className="w-32 h-32 rounded-full border-4 border-primary object-cover"
        />
        <div className="flex-grow text-center md:text-left">
          <h2 className="text-3xl font-bold text-on-surface mb-2">李明</h2>
          <p className="text-primary font-medium mb-4">石河子大学 · 法学爱好者</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="bg-white border border-outline-variant px-3 py-1 rounded-full text-sm text-on-surface-variant">学号: 2021***123</span>
            <span className="bg-white border border-outline-variant px-3 py-1 rounded-full text-sm text-on-surface-variant">加入时间: 2023-09</span>
          </div>
        </div>
        <button className="primary-gradient px-6 py-3 rounded-lg font-bold text-white hover:scale-105 transition-transform shadow-lg shadow-primary/20">
          编辑资料
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: '法律咨询', value: '12次', icon: 'support_agent' },
          { label: '普法学习', value: '328h', icon: 'menu_book' },
          { label: '社区获赞', value: '156', icon: 'thumb_up' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-outline-variant flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <p className="text-on-surface-variant text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <h3 className="text-xl font-bold text-primary mb-6">我的维权与咨询记录</h3>
      <div className="space-y-4">
        {[
          { title: '关于实习期辞退的法律咨询', result: '已解答', date: '2小时前', score: '智能咨询回复' },
          { title: '租房合同条款审查', result: '无风险', date: '昨天', score: '合同扫描' },
          { title: '兼职被扣工资求助', result: '律师跟进中', date: '3天前', score: '张景 律师' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-outline-variant flex justify-between items-center hover:bg-surface-container-low transition-colors shadow-sm">
            <div>
              <h4 className="font-bold text-on-surface">{item.title}</h4>
              <p className="text-sm text-on-surface-variant">{item.date}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.result === '已解答' ? 'bg-green-100 text-green-700' : item.result === '无风险' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {item.result}
              </span>
              <p className="text-sm text-primary mt-1">{item.score}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
