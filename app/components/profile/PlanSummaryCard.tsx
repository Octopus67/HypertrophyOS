import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, letterSpacing as ls } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { formatSummaryFields } from '../../utils/editPlanLogic';

interface PlanSummaryCardProps {
  metrics: {
    id: string;
    heightCm: number | null;
    weightKg: number | null;
    bodyFatPct: number | null;
    activityLevel: string | null;
    recordedAt: string;
  } | null;
  goals: {
    id: string;
    userId: string;
    goalType: string;
    targetWeightKg: number | null;
    goalRatePerWeek: number | null;
  } | null;
  adaptiveTargets: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  } | null;
  unitSystem: 'metric' | 'imperial';
  onEdit: () => void;
}

const DASH = '—';

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={getStyles().labelValue}>
      <Text style={[getStyles().label, { color: getThemeColors().text.muted }]}>{label}</Text>
      <Text style={[getStyles().value, value === DASH && getStyles().valueMuted]}>
        {value}
      </Text>
    </View>
  );
}

export function PlanSummaryCard({
  metrics,
  goals,
  adaptiveTargets,
  unitSystem,
  onEdit,
}: PlanSummaryCardProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const fields = formatSummaryFields(metrics, goals, adaptiveTargets, unitSystem);

  return (
    <Card>
      {/* Section header */}
      <View style={getStyles().header}>
        <Icon name="clipboard" size={20} color={getThemeColors().accent.primary} />
        <Text style={[getStyles().sectionTitle, { color: getThemeColors().text.primary }]}>My Plan</Text>
      </View>

      {/* Body stats row */}
      <View style={getStyles().row}>
        <LabelValue label="Weight" value={fields.weight} />
        <LabelValue label="Height" value={fields.height} />
        <LabelValue label="Body Fat" value={fields.bodyFat} />
        <LabelValue label="Activity" value={fields.activityLevel} />
      </View>

      {/* Goals row */}
      <View style={getStyles().row}>
        <LabelValue label="Goal" value={fields.goalType} />
        <LabelValue label="Target" value={fields.targetWeight} />
        <LabelValue label="Rate" value={fields.goalRate} />
      </View>

      {/* TDEE targets grid */}
      <View style={[getStyles().divider, { backgroundColor: getThemeColors().border.subtle }]} />
      <Text style={[getStyles().targetsHeader, { color: getThemeColors().text.secondary }]}>TDEE Targets</Text>
      <View style={getStyles().targetsGrid}>
        <View style={getStyles().targetItem}>
          <Text style={[getStyles().targetValue, { color: getThemeColors().macro.calories }, fields.calories === DASH && getStyles().valueMuted]}>
            {fields.calories}
          </Text>
          <Text style={[getStyles().targetLabel, { color: getThemeColors().text.muted }]}>kcal</Text>
        </View>
        <View style={getStyles().targetItem}>
          <Text style={[getStyles().targetValue, { color: getThemeColors().macro.protein }, fields.protein === DASH && getStyles().valueMuted]}>
            {fields.protein}
          </Text>
          <Text style={[getStyles().targetLabel, { color: getThemeColors().text.muted }]}>protein</Text>
        </View>
        <View style={getStyles().targetItem}>
          <Text style={[getStyles().targetValue, { color: getThemeColors().macro.carbs }, fields.carbs === DASH && getStyles().valueMuted]}>
            {fields.carbs}
          </Text>
          <Text style={[getStyles().targetLabel, { color: getThemeColors().text.muted }]}>carbs</Text>
        </View>
        <View style={getStyles().targetItem}>
          <Text style={[getStyles().targetValue, { color: getThemeColors().macro.fat }, fields.fat === DASH && getStyles().valueMuted]}>
            {fields.fat}
          </Text>
          <Text style={[getStyles().targetLabel, { color: getThemeColors().text.muted }]}>fat</Text>
        </View>
      </View>

      {/* Edit CTA */}
      <View style={getStyles().buttonContainer}>
        <Button title="Edit My Plan" onPress={onEdit} variant="secondary" />
      </View>
    </Card>
  );
}


/** Lazy styles for module-level helpers */
function getStyles() { return getThemedStyles(getThemeColors()); }

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[3],
  },
  labelValue: {
    minWidth: 80,
    flex: 1,
    marginBottom: spacing[1],
  },
  label: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[1],
  },
  value: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  valueMuted: {
    color: getThemeColors().text.muted,
  },
  divider: {
    height: 1,
    backgroundColor: getThemeColors().border.subtle,
    marginBottom: spacing[3],
  },
  targetsHeader: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: ls.wide,
    marginBottom: spacing[3],
  },
  targetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  targetItem: {
    alignItems: 'center',
    flex: 1,
  },
  targetValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[1],
  },
  targetLabel: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  buttonContainer: {
    marginTop: spacing[1],
  },
});
