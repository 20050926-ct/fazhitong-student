export type Lawyer = {
  id: number;
  name: string;
  avatar: string;
  price: string;
  region: '乌鲁木齐' | '石河子';
  business: '实习兼职' | '租房押金' | '校园网贷' | '消费维权' | '交通事故';
  experience: string;
  consultCount: string;
  rating: string;
  desc: string;
};

export const LAWYERS_DATA: Lawyer[] = [
  {
    id: 1,
    name: '张景 律师',
    avatar: '/lawyer/zhangjing.jp',
    price: '¥500',
    region: '石河子',
    business: '实习兼职',
    experience: '12年经验',
    consultCount: '1.2w+',
    rating: '99.8%',
    desc: '擅长处理各种复杂的劳动仲裁，特别是大学生实习工资被扣、试用期辞退等维权，在石河子地区具有极高声誉。'
  },
  {
    id: 2,
    name: '赵美玲 律师',
    avatar: '/lawyer/zhaomeiling.jpg',
    price: '¥300',
    region: '乌鲁木齐',
    business: '租房押金',
    experience: '8年经验',
    consultCount: '8k+',
    rating: '99.5%',
    desc: '专注于租赁合同、购房合同审核。为无数留学生及租房群体提供法律援助，极其负责。'
  },
  {
    id: 3,
    name: '马凯 律师',
    avatar: '/lawyer/makai.jpg',
    price: '¥800',
    region: '乌鲁木齐',
    business: '校园网贷',
    experience: '15年经验',
    consultCount: '5k+',
    rating: '99.2%',
    desc: '曾参与多起校园贷暴力催收案件，对消费维权和网贷纠纷有深刻见解。'
  },
  {
    id: 4,
    name: '林静 律师',
    avatar: '/lawyer/linjing.jpg',
    price: '¥400',
    region: '石河子',
    business: '消费维权',
    experience: '6年经验',
    consultCount: '4.5k+',
    rating: '98.9%',
    desc: '精通消费者权益保护法，多次代理大学生网购受骗、线下教培机构退费等群体性维权案件。'
  },
  {
    id: 5,
    name: '陈建国 律师',
    avatar: '/lawyer/chenjianguo.jpg',
    price: '¥600',
    region: '乌鲁木齐',
    business: '交通事故',
    experience: '20年经验',
    consultCount: '9k+',
    rating: '99.6%',
    desc: '资深交通事故理赔专家，处理过上百起校园周边交通事故、共享单车理赔案件，经验极其丰富。'
  },
  {
    id: 6,
    name: '刘芳 律师',
    avatar: '/lawyer/liufang.jpg',
    price: '¥350',
    region: '乌鲁木齐',
    business: '实习兼职',
    experience: '5年经验',
    consultCount: '3k+',
    rating: '98.5%',
    desc: '年轻有活力的青年律师，非常了解当代大学生的职场困境，擅长三方协议违约金争议处理。'
  },
  {
    id: 7,
    name: '张海波 律师',
    avatar: '/lawyer/zhanghaibo.jpg',
    price: '¥450',
    region: '石河子',
    business: '租房押金',
    experience: '9年经验',
    consultCount: '6k+',
    rating: '99.1%',
    desc: '深耕房地产与租赁市场，对黑中介套路了如指掌，曾帮助上百名学生成功追回被扣押金。'
  },
  {
    id: 8,
    name: '周雪 律师',
    avatar: '/lawyer/zhouxue.jpg',
    price: '¥550',
    region: '乌鲁木齐',
    business: '消费维权',
    experience: '11年经验',
    consultCount: '7.5k+',
    rating: '99.4%',
    desc: '前消协法律顾问，擅长处理医美纠纷、健身房跑路等高发消费陷阱，谈判能力极强。'
  }
];

export function getLawyerById(id: number) {
  return LAWYERS_DATA.find((lawyer) => lawyer.id === id);
}
