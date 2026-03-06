# Onboarding Fix — Phase 3 Detailed Spec

## PHASE 3.1: Advanced Settings UI

### File 16: `app/components/profile/AdvancedSettingsSection.tsx` (NEW — 400 lines)

**Purpose:** Collapsible section in Profile for editing exercise/nutrition preferences

**Structure:**
```typescript
export function AdvancedSettingsSection() {
  const [expanded, setExpanded] = useState(false);
  const [exerciseFreq, setExerciseFreq] = useState(3);
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [dietStyle, setDietStyle] = useState('balanced');
  const [proteinPerKg, setProteinPerKg] = useState(2.0);
  // ... other fields
  
  const handleSave = async () => {
    // Update preferences
    await api.put('users/profile', {
      preferences: {
        exercise_sessions_per_week: exerciseFreq,
        exercise_types: exerciseTypes,
        diet_style: dietStyle,
        protein_per_kg: proteinPerKg,
        // ... other fields
      }
    });
    
    // Trigger recalculate
    await api.post('users/recalculate', {});
    
    // Refresh targets
    // ...
  };
  
  return (
    <Card>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <SectionHeader title="Advanced Settings" action={{label: expanded ? '▼' : '▶', onPress: () => {}}} />
      </TouchableOpacity>
      
      {expanded && (
        <>
          {/* Exercise & Activity */}
          <ExerciseFrequencyPicker value={exerciseFreq} onChange={setExerciseFreq} />
          <ExerciseTypesPicker value={exerciseTypes} onChange={setExerciseTypes} />
          
          {/* Nutrition Preferences */}
          <DietStylePicker value={dietStyle} onChange={setDietStyle} />
          <ProteinTargetSlider value={proteinPerKg} onChange={setProteinPerKg} />
          
          {/* Food DNA */}
          <DietaryRestrictionsPicker ... />
          <AllergiesPicker ... />
          <CuisinePreferencesPicker ... />
          <MealFrequencyStepper ... />
          
          <Button title="Save Changes" onPress={handleSave} />
        </>
      )}
    </Card>
  );
}
```

**Sub-components to create:**
- `ExerciseFrequencyPicker.tsx` (stepper 1-7)
- `ExerciseTypesPicker.tsx` (multi-select chips)
- `DietStylePicker.tsx` (4 cards: balanced/high protein/low carb/keto)
- `ProteinTargetSlider.tsx` (slider 1.2-3.5 g/kg)
- `DietaryRestrictionsPicker.tsx` (multi-select chips)
- `AllergiesPicker.tsx` (multi-select chips)
- `CuisinePreferencesPicker.tsx` (multi-select chips)
- `MealFrequencyStepper.tsx` (stepper 2-6)

**Tests:**
- Component render test
- Save flow test
- Validation test (protein 1.2-3.5 range)
- API error handling test

---

### File 17: `app/screens/profile/ProfileScreen.tsx` (MODIFY)

**Add import:**
```typescript
import { AdvancedSettingsSection } from '../../components/profile/AdvancedSettingsSection';
```

**Add to JSX (after PreferencesSection):**
```typescript
<Animated.View style={advancedSettingsAnim}>
  <AdvancedSettingsSection />
</Animated.View>
```

**Add staggered entrance:**
```typescript
const advancedSettingsAnim = useStaggeredEntrance(8, 60);
```

---

## PHASE 3.2: Redo Onboarding

### File 18: `app/components/profile/AccountSection.tsx` (MODIFY)

**Add button:**
```typescript
<TouchableOpacity 
  style={styles.redoButton}
  onPress={handleRedoOnboarding}
>
  <Icon name="refresh" size={20} color={colors.text.secondary} />
  <Text style={styles.redoText}>Retake Setup Wizard</Text>
</TouchableOpacity>

const handleRedoOnboarding = () => {
  Alert.alert(
    'Retake Setup Wizard',
    'This will reset your current plan. You can set new goals and preferences. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reset', 
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear backend data
            await api.delete('users/goals');
            await api.delete('users/metrics');
            
            // Trigger onboarding
            setNeedsOnboarding(true);
          } catch (err) {
            Alert.alert('Error', 'Failed to reset. Please try again.');
          }
        }
      },
    ]
  );
};
```

---

## Test Plan Summary

### Unit Tests (15 files)
1. `buildOnboardingPayload.test.ts` — 10 cases
2. `mapGoalTypeToBackend.test.ts` — 5 cases
3. `mapActivityLevelToBackend.test.ts` — 4 cases
4. `ExerciseFrequencyPicker.test.tsx` — 3 cases
5. `DietStylePicker.test.tsx` — 4 cases
6. `ProteinTargetSlider.test.tsx` — 5 cases
7. `AdvancedSettingsSection.test.tsx` — 8 cases
8. `test_adaptive_engine_diet_style.py` — 4 cases
9. `test_adaptive_engine_protein_override.py` — 5 cases
10. `test_adaptive_engine_body_fat.py` — 3 cases
11. `test_onboarding_service_new_fields.py` — 6 cases
12. `test_user_service_recalculate_prefs.py` — 4 cases
13. `test_compute_bmr_katch_mcardle.py` — 3 cases
14. `test_diet_style_macro_split.py` — 4 cases
15. `test_protein_override_validation.py` — 3 cases

### Integration Tests (12 files)
1. `test_onboarding_completion_api.test.tsx` — 5 cases
2. `test_onboarding_error_handling.test.tsx` — 3 cases
3. `test_profile_advanced_settings.test.tsx` — 8 cases
4. `test_redo_onboarding.test.tsx` — 4 cases
5. `test_onboarding_complete_endpoint.py` — 6 cases
6. `test_adaptive_snapshot_with_prefs.py` — 5 cases
7. `test_recalculate_with_prefs.py` — 4 cases
8. `test_keto_user_targets.py` — 3 cases
9. `test_protein_override_targets.py` — 3 cases
10. `test_body_fat_bmr_calculation.py` — 3 cases
11. `test_enum_conversion_roundtrip.py` — 5 cases
12. `test_preferences_persistence.py` — 4 cases

### E2E Tests (8 files)
1. `onboarding-completion.spec.ts` — full flow
2. `onboarding-no-skip.spec.ts` — verify skip removed
3. `onboarding-restart-no-loop.spec.ts` — verify no infinite loop
4. `profile-advanced-settings.spec.ts` — edit all fields
5. `redo-onboarding.spec.ts` — full redo flow
6. `keto-user-journey.spec.ts` — keto selection → verify macros
7. `protein-override-journey.spec.ts` — custom protein → verify targets
8. `goal-change-volume-adjust.spec.ts` — cutting→bulking → verify volume

---

## Migration Strategy

**For existing users (no preferences data):**
- Backend defaults: balanced diet, goal-based protein, Mifflin-St Jeor BMR
- No data migration needed
- Existing adaptive snapshots remain valid

**For new users:**
- Full onboarding → all preferences saved
- Backend uses preferences immediately

**Backward compatibility:**
- All new fields are Optional in AdaptiveInput
- Defaults applied if None
- No breaking changes to existing API contracts

---

## Approval Checklist

Before implementation begins, confirm:
- [ ] Scope approved (3 phases, 47 files, 45 tests)
- [ ] Timeline approved (3-4 days)
- [ ] Risk mitigation approved
- [ ] Rollback plan approved
- [ ] Test coverage approved (60+ new tests)
- [ ] Migration strategy approved (defaults for existing users)

**Ready for your approval to proceed.**
