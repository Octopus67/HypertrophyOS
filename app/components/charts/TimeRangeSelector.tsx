import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

const OPTIONS = ['7d', '14d', '30d', '90d'] as const;

interface TimeRangeSelectorProps {
  selected: string;
  onSelect: (range: string) => void;
}

export function TimeRangeSelector({ selected, onSelect }: TimeRangeSelectorProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  return (
    <View style={[styles.container, { backgroundColor: getThemeColors().bg.surfaceRaised }]}>
      {OPTIONS.map((option) => {
        const isActive = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segment, isActive && { backgroundColor: getThemeColors().accent.primary }]}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${option} time range`}
          >
            <Text style={[styles.label, { color: isActive ? getThemeColors().text.inverse : getThemeColors().text.secondary }]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.sm,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderRadius: radius.sm - 2,
  },
  segmentActive: {
    backgroundColor: getThemeColors().accent.primary,
  },
  label: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  labelActive: {
    color: getThemeColors().text.inverse,
    fontWeight: typography.weight.semibold,
  },
});
