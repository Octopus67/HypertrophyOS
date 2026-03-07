import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, radius, shadows } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface TemplateRowProps {
  name: string;
  exerciseCount: number;
  onStart: () => void;
}

export function TemplateRow({ name, exerciseCount, onStart }: TemplateRowProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  return (
    <View style={[styles.card, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.subtle }]}>
      <View style={styles.content}>
        <Text style={[styles.name, { color: getThemeColors().text.primary }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.badge, { color: getThemeColors().text.secondary }]}>
          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>
      <TouchableOpacity style={[styles.startButton, { backgroundColor: getThemeColors().accent.primary }]} onPress={onStart} activeOpacity={0.8}>
        <Text style={[styles.startText, { color: getThemeColors().text.inverse }]}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: getThemeColors().bg.surface,
    borderColor: getThemeColors().border.subtle,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  name: {
    flex: 1,
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  badge: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  startButton: {
    backgroundColor: getThemeColors().accent.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
    marginLeft: spacing[3],
    ...shadows.sm,
  },
  startText: {
    color: getThemeColors().text.inverse,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
