import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bilibiliEmbedSrc, detectPlaybackKind, youtubeEmbedSrc } from '../lib/legalVideoPlayback';

type LegalVideo = {
  id: string;
  url: string;
  title: string;
  category: string;
  scrapedAt: string;
  source?: string;
  description?: string;
  tag?: string;
  posterUrl?: string;
  sourceKind?: 'scrape' | 'creator';
  author?: string;
};

function VideoWatchModal({
  video,
  onClose,
}: {
  video: LegalVideo | null;
  onClose: () => void;
}) {
  if (!video) return null;
  const kind = detectPlaybackKind(video.url);
  const yt = kind === 'youtube' ? youtubeEmbedSrc(video.url) : null;
  const bl = kind === 'bilibili' ? bilibiliEmbedSrc(video.url) : null;
  const showUnknown =
    kind === 'unknown' || (kind === 'youtube' && !yt) || (kind === 'bilibili' && !bl);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-video-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-outline-variant flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-outline-variant shrink-0">
          <div className="min-w-0">
            <h2 id="legal-video-modal-title" className="text-lg font-bold text-on-surface truncate">
              {video.title}
            </h2>
            {video.author && video.sourceKind === 'creator' && (
              <p className="text-xs text-on-surface-variant mt-1">创作者：{video.author}</p>
            )}
            {video.description && <p className="text-sm text-on-surface-variant mt-2 line-clamp-3">{video.description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
            aria-label="关闭"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-black flex items-center justify-center">
          {kind === 'direct' && (
            <video
              key={video.id}
              className="w-full max-h-[60vh] outline-none"
              controls
              playsInline
              poster={video.posterUrl}
              src={video.url}
            >
              您的浏览器不支持 HTML5 视频。
            </video>
          )}
          {yt && (
            <iframe
              title={video.title}
              className="w-full aspect-video max-h-[60vh]"
              src={yt}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
          {kind === 'bilibili' && bl && (
            <iframe
              title={video.title}
              className="w-full aspect-video max-h-[60vh]"
              src={bl}
              allow="fullscreen; autoplay; clipboard-write"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          {showUnknown && (
            <div className="p-6 text-center text-white/90 text-sm max-w-md">
              <p className="mb-4">当前链接无法在页面内直接解码播放。若为网盘或 App 内链，请复制到对应客户端打开。</p>
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90"
              >
                在新窗口打开链接
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PublishVideoModal({
  open,
  onClose,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  onPublished: () => void;
}) {
  const [title, setTitle] = useState('');
  const [playUrl, setPlayUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('原创');
  const [author, setAuthor] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!title.trim() || !playUrl.trim()) {
      setErr('请填写标题与播放链接');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/legal-videos/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          playUrl: playUrl.trim(),
          description: description.trim() || undefined,
          tag: tag.trim() || undefined,
          author: author.trim() || undefined,
          posterUrl: posterUrl.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setErr(json.error || '发布失败');
        return;
      }
      onPublished();
      onClose();
      setTitle('');
      setPlayUrl('');
      setDescription('');
      setTag('原创');
      setAuthor('');
      setPosterUrl('');
    } catch {
      setErr('网络错误');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-outline-variant"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-bold text-lg text-on-surface">发布普法视频</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high" aria-label="关闭">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <p className="text-on-surface-variant text-xs leading-relaxed">
            支持直链 mp4 / webm、m3u8，或 YouTube、哔哩哔哩作品页链接。请确保您拥有上传与传播权。
          </p>
          <label className="block space-y-1">
            <span className="font-medium text-on-surface">标题</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2"
              placeholder="例如：《校园兼职避坑指南》"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-on-surface">播放或作品页链接</span>
            <input
              value={playUrl}
              onChange={(e) => setPlayUrl(e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2 font-mono text-xs"
              placeholder="https://..."
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium text-on-surface">简介（可选）</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-outline-variant rounded-lg px-3 py-2 resize-y"
              placeholder="一句话介绍视频内容"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="font-medium text-on-surface">角标</span>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2"
                placeholder="原创 / 热门"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-medium text-on-surface">创作者署名（可选）</span>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2"
                placeholder="昵称"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="font-medium text-on-surface">封面图链接（可选）</span>
            <input
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs"
              placeholder="https://...jpg"
            />
          </label>
          {err && <p className="text-error text-xs">{err}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? '提交中…' : '发布到本站'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveColumn() {
  const navigate = useNavigate();
  const [sectionTitle, setSectionTitle] = useState('普法短视频');
  const [videos, setVideos] = useState<LegalVideo[]>([]);
  const [loadErr, setLoadErr] = useState('');
  const [active, setActive] = useState<LegalVideo | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const loadVideos = useCallback(async () => {
    setLoadErr('');
    try {
      const [secRes, listRes] = await Promise.all([
        fetch('/api/legal-video-section'),
        fetch('/api/legal-videos?limit=24'),
      ]);
      const secJson = (await secRes.json()) as { success?: boolean; data?: { title?: string } };
      if (secJson.success && secJson.data?.title) {
        setSectionTitle(secJson.data.title);
      }
      const listJson = (await listRes.json()) as { success?: boolean; data?: LegalVideo[]; error?: string };
      if (!listRes.ok || !listJson.success) {
        setLoadErr(listJson.error || '视频列表加载失败');
        setVideos([]);
        return;
      }
      setVideos(Array.isArray(listJson.data) ? listJson.data : []);
    } catch {
      setLoadErr('无法连接服务器，请确认已运行 npm run dev');
      setVideos([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initVideos() {
      try {
        await fetch('/api/legal-videos/crawl-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: '普法收录' }),
        });
      } catch {
        /* 网络或站点不可用时不阻塞列表展示 */
      }
      if (!cancelled) await loadVideos();
    }
    void initVideos();
    return () => {
      cancelled = true;
    };
  }, [loadVideos]);

  return (
    <section className="py-16 px-6 max-w-[1400px] mx-auto bg-white">
      <div className="flex justify-between items-end mb-10 border-b border-outline-variant pb-2">
        <div>
          <h2 className="text-3xl font-bold text-primary border-l-4 border-primary pl-4">虚拟仿真游戏 (2D/3D)</h2>
          <p className="text-on-surface-variant text-sm mt-1 ml-4">沉浸式法律实战演练 · 虚拟仿真教学</p>
        </div>
        <button className="text-primary flex items-center gap-1 text-sm font-bold hover:underline">
          查看全部专栏 <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-white shadow-md transition-all hover:shadow-xl border border-outline-variant">
          <img alt="Game Card" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src="/courtroom.png" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 p-6 w-full text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="px-2 py-0.5 bg-primary text-[10px] font-bold rounded text-white uppercase tracking-wider">3D 虚拟仿真</span>
              <span className="flex items-center gap-1 text-white text-xs font-bold">
                <span className="material-symbols-outlined text-xs">star</span> 4.9
              </span>
            </div>
            <h3 className="text-xl font-bold mb-1">模拟法庭：扶与不扶</h3>
            <p className="text-white/80 text-xs mb-4 line-clamp-1">大学生好心扶起摔倒老人，却反被家属讹诈？</p>
            <button
              onClick={() => navigate('/play/court')}
              className="w-full py-2 bg-white text-primary rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all"
            >
              立即进入
            </button>
          </div>
        </div>
        <div className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-white shadow-md transition-all hover:shadow-xl border border-outline-variant">
          <img
            alt="Game Card"
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 p-6 w-full text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="px-2 py-0.5 bg-primary text-[10px] font-bold rounded text-white uppercase tracking-wider">2D 文字冒险</span>
              <span className="flex items-center gap-1 text-white text-xs font-bold">
                <span className="material-symbols-outlined text-xs">star</span> 4.7
              </span>
            </div>
            <h3 className="text-xl font-bold mb-1">网络虚实：美妆的故事</h3>
            <p className="text-white/80 text-xs mb-4 line-clamp-1">因为轻信朋友圈代购，购买了一批低价大牌美妆？</p>
            <button
              onClick={() => navigate('/play/makeup')}
              className="w-full py-2 bg-white text-primary rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all"
            >
              开始调查
            </button>
          </div>
        </div>
        <div className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-white shadow-md transition-all hover:shadow-xl border border-outline-variant">
          <img
            alt="Game Card"
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
            src="https://images.unsplash.com/photo-1589391886645-d51941baf7fb?q=80&w=800&auto=format&fit=crop"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 p-6 w-full text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="px-2 py-0.5 bg-surface-container-high text-[10px] font-bold rounded text-on-surface-variant uppercase tracking-wider">敬请期待</span>
            </div>
            <h3 className="text-xl font-bold mb-1 text-white/60">正在开发中...</h3>
            <p className="text-white/40 text-xs mb-4 line-clamp-1">更多精彩校园法律互动案例正在制作中。</p>
            <button className="w-full py-2 bg-surface-container-high border border-outline-variant rounded-lg text-sm font-bold text-on-surface-variant cursor-not-allowed">
              即将上线
            </button>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-outline-variant pb-2 mb-6">
          <h2 className="text-2xl font-bold text-primary border-l-4 border-primary pl-4 truncate min-w-0">{sectionTitle}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="text-sm font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              创作者发布
            </button>
            <button
              type="button"
              onClick={() => void loadVideos()}
              className="text-on-surface-variant flex items-center gap-1 text-sm font-bold hover:underline"
            >
              刷新列表 <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>
        {loadErr && <p className="text-sm text-error mb-4">{loadErr}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v) => (
            <button
              type="button"
              key={v.id}
              onClick={() => setActive(v)}
              className="text-left bg-surface-container-low p-5 rounded-xl border border-outline-variant hover:border-primary transition-all cursor-pointer group w-full"
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <h3 className="font-bold text-on-surface text-xl group-hover:text-primary transition-colors line-clamp-2">
                  {v.title}
                </h3>
                <span className="shrink-0 bg-primary/10 text-primary text-xs px-2 py-1 rounded font-bold">
                  {v.tag || v.category}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mb-2 line-clamp-3">
                {v.description || (v.sourceKind === 'creator' ? `创作者：${v.author || '匿名'}` : '点击播放')}
              </p>
              <div className="flex items-center gap-1 text-primary text-sm font-bold">
                <span className="material-symbols-outlined text-base">play_circle</span>
                立即观看
              </div>
            </button>
          ))}
        </div>
        {videos.length === 0 && !loadErr && (
          <p className="text-sm text-on-surface-variant">暂无视频；进入本页时会自动尝试收录，也可使用「创作者发布」。</p>
        )}
      </div>

      <VideoWatchModal video={active} onClose={() => setActive(null)} />
      <PublishVideoModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={() => void loadVideos()}
      />
    </section>
  );
}
