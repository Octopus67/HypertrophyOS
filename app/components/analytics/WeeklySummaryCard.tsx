import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Card } from '../common/Card';
import {
  computeWeeklySummary,
  NutritionEntry,
} from '../../utils/weeklySummary';

interface WeeklySummaryCardProps {
  entries: NutritionEntry[];
  targetCalories: number;
}

export function WeeklySummaryCard({ entries, targetCalories }: WeeklySummaryCardProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const summary = computeWeeklySummary(entries, targetCalories);

  // Insufficient data
  if (summary.daysLogged < 2) {
    return (
      <Card variant="flat">
        <Text style={[getStyles().title, { color: getThemeColors().text.primary }]}>Weekly Summary</Text>
        <Text style={[getStyles().emptyText, { color: getThemeColors().text.muted }]}>
          Log more days to see weekly patterns. ({summary.daysLogged} of 7 days logged)
        </Text>
      </Card>
    );
  }

  return (
    <Card variant="flat">
      <Text style={[getStyles().title, { color: getThemeColors().text.primary }]}>Weekly Summary</Text>
      <Text style={[getStyles().daysLogged, { color: getThemeColors().text.muted }]}>{summary.daysLogged} of 7 days logged</Text>

      {/* Averages */}
      <View style={getStyles().avgRow}>
        <StatBlock label="Avg Calories" value={`${Math.round(summary.avgCalories)}`} unit="kcal" />
        <StatBlock label="Avg Protein" value={`${Math.round(summary.avgProtein)}`} unit="g" />
        <StatBlock label="Avg Carbs" value={`${Math.round(summary.avgCarbs)}`} unit="g" />
        <StatBlock label="Avg Fat" value={`${Math.round(summary.avgFat)}`} unit="g" />
      </View>

      {/* Adherence */}
      <View style={[getStyles().adherenceRow, { borderTopColor: getThemeColors().border.subtle }]}>
        {summary.bestDay && (
          <View style={getStyles().adherenceBlock}>
            <Text style={[getStyles().adherenceLabel, { color: getThemeColors().text.muted }]}>Best Day</Text>
            <Text style={[getStyles().adherenceDate, { color: getThemeColors().text.primary }]}>{summary.bestDay.date}</Text>
            <Text style={[getStyles().adherenceDeviation, { color: getThemeColors().text.secondary }]}>
              ±{Math.round(summary.bestDay.deviation)} kcal
            </Text>
          </View>
        )}
        {summary.worstDay && (
          <View style={getStyles().adherenceBlock}>
            <Text style={[getStyles().adherenceLabel, { color: getThemeColors().text.muted }]}>Worst Day</Text>
            <Text style={[getStyles().adherenceDate, { color: getThemeColors().text.primary }]}>{summary.worstDay.date}</Text>
            <Text style={[getStyles().adherenceDeviation, { color: getThemeColors().text.secondary }]}>
              ±{Math.round(summary.worstDay.deviation)} kcal
            </Text>
          </View>
        )}
      </View>

      {/* Water */}
      {summary.totalWaterMl > 0 && (
        <View style={[getStyles().waterRow, { borderTopColor: getThemeColors().border.subtle }]}>
          <Text style={[getStyles().waterLabel, { color: getThemeColors().text.muted }]}>Total Water</Text>
          <Text style={[getStyles().waterValue, { color: getThemeColors().text.primary }]}>{Math.round(summary.totalWaterMl)} ml</Text>
        </View>
      )}
    </Card>
  );
}

function StatBlock({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={getStyles().statBlock}>
      <Text style={[getStyles().statLabel, { color: getThemeColors().text.muted }]}>{label}</Text>
      <Text style={[getStyles().statValue, { color: getThemeColors().text.primary }]}>
        {value}
        <Text style={[getStyles().statUnit, { color: getThemeColors().text.secondary }]}> {unit}</Text>
      </Text>
    </View>
  );
}


/** Lazy styles for module-level helpers */
function getStyles() { return getThemedStyles(getThemeColors()); }

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: getThemeColors().text.primary,
    marginBottom: spacing[2],
  },
  daysLogged: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.muted,
    marginBottom: spacing[3],
  },
  emptyText: {
    fontSize: typography.size.base,
    color: getThemeColors().text.muted,
    textAlign: 'center',
    paddingVertical: spacing[4],
  },
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: getThemeColors().text.muted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: getThemeColors().text.primary,
  },
  statUnit: {
    fontSize: typography.size.xs,
    color: getThemeColors().text.secondary,
    fontWeight: typography.weight.regular,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: getThemeColors().border.subtle,
  },
  adherenceBlock: {
    alignItems: 'center',
  },
  adherenceLabel: {
    fontSize: typography.size.xs,
    color: getThemeColors().text.muted,
    marginBottom: 2,
  },
  adherenceDate: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.primary,
    fontWeight: typography.weight.medium,
  },
  adherenceDeviation: {
    fontSize: typography.size.xs,
    color: getThemeColors().text.secondary,
  },
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: getThemeColors().border.subtle,
  },
  waterLabel: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.muted,
  },
  waterValue: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.primary,
    fontWeight: typography.weight.medium,
  },
});
