import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';

interface PremiumBadgeProps {
  size?: 'sm' | 'md';
}

export function PremiumBadge({ size = 'sm' }: PremiumBadgeProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  return (
    <View style={[styles.badge, size === 'md' && styles.badgeMd]}>
      <Icon name="star" size={14} color={getThemeColors().premium.gold} />
      <Text style={[styles.label, size === 'md' && styles.labelMd]}>PRO</Text>
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getThemeColors().premium.goldSubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    gap: 2,
  },
  badgeMd: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    gap: 4,
  },
  icon: {},
  iconMd: {},
  label: {
    color: getThemeColors().premium.gold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.semibold,
  },
  labelMd: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
