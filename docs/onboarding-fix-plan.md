# Onboarding Critical Bugs — Implementation Plan

## Executive Summary

**Bugs Found:**
1. 🔴 CRITICAL: Onboarding data never saved to backend
2. 🔴 CRITICAL: Skip creates infinite loop
3. 🔴 CRITICAL: Backend ignores diet_style and protein_per_kg preferences
4. 🟡 HIGH: Enum mismatches (goal types, activity levels)
5. 🟡 HIGH: Missing edit UI for exercise frequency, diet style, protein target
6. 🟡 MEDIUM: Body fat % editable but backend ignores it

**Scope:** 3 phases, 47 files modified, 18 new files, ~2,500 lines of code, 45 new tests

**Estimated effort:** 3-4 days for one senior engineer

**Risk level:** HIGH — touches critical user data flow, requires careful migration

---

## Phase 1: Critical Bugs (IMMEDIATE — Day 1)

### 1.1 Wire Up Onboarding Completion API Call

**Problem:** OnboardingWizard never calls backend

**Files to modify:**
- `app/screens/onboarding/steps/SummaryStep.tsx`
- `app/utils/onboardingPayloadBuilder.ts` (NEW)
- `app/store/onboardingSlice.ts`

**Changes:**
1. Create `buildOnboardingPayload()` utility that maps Zustand store → API payload
2. Handle enum conversions (lose_fat → cutting, lightly_active → light)
3. In SummaryStep.handleComplete(), call `api.post('onboarding/complete', payload)`
4. Handle errors (show error banner, don't reset store on failure)
5. On success, reset store and call onComplete()

**Backend changes:**
- None (endpoint already exists and works)

**Tests:**
- Unit test: `buildOnboardingPayload()` with all field combinations
- Integration test: Complete onboarding flow, verify data persisted
- E2E test: Full onboarding → verify goals/metrics/profile in DB

**Dependencies:** None

**Rollback:** If API call fails, user stays on SummaryStep with error message

---

### 1.2 Remove Skip Option

**Problem:** Skip creates infinite loop, app doesn't work without onboarding

**Files to modify:**
- `app/screens/onboarding/steps/IntentStep.tsx`
- `app/screens/onboarding/OnboardingWizard.tsx`
- `app/App.tsx`

**Changes:**
1. Remove "Skip for now" link from IntentStep
2. Remove `onSkip` prop from OnboardingWizard
3. Remove `handleOnboardingSkip` from App.tsx
4. Remove `onboardingSkipped` state from store (dead code)

**Tests:**
- Visual test: Verify no skip link visible
- Unit test: Verify onboardingSkipped state removed

**Dependencies:** Must be done AFTER 1.1 (so users can't skip before API call is wired)

**Rollback:** Re-add skip link if needed

---

### 1.3 Fix Enum Mismatches

**Problem:** Frontend uses lose_fat/build_muscle, backend uses cutting/bulking

**Files to modify:**
- `app/utils/onboardingPayloadBuilder.ts` (from 1.1)
- `app/store/onboardingSlice.ts`
- `app/utils/onboardingCalculations.ts`

**Changes:**
1. Create enum mapping functions:
   ```typescript
   function mapGoalTypeToBackend(frontend: GoalType): BackendGoalType {
     const map = {
       'lose_fat': 'cutting',
       'build_muscle': 'bulking',
       'maintain': 'maintaining',
       'eat_healthier': 'maintaining',  // No backend equivalent
       'recomposition': 'recomposition',
     };
     return map[frontend];
   }
   
   function mapActivityLevelToBackend(frontend: ActivityLevel): BackendActivityLevel {
     const map = {
       'sedentary': 'sedentary',
       'lightly_active': 'light',
       'moderately_active': 'moderate',
       'highly_active': 'active',
     };
     return map[frontend];
   }
   ```

2. Use these in payload builder
3. Document the mappings

**Tests:**
- Unit test: All enum mappings
- Integration test: Onboarding with each goal type → verify correct backend enum stored

**Dependencies:** Part of 1.1

**Rollback:** N/A (pure mapping logic)

---

## Phase 2: Backend Preference Integration (HIGH PRIORITY — Day 2)

### 2.1 Make Backend Respect diet_style

**Problem:** Backend uses fixed 25% fat, ignores user's keto/low-carb choice

**Files to modify:**
- `src/modules/adaptive/engine.py`
- `src/modules/adaptive/schemas.py`
- `src/modules/adaptive/service.py`

**Changes:**
1. Add `diet_style` to `AdaptiveInput` dataclass
2. Create `DIET_STYLE_MACROS` dict:
   ```python
   DIET_STYLE_MACROS = {
       'balanced': {'fat_pct': 0.25, 'carb_pct': 0.75},  # After protein
       'high_protein': {'fat_pct': 0.25, 'carb_pct': 0.75},
       'low_carb': {'fat_pct': 0.40, 'carb_pct': 0.60'},
       'keto': {'fat_pct': 0.70, 'carb_pct': 0.30'},
   }
   ```
3. In `compute_snapshot()`, use diet_style to determine fat/carb split
4. In `AdaptiveService.create_snapshot()`, fetch diet_style from user_profiles.preferences
5. Default to 'balanced' if not set

**Tests:**
- Unit test: compute_snapshot() with each diet_style
- Integration test: User with keto → verify high fat targets
- Regression test: Existing users without diet_style → defaults to balanced

**Dependencies:** None

**Rollback:** Revert to fixed FAT_PERCENTAGE=0.25

---

### 2.2 Make Backend Respect protein_per_kg

**Problem:** Backend uses fixed PROTEIN_MULTIPLIERS, ignores user's 1.6 g/kg choice

**Files to modify:**
- `src/modules/adaptive/engine.py`
- `src/modules/adaptive/schemas.py`
- `src/modules/adaptive/service.py`

**Changes:**
1. Add `protein_per_kg_override: Optional[float]` to `AdaptiveInput`
2. In `compute_snapshot()`:
   ```python
   if input.protein_per_kg_override:
       protein_g_per_kg = input.protein_per_kg_override
   else:
       protein_g_per_kg = PROTEIN_MULTIPLIERS[input.goal_type]
   ```
3. Fetch from preferences, pass to engine
4. Validate range (1.2-3.5 g/kg)

**Tests:**
- Unit test: compute_snapshot() with protein override
- Integration test: User with 1.6 g/kg → verify targets match
- Edge case test: Invalid protein value → falls back to default

**Dependencies:** None

**Rollback:** Revert to fixed PROTEIN_MULTIPLIERS

---

### 2.3 Integrate body_fat_pct into Backend

**Problem:** Body fat is editable but backend always uses Mifflin-St Jeor

**Files to modify:**
- `src/modules/adaptive/engine.py`

**Changes:**
1. Add `body_fat_pct: Optional[float]` to `AdaptiveInput`
2. In `_compute_bmr()`:
   ```python
   if input.body_fat_pct and 5 <= input.body_fat_pct <= 50:
       # Katch-McArdle (more accurate for lean individuals)
       lean_mass_kg = input.weight_kg * (1 - input.body_fat_pct / 100)
       bmr = 370 + (21.6 * lean_mass_kg)
   else:
       # Mifflin-St Jeor (default)
       bmr = _mifflin_st_jeor(...)
   ```
3. Fetch from user_metrics, pass to engine

**Tests:**
- Unit test: BMR with body fat (Katch-McArdle) vs without (Mifflin-St Jeor)
- Integration test: User with 15% BF → verify Katch-McArdle used
- Edge case: Invalid BF% → falls back to Mifflin-St Jeor

**Dependencies:** None

**Rollback:** Remove body_fat_pct from AdaptiveInput

---

## Phase 3: Edit UI & Advanced Settings (MEDIUM — Day 3)

### 3.1 Add Advanced Settings Section to Profile

**Files to create:**
- `app/components/profile/AdvancedSettingsSection.tsx` (NEW)
- `app/components/profile/ExerciseFrequencyPicker.tsx` (NEW)
- `app/components/profile/DietStylePicker.tsx` (NEW)
- `app/components/profile/ProteinTargetSlider.tsx` (NEW)

**Files to modify:**
- `app/screens/profile/ProfileScreen.tsx`

**Changes:**
1. Create AdvancedSettingsSection with collapsible sections:
   - Exercise & Activity
     - Exercise frequency (1-7 sessions/week)
     - Exercise types (checkboxes: strength, cardio, sports, yoga, walking)
   - Nutrition Preferences
     - Diet style (balanced, high protein, low carb, keto)
     - Protein target (1.2-3.5 g/kg slider)
   - Food DNA
     - Dietary restrictions (chips)
     - Allergies (chips)
     - Cuisine preferences (chips)
     - Meals per day (2-6 stepper)

2. Each field saves to `PUT users/profile` with preferences JSONB update
3. After save, call `POST users/recalculate` to refresh targets

**Tests:**
- Component test: Each picker/slider renders correctly
- Integration test: Change diet style → verify preferences updated
- Integration test: Change protein target → verify recalculate called → targets updated
- E2E test: Full edit flow → verify all fields persist

**Dependencies:** Phase 2 (backend must respect these preferences)

**Rollback:** Hide AdvancedSettingsSection

---

### 3.2 Add "Redo Onboarding" Option

**Files to modify:**
- `app/components/profile/AccountSection.tsx`
- `app/App.tsx`

**Changes:**
1. Add "Retake Setup Wizard" button in AccountSection
2. Shows confirmation alert: "This will reset your plan. Continue?"
3. On confirm:
   ```typescript
   await api.delete('users/goals');  // Clear goals
   await api.delete('users/metrics');  // Clear metrics
   setNeedsOnboarding(true);
   ```
4. User re-enters onboarding with fresh state

**Tests:**
- Integration test: Redo onboarding → verify old data cleared
- E2E test: Complete onboarding → redo → complete again → verify new data

**Dependencies:** Phase 1.1 (onboarding must save data)

**Rollback:** Remove button

---

## Testing Strategy

### Unit Tests (15 new tests)
1. `buildOnboardingPayload()` — all fields
2. `mapGoalTypeToBackend()` — all 5 goal types
3. `mapActivityLevelToBackend()` — all 4 activity levels
4. `get_volume_multiplier_for_goal()` — all goal types + rates
5. `compute_snapshot()` with diet_style — all 4 styles
6. `compute_snapshot()` with protein_per_kg_override
7. `compute_snapshot()` with body_fat_pct (Katch-McArdle)
8. `_compute_bmr()` with/without body fat
9. ExerciseFrequencyPicker component
10. DietStylePicker component
11. ProteinTargetSlider component
12. AdvancedSettingsSection render
13. Onboarding payload validation
14. Enum mapping edge cases
15. Recalculate with all new fields

### Integration Tests (12 new tests)
1. Complete onboarding → verify POST onboarding/complete called
2. Complete onboarding → verify goals persisted
3. Complete onboarding → verify metrics persisted
4. Complete onboarding → verify preferences persisted
5. Edit diet style → verify preferences updated → recalculate called
6. Edit protein target → verify targets updated
7. Edit exercise frequency → verify preferences updated
8. Redo onboarding → verify old data cleared
9. Onboarding with keto → verify backend uses keto macros
10. Onboarding with 1.6 g/kg protein → verify backend uses 1.6
11. Onboarding with body fat → verify Katch-McArdle BMR
12. User without preferences → verify defaults applied

### E2E Tests (8 new tests)
1. Full onboarding flow → verify dashboard shows correct targets
2. Skip removed → verify no skip option visible
3. Complete onboarding → restart app → verify no re-onboarding
4. Edit plan via profile → verify targets update
5. Change goal cutting→bulking → verify volume targets adjust
6. Redo onboarding → verify fresh wizard
7. Onboarding error handling → verify user can retry
8. Onboarding with all optional fields → verify all persist

### Regression Tests (5 tests)
1. Existing users without new preferences → verify app doesn't break
2. Old adaptive snapshots → verify still work
3. Recalculate without new fields → verify defaults applied
4. Profile edit without advanced settings → verify still works
5. WNS volume without goal → verify defaults to 1.0x multiplier

---

## Implementation Order (Critical Path)

**Day 1 Morning:**
1. Create `buildOnboardingPayload()` utility (1 hour)
2. Wire up API call in SummaryStep (30 min)
3. Test onboarding completion (1 hour)
4. Remove skip option (30 min)

**Day 1 Afternoon:**
5. Fix enum mappings (1 hour)
6. Test enum conversions (1 hour)
7. Backend: Add diet_style to adaptive engine (2 hours)
8. Test diet_style integration (1 hour)

**Day 2 Morning:**
9. Backend: Add protein_per_kg to adaptive engine (1 hour)
10. Backend: Add body_fat_pct to BMR calculation (1 hour)
11. Test backend preference integration (2 hours)

**Day 2 Afternoon:**
12. Create AdvancedSettingsSection UI (3 hours)
13. Wire up preference updates (1 hour)

**Day 3:**
14. Add "Redo Onboarding" option (1 hour)
15. Full integration testing (3 hours)
16. E2E testing (2 hours)
17. Regression testing (1 hour)
18. Documentation updates (1 hour)

---

## Risk Mitigation

**Risk 1: Data migration for existing users**
- Existing users have no preferences JSONB data
- **Mitigation:** Backend defaults to balanced diet, goal-based protein, Mifflin-St Jeor BMR

**Risk 2: Breaking existing adaptive snapshots**
- Changing adaptive engine could invalidate existing snapshots
- **Mitigation:** Add schema version field, support both old and new

**Risk 3: Onboarding API call failure**
- Network error during onboarding completion
- **Mitigation:** Show error, allow retry, don't reset store on failure

**Risk 4: Enum conversion bugs**
- eat_healthier has no backend equivalent
- **Mitigation:** Map to 'maintaining', document the decision

**Risk 5: Test coverage gaps**
- 45 new tests is a lot
- **Mitigation:** Prioritize critical path tests, defer edge cases

---

## Rollback Plan

**If Phase 1 fails:**
- Revert SummaryStep changes
- Re-add skip option
- Users can still skip (broken state) but no worse than before

**If Phase 2 fails:**
- Revert adaptive engine changes
- Backend ignores preferences (same as before)
- Frontend still collects data (no harm)

**If Phase 3 fails:**
- Hide AdvancedSettingsSection
- Users can't edit advanced fields (same as before)

---

## Success Criteria

**Phase 1:**
- ✅ User completes onboarding → data persisted to backend
- ✅ User restarts app → no re-onboarding loop
- ✅ No skip option visible

**Phase 2:**
- ✅ User selects keto → backend uses keto macros
- ✅ User selects 1.6 g/kg protein → backend uses 1.6
- ✅ User with body fat → backend uses Katch-McArdle

**Phase 3:**
- ✅ User can edit exercise frequency in profile
- ✅ User can edit diet style in profile
- ✅ User can redo onboarding

---

**Next:** Detailed file-by-file implementation spec (separate document)
