import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';
import { ProgressBar } from '../common/ProgressBar';

interface TrialCountdownProps {
  daysRemaining: number;
  totalDays?: number;
}

export function TrialCountdown({ daysRemaining, totalDays = 7 }: TrialCountdownProps) {
  const c = useThemeColors();
  const elapsed = totalDays - daysRemaining;
  const isUrgent = daysRemaining <= 2;

  return (
    <View
      style={[styles.container, { backgroundColor: c.bg.surfaceRaised, borderColor: c.border.subtle }]}
      accessibilityRole="text"
      accessibilityLabel={`Trial countdown: ${daysRemaining} of ${totalDays} days remaining`}
    >
      <View style={styles.header}>
        <Icon name="calendar" size={16} color={isUrgent ? c.semantic.warning : c.accent.primary} />
        <Text style={[styles.title, { color: c.text.primary }]}>Free Trial</Text>
        <Text style={[styles.days, { color: isUrgent ? c.semantic.warning : c.accent.primary }]}>
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
        </Text>
      </View>
      <ProgressBar
        value={elapsed}
        target={totalDays}
        color={isUrgent ? c.semantic.warning : c.accent.primary}
        trackColor={c.border.subtle}
        showPercentage={false}
      />
      <Text style={[styles.detail, { color: c.text.muted }]}>
        Day {elapsed} of {totalDays}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.semibold,
  },
  days: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  detail: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
