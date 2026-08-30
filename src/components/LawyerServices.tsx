import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LAWYERS_DATA } from '../data/lawyers';

export default function LawyerServices() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState('全部地区');
  const [selectedBusiness, setSelectedBusiness] = useState('全部业务');

  const filteredLawyers = LAWYERS_DATA.filter(lawyer => {
    const matchRegion = selectedRegion === '全部地区' || lawyer.region === selectedRegion;
    const matchBusiness = selectedBusiness === '全部业务' || lawyer.business === selectedBusiness;
    return matchRegion && matchBusiness;
  });

  return (
    <section className="py-24 px-12 max-w-[1920px] mx-auto overflow-hidden bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 text-primary">找律师</h2>
          <p className="text-on-surface-variant">连接全疆专业律师，为您的权益保驾护航</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary w-full md:w-40 outline-none text-on-surface"
          >
            <option value="全部地区">全部地区</option>
            <option value="乌鲁木齐">乌鲁木齐</option>
            <option value="石河子">石河子</option>
          </select>
          <select 
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary w-full md:w-40 outline-none text-on-surface"
          >
            <option value="全部业务">全部业务</option>
            <option value="实习兼职">实习兼职</option>
            <option value="租房押金">租房押金</option>
            <option value="校园网贷">校园网贷</option>
            <option value="消费维权">消费维权</option>
            <option value="交通事故">交通事故</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-1 bg-surface-container-low rounded-2xl p-6 border border-outline-variant shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">workspace_premium</span>
            律师口碑榜
          </h3>
          <div className="space-y-6">
            {filteredLawyers.length > 0 ? (
              filteredLawyers.slice(0, 3).map((lawyer, index) => (
                <div key={lawyer.id} className="flex items-center gap-4 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-outline-variant" onClick={() => navigate(`/lawyer/${lawyer.id}`)}>
                  <span className="text-2xl font-black text-primary/30 italic">0{index + 1}</span>
                  <img alt="Lawyer" className="w-10 h-10 rounded-full object-cover border border-outline-variant" src={lawyer.avatar}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-on-surface">{lawyer.name}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">咨询 {lawyer.consultCount} 次 | 好评率 {lawyer.rating}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-on-surface-variant text-sm border border-dashed border-outline-variant rounded-xl">
                暂无上榜律师
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-outline-variant">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">work</span> 实习就业专区
            </h4>
            <p className="text-xs text-on-surface-variant mb-4">提供三方协议、试用期权益相关法律服务</p>
            <button onClick={() => navigate('/internship-zone')} className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm">进入专区</button>
          </div>
        </div>
        {/* Lawyer Cards Scroll Area */}
        <div className="lg:col-span-3 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
          {filteredLawyers.length > 0 ? (
            filteredLawyers.map((lawyer) => (
              <div key={lawyer.id} className="min-w-[300px] max-w-[300px] bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary transition-all flex flex-col shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <img alt="Lawyer Profile" className="w-16 h-16 rounded-xl object-cover border border-outline-variant" src={lawyer.avatar}/>
                  <div className="flex flex-col items-end">
                    <span className="text-primary font-bold text-lg">{lawyer.price}</span>
                    <span className="text-xs text-on-surface-variant">在线预约咨询</span>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-on-surface">{lawyer.name}</h4>
                <p className="text-xs text-primary mb-4 font-medium">{lawyer.business} | {lawyer.experience}</p>
                <p className="text-sm text-on-surface-variant mb-6 flex-1">{lawyer.desc}</p>
                <button onClick={() => navigate(`/lawyer/${lawyer.id}`)} className="bg-surface-container-low border border-outline-variant py-3 rounded-lg font-bold hover:bg-primary hover:text-white transition-all text-on-surface">预约咨询</button>
              </div>
            ))
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-12 text-on-surface-variant bg-surface-container-low rounded-2xl border border-outline-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
              <p>没有找到符合条件的律师</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
