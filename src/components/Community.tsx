import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunityPost, getCommunityPosts } from '../data/communityPosts';

function PostCard({ post, compact }: { post: CommunityPost; compact?: boolean }) {
  const navigate = useNavigate();
  const p = compact ? 'p-4' : 'p-6';
  const titleCls = compact ? 'text-base font-bold' : 'text-lg font-bold';
  const snippetClamp = compact ? 'line-clamp-2' : 'line-clamp-2';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/post/${post.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/post/${post.id}`);
        }
      }}
      className={`bg-white ${p} rounded-2xl border border-outline-variant hover:border-primary transition-all cursor-pointer group shadow-sm`}
    >
      <div className={`flex items-start gap-3 ${compact ? 'mb-2' : 'mb-3'}`}>
        <img
          src={post.avatar}
          alt=""
          className={`rounded-full object-cover shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
        />
        <div className="flex-1 min-w-0">
          <h4 className={`${titleCls} text-on-surface group-hover:text-primary transition-colors mb-1`}>
            {post.title}
          </h4>
          <p className={`text-xs text-on-surface-variant ${snippetClamp} mb-2`}>{post.content}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="font-bold text-on-surface shrink-0">{post.author}</span>
              <span className="shrink-0">{post.time}</span>
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      tag === '精华'
                        ? 'bg-primary/10 text-primary border border-primary/25'
                        : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                {post.views}
              </span>
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                {post.replies}
              </span>
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                {post.likes}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const [listPosts, setListPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    setListPosts(getCommunityPosts());
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-12 py-12 bg-white">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-primary mb-4">普法社区</h2>
          <p className="text-on-surface-variant text-lg">法律问题交流社区与精选案例库，拆解举证责任与谈判要点。</p>
        </div>
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="搜索帖子、案例或用户..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex gap-6 border-b border-outline-variant w-full sm:w-auto">
              <button
                type="button"
                className="text-primary font-bold border-b-2 border-primary pb-2 px-1"
              >
                最新发布
              </button>
              <button
                type="button"
                className="text-on-surface-variant hover:text-primary font-bold pb-2 px-1 transition-colors"
              >
                热门讨论
              </button>
              <button
                type="button"
                className="text-on-surface-variant hover:text-primary font-bold pb-2 px-1 transition-colors"
              >
                精华案例
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/community/new')}
              className="primary-gradient px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">edit</span> 发帖求助
            </button>
          </div>

          <div className="space-y-3 max-w-3xl">
            {listPosts.map((post) => (
              <PostCard key={post.id} post={post} compact={false} />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined">local_fire_department</span> 热门话题
            </h3>
            <div className="flex flex-wrap gap-2">
              {['# 租房避坑指南', '# 实习生权益', '# 校园贷防骗', '# 消费者维权', '# 劳动仲裁流程', '# 考研违约金'].map(
                (topic, i) => (
                  <span
                    key={i}
                    className="bg-white border border-outline-variant hover:border-primary hover:text-primary transition-colors cursor-pointer text-sm px-3 py-1.5 rounded-lg text-on-surface-variant"
                  >
                    {topic}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined">library_books</span> 必读案例
            </h3>

            <div className="space-y-4">
              {[
                { title: '租房退押金争议', desc: '拆解举证责任与谈判要点', icon: 'home_work' },
                { title: '兼职工资拖欠', desc: '无书面合同的维权路径', icon: 'payments' },
                { title: '校园贷暴力催收', desc: '紧急应对措施与报警指南', icon: 'gavel' },
              ].map((caseItem, i) => (
                <div key={i} className="group cursor-pointer flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">{caseItem.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                      {caseItem.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{caseItem.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="w-full mt-6 py-2 text-sm font-bold text-primary hover:bg-primary/5 border border-primary/20 rounded-lg transition-colors"
            >
              查看全部案例
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
