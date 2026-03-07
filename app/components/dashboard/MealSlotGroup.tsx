import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, radius } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { MealSlotData, MealSlotName } from '../../utils/mealSlotLogic';
import { formatEntryTime, sortEntriesChronologically } from '../../utils/timestampFormat';

interface MealSlotGroupProps {
  slot: MealSlotData;
  onAddToSlot: (slotName: MealSlotName) => void;
}

export function MealSlotGroup({ slot, onAddToSlot }: MealSlotGroupProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const [expanded, setExpanded] = useState(true);
  const hasEntries = slot.entries.length > 0;
  const sorted = hasEntries ? sortEntriesChronologically(slot.entries) : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={[styles.header, { backgroundColor: getThemeColors().bg.surfaceRaised }]}
        onPress={() => hasEntries && setExpanded(!expanded)}
        activeOpacity={hasEntries ? 0.7 : 1}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.slotName, { color: getThemeColors().text.primary }]}>{slot.name}</Text>
          {hasEntries && (
            <Text style={[styles.chevron, { color: getThemeColors().text.muted }]}>{expanded ? '▾' : '▸'}</Text>
          )}
        </View>
        <Text style={[styles.slotCalories, { color: getThemeColors().text.secondary }]}>
          {Math.round(slot.totals.calories)} kcal
        </Text>
      </TouchableOpacity>

      {/* Body */}
      {hasEntries && expanded && (
        <View style={styles.body}>
          {sorted.map((entry) => {
            const time = formatEntryTime(entry.created_at);
            return (
              <View key={entry.id} style={[styles.entryRow, { borderBottomColor: getThemeColors().border.subtle }]}>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, { color: getThemeColors().text.primary }]} numberOfLines={1}>
                    {entry.meal_name}
                  </Text>
                  {time !== '' && (
                    <Text style={[styles.entryTime, { color: getThemeColors().text.muted }]}>{time}</Text>
                  )}
                </View>
                <Text style={[styles.entryCal, { color: getThemeColors().text.secondary }]}>{Math.round(entry.calories)} kcal</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Add button — always visible */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onAddToSlot(slot.name)}
        activeOpacity={0.7}
      >
        <Text style={[styles.addButtonText, { color: getThemeColors().accent.primary }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}


const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  slotName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: getThemeColors().text.primary,
  },
  chevron: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.muted,
  },
  slotCalories: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.secondary,
    fontWeight: typography.weight.medium,
  },
  body: {
    paddingLeft: spacing[3],
    paddingTop: spacing[1],
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: getThemeColors().border.subtle,
  },
  entryInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  entryName: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.primary,
  },
  entryTime: {
    fontSize: typography.size.xs,
    color: getThemeColors().text.muted,
    marginTop: 1,
  },
  entryCal: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.secondary,
  },
  addButton: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  addButtonText: {
    fontSize: typography.size.lg,
    color: getThemeColors().accent.primary,
    fontWeight: typography.weight.bold,
  },
});
