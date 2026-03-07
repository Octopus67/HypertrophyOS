import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Icon } from './Icon';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  editable?: boolean;
}

export function EditableField({
  label,
  value,
  onSave,
  editable = true,
}: EditableFieldProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleTap = useCallback(() => {
    if (!editable) return;
    setDraft(value);
    setEditing(true);
  }, [editable, value]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, onSave, value]);

  // Edit mode
  if (editing) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          autoFocus
          placeholderTextColor={getThemeColors().text.muted}
        />
        <View style={styles.actions}>
          {saving ? (
            <ActivityIndicator color={getThemeColors().accent.primary} size="small" />
          ) : (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          )}
          {!saving && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Read-only mode (not editable)
  if (!editable) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.viewRow}>
          <Text style={styles.value} numberOfLines={1}>{value || '—'}</Text>
          <Icon name="lock" size={14} color={getThemeColors().text.muted} />
        </View>
      </View>
    );
  }

  // View mode (editable, not editing)
  return (
    <TouchableOpacity style={styles.container} onPress={handleTap} activeOpacity={0.7}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.viewRow}>
        <Text style={styles.value} numberOfLines={1}>{value || '—'}</Text>
        <Icon name="edit" size={14} color={getThemeColors().text.muted} />
      </View>
    </TouchableOpacity>
  );
}

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: getThemeColors().border.subtle,
  },
  label: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[1],
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  icon: {},
  input: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: getThemeColors().border.focus,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  saveBtn: {
    backgroundColor: getThemeColors().accent.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
  },
  saveBtnText: {
    color: getThemeColors().text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  cancelBtn: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
  },
  cancelBtnText: {
    color: getThemeColors().text.muted,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
