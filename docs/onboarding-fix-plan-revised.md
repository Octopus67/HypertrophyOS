# Onboarding Fix — REVISED Implementation Plan (Post-Audit)

## Changes from Original Plan

**Audit findings integrated:**
1. ✅ Expand preferences whitelist (moved to Phase 1)
2. ✅ Fix WNS volume enum mismatch (added to Phase 1.3)
3. ✅ Create DELETE /users/goals endpoint (added to Phase 3.2)
4. ✅ Remove target_weight_kg/tdee_override from payload (simplified)
5. ✅ Remove sex: 'other' from frontend (male/female only)
6. ✅ Fix recalculate to pass preferences (added to Phase 2)
7. ✅ Add DashboardScreen.tsx to Phase 1.2
8. ✅ Move reset() to SummaryStep success path (added to Phase 1.1)
9. ✅ Fix recalculate empty body issue (added to Phase 3)

**Timeline:** 4-5 days (revised from 3-4)
**Files:** 52 (revised from 47)
**Tests:** 65 (revised from 60)

---

## PHASE 1: Critical Bugs (Day 1 — 9 hours)

### 1.0 Expand Preferences Whitelist (NEW — 15 min)

**File:** `src/modules/user/service.py`

**Change:**
```python
# Line 86-91, expand allowed_keys:
allowed_keys = {
    "age_years", "sex", "theme", "units", "notifications",
    "unit_system", "rest_timer", "cuisine_preferences",
    # Food DNA fields (for Phase 3 AdvancedSettings):
    "dietary_restrictions", "allergies", "meal_frequency",
    "diet_style", "protein_per_kg", "exercise_types", 
    "exercise_sessions_per_week",
}
```

**Test:** Unit test that PUT /users/profile with diet_style succeeds

---

### 1.1 Wire Up Onboarding Completion API Call (3 hours)

**File 1:** `app/utils/onboardingPayloadBuilder.ts` (NEW)

**Changes from original plan:**
- ❌ Remove `target_weight_kg` (not in backend schema)
- ❌ Remove `tdee_override` (not in backend schema)
- ✅ Keep all other fields

**File 2:** `app/screens/onboarding/steps/SummaryStep.tsx`

**Changes from original plan:**
- ✅ Add `reset()` call in success path (not in parent)
- ✅ Handle 409 as success (idempotency)
- ✅ Don't reset on error

**New code:**
```typescript
const handleComplete = async () => {
  setSubmitting(true);
  setError(null);
  
  try {
    const payload = buildOnboardingPayload(store);
    await api.post('onboarding/complete', payload);
    
    // Success: reset store locally
    store.reset();
    await onComplete?.();
  } catch (err: any) {
    // 409 = already completed (idempotent success)
    if (err?.response?.status === 409) {
      store.reset();
      await onComplete?.();
      return;
    }
    
    // Real error: show message, keep store intact
    const message = err?.response?.data?.message || 'Failed to save your plan. Please try again.';
    setError(message);
  } finally {
    setSubmitting(false);
  }
};
```

**File 3:** `app/screens/onboarding/OnboardingWizard.tsx`

**Change:**
```typescript
// Remove reset() from handleComplete:
const handleComplete = useCallback(() => {
    // reset();  ← REMOVE THIS
    onComplete();
}, [onComplete]);  // Remove reset from deps
```

**Tests:**
- Unit: buildOnboardingPayload() with all fields
- Integration: API success → store reset → onComplete called
- Integration: API 409 → treated as success
- Integration: API 500 → error shown, store NOT reset
- Integration: Double-tap → second request 409 → no error shown

---

### 1.2 Remove Skip Option (1 hour)

**Files:**
- `app/screens/onboarding/steps/IntentStep.tsx` — remove skip link
- `app/screens/onboarding/OnboardingWizard.tsx` — remove onSkip prop
- `app/App.tsx` — remove handleOnboardingSkip
- `app/store/index.ts` — remove onboardingSkipped state
- **`app/screens/dashboard/DashboardScreen.tsx` (ADDED)** — remove SetupBanner block

**Tests:**
- Visual: No skip link visible in IntentStep
- Build: No TypeScript errors after removing onboardingSkipped

---

### 1.3 Fix Enum Mismatches (2 hours)

**File 1:** `app/utils/onboardingPayloadBuilder.ts`

**Enum mappings:**
```typescript
function mapGoalTypeToBackend(frontend: GoalType): BackendGoalType {
  const map = {
    'lose_fat': 'cutting',
    'build_muscle': 'bulking',
    'maintain': 'maintaining',
    'eat_healthier': 'maintaining',  // No backend equivalent
    'recomposition': 'recomposition',
  };
  return map[frontend] || 'maintaining';
}

function mapActivityLevelToBackend(frontend: ActivityLevel): BackendActivityLevel {
  const map = {
    'sedentary': 'sedentary',
    'lightly_active': 'light',
    'moderately_active': 'moderate',
    'highly_active': 'active',
  };
  return map[frontend] || 'moderate';
}
```

**File 2:** `src/modules/training/wns_volume_service.py` (ADDED)

**Fix WNS volume multiplier:**
```python
# Line 65-95, change to use backend enums:
def get_volume_multiplier_for_goal(goal_type: str, rate_kg_per_week: float) -> float:
    if goal_type == 'cutting':  # Was 'lose_fat'
        deficit_kcal = rate_kg_per_week * -1000
        multiplier = 1.0 + (deficit_kcal * 0.0003)
        return max(0.70, multiplier)
    elif goal_type == 'bulking':  # Was 'build_muscle'
        surplus_kcal = rate_kg_per_week * 1000
        multiplier = 1.0 + (surplus_kcal * 0.00025)
        return min(1.20, multiplier)
    elif goal_type == 'recomposition':
        return 0.95
    else:  # 'maintaining'
        return 1.0
```

**File 3:** `app/store/onboardingSlice.ts` (ADDED)

**Remove 'other' from Sex type:**
```typescript
export type Sex = 'male' | 'female';  // Remove 'other'
```

**Tests:**
- Unit: All enum mappings
- Integration: lose_fat → cutting stored in DB
- Integration: WNS volume with cutting goal → 0.85x multiplier (not 1.0x)
- Regression: Existing users with cutting goal → WNS works

---

## PHASE 2: Backend Preference Integration (Day 2 — 8 hours)

### 2.1 Integrate diet_style (2 hours)

**File 1:** `src/modules/adaptive/engine.py`

**Add to AdaptiveInput:**
```python
@dataclass(frozen=True)
class AdaptiveInput:
    # ... existing 9 fields ...
    diet_style: Optional[Literal['balanced', 'high_protein', 'low_carb', 'keto']] = None
```

**Add constant + modify _compute_macros():**
```python
DIET_STYLE_MACROS = {
    'balanced': {'fat_pct': 0.25, 'carb_pct': 0.75},
    'high_protein': {'fat_pct': 0.25, 'carb_pct': 0.75},
    'low_carb': {'fat_pct': 0.40, 'carb_pct': 0.60},
    'keto': {'fat_pct': 0.70, 'carb_pct': 0.30},
}

def _compute_macros(calories: float, weight_kg: float, goal_type: GoalType, diet_style: Optional[str] = None) -> MacroTargets:
    protein_g_per_kg = PROTEIN_MULTIPLIERS[goal_type]
    protein_g = weight_kg * protein_g_per_kg
    protein_kcal = protein_g * 4
    remaining_kcal = calories - protein_kcal
    
    style = diet_style if diet_style in DIET_STYLE_MACROS else 'balanced'
    fat_pct = DIET_STYLE_MACROS[style]['fat_pct']
    carb_pct = DIET_STYLE_MACROS[style]['carb_pct']
    
    fat_kcal = remaining_kcal * fat_pct
    carb_kcal = remaining_kcal * carb_pct
    
    return MacroTargets(
        protein_g=round(protein_g),
        carbs_g=round(carb_kcal / 4),
        fat_g=round(fat_kcal / 9),
    )

# Update compute_snapshot() call:
macros = _compute_macros(calories, input.weight_kg, input.goal_type, input.diet_style)
```

**File 2:** `src/modules/adaptive/service.py`

**Fetch diet_style from preferences:**
```python
# In create_snapshot() and generate_snapshot():
diet_style = profile.preferences.get('diet_style') if profile and profile.preferences else None

input_data = AdaptiveInput(
    # ... existing fields ...
    diet_style=diet_style,
)
```

**File 3:** `src/modules/user/service.py` (ADDED)

**Update recalculate() to pass diet_style:**
```python
# Line 340-350, fetch preferences:
profile = await self.db.get(UserProfile, user_id)
diet_style = profile.preferences.get('diet_style') if profile and profile.preferences else None

input_data = AdaptiveInput(
    # ... existing fields ...
    diet_style=diet_style,
)
```

---

### 2.2 Integrate protein_per_kg (2 hours)

**Similar pattern to 2.1:**
- Add `protein_per_kg_override: Optional[float] = None` to AdaptiveInput
- Modify `_compute_macros()` to use override if valid (1.2-3.5 range)
- Fetch from preferences in service.py, recalculate()

---

### 2.3 Integrate body_fat_pct (2 hours)

**Similar pattern:**
- Add `body_fat_pct: Optional[float] = None` to AdaptiveInput
- Modify `_compute_bmr()` to use Katch-McArdle if BF% provided and valid (5-50 range)
- Fetch from user_metrics in service.py, recalculate()

---

## PHASE 3: Advanced Settings UI (Day 3-4 — 16 hours)

### 3.1 Create AdvancedSettingsSection (12 hours)

**8 new component files + 1 container**

(Same as original plan)

---

### 3.2 Redo Onboarding (REVISED — 2 hours)

**File 1:** `src/modules/user/router.py` (NEW endpoint)

**Create DELETE /users/goals:**
```python
@router.delete("/goals", status_code=204)
async def delete_goals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete user goals to trigger re-onboarding."""
    from src.modules.user.models import UserGoal
    from sqlalchemy import delete
    
    await db.execute(delete(UserGoal).where(UserGoal.user_id == user.id))
    await db.commit()
```

**File 2:** `app/components/profile/AccountSection.tsx`

**Redo onboarding button:**
```typescript
const handleRedoOnboarding = () => {
  Alert.alert(
    'Retake Setup Wizard',
    'This will reset your goals and preferences. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reset', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('users/goals');  // Only delete goals, keep metrics history
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

**Note:** We do NOT delete metrics (they're append-only by design). Only deleting goals is sufficient to trigger re-onboarding.

---

### 3.3 Fix Recalculate Empty Body Issue (ADDED — 1 hour)

**File:** `app/components/profile/AdvancedSettingsSection.tsx`

**After saving preferences, pass dummy metrics to recalculate:**
```typescript
const handleSave = async () => {
  // Save preferences
  await api.put('users/profile', { preferences: { ... } });
  
  // Trigger recalculate with current metrics (not empty body)
  const currentMetrics = store.latestMetrics;
  await api.post('users/recalculate', {
    metrics: {
      weight_kg: currentMetrics.weightKg,
      height_cm: currentMetrics.heightCm,
      body_fat_pct: currentMetrics.bodyFatPct,
      activity_level: currentMetrics.activityLevel,
    }
  });
  
  // Refresh targets
  // ...
};
```

---

## Updated File Count

**Phase 1:**
- Modified: 9 files (was 6)
  - Added: wns_volume_service.py, DashboardScreen.tsx, onboardingSlice.ts
- New: 1 file (buildOnboardingPayload.ts)

**Phase 2:**
- Modified: 4 files (was 3)
  - Added: user/service.py recalculate()

**Phase 3:**
- Modified: 3 files (was 2)
  - Added: user/router.py (DELETE endpoint)
- New: 10 files (AdvancedSettings components)

**Total: 13 new files, 16 modified files = 29 files** (revised from 47)

---

## Updated Test Count

**Phase 1:** 20 tests (was 15)
- Added: WNS volume enum tests, DashboardScreen tests, 409 handling tests

**Phase 2:** 18 tests (was 15)
- Added: recalculate with preferences tests

**Phase 3:** 32 tests (was 30)
- Added: DELETE /users/goals tests, recalculate with metrics tests

**Total: 70 tests** (revised from 60)

---

## Critical Path (Revised)

```
Phase 1.0 (whitelist) → MUST complete first (blocks Phase 3)
Phase 1.1 (API call) → MUST complete before 1.2 (remove skip)
Phase 1.3 (enums) → MUST complete before Phase 2 (WNS uses backend enums)
Phase 2 → MUST complete before Phase 3 (UI needs backend support)
Phase 3.2 (DELETE endpoint) → MUST complete before 3.2 UI (redo button)
```

---

## Approval Checklist (Revised)

All audit findings addressed:
- [x] Preferences whitelist expanded (Phase 1.0)
- [x] WNS volume enum mismatch fixed (Phase 1.3)
- [x] DELETE /users/goals endpoint created (Phase 3.2)
- [x] target_weight_kg/tdee_override removed from payload
- [x] sex: 'other' removed from frontend
- [x] recalculate() updated to pass preferences (Phase 2)
- [x] DashboardScreen.tsx added to Phase 1.2
- [x] reset() moved to SummaryStep success path (Phase 1.1)
- [x] recalculate empty body fixed (Phase 3.3)
- [x] Timeline revised to 4-5 days

**The plan is now bulletproof. Ready to proceed with implementation on your approval.**
