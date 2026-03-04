import { colors } from '../theme/tokens';

export interface MuscleGroupConfig {
  key: string;
  label: string;
  color: string;
}

export const MUSCLE_GROUP_CONFIG: MuscleGroupConfig[] = [
  { key: 'chest', label: 'Chest', color: colors.semantic.negative },
  { key: 'back', label: 'Back', color: colors.accent.primary },
  { key: 'shoulders', label: 'Shoulders', color: colors.accent.primaryHover },
  { key: 'biceps', label: 'Biceps', color: colors.semantic.warning },
  { key: 'triceps', label: 'Triceps', color: colors.semantic.caution },
  { key: 'quads', label: 'Quads', color: colors.semantic.positive },
  { key: 'hamstrings', label: 'Hamstrings', color: colors.macro.carbs },
  { key: 'glutes', label: 'Glutes', color: colors.premium.gold },
  { key: 'calves', label: 'Calves', color: colors.accent.primary },
  { key: 'abs', label: 'Abs', color: colors.semantic.warning },
  { key: 'traps', label: 'Traps', color: colors.accent.primaryHover },
  { key: 'forearms', label: 'Forearms', color: colors.semantic.caution },
  { key: 'full_body', label: 'Full Body', color: colors.accent.primary },
];

export function getMuscleGroupConfig(key: string): MuscleGroupConfig | undefined {
  return MUSCLE_GROUP_CONFIG.find((config) => config.key === key);
}
