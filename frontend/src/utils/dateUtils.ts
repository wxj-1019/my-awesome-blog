/**
 * 通用日期格式化工具函数
 */

export type FormatDateOptions = Intl.DateTimeFormatOptions;

/**
 * 格式化日期为中文格式
 * @param date - 日期字符串或 Date 对象
 * @param options - 格式化选项
 * @param locale - 语言环境
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: string | Date | number,
  options: FormatDateOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = 'zh-CN'
): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return '';
  }
  return dateObj.toLocaleDateString(locale, options);
}

/**
 * 格式化为相对时间（如 "3分钟前"）
 * @param date - 日期字符串或 Date 对象
 * @returns 相对时间字符串
 */
export function formatTimeAgo(date: string | Date | number): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return '';
  }

  const now = Date.now();
  const diffMs = now - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return '刚刚';
  }
  if (diffMin < 60) {
    return `${diffMin}分钟前`;
  }
  if (diffHour < 24) {
    return `${diffHour}小时前`;
  }
  if (diffDay < 30) {
    return `${diffDay}天前`;
  }
  return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * 获取日期的简短格式（月-日）
 */
export function formatShortDate(date: string | Date | number): string {
  return formatDate(date, {
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 获取日期的完整格式（年-月-日）
 */
export function formatFullDate(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 获取日期的月份和年份
 */
export function formatMonthYear(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
  });
}
