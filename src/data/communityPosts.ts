export type CommunityPost = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  time: string;
  tags: string[];
  replies: number;
  likes: number;
  views: number;
  content: string;
  featuredInCarousel?: boolean;
  createdAt: string;
};

export type CommunityComment = {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  createdAt: string;
  isLawyer?: boolean;
};

export type CreateCommunityPostInput = {
  title: string;
  content: string;
  tags: string[];
  author?: string;
  avatar?: string;
};

const STORAGE_KEY = 'community-posts-v1';
const COMMENT_STORAGE_KEY = 'community-comments-v1';
const DEFAULT_AVATAR = '/yonghu.jpg';

export const DEFAULT_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: '1',
    title: '求助：实习公司不签三方协议，试用期被辞退怎么办？',
    author: '法学小萌新',
    avatar: '/touxiang1.jpg',
    time: '2小时前',
    tags: ['实习兼职', '劳动纠纷'],
    replies: 0,
    likes: 12,
    views: 342,
    content:
      '大家好，我是一名大四学生。上个月找了一家公司实习，当时口头说好了实习期三个月，表现好就签三方。结果今天突然通知我明天不用来了，也没有任何补偿。请问我该怎么维权？',
    createdAt: new Date('2026-04-14T10:00:00.000Z').toISOString()
  },
  {
    id: '2',
    title: '避雷！大学城附近某公寓退租不退押金套路',
    author: '正义使者',
    avatar: '/touxiang2.jpg',
    time: '5小时前',
    tags: ['租房押金', '维权', '精华'],
    replies: 0,
    likes: 456,
    views: 2100,
    content:
      '刚刚经历了一场恶心的退租风波，特地来给大家避雷。房东以各种莫须有的理由（比如墙面有正常使用的划痕、下水道有点堵）扣了我全部押金。我已经准备起诉了，附上我的证据收集清单...',
    featuredInCarousel: true,
    createdAt: new Date('2026-04-14T08:00:00.000Z').toISOString()
  },
  {
    id: '3',
    title: '大家注意校园网贷的新骗局，千万别点这些链接',
    author: '防骗达人',
    avatar: '/touxiang3.jpg',
    time: '1天前',
    tags: ['校园网贷', '防骗指南'],
    replies: 0,
    likes: 89,
    views: 890,
    content:
      '最近有很多同学收到自称是某某金融客服的短信，说你的校园贷账户异常需要注销，否则影响征信。千万别信！这是典型的诈骗套路，点进去链接就会让你转账...',
    createdAt: new Date('2026-04-13T09:00:00.000Z').toISOString()
  },
  {
    id: '4',
    title: '分享：成功要回被拖欠的兼职工资，附完整流程',
    author: '打工魂',
    avatar: '/touxiang4.jpg',
    time: '2天前',
    tags: ['兼职维权', '经验分享', '精华'],
    replies: 0,
    likes: 320,
    views: 1500,
    content:
      '历时一个月，终于把上个学期在奶茶店兼职被拖欠的2000块钱工资要回来了！没有签合同，只有微信聊天记录。今天把整个投诉和仲裁流程分享给大家，希望能帮到有需要的人。',
    featuredInCarousel: true,
    createdAt: new Date('2026-04-12T07:30:00.000Z').toISOString()
  }
];

const DEFAULT_COMMENTS_BY_POST_ID: Record<string, CommunityComment[]> = {
  '1': [
    {
      id: 1,
      author: '张景 律师',
      avatar: '/lawyer/zhangjing.jp',
      time: '1小时前',
      content:
        '同学你好，即使没有签订书面三方协议，只要你受公司管理、获得报酬，且工作内容是公司业务的一部分，就可能构成事实劳动关系。建议先保存好聊天记录、打卡记录、工作文件等证据，再向劳动监察大队投诉或申请劳动仲裁。',
      createdAt: new Date('2026-04-14T11:00:00.000Z').toISOString(),
      isLawyer: true
    },
    {
      id: 2,
      author: '打工人打工魂',
      avatar: '/touxiang2.jpg',
      time: '45分钟前',
      content: '太坑了！现在有些公司就喜欢白嫖实习生。支持维权，千万别妥协！',
      createdAt: new Date('2026-04-14T11:15:00.000Z').toISOString()
    }
  ]
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizePost(post: CommunityPost): CommunityPost {
  return {
    ...post,
    tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
    author: post.author?.trim() || '匿名同学',
    avatar: post.avatar?.trim() || DEFAULT_AVATAR
  };
}

function normalizeComment(comment: CommunityComment): CommunityComment {
  return {
    ...comment,
    author: comment.author?.trim() || '匿名同学',
    avatar: comment.avatar?.trim() || DEFAULT_AVATAR,
    content: comment.content?.trim() || ''
  };
}

function getCommentsMap(): Record<string, CommunityComment[]> {
  if (!canUseStorage()) return DEFAULT_COMMENTS_BY_POST_ID;

  try {
    const raw = window.localStorage.getItem(COMMENT_STORAGE_KEY);
    if (!raw) return DEFAULT_COMMENTS_BY_POST_ID;
    const parsed = JSON.parse(raw) as Record<string, CommunityComment[]>;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_COMMENTS_BY_POST_ID;

    const result: Record<string, CommunityComment[]> = {};
    Object.entries(parsed).forEach(([postId, comments]) => {
      result[postId] = Array.isArray(comments)
        ? comments.map((comment) => normalizeComment(comment))
        : [];
    });
    return result;
  } catch {
    return DEFAULT_COMMENTS_BY_POST_ID;
  }
}

function saveCommentsMap(commentsMap: Record<string, CommunityComment[]>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(commentsMap));
}

function toRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / (1000 * 60));
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;
  const day = Math.floor(hour / 24);
  return `${day}天前`;
}

export function getCommunityPosts(): CommunityPost[] {
  if (!canUseStorage()) return DEFAULT_COMMUNITY_POSTS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const commentsMap = getCommentsMap();
    const sourcePosts = (() => {
      if (!raw) return DEFAULT_COMMUNITY_POSTS;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COMMUNITY_POSTS;
      return parsed.map((item) => normalizePost(item as CommunityPost));
    })();

    return sourcePosts.map((post) => ({
      ...post,
      replies: commentsMap[post.id]?.length ?? 0
    }));
  } catch {
    const commentsMap = getCommentsMap();
    return DEFAULT_COMMUNITY_POSTS.map((post) => ({
      ...post,
      replies: commentsMap[post.id]?.length ?? 0
    }));
  }
}

export function saveCommunityPosts(posts: CommunityPost[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function getCommunityPostById(id: string): CommunityPost | undefined {
  return getCommunityPosts().find((post) => post.id === id);
}

export function createCommunityPost(input: CreateCommunityPostInput): CommunityPost {
  const now = new Date();
  return {
    id: String(now.getTime()),
    title: input.title.trim(),
    author: input.author?.trim() || '匿名同学',
    avatar: input.avatar?.trim() || DEFAULT_AVATAR,
    time: '刚刚',
    tags: input.tags,
    replies: 0,
    likes: 0,
    views: 0,
    content: input.content.trim(),
    createdAt: now.toISOString()
  };
}

export function addCommunityPost(input: CreateCommunityPostInput): CommunityPost {
  const newPost = createCommunityPost(input);
  const posts = getCommunityPosts();
  const nextPosts = [newPost, ...posts];
  saveCommunityPosts(nextPosts);
  return newPost;
}

export function getCommunityCommentsByPostId(postId: string): CommunityComment[] {
  return getCommentsMap()[postId] ?? [];
}

/** 清除本机持久化的社区帖子与评论（恢复默认演示数据）。不影响登录状态。 */
export function clearCommunityLocalCache(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(COMMENT_STORAGE_KEY);
}

export function addCommunityComment(postId: string, content: string, author = '匿名同学'): CommunityComment {
  const commentsMap = getCommentsMap();
  const postComments = commentsMap[postId] ?? [];
  const now = new Date();
  const newComment: CommunityComment = {
    id: now.getTime(),
    author: author.trim() || '匿名同学',
    avatar: DEFAULT_AVATAR,
    time: '刚刚',
    content: content.trim(),
    createdAt: now.toISOString()
  };
  const nextComments = [newComment, ...postComments].map((comment) => ({
    ...comment,
    time: toRelativeTime(comment.createdAt)
  }));
  const nextMap = {
    ...commentsMap,
    [postId]: nextComments
  };
  saveCommentsMap(nextMap);
  return newComment;
}
