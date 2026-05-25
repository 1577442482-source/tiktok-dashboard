import { jsPDF } from 'jspdf';
import type { DataPeriod } from '../types';
import { METRIC_CATEGORIES, METRIC_LABELS } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export function exportToPDF(period: DataPeriod, summary: string): void {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text('运营数据记录', 14, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`分析周期: ${period.analysisStart} ~ ${period.analysisEnd}`, 14, y);
  y += 7;
  doc.text(`对比周期: ${period.comparisonStart} ~ ${period.comparisonEnd}`, 14, y);
  y += 10;

  doc.setFontSize(14);
  doc.text('分析摘要', 14, y);
  y += 7;
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(summary, 180);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 10;

  doc.setFontSize(14);
  doc.text('核心指标', 14, y);
  y += 8;

  doc.setFontSize(10);
  const coreKeys = ['gmv', 'orders', 'customers', 'itemsSold', 'aov'];
  for (const key of coreKeys) {
    const val = period.overview[key as keyof typeof period.overview];
    const change = period.overviewChange[key as keyof typeof period.overviewChange];
    doc.text(`${METRIC_LABELS[key as keyof typeof METRIC_LABELS]}: ${formatCurrency(val, '$')} (${formatPercent(change)})`, 14, y);
    y += 6;
  }

  y += 6;
  doc.setFontSize(14);
  doc.text('全量指标', 14, y);
  y += 8;
  doc.setFontSize(10);

  for (const cat of METRIC_CATEGORIES) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.text(cat.label, 14, y);
    y += 6;
    doc.setFontSize(9);
    for (const key of cat.keys) {
      const val = period.overview[key as keyof typeof period.overview];
      const change = period.overviewChange[key as keyof typeof period.overviewChange];
      const formattedVal = key.includes('gmv') || key === 'gmvWithCoFunding' || key === 'tax' || key === 'shippingFees' || key === 'itemsRefunded'
        ? formatCurrency(val, '$') : formatNumber(val);
      doc.text(`  ${METRIC_LABELS[key]}: ${formattedVal} (${formatPercent(change)})`, 14, y);
      y += 5;
    }
    y += 3;
  }

  const filename = `运营数据_${period.analysisStart}_${period.analysisEnd}.pdf`;
  doc.save(filename);
}

export function exportToMarkdown(period: DataPeriod, summary: string): string {
  let md = `# 运营数据记录\n\n`;
  md += `**分析周期**: ${period.analysisStart} ~ ${period.analysisEnd}  \n`;
  md += `**对比周期**: ${period.comparisonStart} ~ ${period.comparisonEnd}  \n\n`;
  md += `## 分析摘要\n\n${summary}\n\n`;
  md += `## 核心指标\n\n`;
  md += `| 指标 | 绝对值 | 环比变化 |\n`;
  md += `|------|--------|----------|\n`;

  const coreKeys = ['gmv', 'orders', 'customers', 'itemsSold', 'aov'];
  for (const key of coreKeys) {
    const val = period.overview[key as keyof typeof period.overview];
    const change = period.overviewChange[key as keyof typeof period.overviewChange];
    md += `| ${METRIC_LABELS[key as keyof typeof METRIC_LABELS]} | ${formatCurrency(val, '$')} | ${formatPercent(change)} |\n`;
  }

  for (const cat of METRIC_CATEGORIES) {
    md += `\n### ${cat.label}\n\n`;
    md += `| 指标 | 绝对值 | 环比变化 |\n`;
    md += `|------|--------|----------|\n`;
    for (const key of cat.keys) {
      const val = period.overview[key];
      const change = period.overviewChange[key];
      const formattedVal = key.includes('gmv') || key === 'gmvWithCoFunding' || key === 'tax' || key === 'shippingFees' || key === 'itemsRefunded'
        ? formatCurrency(val, '$') : formatNumber(val);
      md += `| ${METRIC_LABELS[key]} | ${formattedVal} | ${formatPercent(change)} |\n`;
    }
  }

  return md;
}
