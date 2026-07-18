export const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {return '刚刚';}
  if (diffMins < 60) {return `${diffMins}分钟前`;}
  if (diffHours < 24) {return `${diffHours}小时前`;}
  if (diffDays < 7) {return `${diffDays}天前`;}
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

export const formatMonthYear = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
};

export const formatReadTime = (minutes: number): string => {
  return `${minutes} min`;
};
