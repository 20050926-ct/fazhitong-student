/**
 * 法考客观题演示题库（自编，用于离线/无 API 时展示）。
 * 与「法考服务」页六个科目名称严格一致；每科约 20 题，便于本机 JSON「数据库」同步。
 */

export type LegalExamQuestionRecord = {
  id: string;
  subject: string;
  stem: string;
  options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
  answerKey: 'A' | 'B' | 'C' | 'D';
  analysis: string;
  sourceTitle: string;
  sourceUrl: string;
  scrapedAt?: string;
};

const SOURCE = {
  sourceTitle: '法考综合能力训练（演示题库）',
  sourceUrl: 'https://www.12348.gov.cn/#/publicies/sfks/sfks'
} as const;

const KEYS = ['A', 'B', 'C', 'D'] as const;

function makeQ(
  subject: string,
  idx: number,
  stem: string,
  answerKey: 'A' | 'B' | 'C' | 'D',
  texts: [string, string, string, string],
  analysis: string
): LegalExamQuestionRecord {
  const options = KEYS.map((key, i) => ({ key, text: texts[i] }));
  return {
    id: `${subject.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')}-${String(idx + 1).padStart(2, '0')}`,
    subject,
    stem,
    options,
    answerKey,
    analysis,
    ...SOURCE,
    scrapedAt: new Date().toISOString()
  };
}

const WRONG = {
  rumor: '仅凭网络传言或非官方“内部消息”作为主要依据',
  oral: '仅保留口头约定，不固定书面或电子证据',
  delay: '忽视法定期限与程序要求，拖延至逾期后再补救',
  agent: '将关键资格判断与账号密码交由无资质第三方代办'
} as const;

function civilQuestions(): LegalExamQuestionRecord[] {
  const topics = [
    '不动产登记与物权变动',
    '善意取得构成要件',
    '无权代理与表见代理',
    '诉讼时效起算与中断',
    '留置权成立条件',
    '格式条款无效情形',
    '违约责任与损害赔偿范围',
    '买卖合同风险负担',
    '租赁合同解除与腾退',
    '侵权责任归责原则',
    '监护人责任',
    '高空抛物规则',
    '人格权侵害救济',
    '不当得利返还范围',
    '无因管理必要费用',
    '共有物分割',
    '抵押权实现顺序',
    '保证方式约定不明',
    '债权让与通知',
    '代位权行使条件'
  ];
  return topics.map((t, i) => {
    const cycle = i % 4;
    const texts: [string, string, string, string] =
      cycle === 0
        ? [
            '应以法律规定与合同约定为基础，结合交易习惯作体系解释',
            WRONG.rumor,
            WRONG.oral,
            WRONG.delay
          ]
        : cycle === 1
          ? [WRONG.agent, '应优先核查权利外观、合理信赖与可归责性等要件', WRONG.oral, WRONG.delay]
          : cycle === 2
            ? [WRONG.rumor, WRONG.oral, '应注意构成要件、法律效果与举证责任分配', WRONG.delay]
            : [WRONG.rumor, WRONG.oral, WRONG.delay, '应结合个案证据，避免以单一事实推定全部法律效果'];
    const answerKey = (['A', 'B', 'C', 'D'] as const)[cycle];
    return makeQ(
      '民法客观题',
      i,
      `关于「${t}」，下列说法更符合民法基本原理的是？`,
      answerKey,
      texts,
      `本题考查${t}。解题时应抓住构成要件、当事人意思表示、善意保护与交易安全之间的平衡，并结合证据规则判断。`
    );
  });
}

function criminalQuestions(): LegalExamQuestionRecord[] {
  const topics = [
    '罪刑法定与类推禁止',
    '犯罪故意与过失区分',
    '正当防卫与防卫过当',
    '犯罪未遂与不能犯',
    '共同正犯与帮助犯',
    '累犯成立条件',
    '自首与坦白',
    '数罪并罚规则',
    '缓刑适用条件',
    '假释撤销情形',
    '危害公共安全类犯罪',
    '侵犯财产罪界限',
    '诈骗罪与民事欺诈',
    '盗窃罪既遂标准',
    '抢劫罪加重情节',
    '贪污罪主体身份',
    '受贿罪“为他人谋取利益”',
    '渎职罪因果关系',
    '刑事证据排除规则',
    '上诉不加刑'
  ];
  return topics.map((t, i) => {
    const cycle = i % 4;
    const texts: [string, string, string, string] =
      cycle === 0
        ? [
            '应以刑法条文与司法解释为依据，坚持主客观相统一',
            '可依据道德评价替代规范判断直接入罪',
            WRONG.oral,
            WRONG.delay
          ]
        : cycle === 1
          ? [WRONG.rumor, '应区分违法性、有责性与量刑情节，避免单一标签化认定', WRONG.oral, WRONG.delay]
          : cycle === 2
            ? [WRONG.rumor, WRONG.oral, '应注意构成要件该当、违法性与罪责的阶层判断', WRONG.agent]
            : [WRONG.rumor, WRONG.oral, WRONG.delay, '应综合事实、证据与程序，保障辩护与质证权利'];
    const answerKey = (['A', 'B', 'C', 'D'] as const)[cycle];
    return makeQ(
      '刑法客观题',
      i,
      `关于「${t}」，下列表述更准确的是？`,
      answerKey,
      texts,
      `本题考查${t}。刑法适用应坚持罪刑法定，注意条文竞合、法益衡量与量刑规范化。`
    );
  });
}

function adminQuestions(): LegalExamQuestionRecord[] {
  const topics = [
    '具体行政行为与抽象行政行为',
    '行政复议受案范围',
    '行政诉讼原告资格',
    '行政诉讼起诉期限',
    '举证责任分配',
    '规范性文件附带审查',
    '行政处罚听证',
    '行政强制措施与强制执行',
    '政府信息公开范围',
    '国家赔偿归责原则',
    '行政许可撤销与注销',
    '行政协议争议解决',
    '行政复议与诉讼衔接',
    '地域管辖与级别管辖',
    '判决类型与适用条件',
    '行政机关负责人出庭',
    '程序轻微违法的处理',
    '复议改变后被告确定',
    '行政补偿与赔偿区分',
    '信访与法定救济关系'
  ];
  return topics.map((t, i) => {
    const cycle = i % 4;
    const texts: [string, string, string, string] =
      cycle === 0
        ? [
            '应依据行政实体法与行政诉讼法，关注职权、程序与证据',
            WRONG.rumor,
            WRONG.oral,
            WRONG.delay
          ]
        : cycle === 1
          ? [WRONG.agent, '应在法定救济渠道内主张权利，并注意起诉期限与复议前置', WRONG.oral, WRONG.delay]
          : cycle === 2
            ? [WRONG.rumor, WRONG.oral, '应区分合法性审查与合理性审查的边界', WRONG.delay]
            : [WRONG.rumor, WRONG.oral, WRONG.delay, '应结合行政行为效力、证据与程序正当性综合判断'];
    const answerKey = (['A', 'B', 'C', 'D'] as const)[cycle];
    return makeQ(
      '行政法与行政诉讼法',
      i,
      `关于「${t}」，下列说法更妥当的是？`,
      answerKey,
      texts,
      `本题考查${t}。行政争议处理应紧扣职权依据、事实证据、法定程序与救济期限。`
    );
  });
}

function commercialQuestions(): LegalExamQuestionRecord[] {
  const topics = [
    '公司人格否认适用',
    '股东出资瑕疵责任',
    '董事忠实与勤勉义务',
    '公司决议效力类型',
    '破产债权申报',
    '票据无因性及其例外',
    '保险法近因原则',
    '证券虚假陈述责任',
    '反垄断协议认定',
    '不正当竞争混淆行为',
    '消费者权益七日无理由',
    '产品质量责任主体',
    '劳动合同解除限制',
    '经济补偿金计算',
    '劳务派遣岗位限制',
    '商业秘密构成要件',
    '垄断协议宽大制度',
    '企业所得税税前扣除',
    '增值税纳税义务时间',
    '金融监管与合规边界'
  ];
  return topics.map((t, i) => {
    const cycle = i % 4;
    const texts: [string, string, string, string] =
      cycle === 0
        ? [
            '应结合商法强制性规范与交易安全，审查主体资格与公示外观',
            WRONG.rumor,
            WRONG.oral,
            WRONG.delay
          ]
        : cycle === 1
          ? [WRONG.agent, '应区分公司内部关系与外部善意相对人保护', WRONG.oral, WRONG.delay]
          : cycle === 2
            ? [WRONG.rumor, WRONG.oral, '应注意经济法监管目标与私法自治的协调', WRONG.delay]
            : [WRONG.rumor, WRONG.oral, WRONG.delay, '应关注信息披露、公平交易与投资者保护要求'];
    const answerKey = (['A', 'B', 'C', 'D'] as const)[cycle];
    return makeQ(
      '商法与经济法',
      i,
      `关于「${t}」，下列理解更恰当的是？`,
      answerKey,
      texts,
      `本题考查${t}。商经类题目常涉强行性规定、公示公信与监管合规，应体系化把握。`
    );
  });
}

function subjectiveQuestions(): LegalExamQuestionRecord[] {
  const topics = [
    '请求权基础分析方法',
    '事实与法律争点整理',
    '共同诉讼与第三人',
    '证据三性与证明力',
    '自认与拟制自认',
    '举证妨碍法律后果',
    '鉴定意见审查要点',
    '调解与和解笔录效力',
    '既判力客观范围',
    '再审事由识别',
    '执行异议之诉',
    '保全错误赔偿',
    '仲裁协议效力',
    '涉外民事关系法律适用',
    '案例题答题结构',
    '结论先行与理由展开',
    '法条引用规范',
    '多级标题与条理分点',
    '时间线制作技巧',
    '责任竞合时选择路径'
  ];
  return topics.map((t, i) => {
    const cycle = i % 4;
    const texts: [string, string, string, string] =
      cycle === 0
        ? [
            '应先锁定法律关系与请求权基础，再组织事实与规范涵摄',
            '可直接凭直觉下结论，不必展示推理链条',
            WRONG.oral,
            WRONG.delay
          ]
        : cycle === 1
          ? [WRONG.rumor, '应采用“结论—理由—法条/判例”结构，避免跳跃论证', WRONG.oral, WRONG.delay]
          : cycle === 2
            ? [WRONG.rumor, WRONG.oral, '应把争点拆解为可证明的子事实并匹配证据', WRONG.agent]
            : [WRONG.rumor, WRONG.oral, WRONG.delay, '应在答题中体现程序事项对实体判断的影响'];
    const answerKey = (['A', 'B', 'C', 'D'] as const)[cycle];
    return makeQ(
      '主观题案例训练',
      i,
      `在主观题训练中，关于「${t}」，下列做法更有效的是？`,
      answerKey,
      texts,
      `本题侧重${t}。主观题强调结构、争点与涵摄过程，请结合官方阅卷评分习惯练习。`
    );
  });
}

function pastPaperQuestions(): LegalExamQuestionRecord[] {
  const topics = [
    '历年客观题时间分配',
    '多选题少选得分规则',
    '考场设备故障应对',
    '成绩复核申请要点',
    '主观题选做题策略',
    '法条索引熟练度训练',
    '模拟机考环境适应',
    '错题本建立方法',
    '高频考点滚动复习',
    '考前一周作息安排',
    '心理焦虑调节',
    '考场纪律与违纪后果',
    '答题卡填涂规范',
    '卷面整洁与可读性',
    '开卷法规使用技巧',
    '跨部门法综合题',
    '新修法律追踪',
    '指导案例阅读方法',
    '命题趋势与重者恒重',
    '考后资格申请衔接'
  ];
  return topics.map((t, i) => {
    const cycle = i % 4;
    const texts: [string, string, string, string] =
      cycle === 0
        ? [
            '应以真题与官方样题为纲，复盘错因并形成可执行改进清单',
            WRONG.rumor,
            WRONG.oral,
            WRONG.delay
          ]
        : cycle === 1
          ? [WRONG.agent, '应模拟真实时限与机考环境，训练节奏与取舍策略', WRONG.oral, WRONG.delay]
          : cycle === 2
            ? [WRONG.rumor, WRONG.oral, '应关注评分规则与答题规范，减少技术性失分', WRONG.delay]
            : [WRONG.rumor, WRONG.oral, WRONG.delay, '应结合当年大纲与公告调整复习重点'];
    const answerKey = (['A', 'B', 'C', 'D'] as const)[cycle];
    return makeQ(
      '历年真题模拟',
      i,
      `关于「${t}」，下列备考策略更稳妥的是？`,
      answerKey,
      texts,
      `本题考查${t}。真题模拟重在发现薄弱环节并固化应试策略，而非单纯刷题量。`
    );
  });
}

/** 全量演示题库：六科目 × 各 20 题 ≈ 120 题 */
export const LEGAL_EXAM_QUESTIONS_BANK: LegalExamQuestionRecord[] = [
  ...civilQuestions(),
  ...criminalQuestions(),
  ...adminQuestions(),
  ...commercialQuestions(),
  ...subjectiveQuestions(),
  ...pastPaperQuestions()
];

export function countQuestionsBySubject(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const q of LEGAL_EXAM_QUESTIONS_BANK) {
    m[q.subject] = (m[q.subject] || 0) + 1;
  }
  return m;
}
