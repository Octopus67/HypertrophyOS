import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, letterSpacing } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Card } from '../common/Card';
import { TrendLineChart } from '../charts/TrendLineChart';
import {
  computeTDEEEstimate,
  WeightPoint,
} from '../../utils/tdeeEstimation';

interface ExpenditureTrendCardProps {
  weightHistory: WeightPoint[];
  caloriesByDate: Record<string, number>;
}

const MIN_DATA_DAYS = 14;

export function ExpenditureTrendCard({ weightHistory, caloriesByDate }: ExpenditureTrendCardProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const estimate = computeTDEEEstimate(weightHistory, caloriesByDate);

  // Build trend data points for the chart from calorie data
  const chartData = Object.entries(caloriesByDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Insufficient data
  if (!estimate) {
    const weightDays = weightHistory.length;
    const calorieDays = Object.keys(caloriesByDate).length;
    const minDays = Math.min(weightDays, calorieDays);
    const daysNeeded = MIN_DATA_DAYS - minDays;

    return (
      <Card variant="flat">
        <Text style={[styles.title, { color: getThemeColors().text.primary }]}>Expenditure Trend</Text>
        <Text style={[styles.emptyText, { color: getThemeColors().text.muted }]}>
          {daysNeeded > 0
            ? `${daysNeeded} more day${daysNeeded === 1 ? '' : 's'} needed`
            : 'Insufficient data for TDEE estimation'}
        </Text>
        <Text style={[styles.emptySubtext, { color: getThemeColors().text.muted }]}>
          Log bodyweight and nutrition daily for accurate estimates.
        </Text>
      </Card>
    );
  }

  return (
    <Card variant="flat">
      <Text style={[styles.title, { color: getThemeColors().text.primary }]}>Expenditure Trend</Text>

      {/* Prominent TDEE number */}
      <View style={styles.tdeeRow}>
        <Text style={[styles.tdeeValue, { color: getThemeColors().text.primary }]}>{Math.round(estimate.tdee)}</Text>
        <Text style={[styles.tdeeUnit, { color: getThemeColors().text.secondary }]}>kcal/day</Text>
      </View>
      <Text style={[styles.tdeeLabel, { color: getThemeColors().text.muted }]}>Estimated TDEE ({estimate.windowDays}-day window)</Text>

      {/* Trend line chart */}
      {chartData.length > 1 && (
        <View style={styles.chartContainer}>
          <TrendLineChart
            data={chartData}
            color={getThemeColors().chart.calories}
            targetLine={estimate.tdee}
            suffix=" kcal"
          />
        </View>
      )}
    </Card>
  );
}


const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: getThemeColors().text.primary,
    marginBottom: spacing[2],
    lineHeight: typography.lineHeight.md,
  },
  tdeeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  tdeeValue: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: getThemeColors().text.primary,
    fontVariant: typography.numeric.fontVariant as any,
    letterSpacing: letterSpacing.tighter,
    lineHeight: typography.lineHeight['3xl'],
  },
  tdeeUnit: {
    fontSize: typography.size.base,
    color: getThemeColors().text.secondary,
    lineHeight: typography.lineHeight.base,
  },
  tdeeLabel: {
    fontSize: typography.size.xs,
    color: getThemeColors().text.muted,
    marginBottom: spacing[3],
    lineHeight: typography.lineHeight.xs,
  },
  chartContainer: {
    marginTop: spacing[2],
  },
  emptyText: {
    fontSize: typography.size.base,
    color: getThemeColors().text.muted,
    textAlign: 'center',
    paddingVertical: spacing[2],
    lineHeight: typography.lineHeight.base,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.muted,
    textAlign: 'center',
    paddingBottom: spacing[2],
    lineHeight: typography.lineHeight.sm,
  },
});
