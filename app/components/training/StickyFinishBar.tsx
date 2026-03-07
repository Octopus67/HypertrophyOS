import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { radius, spacing, typography, shadows } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface StickyFinishBarProps {
  exerciseCount: number;
  setCount: number;
  durationFormatted: string;
  onFinish: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function StickyFinishBar({
  exerciseCount,
  setCount,
  durationFormatted,
  onFinish,
  loading,
  disabled,
}: StickyFinishBarProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const summaryText = `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} · ${setCount} set${setCount !== 1 ? 's' : ''} · ${durationFormatted}`;

  return (
    <View style={[styles.container, { backgroundColor: getThemeColors().bg.surfaceRaised, borderTopColor: getThemeColors().border.default }]}>
      <Text style={[styles.summary, { color: getThemeColors().text.secondary }]} numberOfLines={1} accessibilityRole="text" accessibilityLabel={summaryText}>{summaryText}</Text>
      <TouchableOpacity
        style={[styles.finishBtn, loading && styles.finishBtnDisabled]}
        onPress={onFinish}
        disabled={loading || disabled}
        accessibilityLabel="Finish Workout"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text style={[styles.finishText, { color: getThemeColors().text.primary }]}>
          {loading ? 'Saving…' : 'Finish Workout'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderTopWidth: 1,
    borderTopColor: getThemeColors().border.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    ...shadows.md,
  },
  summary: {
    flex: 1,
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  finishBtn: {
    backgroundColor: getThemeColors().accent.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  finishBtnDisabled: {
    opacity: 0.5,
  },
  finishText: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight.base,
  },
});
