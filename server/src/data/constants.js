const CHINESE_COLORS = [
  { name: '月白', hex: '#D6E4FF', desc: '月色如水，心静如水' },
  { name: '朱柿', hex: '#C84032', desc: '柿子红透，心头微热' },
  { name: '青竹', hex: '#7BA05B', desc: '竹林清风，悠然自得' },
  { name: '烟紫', hex: '#9370DB', desc: '暮烟四合，情思朦胧' },
  { name: '沉香', hex: '#8B6914', desc: '香沉一缕，往事如烟' },
  { name: '鹅黄', hex: '#F0E68C', desc: '初春新柳，轻盈明媚' },
];

const FIXED_TAGS = [
  { name: '推荐', color: '#C84032' },
  { name: '经典', color: '#4A5568' },
  { name: '治愈', color: '#7BA05B' },
  { name: '烧脑', color: '#9370DB' },
  { name: '感人', color: '#E6B8CF' },
  { name: '古风', color: '#8B6914' },
  { name: '悬疑', color: '#5F9EA0' },
  { name: '轻松', color: '#F0E68C' },
  { name: '虐心', color: '#9D2933' },
  { name: '神作', color: '#1661AB' },
  { name: '小众', color: '#789262' },
  { name: '二刷', color: '#48C9B0' },
];

const DEFAULT_TAGS = FIXED_TAGS;

const RATING_LABELS = {
  0: '未评',
  1: '下',
  2: '中下',
  3: '中',
  4: '上',
  5: '上上品',
};

const STATUS_LABELS = {
  wish: '想看',
  watching: '在看',
  watched: '已看',
};

const WORK_TYPE_LABELS = {
  tv: '剧集',
  book: '书籍',
  movie: '电影',
};

module.exports = {
  CHINESE_COLORS,
  FIXED_TAGS,
  DEFAULT_TAGS,
  RATING_LABELS,
  STATUS_LABELS,
  WORK_TYPE_LABELS,
};
