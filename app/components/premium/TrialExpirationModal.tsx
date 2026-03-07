import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import type { TrialInsights } from '../../utils/trialLogic';

interface TrialExpirationModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  insights: TrialInsights | null;
}

export function TrialExpirationModal({
  visible,
  onClose,
  onUpgrade,
  insights,
}: TrialExpirationModalProps) {
  const c = useThemeColors();

  const stats = insights
    ? [
        { label: 'Workouts logged', value: insights.workouts_logged, icon: 'dumbbell' as const },
        { label: 'PRs hit', value: insights.prs_hit, icon: 'trophy' as const },
        { label: 'Volume lifted', value: `${Math.round(insights.total_volume_kg).toLocaleString()} kg`, icon: 'chart' as const },
        { label: 'Meals logged', value: insights.meals_logged, icon: 'utensils' as const },
        { label: 'Measurements', value: insights.measurements_tracked, icon: 'scale' as const },
      ]
    : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: c.bg.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: c.bg.surface }]}>
          <View style={[styles.handle, { backgroundColor: c.border.default }]} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: c.text.primary }]}>
              Your Trial Has Ended
            </Text>
            <Text style={[styles.subtitle, { color: c.text.secondary }]}>
              Here's what you accomplished in 7 days
            </Text>

            {stats.length > 0 && (
              <View style={styles.statsGrid}>
                {stats.map((stat) => (
                  <View
                    key={stat.label}
                    style={[styles.statCard, { backgroundColor: c.bg.surfaceRaised }]}
                  >
                    <Icon name={stat.icon} size={20} color={c.accent.primary} />
                    <Text style={[styles.statValue, { color: c.text.primary }]}>
                      {stat.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: c.text.muted }]}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Button title="Upgrade to Premium" onPress={onUpgrade} style={styles.cta} />
            <Button
              title="Maybe later"
              onPress={onClose}
              variant="ghost"
              style={styles.dismiss}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing[6],
    paddingBottom: spacing[10],
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    width: '47%',
    borderRadius: radius.md,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[1],
  },
  statValue: {
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.semibold,
  },
  statLabel: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  cta: {
    marginBottom: spacing[3],
  },
  dismiss: {},
});
