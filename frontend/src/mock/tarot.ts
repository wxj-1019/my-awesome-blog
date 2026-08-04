/**
 * 78 张韦特塔罗静态数据（/tools/tarot）
 * 牌义为通用韦特体系的中文简写版，仅作娱乐参考。
 */

import type { TarotCard, TarotCourt, TarotElement, TarotSpread, TarotSuit } from '@/types/tarot';

// ============================================
// 大阿尔克那（22 张，number 0-21，牌面显示罗马数字）
// ============================================

/** 大阿尔克那占星对应（韦特体系通行对应） */
const MAJOR_ASTROLOGY: Record<string, string> = {
  fool: '天王星',
  magician: '水星',
  'high-priestess': '月亮',
  empress: '金星',
  emperor: '白羊座',
  hierophant: '金牛座',
  lovers: '双子座',
  chariot: '巨蟹座',
  strength: '狮子座',
  hermit: '处女座',
  'wheel-of-fortune': '木星',
  justice: '天秤座',
  'hanged-man': '海王星',
  death: '天蝎座',
  temperance: '射手座',
  devil: '摩羯座',
  tower: '火星',
  star: '水瓶座',
  moon: '双鱼座',
  sun: '太阳',
  judgement: '冥王星',
  world: '土星',
};

/** 小阿尔克那花色 → 元素映射 */
const SUIT_ELEMENT: Record<TarotSuit, TarotElement> = {
  wands: '火',
  cups: '水',
  swords: '风',
  pentacles: '土',
};

const MAJOR: Array<Omit<TarotCard, 'arcana'>> = [
  { id: 'fool', name: '愚者', nameEn: 'The Fool', number: 0, glyph: 'fool', keywords: ['开始', '自由', '天真'], upright: '新的旅程即将开始，保持开放与好奇心，勇敢迈出第一步。', reversed: '冲动鲁莽、欠缺考虑，可能因天真而碰壁，行动前宜三思。' },
  { id: 'magician', name: '魔术师', nameEn: 'The Magician', number: 1, glyph: 'infinity', keywords: ['创造', '意志', '资源'], upright: '你已具备实现目标所需的全部资源与能力，主动行动即可化想法为现实。', reversed: '才能未被善用，或方向不清导致空转；警惕欺骗与自我怀疑。' },
  { id: 'high-priestess', name: '女祭司', nameEn: 'The High Priestess', number: 2, glyph: 'crescent', keywords: ['直觉', '潜意识', '神秘'], upright: '答案藏在内心深处，倾听直觉与梦境的提示，静待真相浮现。', reversed: '忽视了内心的声音，被表面信息迷惑；秘密可能被揭开。' },
  { id: 'empress', name: '女皇', nameEn: 'The Empress', number: 3, glyph: 'venus', keywords: ['丰饶', '滋养', '美'], upright: '丰收与滋养的时期，感情与创意蓬勃生长，适合经营关系与生活之美。', reversed: '过度依赖或付出失衡，创造力受阻；注意自我照顾。' },
  { id: 'emperor', name: '皇帝', nameEn: 'The Emperor', number: 4, glyph: 'crown', keywords: ['权威', '秩序', '掌控'], upright: '以规则与结构带来稳定，确立边界与计划，事情在掌控中推进。', reversed: '控制欲过强或纪律松散，权威受到挑战；僵化思维需要松动。' },
  { id: 'hierophant', name: '教皇', nameEn: 'The Hierophant', number: 5, glyph: 'keys', keywords: ['传统', '信仰', '指引'], upright: '遵循传统与既有体系会带来帮助，适合求教导师或加入群体学习。', reversed: '旧有规则正在束缚你，需要打破教条，走出自己的路。' },
  { id: 'lovers', name: '恋人', nameEn: 'The Lovers', number: 6, glyph: 'heart', keywords: ['爱', '选择', '契合'], upright: '真挚的情感与价值观的契合；面临重要选择时，遵从内心的真实。', reversed: '关系失衡或价值观冲突；选择上的犹豫让机会流失。' },
  { id: 'chariot', name: '战车', nameEn: 'The Chariot', number: 7, glyph: 'wheel', keywords: ['意志', '胜利', '前进'], upright: '以坚定意志驾驭方向，克服阻碍，胜利属于专注而自律的人。', reversed: '方向失控或动力分散，强攻不如先整合内在矛盾。' },
  { id: 'strength', name: '力量', nameEn: 'Strength', number: 8, glyph: 'lion', keywords: ['勇气', '耐心', '柔韧'], upright: '以柔克刚的力量，温柔而坚定足以驯服困难；对自己保持信心。', reversed: '自我怀疑削弱了你的力量，或以蛮力硬碰硬；需要恢复内在韧性。' },
  { id: 'hermit', name: '隐士', nameEn: 'The Hermit', number: 9, glyph: 'lantern', keywords: ['内省', '独处', '求索'], upright: '退一步独处与反思，内在的明灯会指引你找到答案。', reversed: '过度孤立或逃避社交；也可能因浮躁而听不进智慧。' },
  { id: 'wheel-of-fortune', name: '命运之轮', nameEn: 'Wheel of Fortune', number: 10, glyph: 'fortune-wheel', keywords: ['转折', '循环', '机遇'], upright: '命运之轮转动，迎来转机与新周期；顺势而为，好运在靠近。', reversed: '时运暂逆或抗拒改变；接受起伏，低谷亦是循环的一部分。' },
  { id: 'justice', name: '正义', nameEn: 'Justice', number: 11, glyph: 'scales', keywords: ['公正', '真相', '因果'], upright: '公平与真相将占上风，你的决定需基于事实与责任；种瓜得瓜。', reversed: '遭遇不公或逃避责任；信息失真时更要诚实面对自己。' },
  { id: 'hanged-man', name: '倒吊人', nameEn: 'The Hanged Man', number: 12, glyph: 'hanged', keywords: ['暂停', '换位', '放下'], upright: '主动暂停，换个角度看问题；暂时的放下是为更大的获得。', reversed: '无谓的牺牲或僵持拖延；执念让你看不见新的出口。' },
  { id: 'death', name: '死神', nameEn: 'Death', number: 13, glyph: 'rose', keywords: ['结束', '蜕变', '重生'], upright: '一个阶段的彻底结束，为新生腾出空间；接受蜕变而非抗拒。', reversed: '抗拒必要的结束，让旧事物拖住脚步；改变虽难但不可避免。' },
  { id: 'temperance', name: '节制', nameEn: 'Temperance', number: 14, glyph: 'two-cups', keywords: ['平衡', '调和', '耐心'], upright: '以耐心与节制调和矛盾，中庸之道带来长久的和谐。', reversed: '失衡与极端，急于求成；需要重新校准节奏。' },
  { id: 'devil', name: '恶魔', nameEn: 'The Devil', number: 15, glyph: 'pentagram', keywords: ['束缚', '欲望', '执念'], upright: '看见束缚你的欲望、依赖或恐惧——锁链其实是松的，你有力量挣脱。', reversed: '正在挣脱桎梏、觉察上瘾模式；重获自由的契机出现。' },
  { id: 'tower', name: '高塔', nameEn: 'The Tower', number: 16, glyph: 'lightning', keywords: ['突变', '崩塌', '觉醒'], upright: '旧有结构突然崩塌，虽震撼却扫清了虚假根基；危机即转机。', reversed: '在勉强维持岌岌可危的局面；主动改变胜过被动崩塌。' },
  { id: 'star', name: '星星', nameEn: 'The Star', number: 17, glyph: 'eight-star', keywords: ['希望', '疗愈', '灵感'], upright: '黑暗之后星光出现，希望、疗愈与灵感正在注入你的生活。', reversed: '暂时失去信心或感到迷茫；重新连接内心的信念。' },
  { id: 'moon', name: '月亮', nameEn: 'The Moon', number: 18, glyph: 'moon', keywords: ['迷雾', '潜意识', '不安'], upright: '前方笼罩迷雾，直觉与不安并存；不要急于下结论，等潮水退去。', reversed: '迷雾正在散去，真相渐明；或恐惧被放大，需要分辨虚实。' },
  { id: 'sun', name: '太阳', nameEn: 'The Sun', number: 19, glyph: 'sun', keywords: ['喜悦', '成功', '活力'], upright: '阳光普照，成功、喜悦与生命力满溢；大胆展现自己。', reversed: '短暂的阴云遮住太阳，快乐打了折扣；调整期待，晴天会回来。' },
  { id: 'judgement', name: '审判', nameEn: 'Judgement', number: 20, glyph: 'trumpet', keywords: ['觉醒', '召唤', '重生'], upright: '听见内心的召唤，过去的努力迎来结算；原谅与释然让你重生。', reversed: '自我批判过重或逃避内心的召唤；别让过去定义未来。' },
  { id: 'world', name: '世界', nameEn: 'The World', number: 21, glyph: 'wreath', keywords: ['圆满', '完成', '整合'], upright: '一个周期圆满完成，整合所有经验，庆祝成就并准备新的旅程。', reversed: '距离圆满只差一步，或有未完成的功课；补上缺口再出发。' },
];

// ============================================
// 小阿尔克那（56 张 = 4 花色 × 14）
// ============================================

const SUIT_NAME: Record<TarotSuit, string> = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
};

const NUMBER_NAME = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const;

const COURT_NAME: Record<TarotCourt, string> = {
  page: '侍从',
  knight: '骑士',
  queen: '王后',
  king: '国王',
};

const COURT_EN: Record<TarotCourt, string> = {
  page: 'Page',
  knight: 'Knight',
  queen: 'Queen',
  king: 'King',
};

const SUIT_EN: Record<TarotSuit, string> = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
};

/** 数字牌英文序数（Ace, Two ... Ten） */
const NUMBER_EN = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'] as const;

type MinorDef = [keywords: string[], upright: string, reversed: string];

/** 权杖（火）：行动、激情、事业 */
const WANDS: MinorDef[] = [
  [['灵感', '新起点', '行动'], '新的灵感与热情点燃，抓住火种立即行动。', '热情受阻或方向未明，别急着开始，先找到真正的动力。'],
  [['规划', '远见', '抉择'], '站在起点眺望远方，是时候制定计划、放眼更大的世界。', '计划犹豫不前，或过度保守；害怕离开舒适区。'],
  [['拓展', '进展', '远见'], '初步成果已现，事业向外拓展，保持远见等待回报。', '拓展受阻或回报延迟，检视计划是否脱节。'],
  [['庆祝', '稳定', '归属'], '值得庆祝的里程碑，家庭与团队和谐，享受安稳的喜悦。', '庆祝延迟或内部小摩擦，安稳感暂时缺失。'],
  [['竞争', '冲突', '磨合'], '多方角力与良性竞争，在碰撞中磨合出更好的方案。', '内耗升级或无谓争执，避开消耗性的冲突。'],
  [['胜利', '认可', '自信'], '努力获得公开认可，胜利属于你，保持谦逊继续前行。', '认可延迟或信心受挫，别让外界评价左右自己。'],
  [['坚守', '捍卫', '立场'], '守住阵地，面对质疑坚定立场，你占上风。', '防御过度或立场动摇，选择值得的战场。'],
  [['迅速', '进展', '消息'], '事情快速推进，好消息在路上，顺势而为。', '延迟与卡顿，欲速则不达，检查阻碍所在。'],
  [['韧性', '戒备', '坚持'], '历经考验仍屹立不倒，最后一程坚持住。', '疲惫与过度戒备，承认脆弱也是一种力量。'],
  [['负担', '责任', '压力'], '责任满载，学会授权与取舍，别独自扛下所有。', '负担过重濒临崩溃，卸下不属于你的包袱。'],
];

/** 圣杯（水）：情感、关系、直觉 */
const CUPS: MinorDef[] = [
  [['新情感', '爱', '喜悦'], '新的情感开始，心被爱与喜悦充满。', '情感受阻或自我封闭，先疗愈自己再爱人。'],
  [['契合', '伙伴', '吸引'], '两情相悦或志同道合的合作，平等而真诚的连接。', '关系失衡或误解，重新对齐彼此的期待。'],
  [['欢聚', '友谊', '庆祝'], '与朋友共享的欢乐时光，庆祝与联结。', '社交过度或圈子杂音，留出独处空间。'],
  [['倦怠', '内省', '契机'], '对现状提不起劲；静心中，新的机会正悄悄递来。', '从倦怠中苏醒，开始注意到身边的机会。'],
  [['失落', '遗憾', '悲伤'], '为打翻的杯子悲伤时，别忘了身后还有满杯。', '走出悲伤，接受并重建，前方有支撑你的人。'],
  [['怀旧', '童真', '馈赠'], '温暖的回忆与旧友重逢，纯真带来疗愈。', '沉溺过去或需要放下旧模式，向前看。'],
  [['幻想', '选择', '迷思'], '选择太多令人迷醉，分清幻想与真实再下注。', '从幻想中清醒，聚焦真正想要的那一个。'],
  [['离开', '追寻', '转身'], '放下不再滋养你的，转身去追寻更深层的意义。', '想走却走不了，或逃避必要的告别。'],
  [['满足', '心愿', '幸福'], '心愿达成，享受丰盛的满足感。', '满足背后有点空虚，物质之外寻找意义。'],
  [['圆满', '家庭', '和谐'], '情感圆满，家庭与关系和谐美满。', '表面和谐下的裂缝，真诚沟通修复连接。'],
];

/** 宝剑（风）：思想、沟通、真相 */
const SWORDS: MinorDef[] = [
  [['真相', '清晰', '突破'], '思维清明，一剑劈开迷雾，说出真相。', '思绪混乱或信息失真，暂缓下结论。'],
  [['僵局', '抉择', '回避'], '两难之中僵持，摘下眼罩才能做出选择。', '僵局松动，信息逐渐清晰，接近决定时刻。'],
  [['心碎', '悲伤', '真相'], '心痛的真相，允许悲伤流过，它会带走淤积。', '伤痛正在愈合，或不愿面对的隐痛需要释放。'],
  [['休息', '恢复', '沉淀'], '按下暂停键，休息与沉淀是为了更好地出发。', '休息不足或静极思动，听从身体的信号。'],
  [['争执', '输赢', '代价'], '赢了争论输了关系，审视这场胜利的代价。', '放下争执，和解与翻篇的时机到了。'],
  [['过渡', '离开', '疗愈'], '渡过难关的过渡期，水面渐平，慢慢疗愈。', '过渡受阻或背负旧行李，轻装才能前行。'],
  [['策略', '机智', '独断'], '用策略而非蛮力取胜；也要检视是否有自欺。', '小手段被看穿，或良心不安，回到正途。'],
  [['束缚', '设限', '困局'], '困住你的多是自己的念头，松绑的钥匙就在手中。', '开始挣脱自我设限，看见出口。'],
  [['焦虑', '失眠', '担忧'], '深夜的焦虑被放大，多数担忧不会发生；求助并不可耻。', '焦虑逐渐退潮，或已到达需要向外求助的临界点。'],
  [['终结', '谷底', '黎明前'], '触底即反弹，最坏的已经过去，黎明不远。', '拒绝接受结局会延长痛苦；也可能正在缓慢复苏。'],
];

/** 星币（土）：物质、工作、安全 */
const PENTACLES: MinorDef[] = [
  [['新机会', '务实', '播种'], '务实的新机会出现，播下种子，稳稳开始。', '机会暂缓或基础不实，先夯实根基。'],
  [['平衡', '灵活', '多任务'], '在多项事务间灵活腾挪，保持弹性就能玩转。', '顾此失彼，需要减法与优先级。'],
  [['协作', '专业', '打磨'], '专业协作出成果，你的技艺被看见。', '协作不畅或标准不一，对齐目标再动手。'],
  [['守成', '安全', '掌控'], '守住既有成果无可厚非，但别让安全感变成枷锁。', '学会松手与分享，流动带来丰盛。'],
  [['困顿', '匮乏', '求助'], '物质或精神的寒冬，别忘了不远处就有灯火与援手。', '寒冬将尽，接受帮助，情况正在好转。'],
  [['给予', '分享', '互助'], '施与受的良性循环，慷慨让资源流动。', '付出与回报失衡，警惕不对等的关系。'],
  [['耕耘', '评估', '耐心'], '驻足评估耕耘成果，耐心等待收获季。', '对回报的焦虑，检视投入是否用对了地方。'],
  [['精进', '专注', '匠人'], '专注打磨技艺，日拱一卒，精进之路没有捷径。', '重复劳动缺少成长，或为赶工牺牲质量。'],
  [['丰盛', '独立', '自足'], '自力更生的丰盛，享受你一手打造的果实。', '丰盛中的孤独，或过度依赖外在肯定。'],
  [['富足', '传承', '家业'], '物质与家庭的双重富足，长久的基业与传承。', '家业或财务的隐忧，重检长期结构。'],
];

/** 宫廷牌释义（按花色族群共用等级语义 + 花色气质） */
const COURT_DEFS: Record<TarotSuit, Record<TarotCourt, MinorDef>> = {
  wands: {
    page: [['探索', '热情', '新消息'], '带着好奇探索新领域，热情是你最好的老师。', '三分钟热度或方向涣散，先聚焦再出发。'],
    knight: [['冲劲', '冒险', '行动'], '全速前进的冲劲，适合大胆行动与冒险。', '冲动鲁莽或虎头蛇尾，给热情装上方向盘。'],
    queen: [['自信', '魅力', '热忱'], '自信而有感染力，用你的热忱照亮团队。', '自信透支或嫉妒心起，回到内在的力量。'],
    king: [['领导', '愿景', '魄力'], '以愿景带领他人，果断而有格局的行动派。', '专断或好高骛远，愿景需要落地步骤。'],
  },
  cups: {
    page: [['敏感', '创意', '萌芽'], '情感或创意的萌芽，保持敏感与开放。', '情绪化或创意受阻，给感受一个出口。'],
    knight: [['浪漫', '追求', '理想'], '浪漫的追求者，跟随心意优雅前行。', '理想化或情绪摇摆，把浪漫落到行动。'],
    queen: [['共情', '温柔', '直觉'], '温柔而有同理心，照顾好自己也照亮他人。', '情绪内耗或过度共情，先把自己的杯子装满。'],
    king: [['成熟', '包容', '情绪智慧'], '情绪成熟而稳定，以包容与智慧处理关系。', '压抑情绪或被情绪操控，找回内在平衡。'],
  },
  swords: {
    page: [['好奇', '求知', '警觉'], '求知欲旺盛，保持好奇与审慎，信息会带来机会。', '消息混乱或言语轻率，三思而后言。'],
    knight: [['果决', '直率', '迅捷'], '思维与行动一样快，直取目标。', '言语如刀或行动欠考虑，慢一点更准。'],
    queen: [['睿智', '独立', '明察'], '头脑清明、洞察入微，温柔的坚定最有力。', '言辞苛刻或情感隔离，理性之外留一点温度。'],
    king: [['公正', '权威', '理智'], '以理智与原则做决定，公正带来信服。', '冷酷或滥用权威，让理性服务于善意。'],
  },
  pentacles: {
    page: [['学习', '务实', '起步'], '脚踏实地学习新技能，小步积累走得远。', '学习计划搁浅或好高骛远，回到基本功。'],
    knight: [['稳健', '可靠', '坚持'], '稳健可靠的执行者，慢就是快。', '陷入僵化或拖延，给计划留一点弹性。'],
    queen: [['务实', '滋养', '丰盛'], '务实而温暖，把生活经营得丰盛有序。', '为琐事所累或忽略自己，重新排序生活重心。'],
    king: [['成就', '稳健', '富足'], '事业与财富的稳健掌舵者，长期主义的胜利。', '过度看重物质或保守僵化，财富之外还有价值。'],
  },
};

/** 组装一个花色（10 数字牌 + 4 宫廷牌） */
function buildSuit(suit: TarotSuit, numbers: MinorDef[]): TarotCard[] {
  const element = SUIT_ELEMENT[suit];
  const cards: TarotCard[] = numbers.map(([keywords, upright, reversed], i) => ({
    id: `${suit}-${String(i + 1).padStart(2, '0')}`,
    name: `${SUIT_NAME[suit]}${NUMBER_NAME[i]}`,
    nameEn: `${NUMBER_EN[i]} of ${SUIT_EN[suit]}`,
    arcana: 'minor',
    suit,
    number: i + 1,
    glyph: suit,
    keywords,
    upright,
    reversed,
    element,
  }));

  const courts: TarotCourt[] = ['page', 'knight', 'queen', 'king'];
  courts.forEach((court, i) => {
    const [keywords, upright, reversed] = COURT_DEFS[suit][court];
    cards.push({
      id: `${suit}-${court}`,
      name: `${SUIT_NAME[suit]}${COURT_NAME[court]}`,
      nameEn: `${COURT_EN[court]} of ${SUIT_EN[suit]}`,
      arcana: 'minor',
      suit,
      number: 11 + i,
      court,
      glyph: suit,
      keywords,
      upright,
      reversed,
      element,
    });
  });

  return cards;
}

/** 完整 78 张牌 */
export const tarotDeck: TarotCard[] = [
  ...MAJOR.map((card) => ({
    ...card,
    arcana: 'major' as const,
    astrology: MAJOR_ASTROLOGY[card.id],
  })),
  ...buildSuit('wands', WANDS),
  ...buildSuit('cups', CUPS),
  ...buildSuit('swords', SWORDS),
  ...buildSuit('pentacles', PENTACLES),
];

// ============================================
// 牌阵
// ============================================

export const tarotSpreads: TarotSpread[] = [
  {
    type: 'single',
    name: '每日指引',
    description: '抽取一张牌，获得此刻最需要听到的讯息',
    positions: ['指引'],
  },
  {
    type: 'three',
    name: '过去 · 现在 · 未来',
    description: '三张牌看一件事情的来龙去脉与走向',
    positions: ['过去', '现在', '未来'],
  },
];

export function getSpread(type: TarotSpread['type']): TarotSpread {
  const spread = tarotSpreads.find((s) => s.type === type);
  if (!spread) {throw new Error(`未知牌阵: ${type}`);}
  return spread;
}
