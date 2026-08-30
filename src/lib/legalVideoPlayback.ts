export type PlaybackKind = 'youtube' | 'bilibili' | 'direct' | 'unknown';

export function detectPlaybackKind(url: string): PlaybackKind {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('bilibili.com') || u.includes('b23.tv')) return 'bilibili';
  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url.split('?')[0] || url)) return 'direct';
  return 'unknown';
}

export function youtubeEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url, 'https://www.youtube.com');
    if (u.hostname === 'youtu.be' || u.hostname.endsWith('.youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${encodeURIComponent(v)}`;
  } catch {
    /* invalid */
  }
  return null;
}

export function bilibiliEmbedSrc(url: string): string | null {
  const m = url.match(/BV[\w]+/i);
  if (!m) return null;
  const bvid = m[0];
  return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&high_quality=1&danmaku=0`;
}
