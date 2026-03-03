/**
 * Pure logic functions for the micronutrient dashboard.
 */

export type NutrientStatus = 'deficient' | 'low' | 'adequate' | 'excess';

export function getStatusColor(status: NutrientStatus): string {
  switch (status) {
    case 'deficient': return '#EF4444';
    case 'low': return '#F59E0B';
    case 'adequate': return '#22C55E';
    case 'excess': return '#3B82F6';
  }
}

export function getStatusLabel(status: NutrientStatus): string {
  switch (status) {
    case 'deficient': return 'Deficient';
    case 'low': return 'Low';
    case 'adequate': return 'Adequate';
    case 'excess': return 'Excess';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#84CC16';
  if (score >= 40) return '#F59E0B';
  if (score >= 20) return '#F97316';
  return '#EF4444';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
}

export function formatNutrientValue(value: number, unit: string): string {
  if (value >= 1000 && unit === 'mg') return `${(value / 1000).toFixed(1)}g`;
  if (value >= 1000 && unit === 'mcg') return `${(value / 1000).toFixed(1)}mg`;
  if (value < 0.01) return `<0.01${unit}`;
  return `${value.toFixed(value < 1 ? 2 : 1)}${unit}`;
}

export function clampPct(pct: number): number {
  return Math.max(0, Math.min(pct, 100));
}
