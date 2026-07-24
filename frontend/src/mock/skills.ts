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
    howItWorks: [
      '把设计师对布局、配色、排版、动效的判断写成 SKILL.md 约束规则',
      'Agent 在生成代码前先读取并内化这些规则，按规则做设计决策',
      '生成后可对照规则自检，标记「一眼 AI」的模板化产出并重构',
    ],
    bestPractices: [
      '在项目启动时挂载 taste，让规则成为 Agent 的默认审美底座',
      '遇到不满意的设计，先问 Agent「按 taste 标准哪里最像 AI」，再让它改',
      '按项目气质选择不同审美人格，而非一套规则走天下',
      '定期更新规则以匹配你不断进化的品味',
    ],
    fitMatrix: {
      fit: [
        '对设计有要求、不想让 AI 输出模板味的前端项目',
        '需要快速出原型但又要保持专业感的场景',
        '希望 Agent 像设计师一样「先想后做」的团队',
      ],
      notFit: [
        '只需要功能性界面、不在意审美的内部工具',
        '已有严格设计系统、Agent 只需按 token 执行的场景',
        '纯后端或无界面的项目',
      ],
    },
    relatedSlugs: ['frontend-design', 'superpowers'],
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
    howItWorks: [
      '把工程纪律拆成可独立调用的 skill：brainstorm、write-plan、execute-plan、systematic-debugging、test-driven-development',
      '每个 skill 是一段工作流指令，Agent 读取后按步骤执行而非自由发挥',
      'skill 之间可串联：brainstorm 产出规格 → write-plan 拆任务 → execute-plan 落地',
      '整套接入即成为 Agent 的「工程操作系统」，单取一个也能用',
    ],
    bestPractices: [
      '复杂任务先 brainstorm 再 write-plan，别让 Agent 直接开写',
      '调试时强制走 systematic-debugging，拒绝「改一下试试」',
      '按任务性质选 skill 子集，不必每次全套',
      '把执行计划拆成可独立验证的小任务，逐步推进',
    ],
    fitMatrix: {
      fit: [
        '中大型功能开发、需要工程纪律约束 Agent 的场景',
        '团队协作中希望 Agent 按统一流程干活',
        '调试疑难 bug、需要系统化方法论',
      ],
      notFit: [
        '一句话就能完成的琐碎改动',
        '已经非常明确、无需规划的小修小补',
        '探索性、不需要严谨流程的即兴编码',
      ],
    },
    relatedSlugs: ['brainstorm', 'webapp-testing', 'taste'],
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
    howItWorks: [
      '面对模糊需求，不急于给方案，而是连续追问目标、约束、边界',
      '先用开放式提问拓宽可能性，再逐步收敛到单一可执行方向',
      '把对话挤压成结构化的需求规格文档，而非聊天记录',
      '产出的规格可直接交给 write-plan 继续拆解执行',
    ],
    bestPractices: [
      '尽量描述现状与期望，别只说「做个功能」',
      '允许 Agent 多问几轮，别过早拍板',
      '收敛后让 Agent 复述规格，确认理解一致再进入开发',
      '把约束（时间、技术栈、用户）讲清楚，方案会更准',
    ],
    fitMatrix: {
      fit: [
        '需求模糊、自己也没完全想清楚的功能',
        '想法很多但缺乏结构、需要收敛的场景',
        '开工前想逼出隐含假设与边界',
      ],
      notFit: [
        '需求已经非常明确、无需澄清的任务',
        '纯执行类的机械改动',
        '没有决策空间的标准化操作',
      ],
    },
    relatedSlugs: ['superpowers'],
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
    howItWorks: [
      '把视觉层次、信息架构、可读性、响应式等通用设计准则编码为指令',
      'Agent 生成前端代码时自动加载这些准则作为判断依据',
      '无需显式调用，作为前端任务的默认审美底座静默生效',
    ],
    bestPractices: [
      '作为默认底座长期挂载，而非每次手动触发',
      '与 taste 搭配：官方底座 + 个性化规则，效果更好',
      '生成后让 Agent 自查可访问性与响应式',
      '对生成结果不满意时，指明具体维度（层次/留白/对比）再让它改',
    ],
    fitMatrix: {
      fit: [
        '任何需要 Agent 生成前端界面的任务',
        '希望开箱即用、不折腾配置的场景',
        '对可访问性与响应式有基本要求的项目',
      ],
      notFit: [
        '纯后端或无界面项目',
        '已有专属设计系统、只需按规范执行的场景',
        '追求高度个性化审美（用 taste 更合适）',
      ],
    },
    relatedSlugs: ['taste', 'webapp-testing'],
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
    howItWorks: [
      '基于 Playwright 驱动真实浏览器，模拟真实用户环境',
      '按脚本执行点击、填表、导航等操作，并对结果做断言',
      '自动截图与收集控制台错误，形成可查证的验收报告',
      '与编码 Agent 串联：写完即测，把验收闭环在开发流程内',
    ],
    bestPractices: [
      '把核心用户路径写成测试脚本，每次改动自动回归',
      '失败时优先看截图与控制台日志，而非盲猜',
      '移动端视口单独跑一遍，避免响应式问题漏网',
      '与 superpowers 的 execute-plan 配合，每步执行后即测',
    ],
    fitMatrix: {
      fit: [
        'Web 应用开发，需要真实浏览器验证的功能',
        '希望把验收自动化、减少手动回归的场景',
        '线上 UI 问题排查、需要取证的情况',
      ],
      notFit: [
        '纯后端 API 或无界面的服务',
        '一次性脚本、无需浏览器验证的任务',
        '性能压测（应选专用工具）',
      ],
    },
    relatedSlugs: ['superpowers', 'frontend-design'],
  },
];
