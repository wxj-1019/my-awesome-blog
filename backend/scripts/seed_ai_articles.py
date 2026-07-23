"""一次性播种脚本：创建「AI 前沿」分类 + 标签 + 4 篇 AI 趋势文章。
执行：cd backend && .venv/Scripts/python.exe scripts/seed_ai_articles.py
"""
import uuid
from app.core.database import SessionLocal
from app.models.category import Category
from app.models.tag import Tag
from app.models.user import User
from app.schemas.article import ArticleCreate
from app.crud.article import create_article
from app.crud.category import get_category_by_name
from app.crud.tag import get_tag_by_name

AUTHOR_USERNAME = "admin"

CATEGORY_NAME = "AI 前沿"
TAG_NAMES = ["AI", "大模型", "AI Agent", "端侧AI", "具身智能", "行业趋势"]

ARTICLES = [
    {
        "title": "2026，AI Agent 元年：从「调用工具」到「数字员工」",
        "slug": "ai-agent-era-2026",
        "excerpt": "当 Agent 开始操控整个软件生态，我们谈论的不再是一个更聪明的聊天框，而是一种新的生产力形态。2026 年被广泛视为 AI Agent 的落地元年。",
        "tags": ["AI", "AI Agent", "行业趋势"],
        "content": """## 从聊天框到数字员工

过去几年，大模型更多扮演「高级问答机」的角色：你提问，它回答。但 2026 年的关键词已经切换——**AI Agent（智能体）**。它不只是生成文本，而是能规划任务、调用工具、操作软件、闭环交付结果的「数字员工」。

在 2026 中国 AIGC 产业峰会上，港大助理教授黄超提出了一个值得深思的观点：**应该重新设计数字世界以适应 AI Agent，而不是让 AI Agent 适应人类**。这句话的背后是一个判断：通用 Agent 的终极形态，是能够操控复杂软件生态的实体。

## 为什么是今年

三个条件在今年同时成熟：

1. **模型能力过关**：长程推理、多步规划的错误率降到可用区间，Agent 不再三步就"失忆"。
2. **工具协议统一**：MCP 等工具调用协议成为事实标准，Agent 接入一个新工具的成本从"定制开发"变成"即插即用"。
3. **成本拐点**：多家头部厂商 API 价格下调 60% 以上，长链路 Agent 调用的账单第一次变得可以接受。

## 对个人开发者意味着什么

- **工作流重构**：重复性操作（数据整理、监控巡检、初稿撰写）会最先被 Agent 接管，人的角色转向"定义目标 + 验收结果"。
- **新的技能溢价**：会写 prompt 不如会设计 Agent 工作流——拆解任务、定义工具边界、设置校验节点。
- **小而美胜过全而大**：垂直场景的专精 Agent（只做一件事但做穿）比"万能助理"更容易活下来。

## 冷静剂

Agent 不是银弹。当前阶段的可靠性仍依赖**受限的工具边界**和**明确的验收标准**。把 Agent 当实习生用——给清晰的 SOP、允许它调用有限的工具、关键节点人工复核——是目前最务实的姿势。

Agent 元年真正的变化不是技术，而是**人机协作的分工方式**。适应它的人，会先拿到这一轮的生产力红利。
""",
    },
    {
        "title": "大模型进入「深水区」：参数神话终结之后",
        "slug": "llm-deep-water-2026",
        "excerpt": "2026 年的大模型赛道，不再听参数神话，只看应用实效。API 降价 60%、中小厂商转型、垂直场景崛起——行业正在经历一场冷静而深刻的转向。",
        "tags": ["AI", "大模型", "行业趋势"],
        "content": """## 狂欢结束，交卷开始

如果说 2023–2024 是大模型的「军备竞赛」——比谁的参数大、谁的融资多——那么 2026 年，行业已经走进第二个十字路口：**从"谁家模型强"转向"谁家应用能赚钱、能闭环"**。

标志性信号随处可见：头部厂商 API 价格下调 60% 以上；一批中小型模型公司开始裁员或转型；反而是那些专注垂直场景的"专精特新"团队拿到了新的融资。

## 三个正在发生的转向

### 1. 从通用到垂直

"一个模型包打天下"的叙事正在退潮。医疗、法律、工业质检、金融风控——这些场景需要的不是通用智能，而是**领域知识 + 可控输出**。垂直模型用 1/10 的成本做到通用模型 90% 的效果，账算得过来。

### 2. 从比拼规模到比拼效率

开源与闭源正在再平衡：OpenAI、Anthropic 仍站在能力前沿，但 DeepSeek、Meta、Mistral 等开源阵营用快速迭代和成本优势切走了大量市场。对企业来说，**"够用 + 便宜 + 可私有部署"** 正在战胜 "最强但昂贵"。

### 3. 从技术 Demo 到商业闭环

投资人问的问题变了：不再是"你的模型多少分"，而是"你的客户愿意续费吗"。能不能嵌进真实业务流、能不能替代可量化的人力成本，成了唯一的评判标准。

## 给从业者的建议

- 别再追"最新旗舰模型"的新闻焦虑，把 80% 精力放在**你的场景里模型的实际表现**上。
- 建立评估集（Evals）比选型更重要：没有自己的评测数据，你永远在被厂商的跑分牵着走。
- 关注成本结构：RAG、小模型蒸馏、缓存复用，这些"不性感"的工程手段才是利润来源。

深水区的水温更低，但更适合真正会游泳的人。
""",
    },
    {
        "title": "端侧 AI 落地元年：AI 手机真的来了",
        "slug": "on-device-ai-phone-2026",
        "excerpt": "网信办首次集中公布 7 款手机端侧模型备案，苹果、华为、小米等全部入局。喊了两年的 AI 手机，这次是真的来了——但它的意义远不止「手机更聪明」。",
        "tags": ["AI", "端侧AI", "行业趋势"],
        "content": """## 一个被低估的里程碑

2026 年 7 月，国家网信办首次集中公布了 7 款手机端侧生成式 AI 服务的备案信息，涉及苹果、华为、OPPO、vivo、小米、三星和努比亚。

表面上看，这只是又一条合规新闻。但它实际宣告的是：**端侧大模型正式从实验室走进监管框架和量产机型**。喊了两年口号的 AI 手机，这次是真的来了。

## 为什么端侧如此重要

云端大模型有三座绕不开的大山：**延迟、隐私、成本**。端侧模型恰好是这三座山的解药：

- **延迟**：本地推理毫秒级响应，离线可用——地铁、电梯、飞机上不再"转圈圈"。
- **隐私**：相册、聊天记录、健康数据不出设备。这是监管和用户都最在意的一张牌。
- **成本**：一次芯片投入，边际成本为零。对厂商是省 API 账单，对用户是免订阅费。

## 技术上是怎么办到的

端侧跑大模型不是魔法，而是三件套的组合：**模型蒸馏**（把小模型教出大模型的本事）、**量化压缩**（INT4 甚至更低精度，体积砍半再砍半）、**NPU 异构调度**（专用 AI 芯片接管推理）。3B 参数量级的端侧模型，已经能覆盖摘要、改写、翻译、本地搜索等 80% 的日常需求。

## 对个人开发者的机会

端侧不是大厂的专属游戏：

- **本地知识库应用**：隐私敏感场景（日记、病历、合同）是端侧 RAG 的天然土壤。
- **端云协同架构**：简单任务本地跑、复杂任务上云——谁把路由策略做得好，谁的体验就更顺滑。
- **新交互入口**：系统级 AI 意味着 App 可以被"意图"直接调用，而不只是被点开。

当然，端侧不会取代云端，就像手机没取代电脑。但"数据在哪，智能就在哪"的时代，确实开始了。
""",
    },
    {
        "title": "具身智能：当大模型成为机器人的「大脑」",
        "slug": "embodied-ai-robots-2026",
        "excerpt": "2026 年 WAIC 上，具身智能赛道聚集了 200 多家企业。大模型与机器人的深度融合，正在重塑机器人的「大脑」——从提线木偶到能听懂话、会学习的伙伴。",
        "tags": ["AI", "具身智能", "大模型", "行业趋势"],
        "content": """## 从「提线木偶」到「听得懂话」

传统机器人本质上是精密编排的提线木偶：每个动作都要工程师逐行写死。而大模型的加入改变了游戏规则——机器人开始具备**任务泛化、环境适应和自主学习**的能力。

2026 年世界人工智能大会（WAIC）上，仅具身智能一个赛道就聚集了超过 200 家企业。行业的共识逐渐清晰：**AI 大模型深度融合，是重塑机器人"大脑"的关键变量**。

## 技术路线：分层先行，端到端在路上

当前主流是**分层式架构**：

- **大脑（规划层）**：大模型负责理解指令、拆解任务——"把桌上的红杯子拿给我"被分解为定位、规划、抓取、递送。
- **小脑（控制层）**：运动控制模型负责把任务翻译成电机指令，处理平衡、避障、力控。

这种分工务实而高效：大模型不必学走路，控制器不必懂语义。而更激进的**端到端路线**（一个模型从视觉直接输出动作）也在快速演进，仿真训练 + 真实数据回流的闭环一旦跑通，泛化能力会再上一个台阶。

## 为什么是现在

- **多模态大模型成熟**：视觉-语言-动作（VLA）模型让机器人第一次能"看懂再动手"。
- **硬件成本下探**：核心零部件国产化，人形机器人整机成本进入可商用区间。
- **场景真实存在**：工业搬运、仓储分拣、危险环境巡检——这些是确定性需求，不是秀场。

## 冷静看待

具身智能仍处在"能演示"到"能上岗"的中途：可靠性、续航、成本三座大山还没翻完。但方向已经足够明确——**物理世界是 AI 的下一个主战场**。

对开发者而言，现在最值得积累的不是机器人硬件，而是**真实场景的数据闭环能力**：谁能持续采集、标注、回流真实作业数据，谁就握住了下一个十年的入场券。
""",
    },
]


def main():
    db = SessionLocal()
    try:
        author = db.query(User).filter(User.username == AUTHOR_USERNAME).first()
        if not author:
            author = db.query(User).filter(User.is_superuser == True).first()
        if not author:
            raise RuntimeError("未找到作者账号")

        # 1. 分类（幂等）
        category = get_category_by_name(db, CATEGORY_NAME)
        if not category:
            category = Category(
                id=uuid.uuid4(),
                name=CATEGORY_NAME,
                slug="ai-frontier",
                description="人工智能前沿趋势与产业观察",
                color="#8b5cf6",
                icon="cpu",
                is_active=True,
            )
            db.add(category)
            db.flush()
            print(f"创建分类: {CATEGORY_NAME} ({category.id})")
        else:
            print(f"分类已存在: {CATEGORY_NAME} ({category.id})")

        # 2. 标签（幂等）
        tag_map = {}
        for name in TAG_NAMES:
            tag = get_tag_by_name(db, name)
            if not tag:
                tag = Tag(
                    id=uuid.uuid4(),
                    name=name,
                    slug=name.lower().replace(" ", "-"),
                )
                db.add(tag)
                db.flush()
                print(f"创建标签: {name} ({tag.id})")
            tag_map[name] = tag

        # 3. 文章（slug 幂等）
        from app.crud.article import get_article_by_slug

        created = 0
        for data in ARTICLES:
            if get_article_by_slug(db, slug=data["slug"]):
                print(f"跳过（已存在）: {data['title']}")
                continue
            article_in = ArticleCreate(
                title=data["title"],
                slug=data["slug"],
                content=data["content"],
                excerpt=data["excerpt"],
                is_published=True,
                category_id=category.id,
                tags=[tag_map[t].id for t in data["tags"]],
            )
            article = create_article(db, article_in, author_id=author.id)
            created += 1
            print(f"创建文章: {article.title} ({article.id})")

        db.commit()
        print(f"\n完成：新建 {created} 篇文章，分类「{CATEGORY_NAME}」，标签 {len(tag_map)} 个")
    except Exception as e:
        db.rollback()
        print(f"失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
