import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type TemplateField = {
  key: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
};

type ContractTemplate = {
  id: string;
  name: string;
  contractTitle: string;
  scene: string;
  caseReference: string;
  keywordHints: string[];
  fields: TemplateField[];
  buildSections: (values: Record<string, string>) => string[];
};

function getValue(values: Record<string, string>, key: string, fallback: string) {
  const v = values[key];
  return v && v.trim() ? v.trim() : fallback;
}

const STUDENT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'rent-deposit',
    name: '校园租房押金保障模板',
    contractTitle: '校园房屋租赁及押金保障协议',
    scene: '适用于大学生校外租房，重点规避押金不退、提前退租扯皮等问题。',
    caseReference:
      '案例原型：学生退租后，房东以“自然损耗”长期扣押押金。通过明确退房验收标准和押金返还期限，可显著降低争议。',
    keywordHints: ['房屋地址', '租期', '月租', '押金', '退押时间', '违约责任'],
    fields: [
      { key: 'partyA', label: '甲方（出租人）', placeholder: '例：张某' },
      { key: 'partyB', label: '乙方（承租学生）', placeholder: '例：李某（XX大学）' },
      { key: 'houseAddress', label: '房屋地址', placeholder: '例：XX市XX区XX路XX号' },
      { key: 'leasePeriod', label: '租赁期限', placeholder: '例：2026.05.01-2027.04.30' },
      { key: 'monthlyRent', label: '月租金', placeholder: '例：2800元/月' },
      { key: 'depositAmount', label: '押金金额', placeholder: '例：2800元' },
      { key: 'payMethod', label: '租金支付方式', placeholder: '例：每月5日前转账支付' },
      { key: 'depositReturnDays', label: '押金返还期限', placeholder: '例：退租后3个工作日内' },
      { key: 'disputeCourt', label: '争议解决法院', placeholder: '例：房屋所在地人民法院' },
    ],
    buildSections: (values) => {
      const partyA = getValue(values, 'partyA', '甲方（请填写）');
      const partyB = getValue(values, 'partyB', '乙方（请填写）');
      const houseAddress = getValue(values, 'houseAddress', '租赁房屋地址（请填写）');
      const leasePeriod = getValue(values, 'leasePeriod', '租赁期限（请填写）');
      const monthlyRent = getValue(values, 'monthlyRent', '月租金（请填写）');
      const depositAmount = getValue(values, 'depositAmount', '押金金额（请填写）');
      const payMethod = getValue(values, 'payMethod', '租金支付方式（请填写）');
      const depositReturnDays = getValue(values, 'depositReturnDays', '退租后返还期限（请填写）');
      const disputeCourt = getValue(values, 'disputeCourt', '争议管辖法院（请填写）');

      return [
        `甲方：${partyA}\n乙方：${partyB}`,
        `第一条 租赁标的\n1.1 甲方将位于${houseAddress}的房屋出租给乙方使用。\n1.2 租赁期限为：${leasePeriod}。`,
        `第二条 租金及押金\n2.1 月租金标准：${monthlyRent}。\n2.2 押金金额：${depositAmount}，由乙方在签约时支付。\n2.3 租金支付方式：${payMethod}。`,
        `第三条 押金返还与验收\n3.1 双方在退租当日进行现场验收并形成书面验收记录。\n3.2 如无乙方故意损坏或费用欠缴，甲方应在${depositReturnDays}向乙方一次性返还押金。\n3.3 自然损耗、正常使用痕迹不得作为拒绝退还押金的理由。`,
        '第四条 双方权利义务\n4.1 甲方应保证出租房屋具备基本居住条件。\n4.2 乙方应按时缴纳租金并合理使用房屋设施。\n4.3 双方应保留转账凭证、聊天记录、验收照片等证据材料。',
        '第五条 违约责任\n5.1 甲方无正当理由逾期返还押金的，应按逾期天数承担违约责任。\n5.2 乙方逾期支付租金或擅自转租的，甲方有权依法追究责任。',
        `第六条 争议解决\n6.1 因本协议产生争议，双方应先协商；协商不成，向${disputeCourt}提起诉讼。`,
      ];
    },
  },
  {
    id: 'internship',
    name: '实习岗位与报酬约定模板',
    contractTitle: '学生实习协议（岗位职责与报酬版）',
    scene: '适用于大学生到企业实习，重点写清岗位、时间、补贴、加班与安全责任。',
    caseReference:
      '案例原型：学生入岗后岗位内容与承诺不一致，且补贴发放被拖延。通过书面化岗位范围和发放节点，可避免争议。',
    keywordHints: ['实习岗位', '实习期限', '补贴标准', '发放时间', '工作时长', '保险责任'],
    fields: [
      { key: 'partyA', label: '甲方（实习单位）', placeholder: '例：XX科技有限公司' },
      { key: 'partyB', label: '乙方（实习学生）', placeholder: '例：王某（XX大学）' },
      { key: 'school', label: '学校信息', placeholder: '例：XX大学法学院', defaultValue: '' },
      { key: 'position', label: '实习岗位', placeholder: '例：法务助理' },
      { key: 'period', label: '实习期限', placeholder: '例：2026.07.01-2026.09.30' },
      { key: 'allowance', label: '实习补贴', placeholder: '例：150元/天' },
      { key: 'payDate', label: '补贴发放时间', placeholder: '例：次月10日前' },
      { key: 'workHours', label: '工作时间', placeholder: '例：周一至周五 9:00-18:00' },
      { key: 'insurance', label: '保险与安全责任', placeholder: '例：甲方为乙方购买商业意外险' },
      { key: 'disputeCourt', label: '争议解决法院', placeholder: '例：甲方所在地人民法院' },
    ],
    buildSections: (values) => {
      const partyA = getValue(values, 'partyA', '甲方（请填写）');
      const partyB = getValue(values, 'partyB', '乙方（请填写）');
      const school = getValue(values, 'school', '所在学校（请填写）');
      const position = getValue(values, 'position', '实习岗位（请填写）');
      const period = getValue(values, 'period', '实习期限（请填写）');
      const allowance = getValue(values, 'allowance', '实习补贴（请填写）');
      const payDate = getValue(values, 'payDate', '发放时间（请填写）');
      const workHours = getValue(values, 'workHours', '工作时间（请填写）');
      const insurance = getValue(values, 'insurance', '保险责任（请填写）');
      const disputeCourt = getValue(values, 'disputeCourt', '争议管辖法院（请填写）');

      return [
        `甲方：${partyA}\n乙方：${partyB}\n乙方学校：${school}`,
        `第一条 实习安排\n1.1 乙方在甲方岗位为：${position}。\n1.2 实习期限：${period}。\n1.3 甲方不得擅自将乙方长期安排至与岗位明显无关的工作内容。`,
        `第二条 补贴与费用\n2.1 实习补贴标准：${allowance}。\n2.2 发放时间：${payDate}。\n2.3 如涉及加班、差旅等费用，双方另行书面确认。`,
        `第三条 工作时间与管理\n3.1 工作时间安排：${workHours}。\n3.2 甲方应为乙方提供必要的实习指导与安全培训。\n3.3 乙方应遵守甲方合理规章制度及保密要求。`,
        `第四条 安全与保障\n4.1 保险及安全责任：${insurance}。\n4.2 如发生实习安全事故，双方应及时通知学校并依法处理。`,
        '第五条 违约责任\n5.1 甲方无故拖欠补贴的，应及时补发并承担相应违约责任。\n5.2 乙方无故严重违反实习纪律的，甲方可终止实习并书面说明理由。',
        `第六条 争议解决\n6.1 本协议发生争议，双方应先协商解决；协商不成，向${disputeCourt}提起诉讼。`,
      ];
    },
  },
  {
    id: 'part-time',
    name: '学生兼职薪酬保障模板',
    contractTitle: '学生兼职服务协议（薪酬保障版）',
    scene: '适用于大学生短期兼职，重点明确工作内容、计薪方式、结算节点与证据留存。',
    caseReference:
      '案例原型：学生完成兼职后，商家以“活动效果不达标”为由拒绝结算。通过约定验收标准和结算时间，可提升维权成功率。',
    keywordHints: ['兼职内容', '工作地点', '结算标准', '结算日期', '验收方式', '违约处理'],
    fields: [
      { key: 'partyA', label: '甲方（用工方）', placeholder: '例：XX商贸公司' },
      { key: 'partyB', label: '乙方（兼职学生）', placeholder: '例：赵某（XX大学）' },
      { key: 'jobContent', label: '兼职内容', placeholder: '例：线下活动协助/物料发放' },
      { key: 'jobPlace', label: '工作地点', placeholder: '例：XX市XX商圈' },
      { key: 'jobPeriod', label: '工作周期', placeholder: '例：2026.05.10-2026.05.20' },
      { key: 'salaryRule', label: '薪酬标准', placeholder: '例：150元/天，共10天' },
      { key: 'settlementDate', label: '结算日期', placeholder: '例：活动结束后3个工作日内' },
      { key: 'acceptanceRule', label: '验收标准', placeholder: '例：以签到表+现场照片为准' },
      { key: 'disputeCourt', label: '争议解决法院', placeholder: '例：合同履行地人民法院' },
    ],
    buildSections: (values) => {
      const partyA = getValue(values, 'partyA', '甲方（请填写）');
      const partyB = getValue(values, 'partyB', '乙方（请填写）');
      const jobContent = getValue(values, 'jobContent', '兼职内容（请填写）');
      const jobPlace = getValue(values, 'jobPlace', '工作地点（请填写）');
      const jobPeriod = getValue(values, 'jobPeriod', '工作周期（请填写）');
      const salaryRule = getValue(values, 'salaryRule', '薪酬标准（请填写）');
      const settlementDate = getValue(values, 'settlementDate', '结算日期（请填写）');
      const acceptanceRule = getValue(values, 'acceptanceRule', '验收标准（请填写）');
      const disputeCourt = getValue(values, 'disputeCourt', '争议管辖法院（请填写）');

      return [
        `甲方：${partyA}\n乙方：${partyB}`,
        `第一条 工作内容\n1.1 乙方兼职内容：${jobContent}。\n1.2 工作地点：${jobPlace}。\n1.3 工作周期：${jobPeriod}。`,
        `第二条 薪酬与结算\n2.1 薪酬标准：${salaryRule}。\n2.2 结算时间：${settlementDate}。\n2.3 甲方应通过可追溯方式向乙方支付薪酬。`,
        `第三条 验收与证据\n3.1 双方确认工作完成的验收标准为：${acceptanceRule}。\n3.2 双方应保留签到记录、排班信息、聊天记录、转账凭证等证据。`,
        '第四条 双方义务\n4.1 甲方应提供必要的工作条件与安全保障。\n4.2 乙方应按约定时间完成工作，不得无故缺勤。',
        '第五条 违约责任\n5.1 甲方逾期结算薪酬的，应承担相应违约责任。\n5.2 乙方无故未完成工作任务的，应根据实际情况承担责任。',
        `第六条 争议解决\n6.1 因本协议产生争议，双方应先协商；协商不成，向${disputeCourt}提起诉讼。`,
      ];
    },
  },
];

function buildInitialValues(template: ContractTemplate) {
  const out: Record<string, string> = {};
  template.fields.forEach((field) => {
    out[field.key] = field.defaultValue || '';
  });
  return out;
}

export default function ContractBuilder() {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState(STUDENT_TEMPLATES[0].id);
  const selectedTemplate = useMemo(
    () => STUDENT_TEMPLATES.find((x) => x.id === selectedTemplateId) || STUDENT_TEMPLATES[0],
    [selectedTemplateId]
  );

  const [formValues, setFormValues] = useState<Record<string, string>>(
    buildInitialValues(STUDENT_TEMPLATES[0])
  );
  const [draft, setDraft] = useState('');
  const [copyText, setCopyText] = useState('复制合同');

  useEffect(() => {
    setFormValues(buildInitialValues(selectedTemplate));
    setDraft('');
  }, [selectedTemplate]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    const sections = selectedTemplate.buildSections(formValues);
    const contractText = `${selectedTemplate.contractTitle}

鉴于双方在${selectedTemplate.scene}场景下开展合作，经平等协商，订立本协议：

${sections.join('\n\n')}

第七条 其他约定
7.1 本协议未尽事宜，由双方另行签署补充协议，补充协议与本协议具有同等法律效力。
7.2 本协议自双方签字或盖章之日起生效。

甲方（签字/盖章）：________________
日期：_______年___月___日

乙方（签字/盖章）：________________
日期：_______年___月___日

【提示】本模板用于学习和草拟，请在正式签署前结合实际情况进行专业审查。`;
    setDraft(contractText);
  };

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopyText('已复制');
      window.setTimeout(() => setCopyText('复制合同'), 1500);
    } catch {
      setCopyText('复制失败');
      window.setTimeout(() => setCopyText('复制合同'), 1500);
    }
  };

  return (
    <section className="py-12 px-6 md:px-10 bg-white min-h-[calc(100vh-80px)]">
      <div className="max-w-[1400px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          返回
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-primary mb-3">学生场景限定词合同生成</h1>
          <p className="text-on-surface-variant">
            先选模板，再填写关键词，自动生成完整合同草稿。模板根据学生常见纠纷场景设计。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            {STUDENT_TEMPLATES.map((tpl) => {
              const active = tpl.id === selectedTemplate.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    active ? 'border-primary bg-primary/5 shadow-md' : 'border-outline-variant hover:border-primary'
                  }`}
                >
                  <p className="font-bold text-on-surface">{tpl.name}</p>
                  <p className="text-xs text-on-surface-variant mt-2">{tpl.scene}</p>
                </button>
              );
            })}

            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <p className="text-sm font-bold text-primary mb-2">案例参考</p>
              <p className="text-sm text-on-surface-variant leading-6">{selectedTemplate.caseReference}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedTemplate.keywordHints.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-white border border-outline-variant text-xs text-on-surface-variant">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-outline-variant p-6">
              <h2 className="text-2xl font-bold text-on-surface mb-4">{selectedTemplate.contractTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTemplate.fields.map((field) => (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-xs text-on-surface-variant">{field.label}</span>
                    <input
                      value={formValues[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
                <button
                  onClick={handleGenerate}
                  className="primary-gradient px-6 py-2.5 rounded-lg font-bold text-white shadow-lg shadow-primary/20"
                >
                  生成完整合同
                </button>
                <button
                  onClick={handleCopy}
                  className="px-6 py-2.5 rounded-lg font-bold border border-outline-variant text-on-surface hover:bg-surface-container-low"
                >
                  {copyText}
                </button>
              </div>

              <textarea
                value={draft}
                readOnly
                placeholder="生成后会在这里展示完整合同草稿。"
                className="mt-5 w-full min-h-[460px] border border-outline-variant rounded-lg p-4 text-sm leading-7 text-on-surface bg-surface-container-low"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
