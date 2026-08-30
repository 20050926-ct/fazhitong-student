export default function Footer() {
  return (
    <footer className="bg-white border-t border-outline-variant w-full py-16 px-12 flex flex-col items-center gap-8">
      <div className="flex flex-col md:flex-row justify-between w-full max-w-[1400px] gap-12">
        <div className="max-w-xs">
          <div className="text-2xl font-black text-primary mb-6 flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm"></div>
            律境智联
          </div>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            我们致力于通过前沿的数字化体验与智能技术，让法律不再是晦涩的条文，而是每个人都能掌握的生存技能。在法治与科技的交汇处，构建正义的桥梁。
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <h5 className="text-primary font-bold text-sm uppercase tracking-widest">探索</h5>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">互动课堂</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">智能咨询</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">精选案例</a>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-primary font-bold text-sm uppercase tracking-widest">服务</h5>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">律师预约</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">合同审查</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">校园援助</a>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-primary font-bold text-sm uppercase tracking-widest">联系</h5>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">客服支持</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">意见反馈</a>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">加入我们</a>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-primary font-bold text-sm uppercase tracking-widest">管理</h5>
            <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="/admin/data">
              数据中心
            </a>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[1400px] flex flex-col md:flex-row justify-between items-center pt-12 border-t border-outline-variant">
        <div className="flex gap-8">
          <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">关于我们</a>
          <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">联系方式</a>
          <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors underline" href="#">法律声明</a>
          <a className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">隐私政策</a>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-4 md:mt-0">© 2024 律境智联. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
