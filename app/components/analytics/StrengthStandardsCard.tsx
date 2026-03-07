import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';

interface Classification {
  exercise_name: string;
  e1rm_kg: number;
  bodyweight_kg: number;
  bodyweight_ratio: number;
  level: string;
  next_level: string | null;
  next_level_threshold_kg: number | null;
}

interface StrengthStandardsCardProps {
  classifications: Classification[];
  bodyweightKg: number | null;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: getThemeColors().text.muted,
  intermediate: getThemeColors().semantic.warning,
  advanced: getThemeColors().accent.primary,
  elite: getThemeColors().premium.gold,
};

function formatExerciseName(name: string): string {
  return name.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function LevelBadge({ level }: { level: string }) {
  const color = LEVEL_COLORS[level] ?? getThemeColors().text.muted;
  return (
    <View style={[getStyles().badge, { borderColor: color }]}>
      <Text style={[getStyles().badgeText, { color }]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Text>
    </View>
  );
}

export function StrengthStandardsCard({ classifications, bodyweightKg }: StrengthStandardsCardProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  if (bodyweightKg == null) {
    return (
      <Card>
        <View style={getStyles().emptyContainer}>
          <Icon name="scale" size={24} color={getThemeColors().text.muted} />
          <Text style={[getStyles().emptyText, { color: getThemeColors().text.muted }]}>Log your bodyweight to see strength standards</Text>
        </View>
      </Card>
    );
  }

  if (classifications.length === 0) {
    return (
      <Card>
        <View style={getStyles().emptyContainer}>
          <Icon name="dumbbell" size={24} color={getThemeColors().text.muted} />
          <Text style={[getStyles().emptyText, { color: getThemeColors().text.muted }]}>Log training sessions with supported lifts to see standards</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      {classifications.map((c, idx) => (
        <View key={c.exercise_name} style={[getStyles().row, idx > 0 && getStyles().rowBorder]}>
          <View style={getStyles().rowLeft}>
            <Text style={[getStyles().exerciseName, { color: getThemeColors().text.primary }]}>{formatExerciseName(c.exercise_name)}</Text>
            <Text style={[getStyles().ratio, { color: getThemeColors().text.secondary }]}>{c.bodyweight_ratio.toFixed(2)}× BW</Text>
          </View>
          <View style={getStyles().rowRight}>
            <LevelBadge level={c.level} />
            <Text style={[getStyles().e1rm, { color: getThemeColors().text.secondary }]}>{Math.round(c.e1rm_kg)} kg</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

/** Lazy styles for module-level helpers */
function getStyles() { return getThemedStyles(getThemeColors()); }

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  emptyText: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: getThemeColors().border.subtle,
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: spacing[1] },
  exerciseName: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  ratio: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  e1rm: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
});
