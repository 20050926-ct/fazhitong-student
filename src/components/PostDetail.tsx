import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addCommunityComment, getCommunityCommentsByPostId, getCommunityPostById } from '../data/communityPosts';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = id ? getCommunityPostById(id) : undefined;
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const comments = id ? getCommunityCommentsByPostId(id) : [];

  if (!post) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-12 bg-white">
        <button onClick={() => navigate('/community')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span> 返回社区
        </button>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 text-center text-on-surface-variant">
          帖子不存在或已被删除
        </div>
      </div>
    );
  }

  const handleCommentSubmit = () => {
    const nextValue = newComment.trim();
    if (!id) return;
    if (nextValue.length < 2) {
      setCommentError('回复内容至少输入 2 个字');
      return;
    }
    addCommunityComment(id, nextValue);
    setNewComment('');
    setCommentError('');
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 bg-white">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-8 transition-colors">
        <span className="material-symbols-outlined">arrow_back</span> 返回社区
      </button>

      <div className="bg-white rounded-3xl p-8 md:p-12 border border-outline-variant mb-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-6">{post.title}</h1>
        
        <div className="flex items-center justify-between border-b border-outline-variant pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full object-cover border border-outline-variant" />
            <div>
              <div className="font-bold text-on-surface text-lg">{post.author}</div>
              <div className="text-sm text-on-surface-variant">{post.time} · {post.views} 次浏览</div>
            </div>
          </div>
          <div className="flex gap-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className={`px-3 py-1 rounded-full text-sm font-medium ${tag === '精华' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="prose prose-slate max-w-none mb-12 text-on-surface-variant leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="flex items-center gap-6 pt-6 border-t border-outline-variant">
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">thumb_up</span> {post.likes} 赞同
          </button>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">star</span> 收藏
          </button>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">share</span> 分享
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-outline-variant shadow-sm">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-on-surface">全部回复 ({post.replies})</h3>
          {comments.length > 0 ? (
            <p className="text-xs text-on-surface-variant mt-1">当前展示 {comments.length} 条精选回复</p>
          ) : null}
        </div>
        
        <div className="flex gap-4 mb-10">
          <img src="/yonghu.jpg" alt="Me" className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
          <div className="flex-1">
            <textarea 
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (commentError) setCommentError('');
              }}
              placeholder="写下你的回复..." 
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px] resize-y mb-3 text-on-surface"
            />
            {commentError ? <p className="text-sm text-red-600 mb-3">{commentError}</p> : null}
            <div className="flex justify-end">
              <button
                onClick={handleCommentSubmit}
                className="primary-gradient px-6 py-2 rounded-lg text-sm font-bold text-white hover:scale-105 transition-transform shadow-md shadow-primary/20"
              >
                发表回复
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <img src={comment.avatar} alt={comment.author} className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-on-surface">{comment.author}</span>
                    {comment.isLawyer && (
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold border border-primary/20">认证律师</span>
                    )}
                    <span className="text-xs text-on-surface-variant ml-auto">{comment.time}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-3">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px]">thumb_up</span> 赞</button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px]">reply</span> 回复</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-xl p-4">
              暂无精选回复，欢迎发表第一条评论。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
