/**
 * WorkoutSummaryScreen — Post-workout celebration and summary
 *
 * Shows after finishing a workout, before returning to dashboard.
 * Displays workout stats, exercise breakdown, and personal records.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { spacing, typography, radius, shadows } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { formatDuration } from '../../utils/durationFormat';
import type { PersonalRecordResponse } from '../../types/training';
import type { WorkoutSummaryResult } from '../../utils/workoutSummary';
import { Icon } from '../../components/common/Icon';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkoutSummaryScreenParams {
  summary: WorkoutSummaryResult;
  duration: number; // seconds
  personalRecords: PersonalRecordResponse[];
  exerciseBreakdown: Array<{
    exerciseName: string;
    setsCompleted: number;
    bestSet: { weight: string; reps: string } | null;
  }>;
}

interface WorkoutSummaryScreenProps {
  route: { params: WorkoutSummaryScreenParams };
  navigation: any;
}

// ─── Components ──────────────────────────────────────────────────────────────

function CheckmarkIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={getThemeColors().semantic.positive}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={[getStyles().statCard, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}>
      <Text style={[getStyles().statValue, { color: getThemeColors().text.primary }]}>{value}</Text>
      <Text style={[getStyles().statLabel, { color: getThemeColors().text.secondary }]}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function WorkoutSummaryScreen({ route, navigation }: WorkoutSummaryScreenProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const { summary, duration, personalRecords, exerciseBreakdown } = route.params;
  const [sharePromptDismissed, setSharePromptDismissed] = useState(false);
  const { enabled: sharingEnabled } = useFeatureFlag('social_sharing');

  const handleDone = () => {
    navigation.navigate('DashboardHome');
  };

  const handleShareWorkout = useCallback(() => {
    // Navigate back to session detail with share modal open
    // For now, show a prompt that the feature is available from session detail
    Alert.alert(
      'Share Your Workout 💪',
      'You can share a branded workout card from the Session Detail screen. Tap the share icon in the header!',
      [{ text: 'Got it', style: 'default' }],
    );
    setSharePromptDismissed(true);
  }, []);

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  return (
    <SafeAreaView style={[getStyles().container, { backgroundColor: getThemeColors().bg.base }]} edges={['top']}>
      <ScrollView style={getStyles().scroll} contentContainerStyle={getStyles().scrollContent}>
        {/* Header */}
        <View style={getStyles().header}>
          <CheckmarkIcon />
          <Text style={[getStyles().title, { color: getThemeColors().text.primary }]}>Workout Complete</Text>
        </View>

        {/* Stats Row */}
        <View style={getStyles().statsRow}>
          <StatCard label="Duration" value={formatDuration(duration)} />
          <StatCard label="Exercises" value={summary.exerciseCount.toString()} />
          <StatCard label="Sets" value={summary.setCount.toString()} />
          <StatCard label="Volume" value={formatVolume(summary.totalVolumeKg)} />
        </View>

        {/* Exercise Breakdown */}
        <View style={getStyles().section}>
          <Text style={[getStyles().sectionTitle, { color: getThemeColors().text.primary }]}>Exercise Breakdown</Text>
          <View style={[getStyles().sectionContent, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}>
            {exerciseBreakdown.map((exercise, index) => (
              <View
                key={index}
                style={[
                  getStyles().exerciseItem,
                  index === exerciseBreakdown.length - 1 && getStyles().exerciseItemLast,
                ]}
              >
                <View style={getStyles().exerciseHeader}>
                  <Text style={[getStyles().exerciseName, { color: getThemeColors().text.primary }]}>{exercise.exerciseName}</Text>
                  <Text style={[getStyles().setsCount, { color: getThemeColors().text.secondary }]}>{exercise.setsCompleted} sets</Text>
                </View>
                {exercise.bestSet && (
                  <Text style={[getStyles().bestSet, { color: getThemeColors().text.muted }]}>
                    Best: {exercise.bestSet.weight}kg × {exercise.bestSet.reps}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <View style={getStyles().section}>
            <Text style={[getStyles().sectionTitle, { color: getThemeColors().text.primary }]}>Personal Records</Text>
            <View style={[getStyles().sectionContent, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}>
              {personalRecords.map((pr, index) => (
                <View
                  key={index}
                  style={[
                    getStyles().prItem,
                    index === personalRecords.length - 1 && getStyles().prItemLast,
                  ]}
                >
                  <View style={getStyles().prHeader}>
                    <Text style={[getStyles().prExercise, { color: getThemeColors().text.primary }]}>{pr.exercise_name}</Text>
                    <Text style={[getStyles().prImprovement, { color: getThemeColors().accent.primary }]}>
                      {pr.previous_weight_kg
                        ? `+${(pr.new_weight_kg - pr.previous_weight_kg).toFixed(1)}kg`
                        : 'New PR!'}
                    </Text>
                  </View>
                  <Text style={[getStyles().prDetails, { color: getThemeColors().text.secondary }]}>
                    {pr.new_weight_kg}kg × {pr.reps} reps
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Share Prompt — shown when PRs exist and sharing enabled */}
        {sharingEnabled && personalRecords.length > 0 && !sharePromptDismissed && (
          <TouchableOpacity
            style={[getStyles().sharePrompt, { backgroundColor: getThemeColors().accent.primaryMuted, borderColor: getThemeColors().accent.primary }]}
            onPress={handleShareWorkout}
            accessibilityLabel="Share your personal records"
            accessibilityRole="button"
            testID="share-pr-prompt"
          >
            <Icon name="share" size={20} color={getThemeColors().accent.primary} />
            <View style={getStyles().sharePromptText}>
              <Text style={[getStyles().sharePromptTitle, { color: getThemeColors().text.primary }]}>
                New PR{personalRecords.length > 1 ? 's' : ''}! Share your achievement?
              </Text>
              <Text style={[getStyles().sharePromptSub, { color: getThemeColors().text.secondary }]}>
                Create a branded card to share with friends
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Done Button */}
      <View style={[getStyles().bottomBar, { borderTopColor: getThemeColors().border.subtle }]}>
        <TouchableOpacity
          style={[getStyles().doneButton, { backgroundColor: getThemeColors().accent.primary }]}
          onPress={handleDone}
          accessibilityLabel="Done"
          accessibilityRole="button"
        >
          <Text style={[getStyles().doneButtonText, { color: getThemeColors().text.primary }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

/** Lazy styles for module-level helpers */
function getStyles() { return getThemedStyles(getThemeColors()); }

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getThemeColors().bg.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  title: {
    color: getThemeColors().text.primary,
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
    marginTop: spacing[3],
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  statCard: {
    flex: 1,
    backgroundColor: getThemeColors().bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
    padding: spacing[4],
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginTop: spacing[1],
  },

  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[3],
  },
  sectionContent: {
    backgroundColor: getThemeColors().bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
    ...shadows.sm,
  },

  exerciseItem: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: getThemeColors().border.subtle,
  },
  exerciseItemLast: {
    borderBottomWidth: 0,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  exerciseName: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  setsCount: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  bestSet: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.sm,
    fontVariant: ['tabular-nums'],
  },

  prItem: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: getThemeColors().border.subtle,
    backgroundColor: getThemeColors().accent.primaryMuted,
  },
  prItemLast: {
    borderBottomWidth: 0,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  prExercise: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  prImprovement: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  prDetails: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontVariant: ['tabular-nums'],
  },

  bottomBar: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: getThemeColors().border.subtle,
  },
  sharePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  sharePromptText: { flex: 1 },
  sharePromptTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  sharePromptSub: {
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: getThemeColors().accent.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    ...shadows.sm,
  },
  doneButtonText: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});