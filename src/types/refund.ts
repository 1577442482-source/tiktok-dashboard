export interface RefundRow {
  returnOrderId: string;
  orderId: string;
  orderAmount: number;
  orderStatus: string;
  orderSubstatus: string;
  paymentMethod: string;
  skuId: string;
  sellerSku: string;
  productName: string;
  skuName: string;
  buyerUsername: string;
  returnType: string;
  timeRequested: string;  // "DD/MM/YYYY HH:mm:ss"
  returnReason: string;
  returnUnitPrice: number;
  returnQuantity: number;
  returnLogisticsTrackingId: string;
  returnStatus: string;
  returnSubStatus: string;
  refundTime: string;
  disputeStatus: string;
  appealStatus: string;
  compensationStatus: string;
  compensationAmount: string;
  buyerNote: string;
}

export interface RefundDataset {
  id: string;         // e.g. "refund_2026-04"
  fileName: string;
  uploadedAt: string;
  dateRange: { start: string; end: string };
  rows: RefundRow[];
}

export interface RefundStats {
  totalOrders: number;
  totalRefundRequests: number;
  totalRefundAmount: number;
  totalReturnQuantity: number;
  refundRate: number;          // refund requests / total orders (from main data)
  avgRefundAmount: number;
  completedReturns: number;
  rejectedReturns: number;

  reasonDistribution: { reason: string; count: number; amount: number }[];
  statusDistribution: { status: string; count: number }[];
  dailyTrend: { date: string; count: number; amount: number }[];
  productRefunds: { productName: string; sku: string; count: number; amount: number }[];
  returnTypeDistribution: { type: string; count: number }[];
}
