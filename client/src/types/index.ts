export type PaperTexture = 'xuanzhi' | 'maobian' | 'yunlong';
export type InkLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type SealStyle = 'none' | 'yiyue' | 'shenpin' | 'jingdu';

export interface BindingPreferences {
  paperTexture: PaperTexture;
  inkLevel: InkLevel;
  sealStyle: SealStyle;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  preferences?: Record<string, any>;
  createdAt: string;
}

export const PAPER_TEXTURES: { value: PaperTexture; label: string; desc: string }[] = [
  { value: 'xuanzhi', label: '宣纸', desc: '洁白细密，纤维匀净，千年寿纸' },
  { value: 'maobian', label: '毛边纸', desc: '微黄粗糙，竹纤维显，古意盎然' },
  { value: 'yunlong', label: '云龙纸', desc: '龙纹隐现，皮筋交织，厚重典雅' },
];

export const INK_LEVELS: { value: InkLevel; label: string; desc: string }[] = [
  { value: 1, label: '远山', desc: '淡如远山含烟' },
  { value: 2, label: '朝雾', desc: '朦胧若雾' },
  { value: 3, label: '暮色', desc: '暮色四合' },
  { value: 4, label: '深黛', desc: '浓如远山' },
  { value: 5, label: '焦墨', desc: '焦黑如炭' },
  { value: 6, label: '漆夜', desc: '浓如漆夜' },
];

export const SEAL_STYLES: { value: SealStyle; label: string; text: string }[] = [
  { value: 'none', label: '不盖印', text: '' },
  { value: 'yiyue', label: '已阅', text: '已阅' },
  { value: 'shenpin', label: '神品', text: '神品' },
  { value: 'jingdu', label: '静读', text: '静读' },
];

export const DEFAULT_BINDING: BindingPreferences = {
  paperTexture: 'xuanzhi',
  inkLevel: 3,
  sealStyle: 'none',
};

export interface Tag {
  _id: string;
  userId: string;
  name: string;
  color: string;
  workCount: number;
  createdAt: string;
}

export type WorkType = 'tv' | 'book' | 'movie' | 'other';
export type WorkStatus = 'wish' | 'watching' | 'watched' | 'paused' | 'dropped';
export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

export interface Work {
  _id: string;
  userId: string;
  type: WorkType;
  title: string;
  subtitle?: string;
  author?: string;
  cover?: string;
  description?: string;
  totalEpisodes?: number;
  totalPages?: number;
  currentEpisode: number;
  currentPage: number;
  status: WorkStatus;
  rating: Rating;
  startedAt?: string;
  finishedAt?: string;
  tags: Tag[];
  moodColor?: string;
  noteCount: number;
  progressPercent?: number;
  createdAt: string;
  updatedAt: string;
  notes?: Note[];
}

export interface NoteLocation {
  episode?: number;
  page?: number;
  chapter?: string;
}

export interface Note {
  _id: string;
  userId: string;
  workId: string | Work;
  content: string;
  moodColor?: string;
  location?: NoteLocation;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithWork {
  _id: string;
  userId: string;
  workId: { _id: string; title: string; type: WorkType };
  content: string;
  moodColor?: string;
  location?: NoteLocation;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChineseColor {
  name: string;
  hex: string;
  desc: string;
}

export interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface StatsOverview {
  totalWorks: number;
  totalNotes: number;
  watchedThisYear: number;
  watchingNow: number;
  totalEpisodes: number;
  totalPages: number;
  byType: Record<WorkType, number>;
  byStatus: Record<WorkStatus, number>;
  moodDistribution: { color: string; name: string; count: number }[];
  generatedAt: string;
}

export interface HeatmapDay {
  date: string;
  activityCount: number;
}

export interface HeatmapWeek {
  weekStart: string;
  days: HeatmapDay[];
}

export interface HeatmapData {
  weeks: HeatmapWeek[];
  maxActivity: number;
}

export interface MonthlyStat {
  month: number;
  worksCompleted: number;
  notesCount: number;
  avgRating: number;
  topMood: string | null;
}

export interface Milestone {
  date: string;
  type: string;
  text: string;
}

export interface AnnualReport {
  year: number;
  summary: {
    worksAdded: number;
    worksCompleted: number;
    totalNotes: number;
    totalEpisodesWatched: number;
    totalPagesRead: number;
  };
  topRated: Work[];
  mostNotes: Work[];
  monthlyBreakdown: MonthlyStat[];
  moodTimeline: { date: string; color: string; workId: string; noteId?: string }[];
  tagsCloud: { tagId: string; tagName: string; count: number }[];
  wordCloud: string[];
  milestones: Milestone[];
}

export const STATUS_LABELS: Record<WorkStatus, string> = {
  wish: '想看',
  watching: '在看',
  watched: '已看',
  paused: '搁置',
  dropped: '弃坑',
};

export const TYPE_LABELS: Record<WorkType, string> = {
  tv: '剧集',
  book: '书籍',
  movie: '电影',
  other: '其他',
};

export const RATING_LABELS: Record<Rating | 0, string> = {
  0: '未评',
  1: '下',
  2: '中下',
  3: '中',
  4: '上',
  5: '上上品',
};
