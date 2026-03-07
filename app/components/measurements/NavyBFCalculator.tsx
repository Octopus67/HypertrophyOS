/**
 * NavyBFCalculator — Modal for estimating body fat using the U.S. Navy method.
 */

import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { ModalContainer } from '../common/ModalContainer';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { calculateNavyBF, inchesToCm, cmToInches } from '../../utils/navyBFCalculator';

interface NavyBFCalculatorProps {
  visible: boolean;
  onClose: () => void;
  onResult?: (bf: number) => void;
}

export function NavyBFCalculator({ visible, onClose, onResult }: NavyBFCalculatorProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const unitSystem = useStore((s) => s.unitSystem);
  const heightCm = useStore((s) => s.latestMetrics?.heightCm ?? 0);
  const isImperial = unitSystem === 'imperial';
  const lengthUnit = isImperial ? 'in' : 'cm';

  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState(
    heightCm > 0 ? String(isImperial ? cmToInches(heightCm) : Math.round(heightCm)) : '',
  );
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hips, setHips] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(() => {
    setError(null);
    setResult(null);

    const h = parseFloat(height);
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const hp = parseFloat(hips);

    if (isNaN(h) || h <= 0) { setError('Enter a valid height'); return; }
    if (isNaN(w) || w <= 0) { setError('Enter a valid waist measurement'); return; }
    if (isNaN(n) || n <= 0) { setError('Enter a valid neck measurement'); return; }
    if (sex === 'female' && (isNaN(hp) || hp <= 0)) { setError('Enter a valid hips measurement'); return; }

    const heightVal = isImperial ? inchesToCm(h) : h;
    const waistVal = isImperial ? inchesToCm(w) : w;
    const neckVal = isImperial ? inchesToCm(n) : n;
    const hipsVal = isImperial ? inchesToCm(hp) : hp;

    const bf = calculateNavyBF({
      sex, heightCm: heightVal, waistCm: waistVal, neckCm: neckVal, hipsCm: hipsVal,
    });

    if (bf === null) {
      setError('Could not calculate. Check your measurements.');
      return;
    }

    setResult(bf);
  }, [sex, height, waist, neck, hips, isImperial]);

  const handleUseResult = useCallback(() => {
    if (result !== null && onResult) {
      onResult(result);
      onClose();
    }
  }, [result, onResult, onClose]);

  return (
    <ModalContainer visible={visible} onClose={onClose} title="Navy BF Calculator" testID="navy-bf-modal">
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Sex selector */}
        <View style={[styles.segmentRow, { backgroundColor: getThemeColors().bg.surfaceRaised }]}>
          {(['male', 'female'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.segment, sex === s && styles.segmentActive]}
              onPress={() => { setSex(s); setResult(null); }}
              accessibilityRole="button"
              accessibilityState={{ selected: sex === s }}
            >
              <Text style={[styles.segmentText, sex === s && styles.segmentTextActive]}>
                {s === 'male' ? 'Male' : 'Female'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: getThemeColors().text.muted }]}>Height ({lengthUnit})</Text>
          <TextInput
            style={[styles.input, { color: getThemeColors().text.primary, backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.default }]} value={height} onChangeText={setHeight}
            keyboardType="decimal-pad" placeholder={isImperial ? '70' : '178'}
            placeholderTextColor={getThemeColors().text.muted} accessibilityLabel={`Height in ${lengthUnit}`}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: getThemeColors().text.muted }]}>Waist ({lengthUnit})</Text>
          <TextInput
            style={[styles.input, { color: getThemeColors().text.primary, backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.default }]} value={waist} onChangeText={setWaist}
            keyboardType="decimal-pad" placeholder={isImperial ? '34' : '86'}
            placeholderTextColor={getThemeColors().text.muted} accessibilityLabel={`Waist in ${lengthUnit}`}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: getThemeColors().text.muted }]}>Neck ({lengthUnit})</Text>
          <TextInput
            style={[styles.input, { color: getThemeColors().text.primary, backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.default }]} value={neck} onChangeText={setNeck}
            keyboardType="decimal-pad" placeholder={isImperial ? '15' : '38'}
            placeholderTextColor={getThemeColors().text.muted} accessibilityLabel={`Neck in ${lengthUnit}`}
          />
        </View>

        {sex === 'female' && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: getThemeColors().text.muted }]}>Hips ({lengthUnit})</Text>
            <TextInput
              style={[styles.input, { color: getThemeColors().text.primary, backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.default }]} value={hips} onChangeText={setHips}
              keyboardType="decimal-pad" placeholder={isImperial ? '38' : '96'}
              placeholderTextColor={getThemeColors().text.muted} accessibilityLabel={`Hips in ${lengthUnit}`}
            />
          </View>
        )}

        {error && <Text style={[styles.errorText, { color: getThemeColors().semantic.negative }]}>{error}</Text>}

        <Button title="Calculate" onPress={handleCalculate} style={styles.calcBtn} testID="navy-bf-calculate-btn" />

        {/* Result */}
        {result !== null && (
          <View style={[styles.resultCard, { backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().accent.primaryMuted }]}>
            <Text style={[styles.resultLabel, { color: getThemeColors().text.secondary }]}>Estimated Body Fat</Text>
            <Text style={[styles.resultValue, { color: getThemeColors().accent.primary }]}>{result.toFixed(1)}%</Text>
            {onResult && (
              <Button
                title="Use This Value"
                onPress={handleUseResult}
                variant="secondary"
                style={styles.useBtn}
                testID="navy-bf-use-btn"
              />
            )}
          </View>
        )}
      </ScrollView>
    </ModalContainer>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  segmentRow: {
    flexDirection: 'row', backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.sm, padding: 2, marginBottom: spacing[4],
  },
  segment: {
    flex: 1, alignItems: 'center', paddingVertical: spacing[2], borderRadius: radius.sm - 2,
  },
  segmentActive: { backgroundColor: getThemeColors().accent.primary },
  segmentText: {
    color: getThemeColors().text.secondary, fontSize: typography.size.sm, fontWeight: typography.weight.medium,
  },
  segmentTextActive: { color: getThemeColors().text.inverse, fontWeight: typography.weight.semibold },
  field: { marginBottom: spacing[3] },
  label: {
    color: getThemeColors().text.muted, fontSize: typography.size.sm,
    fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.sm,
    marginBottom: spacing[1],
  },
  input: {
    color: getThemeColors().text.primary, fontSize: typography.size.base,
    backgroundColor: getThemeColors().bg.surfaceRaised, borderRadius: radius.sm,
    borderWidth: 1, borderColor: getThemeColors().border.default,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
  },
  errorText: {
    color: getThemeColors().semantic.negative, fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm, marginBottom: spacing[2], textAlign: 'center',
  },
  calcBtn: { marginTop: spacing[2] },
  resultCard: {
    backgroundColor: getThemeColors().bg.surfaceRaised, borderRadius: radius.md,
    borderWidth: 1, borderColor: getThemeColors().accent.primaryMuted,
    padding: spacing[4], marginTop: spacing[4], alignItems: 'center',
  },
  resultLabel: {
    color: getThemeColors().text.secondary, fontSize: typography.size.sm,
    fontWeight: typography.weight.medium, lineHeight: typography.lineHeight.sm,
  },
  resultValue: {
    color: getThemeColors().accent.primary, fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold, marginTop: spacing[1],
    fontVariant: ['tabular-nums'], lineHeight: typography.lineHeight['2xl'],
  },
  useBtn: { marginTop: spacing[3], width: '100%' },
});
