/**
 * HUExplainerSheet — Explains how Hypertrophy Units are calculated.
 *
 * Triggered by "ⓘ" icon in volume pills and drill-down modals.
 * Uses ModalContainer for consistent modal behavior.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ModalContainer } from '../common/ModalContainer';
import { colors, spacing, typography, radius } from '../../theme/tokens';

interface HUExplainerSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    emoji: '💪',
    title: 'Stimulating Reps',
    body: 'Not all reps build muscle equally. Only the last ~5 reps before failure — when your muscles are fully recruited and moving slowly — create enough tension to trigger growth. We call these "stimulating reps."',
  },
  {
    emoji: '🎯',
    title: 'Proximity to Failure',
    body: 'Sets taken close to failure (0–3 reps in reserve) produce the most stimulating reps. Sets with 4+ reps in reserve produce almost no growth stimulus — that\'s "junk volume."',
  },
  {
    emoji: '🔗',
    title: 'Direct & Fractional Volume',
    body: 'Compound exercises train multiple muscles. Bench press gives your chest full credit (1.0×) but also gives your triceps partial credit (0.5×). We track both.',
  },
  {
    emoji: '📉',
    title: 'Diminishing Returns',
    body: 'Your 1st set of the day produces the most growth. Each additional set contributes less. 6 sets produce roughly 2× the stimulus of 1 set — not 6×.',
  },
  {
    emoji: '⏳',
    title: 'Recovery Between Sessions',
    body: 'Muscle protein synthesis stays elevated for ~48 hours after training. After that, a small amount of atrophy occurs until your next session. Training more frequently reduces this loss.',
  },
] as const;

const COLOR_LEGEND = [
  { label: 'Below MEV', desc: 'Not enough to grow', color: '#6B7280' },
  { label: 'Optimal', desc: 'Sweet spot for growth', color: '#22C55E' },
  { label: 'Approaching MRV', desc: 'High volume — watch recovery', color: '#EAB308' },
  { label: 'Above MRV', desc: 'Exceeding recovery capacity', color: '#EF4444' },
] as const;

export function HUExplainerSheet({ visible, onClose }: HUExplainerSheetProps) {
  return (
    <ModalContainer visible={visible} onClose={onClose} title="How Hypertrophy Units Work">
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Your HU score measures the actual growth stimulus reaching each muscle — not just how many sets you did.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.emoji} {section.title}
            </Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.legendSection}>
          <Text style={styles.sectionTitle}>🎨 What the Colors Mean</Text>
          {COLOR_LEGEND.map((item) => (
            <View key={item.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <View style={styles.legendText}>
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ModalContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 450,
  },
  intro: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[1],
  },
  sectionBody: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  legendSection: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  legendDesc: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
});
