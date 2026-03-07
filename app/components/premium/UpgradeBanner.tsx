import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';
import { useReduceMotion } from '../../hooks/useReduceMotion';

interface UpgradeBannerProps {
  onPress: () => void;
}

export function UpgradeBanner({ onPress }: UpgradeBannerProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const reduceMotion = useReduceMotion();
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      false,
    );
  }, [reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <TouchableOpacity style={[styles.banner, { backgroundColor: getThemeColors().accent.primaryMuted, borderColor: getThemeColors().accent.primary }]} onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.content, pulseStyle]}>
        <Icon name="star" size={16} color={getThemeColors().premium.gold} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: getThemeColors().text.primary }]}>Unlock Premium</Text>
          <Text style={[styles.subtitle, { color: getThemeColors().text.secondary }]}>
            Coaching, advanced analytics & more
          </Text>
        </View>
        <Text style={[styles.arrow, { color: getThemeColors().accent.primary }]}>→</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  banner: {
    backgroundColor: getThemeColors().accent.primaryMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: getThemeColors().accent.primary,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  icon: {},
  textContainer: {
    flex: 1,
  },
  title: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.semibold,
  },
  subtitle: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: 2,
  },
  arrow: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.semibold,
  },
});
