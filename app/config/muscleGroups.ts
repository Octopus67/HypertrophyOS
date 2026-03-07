;
import { getThemeColors } from '../hooks/useThemeColors';

export interface MuscleGroupConfig {
  key: string;
  label: string;
  color: string;
}

export const MUSCLE_GROUP_CONFIG: MuscleGroupConfig[] = [
  { key: 'chest', label: 'Chest', color: getThemeColors().semantic.negative },
  { key: 'back', label: 'Back', color: getThemeColors().accent.primary },
  { key: 'shoulders', label: 'Shoulders', color: getThemeColors().accent.primaryHover },
  { key: 'biceps', label: 'Biceps', color: getThemeColors().semantic.warning },
  { key: 'triceps', label: 'Triceps', color: getThemeColors().semantic.caution },
  { key: 'quads', label: 'Quads', color: getThemeColors().semantic.positive },
  { key: 'hamstrings', label: 'Hamstrings', color: getThemeColors().macro.carbs },
  { key: 'glutes', label: 'Glutes', color: getThemeColors().premium.gold },
  { key: 'calves', label: 'Calves', color: getThemeColors().accent.primary },
  { key: 'abs', label: 'Abs', color: getThemeColors().semantic.warning },
  { key: 'traps', label: 'Traps', color: getThemeColors().accent.primaryHover },
  { key: 'forearms', label: 'Forearms', color: getThemeColors().semantic.caution },
  { key: 'full_body', label: 'Full Body', color: getThemeColors().accent.primary },
];

export function getMuscleGroupConfig(key: string): MuscleGroupConfig | undefined {
  return MUSCLE_GROUP_CONFIG.find((config) => config.key === key);
}
