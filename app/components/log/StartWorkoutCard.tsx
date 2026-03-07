import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { spacing, typography, radius, letterSpacing as ls } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import type { WorkoutTemplateResponse } from '../../types/training';

// ─── 5.1: Props Interface ────────────────────────────────────────────────────

interface StartWorkoutCardProps {
  userTemplates: WorkoutTemplateResponse[];
  staticTemplates: Array<{ id: string; name: string; description: string; exercises: any[] }>;
  onStartEmpty: () => void;
  onStartTemplate: (templateId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StartWorkoutCard({
  userTemplates,
  staticTemplates,
  onStartEmpty,
  onStartTemplate,
}: StartWorkoutCardProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  // 5.4: Template picker toggle
  const [showPicker, setShowPicker] = useState(false);

  const hasTemplates = userTemplates.length > 0 || staticTemplates.length > 0;

  // 5.6: Close picker and fire callback
  const handleSelectTemplate = (templateId: string) => {
    setShowPicker(false);
    onStartTemplate(templateId);
  };

  return (
    <View style={[styles.card, { backgroundColor: getThemeColors().accent.primaryMuted }]}>
      {/* 5.2: Title */}
      <Text style={[styles.title, { color: getThemeColors().text.primary }]}>🏋️ Start Workout</Text>

      {/* 5.3 / 5.5: Buttons */}
      <View style={styles.buttonRow}>
        {hasTemplates ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={onStartEmpty}
              accessibilityRole="button"
              accessibilityLabel="Start empty workout"
            >
              <Text style={[styles.buttonText, { color: getThemeColors().text.inverse }]}>Empty Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonHalf, showPicker && styles.buttonActive]}
              onPress={() => setShowPicker((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel="Start workout from template"
            >
              <Text style={[styles.buttonText, { color: getThemeColors().text.inverse }]}>From Template</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* 5.5: No templates — single full-width button */
          <TouchableOpacity
            style={[styles.button, styles.buttonFull]}
            onPress={onStartEmpty}
            accessibilityRole="button"
            accessibilityLabel="Start workout"
          >
            <Text style={[styles.buttonText, { color: getThemeColors().text.inverse }]}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 5.4: Template picker */}
      {showPicker && hasTemplates && (
        <View style={[styles.picker, { backgroundColor: getThemeColors().bg.surfaceRaised }]}>
          {userTemplates.length > 0 && (
            <>
              <Text style={[styles.subheader, { color: getThemeColors().text.secondary }]}>My Templates</Text>
              {userTemplates.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.templateRow, { borderBottomColor: getThemeColors().border.subtle }]}
                  onPress={() => handleSelectTemplate(t.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${t.name}`}
                >
                  <Text style={[styles.templateName, { color: getThemeColors().text.primary }]} numberOfLines={1}>{t.name}</Text>
                  <Text style={[styles.exerciseCount, { color: getThemeColors().text.muted }]}>
                    {t.exercises.length} exercise{t.exercises.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {staticTemplates.length > 0 && (
            <>
              <Text style={[styles.subheader, { color: getThemeColors().text.secondary }]}>Pre-built</Text>
              {staticTemplates.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.templateRow, { borderBottomColor: getThemeColors().border.subtle }]}
                  onPress={() => handleSelectTemplate(t.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${t.name}`}
                >
                  <Text style={[styles.templateName, { color: getThemeColors().text.primary }]} numberOfLines={1}>{t.name}</Text>
                  <Text style={[styles.exerciseCount, { color: getThemeColors().text.muted }]}>
                    {t.exercises.length} exercise{t.exercises.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}


// ─── Styles ──────────────────────────────────────────────────────────────────

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: getThemeColors().accent.primaryMuted,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: getThemeColors().text.primary,
    marginBottom: spacing[3],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  button: {
    backgroundColor: getThemeColors().accent.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFull: {
    flex: 1,
  },
  buttonActive: {
    backgroundColor: getThemeColors().accent.primaryHover,
  },
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: getThemeColors().text.inverse,
  },
  picker: {
    marginTop: spacing[3],
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.sm,
    padding: spacing[3],
  },
  subheader: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: getThemeColors().text.secondary,
    marginBottom: spacing[2],
    marginTop: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: ls.wide,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: getThemeColors().border.subtle,
  },
  templateName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: getThemeColors().text.primary,
    flex: 1,
    marginRight: spacing[2],
  },
  exerciseCount: {
    fontSize: typography.size.sm,
    color: getThemeColors().text.muted,
  },
});

export type { StartWorkoutCardProps };
