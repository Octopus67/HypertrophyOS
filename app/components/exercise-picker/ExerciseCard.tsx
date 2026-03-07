import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { Exercise } from '../../types/exercise';
import { getMuscleGroupConfig } from '../../config/muscleGroups';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { MuscleGroupIcon } from './MuscleGroupIcon';
import { API_BASE_URL } from '../../services/api';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  onLongPress?: (exercise: Exercise) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveImageUrl(url: string): string {
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

export function ExerciseCard({ exercise, onPress, onLongPress }: ExerciseCardProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const config = getMuscleGroupConfig(exercise.muscle_group);
  const bgColor = config?.color ?? '#2563EB';
  const [imgError, setImgError] = useState(false);

  const showImage = exercise.image_url != null && exercise.image_url !== '' && !imgError;

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: getThemeColors().border.subtle }]}
      onPress={() => onPress(exercise)}
      onLongPress={onLongPress ? () => onLongPress(exercise) : undefined}
      activeOpacity={0.7}
      accessibilityLabel={`${exercise.name}, ${exercise.equipment}, ${exercise.category}`}
      accessibilityRole="button"
    >
      {showImage ? (
        <Image
          source={{ uri: resolveImageUrl(exercise.image_url!) }}
          style={styles.image}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[styles.abbrevCircle, { backgroundColor: hexToRgba(bgColor, 0.15) }]}>
          <MuscleGroupIcon muscleGroup={exercise.muscle_group} size={20} color={bgColor} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, { color: getThemeColors().text.primary }]} numberOfLines={1}>{exercise.name}</Text>
        <View style={styles.tagRow}>
          <View style={[styles.equipmentTag, { backgroundColor: getThemeColors().accent.primaryMuted }]}>
            <Text style={[styles.tagText, { color: getThemeColors().text.secondary }]}>{exercise.equipment.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.categoryTag, exercise.category === 'isolation' && styles.isolationTag]}>
            <Text style={[styles.tagText, { color: getThemeColors().text.secondary }]}>{exercise.category}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.chevron, { color: getThemeColors().text.muted }]}>›</Text>
    </TouchableOpacity>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: getThemeColors().border.subtle,
  },
  abbrevCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  info: {
    flex: 1,
    marginLeft: spacing[3],
  },
  name: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: 4,
  },
  equipmentTag: {
    backgroundColor: getThemeColors().accent.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  categoryTag: {
    backgroundColor: getThemeColors().semantic.positiveSubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  isolationTag: {
    backgroundColor: getThemeColors().semantic.warningSubtle,
  },
  tagText: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  chevron: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    marginLeft: spacing[2],
  },
});
