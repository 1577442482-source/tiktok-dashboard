import {
  type DataPeriod, type MetricRow, type Attribution, type AttributionCause,
  type AnalysisResult, type AnomalyLevel,
  type MetricKey, METRIC_LABELS, METRIC_KEYS,
} from '../types';
import { findCampaignsInRange, type CampaignEvent } from './campaignCalendar';

// ============================================================
// 业务上下文 — 户外生火用具 / 美国市场 / GMV增长导向
// ============================================================

/** 户外露营旺季 4-9月，淡季 11-2月，平季 3月/10月 */
function getSeasonalityFactor(dateStr: string): 'peak' | 'shoulder' | 'off' {
  const month = parseInt(dateStr.substring(5, 7), 10);
  if (month >= 4 && month <= 9) return 'peak';
  if (month === 3 || month === 10) return 'shoulder';
  return 'off';
}

// ============================================================
// 衍生指标计算
// ============================================================

interface DerivedMetrics {
  ctr: number;           // productClicks / productImpressions * 100
  uniqueCtr: number;     // uniqueClicks / uniqueProductImpressions * 100
  cvr: number;           // orders / uniqueClicks * 100
  grossCvr: number;      // orders / productClicks * 100
  returnRate: number;    // (canceled+refunded) / orders * 100
  aov: number;
  videoGmvShare: number; // video GMV / total GMV * 100
  liveGmvShare: number;  // live GMV / total GMV * 100
  cardGmvShare: number;  // product card GMV / total GMV * 100
  trafficQuality: number;// unique impressions / total impressions * 100
  hasLiveData: boolean;
}

function calcDerived(overview: MetricRow): DerivedMetrics {
  const totalImpressions = overview.productImpressions || 1;
  const totalClicks = overview.productClicks || 0;
  const uniqueImps = overview.uniqueProductImpressions || 1;
  const uniqueClks = overview.uniqueClicks || 0;
  const totalOrders = overview.orders || 1;
  const totalGmv = overview.gmv || 1;

  const totalVideoGmv = overview.videoAttributedGmv + overview.creatorVideoAttributedGmv + overview.creatorVideoGmv + overview.sellerVideoGmv;
  const totalLiveGmv = overview.liveAttributedGmv + overview.creatorLiveAttributedGmv + overview.creatorLiveGmv + overview.sellerLiveGmv;

  return {
    ctr: (totalClicks / totalImpressions) * 100,
    uniqueCtr: (uniqueClks / uniqueImps) * 100,
    cvr: (totalOrders / uniqueClks) * 100,
    grossCvr: (totalOrders / Math.max(totalClicks, 1)) * 100,
    returnRate: ((overview.itemsCanceledReturned + overview.itemsRefunded) / totalOrders) * 100,
    aov: overview.aov,
    videoGmvShare: (totalVideoGmv / totalGmv) * 100,
    liveGmvShare: (totalLiveGmv / totalGmv) * 100,
    cardGmvShare: (overview.productCardGmv / totalGmv) * 100,
    trafficQuality: (uniqueImps / Math.max(totalImpressions, 1)) * 100,
    hasLiveData: totalLiveGmv > 0,
  };
}

// ============================================================
// 异常判定
// ============================================================

const THRESHOLD_CRITICAL = 50;
const THRESHOLD_WARNING = 20;

function getAnomalyLevel(changeRate: number): AnomalyLevel {
  const abs = Math.abs(changeRate);
  if (abs > THRESHOLD_CRITICAL) return 'critical';
  if (abs > THRESHOLD_WARNING) return 'warning';
  return 'normal';
}

function computeChangeRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ============================================================
// 类型
// ============================================================

interface RuleInput {
  key: MetricKey;
  current: MetricRow;
  previous: MetricRow;
  changeRate: number;
  cur: DerivedMetrics;
  prev: DerivedMetrics;
  seasonHint: string;
  activeCampaigns: CampaignEvent[];
}

type RuleFunc = (input: RuleInput) => AttributionCause[];

// ============================================================
// 辅助函数
// ============================================================

function c(description: string, probability: 'high' | 'medium' | 'low', confidence: number): AttributionCause {
  return { description, probability, confidence };
}

// ============================================================
// 各指标规则
// ============================================================

// --- GMV ---
function gmvRule(input: RuleInput): AttributionCause[] {
  const { changeRate, cur, prev, seasonHint, activeCampaigns } = input;
  const causes: AttributionCause[] = [];

  const hasHighRelevance = activeCampaigns.filter(c => c.relevance === 'high');
  const hasSSCampaign = activeCampaigns.filter(c => c.level === 'SS');

  if (changeRate > 30) {
    if (hasSSCampaign.length > 0) {
      causes.push(c(`${hasSSCampaign[0].name}期间平台流量扶持，户外用品迎来大促红利`, 'high', 90));
    } else if (hasHighRelevance.length > 0) {
      causes.push(c(`${hasHighRelevance[0].name}期间户外品类需求上升，促销活动带动转化`, 'high', 85));
    }
    if (cur.videoGmvShare > 40 && cur.videoGmvShare > prev.videoGmvShare + 5) {
      causes.push(c('短视频渠道贡献占比明显提升，可能出现了爆款视频内容带动转化', 'high', 80));
    }
    if (cur.liveGmvShare > 20 && !prev.hasLiveData) {
      causes.push(c('新增直播渠道开始贡献GMV，建议加大直播频次', 'high', 85));
    }
    if (cur.cvr > prev.cvr + 3) {
      causes.push(c(`CVR从${prev.cvr.toFixed(1)}%升至${cur.cvr.toFixed(1)}%，转化效率显著提升，Listing优化或价格策略生效`, 'high', 80));
    }
    if (cur.aov > prev.aov * 1.1) {
      causes.push(c(`客单价提升${Math.round((cur.aov / prev.aov - 1) * 100)}%，用户购买了更高单价商品或组合装`, 'high', 75));
    }
    if (cur.ctr > prev.ctr + 1) {
      causes.push(c(`CTR从${prev.ctr.toFixed(1)}%升至${cur.ctr.toFixed(1)}%，主图或标题优化吸引了更多点击`, 'high', 70));
    }
    // 旺季自然增长
    if (!causes.length && seasonHint === 'peak') {
      causes.push(c('户外旺季自然流量增长带动GMV上升，建议加大广告投放抢占窗口期', 'high', 75));
    }
  } else if (changeRate < -30) {
    if (hasSSCampaign.length > 0) {
      // SS级大促中GMV反而下降 = 严重问题
      causes.push(c(`${hasSSCampaign[0].name}期间GMV不升反降，竞品可能抢占了活动流量或Listing未获得活动加权`, 'high', 85));
    } else if (seasonHint === 'off') {
      causes.push(c('进入户外淡季，需求自然回落。可考虑推出室内/冬季相关配件维持销售', 'high', 80));
    }
    if (cur.ctr < prev.ctr - 1) {
      causes.push(c(`CTR从${prev.ctr.toFixed(1)}%降至${cur.ctr.toFixed(1)}%，主图或标题吸引力下降，建议A/B测试优化`, 'high', 80));
    }
    if (cur.cvr < prev.cvr - 3) {
      causes.push(c(`CVR从${prev.cvr.toFixed(1)}%降至${cur.cvr.toFixed(1)}%，转化率下滑，排查价格竞争力、Listing质量或竞品促销`, 'high', 80));
    }
    if (cur.trafficQuality < prev.trafficQuality - 10) {
      causes.push(c('重复曝光占比上升，流量质量下降，平台可能向非精准人群推送', 'medium', 65));
    }
    if (cur.videoGmvShare < prev.videoGmvShare - 10) {
      causes.push(c('短视频渠道GMV占比下降明显，可能原有爆款视频热度衰退', 'high', 75));
    }
    if (cur.returnRate > prev.returnRate + 3) {
      causes.push(c(`退货率从${prev.returnRate.toFixed(1)}%升至${cur.returnRate.toFixed(1)}%，产品质量或物流问题影响复购`, 'high', 75));
    }
  }

  return causes;
}

// --- Orders ---
function ordersRule(input: RuleInput): AttributionCause[] {
  const { changeRate, cur, prev } = input;
  const causes: AttributionCause[] = [];

  if (changeRate > 30) {
    if (cur.cvr > prev.cvr + 2) {
      causes.push(c(`CVR提升驱动订单增长，Listing或定价策略见效`, 'high', 80));
    }
    if (cur.ctr > prev.ctr + 0.5) {
      causes.push(c(`CTR提升带动点击量增长，为订单转化提供了更多机会`, 'high', 75));
    }
    if (cur.uniqueCtr > prev.uniqueCtr + 0.5) {
      causes.push(c('独立访客点击率上升，新流量质量较高', 'medium', 65));
    }
  } else if (changeRate < -30) {
    causes.push(c('订单量明显下滑，需要从流量和转化两个环节分别排查', 'high', 85));
    if (cur.cvr < prev.cvr - 2) {
      causes.push(c(`CVR下降是订单下滑的主因，建议优化Listing详情页、增加评价和Q&A`, 'high', 80));
    }
    if (cur.ctr < prev.ctr - 0.5) {
      causes.push(c(`CTR下降导致进店流量减少，需要优化主图和标题吸引力`, 'high', 70));
    }
  }

  return causes;
}

// --- AOV ---
function aovRule(input: RuleInput): AttributionCause[] {
  const { changeRate, cur, prev } = input;
  const causes: AttributionCause[] = [];

  if (changeRate > 15) {
    causes.push(c('客单价提升：可能组合装/套装销售占比增加，户外用户倾向一站式购买', 'high', 75));
    if (cur.aov > 50) {
      causes.push(c('客单价超过$50，处于户外工具类中高价位段，需关注转化率是否受影响', 'medium', 60));
    }
  } else if (changeRate < -15) {
    causes.push(c('客单价下降：可能低价SKU销量占比上升或进行了促销打折', 'high', 75));
    if (input.current.orders > input.previous.orders && cur.aov < prev.aov) {
      causes.push(c('以价换量策略 — 订单上升但客单价下降，关注总GMV是否正向增长', 'medium', 70));
    }
  }

  return causes;
}

// --- 退货退款 ---
function returnsRule(input: RuleInput): AttributionCause[] {
  const { changeRate, cur } = input;
  const causes: AttributionCause[] = [];

  if (changeRate > 30) {
    if (cur.returnRate > 10) {
      causes.push(c(`退货率${cur.returnRate.toFixed(1)}%偏高。生火用具常见原因：产品与描述不符、打火成功率不稳定、物流损坏`, 'high', 80));
    }
    causes.push(c('退货增长侵蚀实际GMV，建议分析退货原因标签并优化产品详情页准确性', 'high', 75));
  } else if (changeRate < -20) {
    causes.push(c('退货率改善，产品质量或Listing描述优化见效', 'medium', 65));
  }

  return causes;
}

// --- 流量 ---
function trafficRule(input: RuleInput): AttributionCause[] {
  const { changeRate, cur, prev } = input;
  const causes: AttributionCause[] = [];

  if (changeRate > 50) {
    causes.push(c('流量大幅增长，广告投放或平台自然推荐权重提升', 'high', 80));
    if (cur.cardGmvShare > prev.cardGmvShare + 10) {
      causes.push(c('商品卡流量占比上升，TikTok Shop搜索推荐算法可能给到了更多曝光', 'high', 75));
    }
  } else if (changeRate < -30) {
    causes.push(c('流量明显下滑，排查：广告预算是否耗尽、竞品是否抢占了关键词排名', 'high', 75));
    if (cur.ctr < prev.ctr - 1) {
      causes.push(c('CTR下降加剧流量浪费 — 曝光没变少但用户不点，优化主图和标题很紧迫', 'high', 80));
    }
  }

  if (cur.trafficQuality < 50) {
    causes.push(c('独立曝光占比低于50%，重复曝光过高，可能存在无效展示或受众疲劳', 'medium', 60));
  }

  return causes;
}

// --- 短视频渠道 ---
function videoRule(input: RuleInput): AttributionCause[] {
  const { changeRate, cur, prev } = input;
  const causes: AttributionCause[] = [];

  if (changeRate > 50) {
    causes.push(c('短视频渠道GMV爆发，可能有视频内容获得平台推荐流量', 'high', 85));
    if (cur.cvr > prev.cvr + 2) {
      causes.push(c('视频引流来的用户转化率也在提升，说明视频内容精准触达了目标受众', 'high', 75));
    }
  } else if (changeRate < -30) {
    causes.push(c('短视频渠道GMV下滑，原有视频热度衰退。建议发布新的使用场景内容（如野外生存、露营vlog）', 'high', 75));
    causes.push(c('户外生火产品适合展示「使用效果」类短视频，火焰/火花画面天然适合短视频传播', 'medium', 65));
  }

  return causes;
}

// --- 直播渠道 ---
function liveRule(input: RuleInput): AttributionCause[] {
  const { changeRate, cur, prev } = input;
  const causes: AttributionCause[] = [];

  if (changeRate > 50 && !prev.hasLiveData) {
    causes.push(c('直播渠道从0到1开始贡献GMV，新增渠道带来增量', 'high', 85));
  } else if (changeRate > 30) {
    causes.push(c('直播GMV增长显著。户外生火产品适合演示型直播（现场点火、耐候性测试）', 'high', 75));
    if (cur.cvr > prev.cvr + 1) {
      causes.push(c('直播互动提升了用户信任度，转化率随之上升', 'high', 70));
    }
  } else if (changeRate < -30 && prev.hasLiveData) {
    causes.push(c('直播GMV下降，检查直播频次、时长和场次是否减少', 'high', 70));
  }

  return causes;
}

// --- 商品卡渠道 ---
function productCardRule(input: RuleInput): AttributionCause[] {
  const { changeRate } = input;
  const causes: AttributionCause[] = [];

  if (changeRate > 30) {
    causes.push(c('商品卡渠道GMV增长，自然搜索或推荐流量表现好，Listing SEO效果显现', 'high', 75));
  } else if (changeRate < -30) {
    causes.push(c('商品卡GMV下降，排查Listing标题关键词排名是否下滑，竞品是否抢占搜索位', 'high', 70));
  }

  return causes;
}

// ============================================================
// 规则注册表
// ============================================================

const RULES: Partial<Record<MetricKey, RuleFunc>> = {
  gmv: gmvRule,
  orders: ordersRule,
  customers: ordersRule,
  aov: aovRule,
  itemsCanceledReturned: returnsRule,
  itemsRefunded: returnsRule,
  productImpressions: trafficRule,
  uniqueProductImpressions: trafficRule,
  productClicks: trafficRule,
  uniqueClicks: trafficRule,
  videoAttributedGmv: videoRule,
  creatorVideoAttributedGmv: videoRule,
  creatorVideoGmv: videoRule,
  liveAttributedGmv: liveRule,
  creatorLiveAttributedGmv: liveRule,
  creatorLiveGmv: liveRule,
  sellerLiveGmv: liveRule,
  productCardGmv: productCardRule,
};

// ============================================================
// 综合分析
// ============================================================

function buildCTRCVRAnalysis(cur: DerivedMetrics, prev: DerivedMetrics): string[] {
  const parts: string[] = [];

  const ctrChange = cur.ctr - prev.ctr;
  const cvrChange = cur.cvr - prev.cvr;

  if (Math.abs(ctrChange) > 0.5) {
    const dir = ctrChange > 0 ? '上升' : '下降';
    parts.push(`CTR${dir}${Math.abs(ctrChange).toFixed(1)}个百分点（${prev.ctr.toFixed(1)}% → ${cur.ctr.toFixed(1)}%）`);
  }
  if (Math.abs(cvrChange) > 1) {
    const dir = cvrChange > 0 ? '上升' : '下降';
    parts.push(`CVR${dir}${Math.abs(cvrChange).toFixed(1)}个百分点（${prev.cvr.toFixed(1)}% → ${cur.cvr.toFixed(1)}%）`);
  }

  // 诊断：CTR和CVR的不同组合
  if (ctrChange > 0.5 && cvrChange < -1) {
    parts.push('CTR升但CVR降：引流更精准但页面转化力不足，建议优化Listing详情和评价区');
  }
  if (ctrChange < -0.5 && cvrChange > 1) {
    parts.push('CTR降但CVR升：流量减少但更精准，可能低意向用户被自然过滤');
  }
  if (ctrChange < -0.5 && cvrChange < -1) {
    parts.push('CTR和CVR双降：主图/标题和Listing详情都需优化，建议A/B测试新素材');
  }

  return parts;
}

function buildTrafficDiagnosis(cur: DerivedMetrics, prev: DerivedMetrics): string[] {
  const parts: string[] = [];

  // 渠道结构变化
  if (cur.videoGmvShare > prev.videoGmvShare + 10) {
    parts.push(`短视频渠道GMV占比从${prev.videoGmvShare.toFixed(0)}%升至${cur.videoGmvShare.toFixed(0)}%，内容引流在加强`);
  }
  if (cur.cardGmvShare > prev.cardGmvShare + 10) {
    parts.push(`商品卡渠道占比从${prev.cardGmvShare.toFixed(0)}%升至${cur.cardGmvShare.toFixed(0)}%，搜索/推荐流量在改善`);
  }

  // 流量效率
  const ctrGap = cur.ctr - prev.ctr;
  if (Math.abs(ctrGap) >= 1) {
    parts.push(`当前CTR ${cur.ctr.toFixed(1)}%，处于${cur.ctr > 3 ? '良好' : cur.ctr > 1.5 ? '一般' : '偏低'}水平`);
  }
  if (Math.abs(cur.cvr - prev.cvr) >= 2) {
    parts.push(`当前CVR ${cur.cvr.toFixed(1)}%，处于${cur.cvr > 8 ? '优秀' : cur.cvr > 4 ? '良好' : '有待提升'}水平`);
  }

  return parts;
}

function buildSummary(
  attributions: Attribution[],
  cur: DerivedMetrics,
  prev: DerivedMetrics,
  periodStart: string,
  periodEnd: string,
): string {
  const parts: string[] = [];

  const criticalCount = attributions.filter(a => a.anomalyLevel === 'critical').length;
  const warningCount = attributions.filter(a => a.anomalyLevel === 'warning').length;

  // --- 总览 ---
  const gmvAttr = attributions.find(a => a.metricKey === 'gmv');
  const gmvChange = gmvAttr?.changeRate || 0;

  if (gmvChange > 15) parts.push('GMV呈现显著增长态势');
  else if (gmvChange > 5) parts.push('GMV稳中有升');
  else if (gmvChange < -15) parts.push('GMV出现明显下滑，需重点关注');
  else if (gmvChange < -5) parts.push('GMV小幅回落');
  else parts.push('GMV基本持平');

  // --- 活动日历 ---
  const campaigns = findCampaignsInRange(periodStart, periodEnd);
  const ssCampaigns = campaigns.filter(c => c.level === 'SS');
  const highRelevanceCampaigns = campaigns.filter(c => c.relevance === 'high');
  if (ssCampaigns.length > 0) {
    parts.push(`覆盖${ssCampaigns.map(c => c.name).join('、')}大促，评估活动ROI至关重要`);
  } else if (highRelevanceCampaigns.length > 0) {
    parts.push(`覆盖${highRelevanceCampaigns[0].name}，户外品类获平台活动加持`);
  }

  // --- 季节性提示 ---
  const season = getSeasonalityFactor(periodStart);
  if (season === 'peak' && gmvChange > 0) parts.push('当前处于户外用品旺季，建议加大投放力度');
  if (season === 'off' && gmvChange < 0) parts.push('淡季属正常回落，可关注冬季户外（篝火配件等）维持营收');

  // --- CTR/CVR 诊断 ---
  parts.push(...buildCTRCVRAnalysis(cur, prev));

  // --- 异常汇总 ---
  if (criticalCount > 0) parts.push(`${criticalCount}项指标出现显著变化（>50%）`);
  if (warningCount > 0 && criticalCount === 0) parts.push(`${warningCount}项指标值得关注`);

  // --- 渠道诊断 ---
  parts.push(...buildTrafficDiagnosis(cur, prev));

  // --- 退货提醒 ---
  if (cur.returnRate > 8) {
    parts.push(`退货率${cur.returnRate.toFixed(1)}%需关注，生火类产品退货通常与打火成功率相关`);
  }

  return parts.join('；') + '。';
}

// ============================================================
// 公共 API
// ============================================================

export function analyzePeriod(
  currentPeriod: DataPeriod,
  previousPeriod: DataPeriod,
): AnalysisResult {
  const attributions: Attribution[] = [];
  const cur = calcDerived(currentPeriod.overview);
  const prev = calcDerived(previousPeriod.overview);
  const seasonHint = getSeasonalityFactor(currentPeriod.analysisStart);
  const activeCampaigns = findCampaignsInRange(currentPeriod.analysisStart, currentPeriod.analysisEnd);

  for (const key of METRIC_KEYS) {
    const currentValue = currentPeriod.overview[key];
    const previousValue = previousPeriod.overview[key];
    const changeRate = computeChangeRate(currentValue, previousValue);
    const anomalyLevel = getAnomalyLevel(changeRate);

    const causes: AttributionCause[] = [];
    if (anomalyLevel !== 'normal') {
      const rule = RULES[key];
      if (rule) {
        const ruleCauses = rule({
          key,
          current: currentPeriod.overview,
          previous: previousPeriod.overview,
          changeRate,
          cur,
          prev,
          seasonHint,
          activeCampaigns,
        });
        causes.push(...ruleCauses);
      }
      if (causes.length === 0) {
        causes.push(c(
          changeRate > 0
            ? `${METRIC_LABELS[key]}增长${Math.round(changeRate)}%，建议持续监测趋势`
            : `${METRIC_LABELS[key]}下降${Math.round(Math.abs(changeRate))}%，建议排查具体原因`,
          'low',
          30,
        ));
      }
    }

    attributions.push({
      metricKey: key,
      metricLabel: METRIC_LABELS[key],
      currentValue,
      previousValue,
      changeRate,
      anomalyLevel,
      causes,
    });
  }

  return {
    periodId: currentPeriod.id,
    attributions,
    summary: buildSummary(attributions, cur, prev, currentPeriod.analysisStart, currentPeriod.analysisEnd),
    generatedAt: new Date().toISOString(),
  };
}

export function analyzeLatestPeriod(
  currentPeriod: DataPeriod,
  allPeriods: DataPeriod[],
): { analysis: AnalysisResult; previousPeriod: DataPeriod | null } {
  const previous = findPreviousPeriod(currentPeriod, allPeriods);
  if (!previous) {
    return {
      analysis: {
        periodId: currentPeriod.id,
        attributions: [],
        summary: '无对比周期数据，无法进行环比分析。请先上传至少两个周期的数据。',
        generatedAt: new Date().toISOString(),
      },
      previousPeriod: null,
    };
  }

  return {
    analysis: analyzePeriod(currentPeriod, previous),
    previousPeriod: previous,
  };
}

function findPreviousPeriod(current: DataPeriod, all: DataPeriod[]): DataPeriod | null {
  if (current.comparisonStart) {
    const match = all.find(
      p => p.analysisStart === current.comparisonStart && p.analysisEnd === current.comparisonEnd
    );
    if (match) return match;
  }

  const sorted = [...all]
    .filter(p => p.id !== current.id)
    .sort((a, b) => b.analysisStart.localeCompare(a.analysisStart));

  return sorted.find(p => p.analysisStart < current.analysisStart) || null;
}
