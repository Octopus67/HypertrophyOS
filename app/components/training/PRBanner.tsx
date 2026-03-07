import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { spacing, typography, radius, springs } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useHaptics } from '../../hooks/useHaptics';

interface PRItem {
  type: 'weight' | 'reps' | 'volume' | 'e1rm';
  exerciseName: string;
  value: string;
}

interface PRBannerProps {
  prs: PRItem[];
  visible: boolean;
  onDismiss: () => void;
}

const PR_TYPE_LABELS: Record<string, string> = {
  weight: '🏋️ Weight PR',
  reps: '💪 Rep PR',
  volume: '📊 Volume PR',
  e1rm: '🎯 e1RM PR',
};

export function PRBanner({ prs, visible, onDismiss }: PRBannerProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const scale = useSharedValue(0);
  const reduceMotion = useReduceMotion();
  const { notification: hapticNotification } = useHaptics();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (visible && prs.length > 0) {
      // Haptic feedback for PR detection
      hapticNotification('success');

      if (reduceMotion) {
        // Skip animation — show immediately at full scale
        scale.value = 1;
      } else {
        scale.value = 0;
        scale.value = withSpring(1, springs.bouncy);
      }

      // Auto-dismiss after 3s
      dismissTimer.current = setTimeout(() => {
        onDismissRef.current();
      }, 3000);
    } else {
      scale.value = 0;
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [visible, prs, reduceMotion, hapticNotification]);

  if (!visible || prs.length === 0) return null;

  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onDismiss}
    >
      <Animated.View style={[styles.banner, animatedStyle]}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={[styles.title, { color: getThemeColors().premium.gold }]}>New Personal Record!</Text>
        {prs.map((pr, i) => (
          <View key={i} style={styles.prRow}>
            <Text style={[styles.prType, { color: getThemeColors().text.secondary }]}>
              {PR_TYPE_LABELS[pr.type] ?? pr.type}
            </Text>
            <Text style={[styles.prExercise, { color: getThemeColors().text.primary }]}>{pr.exerciseName}</Text>
            <Text style={[styles.prValue, { color: getThemeColors().premium.gold }]}>{pr.value}</Text>
          </View>
        ))}
      </Animated.View>
    </TouchableOpacity>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  banner: {
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: getThemeColors().premium.gold,
    padding: spacing[6],
    alignItems: 'center',
    minWidth: 260,
    maxWidth: 320,
  },
  trophy: {
    fontSize: 40,
    marginBottom: spacing[2],
  },
  title: {
    color: getThemeColors().premium.gold,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[3],
  },
  prRow: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  prType: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  prExercise: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  prValue: {
    color: getThemeColors().premium.gold,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
});
