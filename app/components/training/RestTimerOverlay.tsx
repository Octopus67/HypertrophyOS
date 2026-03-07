/**
 * RestTimerOverlay — Full-screen overlay wrapping RestTimerRing.
 *
 * Controls: [-15s] [Pause/Resume] [+15s] [Skip]
 * Auto-starts countdown on mount. Plays notification sound on completion.
 * Shows "Rest Complete" text when timer reaches zero.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { RestTimerRing } from './RestTimerRing';
import { spacing, typography, radius } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

type TimerState = 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface RestTimerOverlayProps {
  /** Total rest duration in seconds */
  durationSeconds: number;
  /** Whether the overlay is visible */
  visible: boolean;
  /** Called when the timer is dismissed (skip or after completion) */
  onDismiss: () => void;
  /** Called when the countdown reaches zero */
  onComplete?: () => void;
}

export function RestTimerOverlay({
  durationSeconds,
  visible,
  onDismiss,
  onComplete,
}: RestTimerOverlayProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const [state, setState] = useState<TimerState>('RUNNING');
  const [remaining, setRemaining] = useState(durationSeconds);
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset when visibility or duration changes
  useEffect(() => {
    if (visible) {
      setRemaining(durationSeconds);
      setTotalDuration(durationSeconds);
      setState('RUNNING');
    } else {
      clearTimer();
    }
  }, [visible, durationSeconds, clearTimer]);

  // Countdown interval
  useEffect(() => {
    if (!visible || state !== 'RUNNING') {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setState('COMPLETED');
          playCompletionSound();
          setTimeout(() => onCompleteRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [visible, state, clearTimer]);

  const handlePauseResume = useCallback(() => {
    setState((s) => (s === 'RUNNING' ? 'PAUSED' : 'RUNNING'));
  }, []);

  const handleSkip = useCallback(() => {
    clearTimer();
    onDismiss();
  }, [onDismiss, clearTimer]);

  const handleAdjust = useCallback((delta: number) => {
    setRemaining((prev) => Math.max(0, prev + delta));
    setTotalDuration((prev) => Math.max(1, prev + delta));
  }, []);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: getThemeColors().bg.overlay }]}>
        <View style={[styles.container, { backgroundColor: getThemeColors().bg.surfaceRaised }]}>
          <Text style={[styles.label, { color: getThemeColors().text.secondary }]}>Rest Timer</Text>

          {/* SVG Progress Ring */}
          <RestTimerRing
            durationSeconds={totalDuration}
            remainingSeconds={remaining}
            paused={state === 'PAUSED'}
          />

          {/* Rest Complete indicator */}
          {state === 'COMPLETED' && (
            <Text style={[styles.completeText, { color: getThemeColors().semantic.positive }]}>Rest Complete</Text>
          )}

          {/* Adjust buttons */}
          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}
              onPress={() => handleAdjust(-15)}
              activeOpacity={0.7}
            >
              <Text style={[styles.adjustText, { color: getThemeColors().text.secondary }]}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}
              onPress={() => handleAdjust(15)}
              activeOpacity={0.7}
            >
              <Text style={[styles.adjustText, { color: getThemeColors().text.secondary }]}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {state !== 'COMPLETED' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: getThemeColors().accent.primary }]}
                onPress={handlePauseResume}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: getThemeColors().text.primary }]}>
                  {state === 'PAUSED' ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.skipBtn, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipText, { color: getThemeColors().text.secondary }]}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Sound helper ────────────────────────────────────────────────────────────

function playCompletionSound() {
  try {
    const { Audio } = require('expo-av');
    Audio.Sound.createAsync(require('../../assets/timer-done.mp3')).catch(() => {});
  } catch {
    // expo-av not available — silent fallback
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: getThemeColors().bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: spacing[8],
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.lg,
    minWidth: 280,
  },
  label: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[4],
  },
  completeText: {
    color: getThemeColors().semantic.positive,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  adjustRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  adjustBtn: {
    backgroundColor: getThemeColors().bg.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
  },
  adjustText: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionBtn: {
    backgroundColor: getThemeColors().accent.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
  },
  actionText: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  skipBtn: {
    backgroundColor: getThemeColors().bg.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
  },
  skipText: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
  },
});
