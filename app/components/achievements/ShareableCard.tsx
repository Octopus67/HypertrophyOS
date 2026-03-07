import { useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { spacing, typography, radius, letterSpacing as ls } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface ShareableCardProps {
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  onShare?: () => void;
}

export function ShareableCard({
  title,
  description,
  icon,
  unlockedAt,
  onShare,
}: ShareableCardProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const cardRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      onShare?.();
    } catch {
      // share sheet unavailable — silent fail
    }
  };

  return (
    <View>
      <View ref={cardRef} style={[styles.card, { backgroundColor: getThemeColors().bg.surface, borderColor: getThemeColors().border.default }]}>
        <View style={[styles.iconCircle, { backgroundColor: getThemeColors().accent.primaryMuted }]}>
          <Icon name="trophy" size={28} color={getThemeColors().accent.primary} />
        </View>
        <Text style={[styles.title, { color: getThemeColors().text.primary }]}>{title}</Text>
        <Text style={[styles.description, { color: getThemeColors().text.secondary }]}>{description}</Text>
        <Text style={[styles.date, { color: getThemeColors().text.muted }]}>
          Unlocked {new Date(unlockedAt).toLocaleDateString(undefined, {
            month: 'long', day: 'numeric', year: 'numeric',
          })}
        </Text>
        <Text style={[styles.branding, { color: getThemeColors().accent.primary }]}>Repwise</Text>
      </View>
      {Platform.OS !== 'web' && onShare && (
        <Button title="Share" onPress={handleShare} style={styles.shareBtn} />
      )}
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: getThemeColors().bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
    padding: spacing[6],
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: getThemeColors().accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  description: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.base,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  date: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.sm,
    marginBottom: spacing[3],
  },
  branding: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    letterSpacing: ls.wider,
  },
  shareBtn: {
    marginTop: spacing[3],
  },
});
