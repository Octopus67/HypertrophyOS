import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { radius, spacing, typography, motion } from '../../theme/tokens';
import { useThemeColors, getThemeColors } from '../../hooks/useThemeColors';
import { usePressAnimation } from '../../hooks/usePressAnimation';
import { useHoverState } from '../../hooks/useHoverState';

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/**
 * Returns computed styles for a given active state.
 * Exported for testing (Property 11).
 */
export function getFilterPillStyles(active: boolean): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
} {
  if (active) {
    return {
      backgroundColor: getThemeColors().accent.primaryMuted,
      borderColor: getThemeColors().accent.primary,
      textColor: getThemeColors().accent.primary,
    };
  }
  return {
    backgroundColor: getThemeColors().bg.surface,
    borderColor: getThemeColors().border.subtle,
    textColor: getThemeColors().text.muted,
  };
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function FilterPill({ label, active, onPress }: FilterPillProps) {
  const c = useThemeColors();
  const progress = useSharedValue(active ? 1 : 0);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();
  const { isHovered, hoverProps } = useHoverState();

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: motion.duration.quick });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [getThemeColors().bg.surface, getThemeColors().accent.primaryMuted],
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [getThemeColors().border.subtle, getThemeColors().accent.primary],
    );
    return { backgroundColor, borderColor };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [getThemeColors().text.muted, getThemeColors().accent.primary],
    );
    return { color };
  });

  const hoverBorderStyle = Platform.OS === 'web' && isHovered
    ? { borderColor: getThemeColors().accent.primary }
    : undefined;

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.8}
      style={[styles.pill, animatedStyle, pressStyle, hoverBorderStyle]}
      {...hoverProps}
    >
      <Animated.Text style={[styles.label, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 32,
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
