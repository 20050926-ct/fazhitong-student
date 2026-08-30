import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export default function ContractScanner() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<null | 'success'>(null);

  const handleUpload = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setResult('success');
    }, 3000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col bg-white">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 w-fit transition-colors">
        <span className="material-symbols-outlined">arrow_back</span> 返回
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">智能合同风险审查</h1>
        <p className="text-on-surface-variant">上传您的合同文件，系统将为您自动识别潜在法律风险。</p>
      </div>

      {!isScanning && !result && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-surface-container-low p-12 rounded-3xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-center hover:bg-white hover:border-primary transition-all cursor-pointer group shadow-sm" onClick={handleUpload}>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-6xl text-primary">cloud_upload</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-on-surface">点击或拖拽文件至此处</h3>
            <p className="text-on-surface-variant mb-8">支持 PDF, Word (DOC/DOCX), JPG, PNG 格式，最大 20MB</p>
            <button className="primary-gradient px-8 py-3 rounded-lg font-bold text-white shadow-lg shadow-primary/20">选择文件</button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 mb-8">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-primary animate-pulse">description</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2 text-on-surface">正在深度扫描合同条款...</h3>
          <p className="text-on-surface-variant">正在比对最新法律法规，请稍候</p>
        </div>
      )}

      {result === 'success' && (
        <div className="flex-1 flex flex-col gap-8">
          <div className="bg-error/5 border border-error/20 rounded-2xl p-6 flex items-start gap-4">
            <span className="material-symbols-outlined text-error text-3xl">warning</span>
            <div>
              <h3 className="text-xl font-bold text-error mb-2">发现 3 处高风险条款</h3>
              <p className="text-on-surface text-sm">建议在签署前与对方协商修改以下条款，以保障您的合法权益。</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { title: '违约金比例过高', desc: '合同第 4.2 条规定违约金为总金额的 50%，远超法律规定的 30% 上限。', type: 'error' },
              { title: '管辖法院约定不明', desc: '合同第 8 条未明确约定争议解决的管辖法院，可能导致维权成本增加。', type: 'warning' },
              { title: '单方解除权不对等', desc: '合同赋予了甲方任意解除权，但未赋予乙方同等权利，显失公平。', type: 'error' },
            ].map((risk, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${risk.type === 'error' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                    {risk.type === 'error' ? '高风险' : '中风险'}
                  </span>
                  <h4 className="font-bold text-lg text-on-surface">{risk.title}</h4>
                </div>
                <p className="text-on-surface-variant text-sm">{risk.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button className="bg-white border border-outline-variant px-8 py-3 rounded-lg font-bold hover:bg-surface-container-low transition-colors text-on-surface" onClick={() => setResult(null)}>重新扫描</button>
            <button className="primary-gradient px-8 py-3 rounded-lg font-bold text-white shadow-lg shadow-primary/20">生成审查报告</button>
          </div>
        </div>
      )}
    </div>
  );
}
