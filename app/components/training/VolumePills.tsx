/**
 * VolumePills — Horizontal scrollable pills showing weekly muscle volume.
 *
 * Each pill: "Chest: 8/16 (MAV: 14-18)"
 * Color coding: green within MAV, yellow approaching, red exceeding.
 *
 * Requirements: 5.1, 5.4
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { MuscleVolumeEntry } from '../../utils/volumeAggregator';
import { typography, spacing, radius } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

export interface VolumePillsProps {
  muscleVolumes: MuscleVolumeEntry[];
  goalType?: string;
  goalMultiplier?: number;
}

function getPillColor(current: number, mavLow: number, mavHigh: number) {
  if (mavHigh <= 0) return { bg: getThemeColors().bg.surfaceRaised, text: getThemeColors().text.secondary };
  if (current > mavHigh) return { bg: getThemeColors().semantic.negativeSubtle, text: getThemeColors().semantic.negative };
  if (current >= mavHigh * 0.9) return { bg: getThemeColors().semantic.warningSubtle, text: getThemeColors().semantic.warning };
  if (current >= mavLow) return { bg: getThemeColors().semantic.positiveSubtle, text: getThemeColors().semantic.positive };
  return { bg: getThemeColors().bg.surfaceRaised, text: getThemeColors().text.secondary };
}

export const VolumePills: React.FC<VolumePillsProps> = ({ muscleVolumes, goalMultiplier }) => {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  if (!muscleVolumes.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {muscleVolumes.map((entry) => {
        const pillColor = getPillColor(entry.currentSets, entry.mavLow, entry.mavHigh);
        return (
          <View
            key={entry.muscleGroup}
            style={[styles.pill, { backgroundColor: pillColor.bg }]}
            accessibilityLabel={`${entry.muscleGroup}: ${entry.currentSets} sets, MAV ${entry.mavLow} to ${entry.mavHigh}`}
            accessibilityRole="text"
          >
            <Text style={[styles.pillText, { color: pillColor.text }]}>
              {entry.muscleGroup}: {entry.currentSets}
              {entry.mavHigh > 0 ? ` (MAV: ${entry.mavLow}-${entry.mavHigh})` : ''}
            </Text>
            {goalMultiplier && goalMultiplier !== 1.0 && (
              <Text style={styles.adjustmentText}>
                {goalMultiplier < 1.0
                  ? `Adjusted for cutting (-${Math.round((1 - goalMultiplier) * 100)}%)`
                  : `Adjusted for bulking (+${Math.round((goalMultiplier - 1) * 100)}%)`}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  pill: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  adjustmentText: {
    fontSize: typography.size.xs,
    color: getThemeColors().text.muted,
    marginTop: spacing[0.5],
  },
});

export default VolumePills;
