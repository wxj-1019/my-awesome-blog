'use client';

/**
 * recharts 懒加载共享入口：
 * ReadingStats 与 StatsCharts 此前各自作为 dynamic() 边界，导致 recharts（~361KB）
 * 被复制进两个 chunk。两者统一经此模块动态引用，让打包器只保留一份 recharts。
 */
export { default as ReadingStats } from '../ReadingStats';
export { StatsCharts } from './StatsCharts';
