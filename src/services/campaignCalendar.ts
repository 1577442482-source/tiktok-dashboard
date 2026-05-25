// 2026年 TikTok Shop 营销活动日历
// 数据来源: 2026营销活动日历.xlsx — 户外/汽摩工具品类
// 活动等级: SS(平台年度大促) > S(季度大促) > A(品类/节点促销)

export interface CampaignEvent {
  level: 'SS' | 'S' | 'A';
  name: string;
  /** 活动覆盖的日期范围 */
  start: string;
  end: string;
  /** 对户外生火类目的相关性: high=直接相关, medium=部分相关, low=泛促销 */
  relevance: 'high' | 'medium' | 'low';
}

export const CAMPAIGNS_2026: CampaignEvent[] = [
  // ============ Q1 ============
  { level: 'A', name: 'Jumpstart Sale', start: '2026-01-01', end: '2026-01-23', relevance: 'medium' },
  { level: 'A', name: 'Love at First Find', start: '2026-02-01', end: '2026-02-10', relevance: 'medium' },
  { level: 'A', name: '二月囤货节 February Stock Up', start: '2026-02-15', end: '2026-02-25', relevance: 'high' },
  { level: 'A', name: '户外节 Spring Outdoor / Spring Break', start: '2026-03-07', end: '2026-03-17', relevance: 'high' },
  { level: 'S', name: '春促 Spring Glow-Up', start: '2026-03-14', end: '2026-03-28', relevance: 'high' },

  // ============ Q2 ============
  { level: 'A', name: '四月囤货节 April Stock Up', start: '2026-04-10', end: '2026-04-22', relevance: 'high' },
  { level: 'A', name: "母亲节 Mother's Day", start: '2026-04-25', end: '2026-05-05', relevance: 'low' },
  { level: 'A', name: '焕新季 Bloomin Deals', start: '2026-05-08', end: '2026-05-18', relevance: 'high' },
  { level: 'A', name: '纪念日 Gear Up For Memorial Day', start: '2026-05-16', end: '2026-05-26', relevance: 'high' },
  { level: 'A', name: "父亲节 Father's Day", start: '2026-05-30', end: '2026-06-08', relevance: 'low' },
  { level: 'S', name: '夏促 Summer Turn Up', start: '2026-06-06', end: '2026-06-22', relevance: 'high' },

  // ============ Q3 ============
  { level: 'SS', name: '年中促 Deals For You Days', start: '2026-06-27', end: '2026-07-14', relevance: 'high' },
  { level: 'A', name: '燃夏季 Fun in the Sun Sale', start: '2026-07-18', end: '2026-07-28', relevance: 'high' },
  { level: 'A', name: '返校季 School Must-Haves', start: '2026-08-08', end: '2026-08-18', relevance: 'low' },
  { level: 'A', name: '招新季 RushReady', start: '2026-08-22', end: '2026-08-31', relevance: 'medium' },
  { level: 'A', name: '劳动节 Labor Day', start: '2026-08-29', end: '2026-09-07', relevance: 'medium' },
  { level: 'A', name: '九月囤货节 September Stock Up', start: '2026-09-12', end: '2026-09-22', relevance: 'high' },

  // ============ Q4 ============
  { level: 'S', name: '秋促 Fall Deals For You', start: '2026-10-03', end: '2026-10-17', relevance: 'high' },
  { level: 'A', name: '万圣节 Halloween', start: '2026-10-17', end: '2026-10-27', relevance: 'medium' },
  { level: 'A', name: '黑五提前购 Black Friday Pre-Holiday Deals', start: '2026-10-30', end: '2026-11-09', relevance: 'high' },
  { level: 'SS', name: '黑五网一 Black Friday & Cyber Monday', start: '2026-11-06', end: '2026-11-20', relevance: 'high' },
  { level: 'SS', name: '年终促 Holiday Deal / End Of Year', start: '2026-11-27', end: '2026-12-15', relevance: 'high' },
];

/** 根据日期查找进行中的活动 */
export function findActiveCampaigns(dateStr: string): CampaignEvent[] {
  return CAMPAIGNS_2026.filter(c => dateStr >= c.start && dateStr <= c.end);
}

/** 根据日期范围查找覆盖的活动 */
export function findCampaignsInRange(start: string, end: string): CampaignEvent[] {
  return CAMPAIGNS_2026.filter(c => c.end >= start && c.start <= end);
}
