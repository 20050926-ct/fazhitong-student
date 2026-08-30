import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, Calendar, Share2, Printer, ExternalLink } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ArticleData {
  title: string;
  date: string;
  content: string;
  url?: string;
}

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get fallback URL from query params if available
  const queryParams = new URLSearchParams(location.search);
  const fallbackUrl = queryParams.get('url');

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        let targetUrl: string | null = fallbackUrl;
        let presetTitle: string | undefined;
        let presetDate: string | undefined;

        const localRes = await fetch(`/api/legal-articles/${encodeURIComponent(id)}`);
        const localJson = await localRes.json().catch(() => ({}));
        if (localRes.ok && localJson.success && localJson.data?.url) {
          targetUrl = localJson.data.url as string;
          presetTitle = localJson.data.title as string | undefined;
          presetDate =
            (localJson.data.date as string | undefined) ||
            (typeof localJson.data.scrapedAt === "string"
              ? localJson.data.scrapedAt.slice(0, 10)
              : undefined);
        } else if (!targetUrl && id.length > 5) {
          const docRef = doc(db, "legal_articles", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const d = docSnap.data() as { url?: string; title?: string; date?: string };
            targetUrl = d.url ?? null;
            presetTitle = d.title;
            presetDate = d.date;
          }
        }

        if (targetUrl) {
          const response = await fetch(`/api/article-content?url=${encodeURIComponent(targetUrl)}`);
          const result = await response.json();

          if (result.success) {
            setArticle({
              ...result.data,
              url: targetUrl,
              title: (result.data.title as string)?.trim() || presetTitle || "无标题",
              date: (result.data.date as string)?.trim() || presetDate || "",
            });
          } else {
            setError("无法从官网加载内容，请尝试直接访问。");
            setArticle({
              title: presetTitle || "加载失败",
              date: presetDate || "",
              content: "",
              url: targetUrl,
            });
          }
        } else {
          setError("文章信息不完整或不存在");
        }
      } catch (err: unknown) {
        console.error("Error fetching article:", err);
        setError("获取文章内容时发生错误");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, fallbackUrl]);

  const hasRenderableBody = Boolean(
    article?.content?.replace(/<[^>]+>/g, "").trim() || /<img\b/i.test(article?.content || "")
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-on-surface-variant font-bold">正在连接司法部官网...</p>
        </div>
      </div>
    );
  }

  if (error && !article?.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-on-surface mb-4">{error}</h2>
          {article?.url && (
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold mb-4 w-full justify-center"
            >
              直接访问官网原文 <ExternalLink size={18} />
            </a>
          )}
          <button 
            onClick={() => navigate('/')}
            className="block w-full px-6 py-2 text-on-surface-variant hover:text-primary font-bold"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Article Header */}
      <div className="bg-white border-b border-outline-variant sticky top-20 z-20">
        <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold"
          >
            <ArrowLeft size={20} /> 返回
          </button>
          <div className="flex gap-4">
            {article?.url && (
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
                title="查看原文"
              >
                <ExternalLink size={20} />
              </a>
            )}
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-[1000px] mx-auto px-6 py-12 bg-white shadow-sm mt-8 rounded-xl border border-outline-variant">
        <header className="mb-10 text-center border-b border-outline-variant pb-10">
          <h1 className="text-3xl md:text-4xl font-black text-on-surface leading-tight mb-6">
            {article?.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-on-surface-variant text-sm">
            <span className="flex items-center gap-1">
              <Calendar size={16} className="text-primary" /> {article?.date}
            </span>
            <span>
              来源：
              {article?.url?.includes("legaldaily.com.cn")
                ? "法治网（法治日报）"
                : article?.url?.includes("moj.gov.cn") || article?.url?.includes("legalinfo.moj.gov.cn")
                  ? "司法部 / 中国普法网"
                  : article?.url?.includes("moe.gov.cn")
                    ? "教育部"
                    : article?.url?.includes("court.gov.cn")
                      ? "最高人民法院"
                      : "转载"}
            </span>
          </div>
        </header>

        {hasRenderableBody ? (
          <div
            className="article-body prose prose-lg max-w-none prose-headings:text-primary prose-a:text-primary prose-p:text-justify prose-p:leading-relaxed prose-img:rounded-xl prose-img:mx-auto text-base text-on-surface"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <div className="py-16 px-4 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-xl bg-surface-container-low">
            <p className="font-bold text-on-surface mb-2">未能加载正文</p>
            <p className="text-sm mb-6">
              该链接可能不是文章详情页，或官网版式已调整。请使用右上角「查看原文」跳转官网阅读。
            </p>
            {article?.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold"
              >
                打开官网原文 <ExternalLink size={18} />
              </a>
            )}
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-outline-variant text-center">
          <p className="text-on-surface-variant text-sm italic">
            温馨提示：正文由服务端代理抓取原文页面 HTML解析展示，仅供学习参考，请以官网发布为准。
          </p>
        </footer>
      </article>
    </div>
  );
}
