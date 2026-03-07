import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';

const LEGEND_ITEMS = [
  { color: getThemeColors().heatmap.untrained, label: 'Untrained' },
  { color: getThemeColors().heatmap.belowMev, label: 'Below MEV' },
  { color: getThemeColors().heatmap.optimal, label: 'Optimal' },
  { color: getThemeColors().heatmap.nearMrv, label: 'Near MRV' },
  { color: getThemeColors().heatmap.aboveMrv, label: 'Above MRV' },
];

export function HeatMapLegend() {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  return (
    <View style={styles.container}>
      {LEGEND_ITEMS.map((item) => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={[styles.label, { color: c.text.secondary }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.xs,
  },
});
