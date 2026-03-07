import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, radius } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface GoalProgressPillProps {
  goalType: string;
  targetCalories: number;
}

export default function GoalProgressPill({ goalType, targetCalories }: GoalProgressPillProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const getGoalLabel = (type: string) => {
    switch (type) {
      case 'cutting': return 'Cutting';
      case 'bulking': return 'Bulking';
      case 'maintaining': return 'Maintaining';
      case 'recomposition': return 'Recomp';
      default: return 'Goal';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.subtle }]}>
      <Text style={[styles.text, { color: getThemeColors().text.secondary }]}>
        {getGoalLabel(goalType)} · {targetCalories} cal
      </Text>
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: getThemeColors().bg.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: getThemeColors().border.subtle,
  },
  text: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: getThemeColors().text.secondary,
    lineHeight: typography.lineHeight.sm,
  },
});