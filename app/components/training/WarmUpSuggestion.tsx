import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { generateWarmUpSets, WarmUpSet } from '../../utils/warmUpGenerator';
import { spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface WarmUpSuggestionProps {
  workingWeightKg: number;
  barWeightKg: number;
  onGenerate: (sets: WarmUpSet[]) => void;
}

export function WarmUpSuggestion({ workingWeightKg, barWeightKg, onGenerate }: WarmUpSuggestionProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const [generated, setGenerated] = useState(false);

  if (generated || workingWeightKg <= barWeightKg) return null;

  const handlePress = () => {
    const sets = generateWarmUpSets(workingWeightKg, barWeightKg);
    onGenerate(sets);
    setGenerated(true);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button}>
      <Text style={[styles.text, { color: getThemeColors().accent.primary }]}>Generate Warm-Up →</Text>
    </TouchableOpacity>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  button: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  text: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: getThemeColors().accent.primary,
  },
});
