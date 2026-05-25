import type { RefundRow, RefundStats } from '../types/refund';
import type { DataPeriod } from '../types';

export function computeRefundStats(
  refundRows: RefundRow[],
  periods: DataPeriod[],
): RefundStats {
  const totalRefundRequests = refundRows.length;
  const totalRefundAmount = refundRows.reduce((sum, r) => sum + r.orderAmount, 0);
  const totalReturnQuantity = refundRows.reduce((sum, r) => sum + r.returnQuantity, 0);
  const completedReturns = refundRows.filter((r) => r.returnStatus === 'Completed').length;
  const rejectedReturns = refundRows.filter(
    (r) => r.returnStatus === 'Refund rejected' || r.returnStatus.includes('Rejected'),
  ).length;

  const totalOrders = periods.reduce((sum, p) => sum + p.overview.orders, 0);
  const refundRate = totalOrders > 0 ? (totalRefundRequests / totalOrders) * 100 : 0;
  const avgRefundAmount = totalRefundRequests > 0 ? totalRefundAmount / totalRefundRequests : 0;

  // Reason distribution
  const reasonMap = new Map<string, { count: number; amount: number }>();
  for (const r of refundRows) {
    const reason = r.returnReason || '未标注';
    const entry = reasonMap.get(reason) || { count: 0, amount: 0 };
    entry.count++;
    entry.amount += r.orderAmount;
    reasonMap.set(reason, entry);
  }
  const reasonDistribution = [...reasonMap.entries()]
    .map(([reason, v]) => ({ reason, ...v }))
    .sort((a, b) => b.count - a.count);

  // Status distribution
  const statusMap = new Map<string, number>();
  for (const r of refundRows) {
    const status = r.returnStatus || 'Unknown';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }
  const statusDistribution = [...statusMap.entries()]
    .map(([status, count]) => ({ status, count }));

  // Daily trend
  const dailyMap = new Map<string, { count: number; amount: number }>();
  for (const r of refundRows) {
    const datePart = r.timeRequested.split(' ')[0]; // "DD/MM/YYYY"
    if (!datePart) continue;
    const parts = datePart.split('/');
    if (parts.length !== 3) continue;
    const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    const entry = dailyMap.get(iso) || { count: 0, amount: 0 };
    entry.count++;
    entry.amount += r.orderAmount;
    dailyMap.set(iso, entry);
  }
  const dailyTrend = [...dailyMap.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Product refunds
  const productMap = new Map<string, { count: number; amount: number; sku: string }>();
  for (const r of refundRows) {
    const key = r.productName || 'Unknown Product';
    const entry = productMap.get(key) || { count: 0, amount: 0, sku: r.sellerSku };
    entry.count++;
    entry.amount += r.orderAmount;
    productMap.set(key, entry);
  }
  const productRefunds = [...productMap.entries()]
    .map(([productName, v]) => ({ productName, sku: v.sku, count: v.count, amount: v.amount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Return type distribution
  const typeMap = new Map<string, number>();
  for (const r of refundRows) {
    const t = r.returnType || 'Unknown';
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  }
  const returnTypeDistribution = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }));

  return {
    totalOrders,
    totalRefundRequests,
    totalRefundAmount,
    totalReturnQuantity,
    refundRate,
    avgRefundAmount,
    completedReturns,
    rejectedReturns,
    reasonDistribution,
    statusDistribution,
    dailyTrend,
    productRefunds,
    returnTypeDistribution,
  };
}
