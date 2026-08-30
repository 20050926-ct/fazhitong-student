import React, { useEffect, useState } from 'react';
import { clearCommunityLocalCache } from '../data/communityPosts';
import { getAuthUser } from '../lib/auth';
import {
  applyAppearancePrefs,
  loadAppearancePrefs,
  loadPrivacyPrefs,
  saveAppearancePrefs,
  savePrivacyPrefs,
  type AppearancePrefs,
  type FontScaleMode,
  type PrivacyPrefs,
  type ThemeMode
} from '../lib/userPreferences';

function maskAccount(account: string) {
  const t = account.trim();
  if (t.length <= 2) return '**';
  return `${t.slice(0, 2)}****${t.slice(-2)}`;
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
      <div className="min-w-0">
        <h4 className="font-bold text-on-surface">{title}</h4>
        <p className="text-sm text-on-surface-variant mt-0.5">{desc}</p>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <div className="relative h-6 w-11 shrink-0 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
      </label>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const [toast, setToast] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyPrefs>(() => loadPrivacyPrefs());
  const [appearance, setAppearance] = useState<AppearancePrefs>(() => loadAppearancePrefs());

  const authUser = getAuthUser();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const updatePrivacy = (patch: Partial<PrivacyPrefs>) => {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    savePrivacyPrefs(next);
    showToast('隐私设置已保存到本机');
  };

  const updateAppearance = (patch: Partial<AppearancePrefs>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    saveAppearancePrefs(next);
    applyAppearancePrefs(next);
    showToast('外观偏好已应用');
  };

  const tabs = [
    { id: 'account', label: '账号设置', icon: 'person', variant: 'default' as const },
    { id: 'notifications', label: '消息通知', icon: 'notifications', variant: 'default' as const },
    { id: 'privacy', label: '隐私安全', icon: 'shield', variant: 'privacy' as const },
    { id: 'appearance', label: '外观偏好', icon: 'palette', variant: 'appearance' as const }
  ];

  const tabButtonClass = (tab: (typeof tabs)[number]) => {
    const active = activeTab === tab.id;
    if (tab.variant === 'privacy') {
      if (active) {
        return 'flex items-center gap-3 rounded-lg border border-zinc-900 bg-rose-50 px-4 py-3 text-left font-bold text-rose-900 transition-colors';
      }
      return 'flex items-center gap-3 rounded-lg px-4 py-3 text-left text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface';
    }
    if (tab.variant === 'appearance') {
      if (active) {
        return 'flex items-center gap-3 rounded-lg border border-outline-variant bg-slate-50 px-4 py-3 text-left font-bold text-on-surface transition-colors';
      }
      return 'flex items-center gap-3 rounded-lg px-4 py-3 text-left text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface';
    }
    if (active) {
      return 'flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-left font-bold text-primary transition-colors';
    }
    return 'flex items-center gap-3 rounded-lg px-4 py-3 text-left text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface';
  };

  const tabIconClass = (tab: (typeof tabs)[number]) => {
    if (tab.variant === 'privacy' && activeTab === tab.id) {
      return 'material-symbols-outlined text-red-600';
    }
    if (tab.variant === 'appearance' && activeTab === tab.id) {
      return 'material-symbols-outlined text-slate-600';
    }
    return 'material-symbols-outlined';
  };

  const tabIconStyle = (tab: (typeof tabs)[number]): React.CSSProperties | undefined => {
    if (tab.variant === 'privacy' && activeTab === tab.id) {
      return { fontVariationSettings: "'FILL' 1, 'wght' 500" };
    }
    return undefined;
  };

  const themeOptions: { id: ThemeMode; label: string; hint: string }[] = [
    { id: 'light', label: '浅色', hint: '固定浅色界面' },
    { id: 'dark', label: '深色', hint: '固定深色界面' },
    { id: 'system', label: '跟随系统', hint: '随系统亮/暗模式切换' }
  ];

  const fontOptions: { id: FontScaleMode; label: string }[] = [
    { id: 'standard', label: '标准' },
    { id: 'large', label: '稍大' },
    { id: 'xlarge', label: '更大' }
  ];

  const handleClearCommunityCache = () => {
    if (!window.confirm('将清除本机保存的社区帖子与评论，恢复为默认演示数据。是否继续？')) return;
    clearCommunityLocalCache();
    showToast('已清除社区本地缓存');
    window.setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1200px] flex-col gap-8 bg-background px-6 py-12 md:flex-row">
      {toast ? (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-outline-variant bg-surface-container-high px-5 py-2 text-sm font-medium text-on-surface shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="w-full shrink-0 md:w-64">
        <h1 className="mb-8 text-3xl font-bold text-primary">设置</h1>
        <div className="flex flex-col gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={tabButtonClass(tab)}>
              <span className={tabIconClass(tab)} style={tabIconStyle(tab)}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[500px] flex-grow rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h2 className="mb-6 text-2xl font-bold text-primary">账号设置</h2>

            <div className="max-w-md space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface-variant">用户名</label>
                <input
                  type="text"
                  defaultValue="李明"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-on-surface transition-colors focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface-variant">邮箱地址</label>
                <input
                  type="email"
                  defaultValue="liming@example.com"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-on-surface transition-colors focus:border-primary focus:outline-none"
                />
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  className="primary-gradient rounded-lg px-6 py-2 font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105"
                >
                  保存更改
                </button>
              </div>
            </div>

            <hr className="my-8 border-outline-variant" />

            <div>
              <h3 className="mb-2 text-lg font-bold text-error">危险区域</h3>
              <p className="mb-4 text-sm text-on-surface-variant">删除账号后，所有记录和社区数据将被永久清除，无法恢复。</p>
              <button
                type="button"
                className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-error transition-colors hover:bg-error/20"
              >
                注销账号
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="mb-6 text-2xl font-bold text-primary">消息通知</h2>
            <div className="space-y-4">
              {[
                { title: '咨询回复', desc: '智能咨询或律师回复时通知我' },
                { title: '社区互动', desc: '有人回复我的帖子或点赞时通知我' },
                { title: '系统公告', desc: '平台维护、法律法规更新等重要通知' }
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-4"
                >
                  <div>
                    <h4 className="font-bold text-on-surface">{item.title}</h4>
                    <p className="text-sm text-on-surface-variant">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">隐私安全</h2>
              <p className="mt-2 text-sm text-on-surface-variant">以下为演示用本机设置，不会上传服务器。正式环境请接入合规隐私中心。</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">账号与登录</h3>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-sm text-on-surface-variant">当前登录账号（脱敏）</p>
                <p className="mt-1 font-mono text-lg font-bold text-on-surface">{authUser ? maskAccount(authUser.account) : '未登录'}</p>
                <p className="mt-3 text-xs text-on-surface-variant">修改密码、二次验证等功能在正式版由统一账号中心提供。</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">资料与可见性</h3>
              <div className="space-y-3">
                <ToggleRow
                  title="在社区展示我的主页入口"
                  desc="控制他人是否易从帖子跳转至你的资料（演示）"
                  checked={privacy.profilePublic}
                  onChange={(v) => updatePrivacy({ profilePublic: v })}
                />
                <ToggleRow
                  title="展示在线状态"
                  desc="在私信/咨询列表中显示最近活跃（演示）"
                  checked={privacy.showOnlineStatus}
                  onChange={(v) => updatePrivacy({ showOnlineStatus: v })}
                />
                <ToggleRow
                  title="个性化推荐"
                  desc="基于浏览与互动优化内容排序（演示，仅存本机偏好）"
                  checked={privacy.personalizedRecommend}
                  onChange={(v) => updatePrivacy({ personalizedRecommend: v })}
                />
                <ToggleRow
                  title="参与体验与诊断统计"
                  desc="匿名化崩溃与性能数据，用于改进产品（演示）"
                  checked={privacy.shareUsageStats}
                  onChange={(v) => updatePrivacy({ shareUsageStats: v })}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">本地数据</h3>
              <div className="rounded-xl border border-error/25 bg-error/5 p-4">
                <p className="text-sm text-on-surface">清除本机「社区帖子与评论」缓存</p>
                <p className="mt-1 text-xs text-on-surface-variant">不影响登录状态；清除后将恢复内置演示帖与评论。</p>
                <button
                  type="button"
                  onClick={handleClearCommunityCache}
                  className="mt-4 rounded-lg border border-error/40 bg-surface-container-lowest px-4 py-2 text-sm font-bold text-error transition-colors hover:bg-error/10"
                >
                  清除社区演示数据
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">外观偏好</h2>
              <p className="mt-2 text-sm text-on-surface-variant">主题与字号会立即应用到本页与全站语义色；部分卡片仍为固定浅色，深色下可继续阅读。</p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">主题</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {themeOptions.map((opt) => {
                  const selected = appearance.theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateAppearance({ theme: opt.id })}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        selected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-outline-variant bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <p className="font-bold text-on-surface">{opt.label}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{opt.hint}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">字体大小</h3>
              <div className="flex flex-wrap gap-2">
                {fontOptions.map((opt) => {
                  const selected = appearance.fontScale === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateAppearance({ fontScale: opt.id })}
                      className={`rounded-full border px-5 py-2 text-sm font-bold transition-colors ${
                        selected ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">动效</h3>
              <ToggleRow
                title="减少界面动效"
                desc="弱化过渡与动画，对晕动或注意力更友好"
                checked={appearance.reduceMotion}
                onChange={(v) => updateAppearance({ reduceMotion: v })}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
