// モックデータ: ユーザー、投稿、スキルカテゴリ

export type SkillCategory = 'engineering' | 'design' | 'business' | 'marketing' | 'data' | 'other';

export interface Skill {
  name: string;
  category: SkillCategory;
}

export interface User {
  id: string;
  name: string;
  university: string;
  faculty: string;
  year: number;
  bio: string;
  skills: Skill[];
  avatar: string;
  email: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: Skill[];
  author: User;
  createdAt: string;
  applicants: number;
  maxMembers: number;
  currentMembers: number;
  status: 'recruiting' | 'closed';
  tags: string[];
}

export const SKILL_CATEGORIES: Record<SkillCategory, string> = {
  engineering: 'エンジニアリング',
  design: 'デザイン',
  business: 'ビジネス',
  marketing: 'マーケティング',
  data: 'データ分析',
  other: 'その他',
};

export const ALL_SKILLS: Skill[] = [
  { name: 'React', category: 'engineering' },
  { name: 'Next.js', category: 'engineering' },
  { name: 'TypeScript', category: 'engineering' },
  { name: 'Python', category: 'engineering' },
  { name: 'Node.js', category: 'engineering' },
  { name: 'Flutter', category: 'engineering' },
  { name: 'AWS', category: 'engineering' },
  { name: 'UI/UXデザイン', category: 'design' },
  { name: 'Figma', category: 'design' },
  { name: 'グラフィックデザイン', category: 'design' },
  { name: '事業計画', category: 'business' },
  { name: '財務・会計', category: 'business' },
  { name: '法務', category: 'business' },
  { name: '営業', category: 'business' },
  { name: 'SNSマーケティング', category: 'marketing' },
  { name: 'コンテンツ制作', category: 'marketing' },
  { name: 'SEO', category: 'marketing' },
  { name: '広告運用', category: 'marketing' },
  { name: '機械学習', category: 'data' },
  { name: 'データ分析', category: 'data' },
  { name: 'プロジェクト管理', category: 'other' },
  { name: 'プレゼン', category: 'other' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: '田中 太郎',
    university: '東京大学',
    faculty: '工学部',
    year: 3,
    bio: 'フルスタック開発が得意です。React/Next.jsを使ったWebアプリ開発経験が2年以上あります。学生の課題を解決するサービスを作りたいと考えています。',
    skills: [
      { name: 'React', category: 'engineering' },
      { name: 'Next.js', category: 'engineering' },
      { name: 'TypeScript', category: 'engineering' },
      { name: 'AWS', category: 'engineering' },
    ],
    avatar: '🧑‍💻',
    email: 'tanaka@g.ecc.u-tokyo.ac.jp',
  },
  {
    id: 'user-2',
    name: '佐藤 花子',
    university: '慶應義塾大学',
    faculty: '商学部',
    year: 2,
    bio: 'ビジネスプランの策定や市場分析が得意です。起業コンペで入賞経験あり。テクノロジーとビジネスの融合に興味があります。',
    skills: [
      { name: '事業計画', category: 'business' },
      { name: '財務・会計', category: 'business' },
      { name: 'SNSマーケティング', category: 'marketing' },
      { name: 'プレゼン', category: 'other' },
    ],
    avatar: '👩‍💼',
    email: 'sato@keio.jp',
  },
  {
    id: 'user-3',
    name: '鈴木 一郎',
    university: '京都大学',
    faculty: '情報学研究科',
    year: 4,
    bio: '機械学習エンジニア志望。Pythonでのデータ分析やモデル構築を行っています。AIを活用した新しいサービスの開発に挑戦したい。',
    skills: [
      { name: 'Python', category: 'engineering' },
      { name: '機械学習', category: 'data' },
      { name: 'データ分析', category: 'data' },
    ],
    avatar: '🧑‍🔬',
    email: 'suzuki@kyoto-u.ac.jp',
  },
  {
    id: 'user-4',
    name: '山田 美咲',
    university: '武蔵野美術大学',
    faculty: 'デザイン情報学科',
    year: 3,
    bio: 'UI/UXデザイナー。ユーザー中心設計で使いやすいプロダクトを作ることに情熱を持っています。Figmaでのプロトタイピングが得意。',
    skills: [
      { name: 'UI/UXデザイン', category: 'design' },
      { name: 'Figma', category: 'design' },
      { name: 'グラフィックデザイン', category: 'design' },
    ],
    avatar: '👩‍🎨',
    email: 'yamada@musabi.ac.jp',
  },
  {
    id: 'user-5',
    name: '高橋 健太',
    university: '早稲田大学',
    faculty: '政治経済学部',
    year: 2,
    bio: 'マーケティングとSNS運用を専門にしています。複数のSNSアカウントを成長させた経験があります。コンテンツ戦略の立案が得意。',
    skills: [
      { name: 'SNSマーケティング', category: 'marketing' },
      { name: 'コンテンツ制作', category: 'marketing' },
      { name: '広告運用', category: 'marketing' },
      { name: '営業', category: 'business' },
    ],
    avatar: '🧑‍💻',
    email: 'takahashi@waseda.jp',
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'AIを活用した学生向け学習管理アプリの開発メンバー募集',
    description:
      '学生の学習効率を最大化するAI搭載アプリを開発しています。ユーザーの学習パターンを分析し、最適な学習計画を自動生成するサービスです。\n\n現在、バックエンド開発とUI/UXデザインを担当してくれるメンバーを探しています。週に2-3回のオンラインMTGを予定しています。\n\nすでにMVPのプロトタイプは完成しており、ユーザーテストのフィードバックを元に改善フェーズに入っています。',
    category: 'EdTech',
    requiredSkills: [
      { name: 'Python', category: 'engineering' },
      { name: '機械学習', category: 'data' },
      { name: 'UI/UXデザイン', category: 'design' },
    ],
    author: MOCK_USERS[0],
    createdAt: '2026-02-25',
    applicants: 5,
    maxMembers: 5,
    currentMembers: 2,
    status: 'recruiting',
    tags: ['AI', '教育', 'アプリ開発'],
  },
  {
    id: 'post-2',
    title: '大学生向けフードデリバリーサービスの共同創業者募集',
    description:
      '大学キャンパス周辺に特化したフードデリバリーサービスを立ち上げます。既存のデリバリーサービスと異なり、地元の学生食堂や隠れた名店を届けるコンセプトです。\n\nエンジニアとマーケティング担当を募集しています。すでに3つの大学で市場調査を完了し、ビジネスモデルは構築済みです。\n\n起業に本気の方、一緒にやりませんか？',
    category: 'フードテック',
    requiredSkills: [
      { name: 'React', category: 'engineering' },
      { name: 'Node.js', category: 'engineering' },
      { name: 'SNSマーケティング', category: 'marketing' },
    ],
    author: MOCK_USERS[1],
    createdAt: '2026-02-24',
    applicants: 8,
    maxMembers: 4,
    currentMembers: 1,
    status: 'recruiting',
    tags: ['フードテック', 'デリバリー', '地域密着'],
  },
  {
    id: 'post-3',
    title: '学生の就活をAIで革新！マッチングプラットフォーム開発',
    description:
      '従来の就職活動の非効率さを解消する、AI駆動の就活マッチングプラットフォームを開発中。学生のスキルと企業の求める人材を高精度でマッチングします。\n\nフロントエンドエンジニアとデータサイエンティストを募集。特にReactとPythonに精通した方を歓迎します。',
    category: 'HR Tech',
    requiredSkills: [
      { name: 'React', category: 'engineering' },
      { name: 'Python', category: 'engineering' },
      { name: 'データ分析', category: 'data' },
      { name: '事業計画', category: 'business' },
    ],
    author: MOCK_USERS[2],
    createdAt: '2026-02-23',
    applicants: 12,
    maxMembers: 6,
    currentMembers: 3,
    status: 'recruiting',
    tags: ['AI', '就活', 'マッチング'],
  },
  {
    id: 'post-4',
    title: 'サステナブルファッションのECプラットフォーム構築',
    description:
      '学生が手軽にサステナブルなファッションを楽しめるECプラットフォームを作ります。古着のリメイクやシェアリングを通じて、環境に優しいファッション文化を広めたい。\n\nデザイナー、エンジニア、ビジネス面をサポートしてくれる方を幅広く募集中！',
    category: 'EC・ファッション',
    requiredSkills: [
      { name: 'Next.js', category: 'engineering' },
      { name: 'UI/UXデザイン', category: 'design' },
      { name: 'SNSマーケティング', category: 'marketing' },
    ],
    author: MOCK_USERS[3],
    createdAt: '2026-02-22',
    applicants: 6,
    maxMembers: 5,
    currentMembers: 2,
    status: 'recruiting',
    tags: ['EC', 'サステナブル', 'ファッション'],
  },
  {
    id: 'post-5',
    title: '学生向け相乗りマッチングアプリの開発チーム',
    description:
      '同じ大学や近隣大学の学生同士で相乗りをマッチングするアプリを開発します。通学コストの削減と環境負荷の低減を同時に実現。\n\nFlutterでのモバイルアプリ開発経験者を特に歓迎。ビジネス面の計画はほぼ完成しています。',
    category: 'モビリティ',
    requiredSkills: [
      { name: 'Flutter', category: 'engineering' },
      { name: 'Node.js', category: 'engineering' },
      { name: '広告運用', category: 'marketing' },
    ],
    author: MOCK_USERS[4],
    createdAt: '2026-02-20',
    applicants: 3,
    maxMembers: 4,
    currentMembers: 1,
    status: 'recruiting',
    tags: ['モビリティ', '相乗り', 'エコ'],
  },
  {
    id: 'post-6',
    title: 'キャンパス内フリーランサー向けコワーキングマッチング',
    description:
      '大学内の空き教室やスペースを活用して、学生フリーランサーが集まれるコワーキング環境を提供するサービス。大学事務局との連携も進行中。\n\n法務やビジネス面の知見を持つ方を探しています。',
    category: 'コワーキング',
    requiredSkills: [
      { name: '法務', category: 'business' },
      { name: '事業計画', category: 'business' },
      { name: 'プロジェクト管理', category: 'other' },
    ],
    author: MOCK_USERS[0],
    createdAt: '2026-02-18',
    applicants: 2,
    maxMembers: 3,
    currentMembers: 1,
    status: 'recruiting',
    tags: ['コワーキング', '大学連携', 'フリーランス'],
  },
];

export const POST_CATEGORIES = [
  'EdTech',
  'フードテック',
  'HR Tech',
  'EC・ファッション',
  'モビリティ',
  'コワーキング',
  'ヘルスケア',
  'FinTech',
  'SaaS',
  'その他',
];

// ローカルストレージのヘルパー
const STORAGE_KEY_POSTS = 'uni-match-posts';
const STORAGE_KEY_USER = 'uni-match-current-user';

export function getStoredPosts(): Post[] {
  if (typeof window === 'undefined') return MOCK_POSTS;
  const stored = localStorage.getItem(STORAGE_KEY_POSTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(MOCK_POSTS));
    return MOCK_POSTS;
  }
  return JSON.parse(stored);
}

export function addPost(post: Post): void {
  const posts = getStoredPosts();
  posts.unshift(post);
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY_USER);
  return stored ? JSON.parse(stored) : null;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY_USER);
}
