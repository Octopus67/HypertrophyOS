import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, radius } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Skeleton } from '../common/Skeleton';
import { Icon } from '../common/Icon';

interface DayBadgeProps {
  isTrainingDay: boolean;
  muscleGroups: string[];
  isLoading: boolean;
}

export function DayBadge({ isTrainingDay, muscleGroups, isLoading }: DayBadgeProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton width={200} height={32} borderRadius={16} />
      </View>
    );
  }

  if (isTrainingDay) {
    return (
      <View style={styles.container}>
        <Icon name="dumbbell" size={16} color={getThemeColors().accent.primary} />
        <Text style={[styles.trainingText, { color: getThemeColors().accent.primary }]}>Training Day</Text>
        {muscleGroups.map((group) => (
          <View key={group} style={[styles.chip, { backgroundColor: getThemeColors().accent.primaryMuted }]}>
            <Text style={[styles.chipText, { color: getThemeColors().accent.primary }]}>{group}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Icon name="moon" size={16} color={getThemeColors().text.muted} />
      <Text style={[styles.restText, { color: getThemeColors().text.muted }]}>Rest Day</Text>
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    flexWrap: 'wrap',
  },
  trainingText: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  restText: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  chip: {
    backgroundColor: getThemeColors().accent.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  chipText: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size.xs,
  },
});
