import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface OnboardingTrialPromptProps {
  onStartTrial: () => void;
  onSkip: () => void;
  loading?: boolean;
}

const TRIAL_FEATURES = [
  'Advanced adaptive nutrition engine',
  '1:1 Coaching sessions',
  'Detailed analytics & insights',
  'Premium content library',
  'Health report analysis',
];

export function OnboardingTrialPrompt({
  onStartTrial,
  onSkip,
  loading,
}: OnboardingTrialPromptProps) {
  const c = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: getThemeColors().bg.surface }]}>
      <Icon name="star" size={40} color={getThemeColors().premium.gold} />
      <Text style={[styles.title, { color: getThemeColors().text.primary }]}>
        Try Premium Free for 7 Days
      </Text>
      <Text style={[styles.subtitle, { color: getThemeColors().text.secondary }]}>
        No credit card required. Full access to every feature.
      </Text>

      <View style={styles.features}>
        {TRIAL_FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Icon name="check" size={14} color={getThemeColors().semantic.positive} />
            <Text style={[styles.featureText, { color: getThemeColors().text.primary }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <Button
        title="Start Free Trial"
        onPress={onStartTrial}
        loading={loading}
        style={styles.cta}
      />
      <Button title="Skip for now" onPress={onSkip} variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  subtitle: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  features: {
    alignSelf: 'stretch',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  featureText: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  cta: {
    alignSelf: 'stretch',
    marginBottom: spacing[3],
  },
});
