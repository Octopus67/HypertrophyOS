import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';

interface TrialBadgeProps {
  daysRemaining: number;
}

export function TrialBadge({ daysRemaining }: TrialBadgeProps) {
  const c = useThemeColors();
  const isUrgent = daysRemaining <= 2;
  const bgColor = isUrgent ? getThemeColors().semantic.warningSubtle : getThemeColors().accent.primaryMuted;
  const textColor = isUrgent ? getThemeColors().semantic.warning : getThemeColors().accent.primary;

  return (
    <View
      style={[styles.badge, { backgroundColor: bgColor }]}
      accessibilityRole="text"
      accessibilityLabel={`Free trial: ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`}
    >
      <Icon name="calendar" size={12} color={textColor} />
      <Text style={[styles.label, { color: textColor }]}>
        {daysRemaining}d left
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    gap: 3,
  },
  label: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.semibold,
  },
});
