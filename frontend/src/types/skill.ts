/**
 * Skill 收藏馆（/tools/skills）的数据类型定义。
 * 与 mock 数据层、SkillCard / SkillDetailHero 等组件共用的跨模块契约。
 */

/** Skill 收藏馆中单个收藏 skill 的展示模型 */
export interface ShowcaseSkill {
  /** 唯一标识，用作 key 与锚点 */
  slug: string;
  /** skill 显示名称，如 "taste" */
  name: string;
  /** 一句话标语 */
  tagline: string;
  /** 领域标签 */
  domain: '前端' | '后端' | '通用';
  /** 收藏类型：skill 提示词工作流 / mcp 工具服务 */
  kind: 'skill' | 'mcp';
  /** 详细介绍 */
  description: string;
  /** 能力亮点（3-5 条） */
  highlights: string[];
  /** 示例提示词（2-3 条） */
  examplePrompts: string[];
  /** 来源/仓库链接（可选） */
  sourceUrl?: string;
  /** 适用场景（3-4 条，详情页展示） */
  scenes?: string[];
  /** 站内托管的 skill 正文路径（站点根相对），如 /skills/taste/SKILL.md */
  contentPath?: string;
  /** 工作原理：在 Agent 工作流中的运作机制（2-4 条要点） */
  howItWorks?: string[];
  /** 最佳实践 / 上手建议（3-5 条） */
  bestPractices?: string[];
  /** 适合 / 不适合对比 */
  fitMatrix?: { fit: string[]; notFit: string[] };
  /** 关联 skill：馆内 slug 列表，详情页互链 */
  relatedSlugs?: string[];
  /** 快速上手/安装步骤（2-4 条，详情页侧栏展示） */
  installSteps?: string[];
}
