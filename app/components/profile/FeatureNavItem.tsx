import { ReactNode } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressAnimation } from '../../hooks/usePressAnimation';
import { typography, spacing } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

interface FeatureNavItemProps {
  icon: ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  testID?: string;
}

export function FeatureNavItem({ icon, label, description, onPress, testID }: FeatureNavItemProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.7}
        testID={testID}
      >
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.content}>
          <Text style={[styles.label, { color: getThemeColors().text.primary }]}>{label}</Text>
          <Text style={[styles.description, { color: getThemeColors().text.muted }]}>{description}</Text>
        </View>
        <Text style={[styles.chevron, { color: getThemeColors().text.muted }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: getThemeColors().text.primary,
  },
  description: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.muted,
    marginTop: spacing[1],
  },
  chevron: {
    fontSize: typography.size.md,
    color: getThemeColors().text.muted,
    marginLeft: spacing[2],
  },
});
