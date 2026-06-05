const CHINESE_COLORS = [
  { name: '月白', hex: '#D6E4FF', desc: '月色如水，心静如水' },
  { name: '黛蓝', hex: '#4A5568', desc: '远山如黛，沉思悠远' },
  { name: '朱柿', hex: '#C84032', desc: '柿子红透，心头微热' },
  { name: '鹅黄', hex: '#F0E68C', desc: '初春新柳，轻盈明媚' },
  { name: '青竹', hex: '#7BA05B', desc: '竹林清风，悠然自得' },
  { name: '藕荷', hex: '#E6B8CF', desc: '荷塘初绽，温柔缱绻' },
  { name: '沉香', hex: '#8B6914', desc: '香沉一缕，往事如烟' },
  { name: '素银', hex: '#C0C0C0', desc: '清辉淡淡，安然无事' },
  { name: '烟紫', hex: '#9370DB', desc: '暮烟四合，情思朦胧' },
  { name: '松石', hex: '#48C9B0', desc: '松石青翠，生机勃勃' },
  { name: '绛红', hex: '#8B0000', desc: '深沉浓烈，难以忘怀' },
  { name: '苍青', hex: '#5F9EA0', desc: '天色微青，开阔辽远' },
  { name: '秋香', hex: '#D9B64C', desc: '秋意盎然，温润醇厚' },
  { name: '竹青', hex: '#789262', desc: '翠竹森森，清雅脱俗' },
  { name: '胭脂', hex: '#9D2933', desc: '胭脂泪，相留醉' },
  { name: '石青', hex: '#1661AB', desc: '石青入骨，沉静端庄' },
];

const DEFAULT_TAGS = [
  { name: '推荐', color: '#C84032' },
  { name: '经典', color: '#4A5568' },
  { name: '治愈', color: '#7BA05B' },
  { name: '烧脑', color: '#9370DB' },
  { name: '感人', color: '#E6B8CF' },
  { name: '古风', color: '#8B6914' },
];

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
  paused: '搁置',
  dropped: '弃坑',
};

const WORK_TYPE_LABELS = {
  tv: '剧集',
  book: '书籍',
  movie: '电影',
  other: '其他',
};

module.exports = {
  CHINESE_COLORS,
  DEFAULT_TAGS,
  RATING_LABELS,
  STATUS_LABELS,
  WORK_TYPE_LABELS,
};
