import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useReduceMotion } from './useReduceMotion';
import { motion } from '../theme/tokens';

const STATIC_STYLE = { opacity: 1, transform: [{ translateX: 0 }] };
const SLIDE_DISTANCE = 40;

/**
 * Hook that provides a horizontal slide + fade transition when currentStep changes.
 * Forward steps slide left, backward steps slide right.
 * Respects reduce-motion and falls back to static style on web.
 */
export function useStepTransition(currentStep: number) {
  const reduceMotion = useReduceMotion();
  const prevStep = useRef(currentStep);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || Platform.OS === 'web') return;

    if (currentStep !== prevStep.current) {
      const direction = currentStep > prevStep.current ? 1 : -1;
      prevStep.current = currentStep;

      opacity.value = 0;
      translateX.value = direction * SLIDE_DISTANCE;

      const timing = { duration: motion.duration.moderate, easing: Easing.out(Easing.ease) };
      opacity.value = withTiming(1, timing);
      translateX.value = withTiming(0, timing);
    }
  }, [currentStep, reduceMotion, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  if (reduceMotion || Platform.OS === 'web') return STATIC_STYLE;
  return animatedStyle;
}
