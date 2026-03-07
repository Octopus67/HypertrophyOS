import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';
import { formatTimer } from '../../utils/formatTimer';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useHaptics } from '../../hooks/useHaptics';

interface RestTimerProps {
  durationSeconds: number;
  visible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
  onSettingsChange?: (compound: number, isolation: number) => void;
}

export function RestTimer({
  durationSeconds,
  visible,
  onDismiss,
  onComplete,
  onSettingsChange,
}: RestTimerProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compoundDraft, setCompoundDraft] = useState('180');
  const [isolationDraft, setIsolationDraft] = useState('90');

  // Reset remaining when duration or visibility changes
  useEffect(() => {
    if (visible) {
      setRemaining(durationSeconds);
      setSettingsOpen(false);
    }
  }, [visible, durationSeconds]);

  // Countdown interval
  useEffect(() => {
    if (!visible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Play sound (best-effort, don't crash if expo-av unavailable)
          try {
            const { Audio } = require('expo-av');
            Audio.Sound.createAsync(
              require('../../assets/timer-done.mp3'),
            ).catch(() => {});
          } catch {
            // expo-av not available — silent fallback
          }
          // Defer onComplete to avoid setState during render
          setTimeout(() => {
            hapticNotification('success');
            onCompleteRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible]);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onDismiss();
  }, [onDismiss]);

  const reduceMotion = useReduceMotion();
  const { notification: hapticNotification } = useHaptics();

  const toggleSettings = useCallback(() => {
    setSettingsOpen((prev) => !prev);
  }, []);

  const handleSaveSettings = useCallback(() => {
    const compound = parseInt(compoundDraft, 10);
    const isolation = parseInt(isolationDraft, 10);
    if (isNaN(compound) || isNaN(isolation) || compound <= 0 || isolation <= 0) return;
    onSettingsChange?.(compound, isolation);
    setSettingsOpen(false);
  }, [compoundDraft, isolationDraft, onSettingsChange]);

  /** Allow parent to pre-fill settings drafts */
  const updateDrafts = useCallback((compound: number, isolation: number) => {
    setCompoundDraft(String(compound));
    setIsolationDraft(String(isolation));
  }, []);

  // Keep drafts in sync when settings panel opens
  useEffect(() => {
    if (settingsOpen) {
      // Drafts are already set from parent via props or previous edits
    }
  }, [settingsOpen]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={[styles.overlay, { backgroundColor: getThemeColors().bg.overlay }]}>
        <View style={styles.container}>
          {/* Header with gear icon */}
          <View style={styles.header}>
            <Text style={[styles.label, { color: getThemeColors().text.secondary }]}>Rest Timer</Text>
            {onSettingsChange && (
              <TouchableOpacity
                style={styles.gearBtn}
                onPress={toggleSettings}
                activeOpacity={0.7}
              >
                <Icon name="gear" size={18} color={getThemeColors().text.muted} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.countdown, { color: getThemeColors().accent.primary }]}>{formatTimer(remaining)}</Text>

          {/* Inline settings panel */}
          {settingsOpen && (
            <Animated.View layout={reduceMotion ? undefined : Layout} style={[styles.settingsPanel, { backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.default }]}>
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { color: getThemeColors().text.secondary }]}>Compound rest (s)</Text>
                <TextInput
                  style={[styles.settingsInput, { color: getThemeColors().text.primary, backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}
                  value={compoundDraft}
                  onChangeText={setCompoundDraft}
                  keyboardType="numeric"
                  placeholderTextColor={getThemeColors().text.muted}
                />
              </View>
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { color: getThemeColors().text.secondary }]}>Isolation rest (s)</Text>
                <TextInput
                  style={[styles.settingsInput, { color: getThemeColors().text.primary, backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}
                  value={isolationDraft}
                  onChangeText={setIsolationDraft}
                  keyboardType="numeric"
                  placeholderTextColor={getThemeColors().text.muted}
                />
              </View>
              <TouchableOpacity
                style={[styles.settingsSaveBtn, { backgroundColor: getThemeColors().accent.primary }]}
                onPress={handleSaveSettings}
                activeOpacity={0.7}
              >
                <Text style={[styles.settingsSaveText, { color: getThemeColors().text.primary }]}>Save</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity style={[styles.skipBtn, { backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.default }]} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: getThemeColors().text.secondary }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/** Helper to pre-fill settings drafts from outside (used by AddTrainingModal) */
RestTimer.updateDrafts = undefined as
  | ((compound: number, isolation: number) => void)
  | undefined;

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
    minWidth: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  label: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.medium,
  },
  gearBtn: {
    padding: spacing[1],
  },
  gearIcon: {},
  countdown: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size['3xl'] * 2,
    lineHeight: typography.lineHeight['5xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing[6],
  },
  skipBtn: {
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
  },
  skipText: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.medium,
  },
  // Settings panel
  settingsPanel: {
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
    padding: spacing[4],
    marginBottom: spacing[4],
    width: '100%',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  settingsLabel: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    flex: 1,
  },
  settingsInput: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    backgroundColor: getThemeColors().bg.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    minWidth: 70,
    textAlign: 'center',
  },
  settingsSaveBtn: {
    backgroundColor: getThemeColors().accent.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  settingsSaveText: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
});
