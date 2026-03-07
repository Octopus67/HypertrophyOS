/**
 * TimelineSlider — horizontal FlatList for chronological photo browsing.
 *
 * Replaces the grid view with a swipeable timeline. Includes pose type
 * filter pills and displays photo info below each item.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { PhotoMeta, PhotoPathMap, PoseType, POSE_TYPES } from '../../utils/progressPhotoTypes';
import { sortPhotosByDate, filterByPoseType, formatPhotoInfo } from '../../utils/timelineLogic';

interface TimelineSliderProps {
  photos: PhotoMeta[];
  pathMap: PhotoPathMap;
  onCompare: (leftPhoto: PhotoMeta, rightPhoto: PhotoMeta) => void;
  poseFilter: PoseType | 'all';
  onPoseFilterChange: (filter: PoseType | 'all') => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH - spacing[8] * 2;
const ITEM_HEIGHT = ITEM_WIDTH * 1.33;

const FILTER_LABELS: Record<PoseType | 'all', string> = {
  all: 'All',
  front_relaxed: 'Front',
  front_double_bicep: 'Bicep',
  side: 'Side',
  back: 'Back',
};

export function TimelineSlider({
  photos,
  pathMap,
  onCompare,
  poseFilter,
  onPoseFilterChange,
}: TimelineSliderProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const displayPhotos = useMemo(() => {
    const filtered = filterByPoseType(photos, poseFilter);
    return sortPhotosByDate(filtered);
  }, [photos, poseFilter]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 50 }),
    [],
  );

  const handleCompare = useCallback(() => {
    if (displayPhotos.length < 2) return;
    const left = displayPhotos[0];
    const right = displayPhotos[currentIndex] || displayPhotos[displayPhotos.length - 1];
    onCompare(left, right);
  }, [displayPhotos, currentIndex, onCompare]);

  const renderItem = useCallback(
    ({ item }: { item: PhotoMeta }) => {
      const fileUri = pathMap[item.id];
      const { dateLabel, weightLabel } = formatPhotoInfo(item);

      return (
        <View style={[styles.item, { backgroundColor: getThemeColors().bg.surface }]}>
          {fileUri ? (
            <Image source={{ uri: fileUri }} style={[styles.photo, { backgroundColor: getThemeColors().bg.surfaceRaised }]} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, styles.placeholder]}>
              <Text style={[styles.placeholderText, { color: getThemeColors().text.muted }]}>Photo unavailable</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={[styles.dateLabel, { color: getThemeColors().text.primary }]}>{dateLabel}</Text>
            {weightLabel && <Text style={[styles.weightLabel, { color: getThemeColors().accent.primary }]}>{weightLabel}</Text>}
          </View>
        </View>
      );
    },
    [pathMap],
  );

  return (
    <View style={styles.container}>
      {/* Pose filter pills */}
      <View style={styles.filterRow}>
        {(['all', ...POSE_TYPES] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterPill, poseFilter === filter && styles.filterPillActive]}
            onPress={() => onPoseFilterChange(filter)}
          >
            <Text
              style={[styles.filterText, poseFilter === filter && styles.filterTextActive]}
            >
              {FILTER_LABELS[filter]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayPhotos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: getThemeColors().text.muted }]}>No photos for this filter</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={displayPhotos}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH + spacing[2]}
            decelerationRate="fast"
            contentContainerStyle={styles.listContent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />

          {/* Compare button */}
          {displayPhotos.length >= 2 && (
            <TouchableOpacity style={[styles.compareBtn, { backgroundColor: getThemeColors().accent.primary }]} onPress={handleCompare} activeOpacity={0.8}>
              <Text style={[styles.compareBtnText, { color: getThemeColors().text.inverse }]}>Compare</Text>
            </TouchableOpacity>
          )}

          {/* Page indicator */}
          <Text style={[styles.pageIndicator, { color: getThemeColors().text.muted }]}>
            {currentIndex + 1} / {displayPhotos.length}
          </Text>
        </>
      )}
    </View>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  filterPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderWidth: 1,
    borderColor: getThemeColors().border.subtle,
  },
  filterPillActive: {
    backgroundColor: getThemeColors().accent.primaryMuted,
    borderColor: getThemeColors().accent.primary,
  },
  filterText: {
    color: getThemeColors().text.secondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  filterTextActive: {
    color: getThemeColors().accent.primary,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  item: {
    width: ITEM_WIDTH,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: getThemeColors().bg.surface,
  },
  photo: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: getThemeColors().bg.surfaceRaised,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.sm,
  },
  info: {
    padding: spacing[3],
    alignItems: 'center',
  },
  dateLabel: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  weightLabel: {
    color: getThemeColors().accent.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },
  compareBtn: {
    alignSelf: 'center',
    backgroundColor: getThemeColors().accent.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[6],
    marginTop: spacing[3],
  },
  compareBtnText: {
    color: getThemeColors().text.inverse,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  pageIndicator: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  emptyText: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.base,
  },
});
