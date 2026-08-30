import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ContractUploadPhase = 'idle' | 'scanning' | 'done';

export default function ToolboxAndCampus() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<ContractUploadPhase>('idle');
  const [pickedFileName, setPickedFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, []);

  const clearProgressTimer = () => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const runFakeLocalFileProcess = (fileName: string) => {
    setPickedFileName(fileName);
    setUploadPhase('scanning');
    setUploadProgress(0);
    clearProgressTimer();
    let p = 0;
    progressTimerRef.current = window.setInterval(() => {
      p += 6;
      if (p >= 100) {
        setUploadProgress(100);
        setUploadPhase('done');
        clearProgressTimer();
      } else {
        setUploadProgress(p);
      }
    }, 90);
  };

  const onContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    runFakeLocalFileProcess(file.name);
  };

  const onDropZoneClick = () => {
    if (uploadPhase === 'scanning' || uploadPhase === 'done') return;
    fileInputRef.current?.click();
  };

  const resetContractUpload = () => {
    clearProgressTimer();
    setUploadPhase('idle');
    setPickedFileName('');
    setUploadProgress(0);
  };

  const scanStatusText =
    uploadProgress < 34 ? '正在读取本地文件…' : uploadProgress < 68 ? '正在解析合同结构与版式…' : '正在提取关键条款与风险点…';

  return (
    <section className="py-24 px-12 max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white">
      {/* Contract Toolbox */}
      <div className="lg:col-span-5 flex flex-col gap-8">
        <div>
          <h2 className="text-4xl font-bold mb-2 text-primary">合同与普法工具</h2>
          <p className="text-on-surface-variant">杜绝合同陷阱，智能工具为您扫清障碍</p>
        </div>
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            onChange={onContractFileChange}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={onDropZoneClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDropZoneClick();
              }
            }}
            className={`flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-xl p-10 mb-8 bg-white transition-all group ${
              uploadPhase === 'scanning' ? 'cursor-wait border-primary/50' : 'hover:border-primary cursor-pointer'
            }`}
          >
            {uploadPhase === 'idle' && (
              <>
                <span className="material-symbols-outlined text-5xl text-primary mb-4 group-hover:scale-110 transition-transform">
                  document_scanner
                </span>
                <p className="font-bold text-on-surface">合同扫描：智能合同审查工具</p>
                <p className="text-xs text-on-surface-variant mt-2">支持 PDF, Word, JPG 格式 (最大 20MB)</p>
                <p className="text-xs text-primary/80 mt-3 font-medium">点击此区域选择本地合同（演示流程）</p>
              </>
            )}
            {uploadPhase === 'scanning' && (
              <div className="w-full max-w-xs text-center">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 animate-pulse">progress_activity</span>
                <p className="text-sm font-bold text-on-surface mb-1">{scanStatusText}</p>
                <p className="text-xs text-on-surface-variant mb-3 truncate" title={pickedFileName}>
                  已选择：{pickedFileName}
                </p>
                <div className="h-2 w-full rounded-full bg-outline-variant/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-100 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2">{uploadProgress}%</p>
              </div>
            )}
            {uploadPhase === 'done' && (
              <div className="w-full max-w-sm text-center space-y-3">
                <span className="material-symbols-outlined text-5xl text-primary mb-1">task_alt</span>
                <p className="font-bold text-on-surface">本地文件已加入审查队列</p>
                <p className="text-xs text-on-surface-variant truncate px-2" title={pickedFileName}>
                  {pickedFileName}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/scanner');
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-sm"
                  >
                    进入智能审查
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetContractUpload();
                    }}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-sm text-on-surface-variant hover:border-primary hover:text-primary"
                  >
                    重新选择文件
                  </button>
                </div>
              </div>
            )}
          </div>
          <h4 className="font-bold mb-4 text-primary">合同关键条款速查清单</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-outline-variant p-4 rounded-lg flex items-center gap-3 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary">work</span>
              <span className="text-sm font-medium">兼职合同核对</span>
            </div>
            <div className="bg-white border border-outline-variant p-4 rounded-lg flex items-center gap-3 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary">house</span>
              <span className="text-sm font-medium">租房合同核对</span>
            </div>
            <div className="bg-white border border-outline-variant p-4 rounded-lg flex items-center gap-3 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary">groups</span>
              <span className="text-sm font-medium">社团合作协议</span>
            </div>
            <div className="bg-white border border-outline-variant p-4 rounded-lg flex items-center gap-3 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary">shopping_bag</span>
              <span className="text-sm font-medium">消费维权须知</span>
            </div>
          </div>
        </div>
      </div>
      {/* Campus Exclusive Zone */}
      <div className="lg:col-span-7">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2 text-primary">校园专属服务</h2>
          <p className="text-on-surface-variant">校园优选，聚焦大学生常见法律问题</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden group shadow-sm hover:border-primary transition-all">
            <div className="h-40 overflow-hidden relative">
              <img alt="Campus" className="w-full h-full object-cover group-hover:scale-105 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzAKzXwpgkX1khszDQqtOwN1OUwhslIn1i-99PCAAXIX_PXe5C0GDx8g0-WK2rhO8_MKYH_H_x8qFnmWCreSCt4kYH5zflaaO7hHuuPfnPgscolVdQy7Bjtd3WVVw8maXveaeteFwZ7K1w8MHRh304HrrJvQzaPSs3F2gRUnHSA6pfTvdgaTIWMNxHhYkp9WHFyKSpxYLIs9uvnKu4zHeLT_pmVpOGoXTksJi1igyLOd5Yz1ZVA2r4utwIX1F5NqKS_PWmcgeDb_Q7"/>
              <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-white">高发警惕</div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-on-surface">实习工资被扣</h3>
              <p className="text-xs text-on-surface-variant mb-4">遭遇实习单位以“表现不佳”为由扣除全部报酬？教你如何合法讨薪。</p>
              <button onClick={() => navigate('/ai-chat')} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">一键发起咨询 <span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden group shadow-sm hover:border-primary transition-all">
            <div className="h-40 overflow-hidden relative">
              <img alt="Rent" className="w-full h-full object-cover group-hover:scale-105 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFYZSSf2m2IZYoyHFlmpiNxcbqdJQ-URbCb8SRm92cGAkf39rtZEMToIlw8Rzsyhixjg_jAOBgIYOdJQZ_7GfFdJIZI8reXyAnkMmXbYLSGF4uwCQH4Kmn9obc8lylCLtVOfyJV7HjeIQ_tuIue4Q_QDmzpzLNkoE-uqlN1oB9Ndfcmrt04g3OwLR5bLycd4JzVrI9mFCCMFPMUQIqvPZM2hhqS2NoZDCJ6wcs86wgRoibIDcGl24Nn6PEJzP6iXBFLNxc4YaPbu7F"/>
              <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold text-primary">避坑案例</div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-on-surface">租房押金退还</h3>
              <p className="text-xs text-on-surface-variant mb-4">房屋正常损耗却被房东恶意扣除押金？了解押金扣除的法律红线。</p>
              <button onClick={() => navigate('/ai-chat')} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">一键发起咨询 <span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden group shadow-sm hover:border-primary transition-all">
            <div className="h-40 overflow-hidden relative">
              <img alt="Loan" className="w-full h-full object-cover group-hover:scale-105 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNPJsvlTndf_qtLUGuCW7y6Wmxz5OpfkoaSINJYYXhpDrXussxljVsh9Pe3rJdQ9dvoEXvO4o8WCk5NRknXyPdXNAlo2M4rr6PL8XaBAbtIu84Rox5MWozMfJ2bgKdWFg_GjeqM1vD8zzJrR_eZBkIXtAVHD8JwRQoV262ZPF1I_uo2m2IDYGzrFikcYsO5jhvxQXe_MxT2HlVYVMkh6ef7ELt_TZDfWFxLAkLBsFbwfWZZS309spsZ3JElWNvgN_EGZuMraVrewWP"/>
              <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-white">风险告知</div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-on-surface">远离校园非法贷</h3>
              <p className="text-xs text-on-surface-variant mb-4">识破“低利息、无抵押”陷阱，遭遇非法催收时应如何报警和取证。</p>
              <button onClick={() => navigate('/ai-chat')} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">一键发起咨询 <span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden group shadow-sm hover:border-primary transition-all">
            <div className="h-40 overflow-hidden relative">
              <img alt="Club" className="w-full h-full object-cover group-hover:scale-105 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ-gjF1YF-DQaVstnCVJ1q9O98vksGHsfB325Uw0BbI7oYHVCy-eSJH2kXVHwbgPOcQAJwuW3olpFwdo2QeeDD6eqtzE_Z6_iNeePN-KbSxUYIrj2CRs9iQlXJ4pTvUhL776xm7cQb8j-TIBbhxFena_ad2nUnSK2ZGsGrqmiTfc87x_lH00jBq_bRBf_bB6DkXaprQcHzGnYYmB5OY7Xqk20g_wgHOaopjyeHKW6-nP-mbq6vflJsigE2a6HBuTfsncj2Q9HkCGN6"/>
              <div className="absolute top-4 right-4 bg-surface-container-low border border-outline-variant px-3 py-1 rounded-full text-[10px] font-bold text-primary">社团必备</div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2 text-on-surface">兼职工资维权</h3>
              <p className="text-xs text-on-surface-variant mb-4">发传单、做家教等兼职没有签订书面合同，工资被拖欠如何维权。</p>
              <button onClick={() => navigate('/ai-chat')} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">一键发起咨询 <span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
