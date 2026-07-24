/**
 * Skill 收藏馆（/tools/skills）的策展数据。
 * 收录个人常用、口碑良好的 Claude / AI agent skills，按分幕滚动顺序排列。
 * 文案为策展视角的介绍，skill 定位以各公开仓库资料为准。
 */
import type { ShowcaseSkill } from '@/types/skill';

export const showcaseSkills: ShowcaseSkill[] = [
  {
    slug: 'taste',
    name: 'taste',
    tagline: '把「一眼 AI」的模板味，炼成真正的设计品味',
    domain: '前端',
    description:
      '一套主打「反廉价感」的前端审美 skill 合集，把专业设计师对布局、配色、排版、动效与留白的判断写成 AI 能执行的约束规则。装上之后，编码 Agent 在动手前先审稿、再编码，按规则做设计决策，而不是凭概率复读训练数据里最常见的蓝紫渐变与居中卡片。',
    highlights: [
      '审美规则化：把布局节奏、字体层次、配色语义等设计经验沉淀为可执行的 SKILL.md 指令',
      '先审后写：生成代码前先评估设计方案，从源头拦截模板化产出',
      '框架无关：React / Vue / Svelte / 原生 HTML 均适用，也兼容 Cursor、Codex 等主流 Agent',
      '多种审美人格：可按项目气质选择不同风格取向，而不是一套设计走天下',
    ],
    examplePrompts: [
      '用 taste 的标准审视这个落地页，指出最「一眼 AI」的三处并重构它们',
      '为我的摄影作品集设计首页，要有编辑杂志般的排版呼吸感，拒绝居中大标题套路',
      '按 taste 的规则重写这个仪表盘：信息密度要高，但不能显得拥挤',
    ],
    sourceUrl: 'https://github.com/Leonxlnx/taste-skill',
    contentPath: '/skills/taste/SKILL.md',
    scenes: [
      '新页面临启动，怕写出来一股模板味',
      '作品被吐槽「一看就是 AI 做的」，想找病根',
      '重构老页面，想顺便把审美也升级一遍',
      '给 Agent 立一套设计规矩，让它不再自由发挥',
    ],
  },
  {
    slug: 'superpowers',
    name: 'superpowers',
    tagline: '让 Agent 先想清楚，再动手写代码',
    domain: '后端',
    description:
      '社区里最具影响力的编码工作流 skill 全家桶。它解决的不是「怎么写代码」，而是「怎么像资深工程师一样工作」——把头脑风暴、写计划、执行计划、系统化调试、测试驱动开发等一整套工程纪律装进 Agent 的工作流，让 Claude 从聊天机器人升级为真正按流程干活的协作伙伴。',
    highlights: [
      '完整工作流闭环：从 brainstorm 澄清需求，到 write-plan 拆解方案，再到 execute-plan 落地执行',
      '强制工程纪律：拦住「直接开写」的冲动，先规划、先测试，减少返工',
      '系统化调试方法论：面对 bug 先定位根因再修复，而不是靠猜',
      '模块化组合：可按需取用单个 skill，也可整套接入作为 Agent 的操作系统',
    ],
    examplePrompts: [
      '别急着写代码，先按 superpowers 的流程和我 brainstorm 这个需求',
      '为这次重构写一份执行计划，拆成可以逐步验证的小任务',
      '这个接口偶发 500，用系统化调试的方法定位根因，不许靠猜',
    ],
    sourceUrl: 'https://github.com/obra/superpowers',
    contentPath: '/skills/superpowers/SKILL.md',
    scenes: [
      '需求刚到手上，想让 Agent 先盘清楚再动手',
      '大重构心里没底，需要一份能逐步验证的执行计划',
      'bug 反复修不好，想戒掉「改一下试试」的玄学调试',
      '给 Agent 装上整套工程纪律，而不是每次都口头叮嘱',
    ],
  },
  {
    slug: 'brainstorm',
    name: 'brainstorm',
    tagline: '把脑子里那团雾，澄清成可执行的规格',
    domain: '通用',
    description:
      '结构化头脑风暴 skill（superpowers 工作流的第一环）。面对一个模糊念头，它不会急着给方案，而是像优秀的产品搭档一样连续追问：目标是什么、约束有哪些、边界在哪里，直到想法被挤压成一份清晰、可验收、可以直接进入开发的需求规格。',
    highlights: [
      '追问式澄清：用有针对性的提问逼出隐含假设与真实约束',
      '从发散到收敛：先拓宽可能性，再收敛成单一可执行方案',
      '输出即规格：产出的不是聊天记录，而是可直接指导开发的结构化文档',
      '与后续流程无缝衔接：规格可直接交给 write-plan 继续拆解执行',
    ],
    examplePrompts: [
      '我想给博客加一个「灵感速记」功能，但还没想清楚，帮我 brainstorm 一下',
      '围绕「让老用户回来」这个目标做一轮头脑风暴，最后收敛成一个可执行方案',
      '这个重构动机很模糊，先通过提问帮我把真正的痛点挖出来',
    ],
    sourceUrl: 'https://github.com/obra/superpowers',
    contentPath: '/skills/brainstorm/SKILL.md',
    scenes: [
      '脑子里只有一个模糊念头，说不清到底要做什么',
      '想法太多太散，需要有人帮忙收敛成一个方案',
      '开工前想先把隐含假设和边界都逼问出来',
      '写好了点子却落不了地，想要一份能直接开发的规格',
    ],
  },
  {
    slug: 'frontend-design',
    name: 'frontend-design',
    tagline: '官方出品的前端设计直觉，开箱即用',
    domain: '前端',
    description:
      'Anthropic 官方 skills 仓库中的前端设计最佳实践 skill。它把界面设计的通用准则——视觉层次、信息架构、可读性、响应式考量——浓缩成 Agent 在生成前端代码时自动调用的判断力，适合作为任何前端生成任务的默认底座。',
    highlights: [
      '官方维护：出自 Anthropic 官方 skills 仓库，质量与兼容性有保障',
      '覆盖设计全链路：从页面结构、组件层级到细节的视觉处理',
      '强调可访问性与响应式：生成的不只是好看，还要好用、可达',
      '即装即用：无需额外配置，生成前端代码时自动生效',
    ],
    examplePrompts: [
      '按前端设计最佳实践，为一个 SaaS 产品生成定价页，突出中间推荐档',
      '设计一个移动端优先的阅读界面，重点保证长文的可读性',
      '检查这个组件的视觉层次，让主要操作在 3 秒内被注意到',
    ],
    sourceUrl: 'https://github.com/anthropics/skills',
    contentPath: '/skills/frontend-design/SKILL.md',
    scenes: [
      '让 Agent 生成页面，希望默认就有像样的设计水准',
      '赶时间出原型，没空逐个调整视觉细节',
      '生成的界面能用但不好看，想要一个开箱即用的审美底座',
      '做移动端页面，怕可读性和响应式被忽略',
    ],
  },
  {
    slug: 'webapp-testing',
    name: 'webapp-testing',
    tagline: '让 Agent 亲手打开浏览器，验收自己的作业',
    domain: '通用',
    description:
      'Anthropic 官方 skills 仓库中的 Web 应用测试 skill，基于 Playwright 驱动真实浏览器。它让 Agent 从「写完就算」进化到「写完亲自验收」：自动启动应用、模拟用户操作、截图比对、抓取控制台报错，把验证环节闭环在开发流程之内。',
    highlights: [
      '真实浏览器验证：用 Playwright 实际打开页面操作，而不是静态读代码猜结果',
      '自动化验收闭环：点击、填表、导航、断言，完整模拟用户路径',
      '截图与日志取证：自动截屏、收集控制台错误，问题有据可查',
      '与编码 Agent 配合：写完功能立即自测，显著减少「看起来对实则跑不通」',
    ],
    examplePrompts: [
      '启动本地开发服务器，用 Playwright 走一遍注册到登录的完整流程并截图',
      '测试这个表单的所有校验分支，把失败的用例和控制台报错整理给我',
      '在移动端视口下验收首页，确认没有横向滚动条和遮挡',
    ],
    sourceUrl: 'https://github.com/anthropics/skills',
    contentPath: '/skills/webapp-testing/SKILL.md',
    scenes: [
      '功能写完了，想让 Agent 自己打开浏览器验收一遍',
      '改完代码心里没底，想自动跑一遍核心用户路径',
      '线上报了个 UI 问题，想留截图和控制台日志当证据',
      '提交前最后一道关，怕「看起来对实则跑不通」',
    ],
  },
];
