import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCommunityPost } from '../data/communityPosts';

const QUICK_TAGS = ['实习兼职', '劳动纠纷', '租房押金', '校园网贷', '消费维权', '经验分享'];

export default function CreatePost() {
  const navigate = useNavigate();
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    return title.trim().length >= 8 && content.trim().length >= 20 && !submitting;
  }, [title, content, submitting]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((item) => item !== tag);
      return [...prev, tag];
    });
  };

  const addCustomTag = () => {
    const nextTag = customTag.trim();
    if (!nextTag) return;
    if (selectedTags.includes(nextTag)) {
      setCustomTag('');
      return;
    }
    setSelectedTags((prev) => [...prev, nextTag]);
    setCustomTag('');
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setError('');

    if (title.trim().length < 8) {
      setError('标题至少输入 8 个字，方便大家更快理解问题。');
      return;
    }
    if (content.trim().length < 20) {
      setError('问题描述至少输入 20 个字，建议写清时间、经过和证据。');
      return;
    }

    setSubmitting(true);
    const newPost = addCommunityPost({
      title,
      content,
      tags: selectedTags.length > 0 ? selectedTags : ['求助'],
      author: author.trim() || '匿名同学',
      avatar: '/yonghu.jpg'
    });
    navigate(`/post/${newPost.id}`);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 bg-white">
      <button
        onClick={() => navigate('/community')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back</span> 返回社区
      </button>

      <div className="bg-white rounded-3xl p-8 border border-outline-variant shadow-sm">
        <h1 className="text-3xl font-bold text-primary mb-2">发帖求助</h1>
        <p className="text-on-surface-variant mb-8">描述越具体，越容易获得律师和同学的有效建议。</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-on-surface">昵称（可选）</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="例如：法学小白"
              maxLength={20}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-on-surface">求助标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：实习公司拖欠工资，没有合同怎么维权？"
              maxLength={60}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              required
            />
            <p className="text-xs text-on-surface-variant mt-2">{title.trim().length}/60（至少 8 字）</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-on-surface">问题描述</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="建议包含：发生时间、对方说法、你目前掌握的证据、想达成的结果。"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[220px] resize-y"
              maxLength={2000}
              required
            />
            <p className="text-xs text-on-surface-variant mt-2">{content.trim().length}/2000（至少 20 字）</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-on-surface">选择标签（可多选）</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="自定义标签"
                maxLength={10}
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                添加
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="px-6 py-3 rounded-xl border border-outline-variant font-bold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="primary-gradient px-8 py-3 rounded-xl font-bold text-white enabled:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-transform shadow-lg shadow-primary/20"
            >
              {submitting ? '提交中...' : '发布求助'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
