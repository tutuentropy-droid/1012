import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDate = (date?: string, format: string = 'YYYY年MM月DD日') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatShortDate = (date?: string) => formatDate(date, 'MM/DD');

export const formatRelative = (date?: string) => {
  if (!date) return '';
  const now = dayjs();
  const target = dayjs(date);
  const diffDays = now.diff(target, 'day');
  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays} 日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
};

export const getWeekdayLabel = (index: number) => {
  return ['日', '一', '二', '三', '四', '五', '六'][index];
};

export const getMonthLabel = (month: number) => {
  return ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'][month - 1];
};
