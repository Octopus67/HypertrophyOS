import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { spacing, radius, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Icon } from './Icon';

type ErrorBannerVariant = 'error' | 'warning' | 'info';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: ErrorBannerVariant;
  testID?: string;
}

const variantConfig: Record<ErrorBannerVariant, { bg: string; accent: string; icon: string }> = {
  error: {
    bg: getThemeColors().semantic.negativeSubtle,
    accent: getThemeColors().semantic.negative,
    icon: 'alert-circle',
  },
  warning: {
    bg: getThemeColors().semantic.warningSubtle,
    accent: getThemeColors().semantic.warning,
    icon: 'alert-triangle',
  },
  info: {
    bg: getThemeColors().accent.primaryMuted,
    accent: getThemeColors().accent.primary,
    icon: 'info',
  },
};

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  variant = 'error',
  testID,
}: ErrorBannerProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const config = variantConfig[variant];

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, { backgroundColor: config.bg }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID={testID}
    >
      <Icon name={config.icon as any} size={20} color={config.accent} />
      <Text style={[styles.message, { color: getThemeColors().text.secondary }]} numberOfLines={3}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={[styles.retryText, { color: getThemeColors().accent.primary }]}>Retry</Text>
        </TouchableOpacity>
      )}
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Icon name="x" size={16} color={getThemeColors().text.muted} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.sm,
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
  },
  message: {
    flex: 1,
    color: getThemeColors().text.secondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    lineHeight: typography.lineHeight.sm,
    marginLeft: spacing[2],
  },
  retryButton: {
    marginLeft: spacing[3],
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  dismissButton: {
    marginLeft: spacing[2],
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
