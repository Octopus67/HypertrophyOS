# Onboarding Fix — Detailed Implementation Spec

## File-by-File Changes

### PHASE 1.1: Wire Up Onboarding Completion

#### File 1: `app/utils/onboardingPayloadBuilder.ts` (NEW — 150 lines)

**Purpose:** Convert Zustand onboarding store → backend API payload

**Exports:**
```typescript
export function buildOnboardingPayload(store: OnboardingStore): OnboardingCompletePayload
export function mapGoalTypeToBackend(frontend: GoalType): BackendGoalType
export function mapActivityLevelToBackend(frontend: ActivityLevel): BackendActivityLevel
```

**Implementation:**
```typescript
import type { OnboardingStore } from '../store/onboardingSlice';

export interface OnboardingCompletePayload {
  // Body basics
  age_years: number;
  sex: 'male' | 'female';
  
  // Measurements
  weight_kg: number;
  height_cm: number;
  body_fat_pct: number | null;
  
  // Lifestyle
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  exercise_sessions_per_week: number;
  exercise_types: string[];
  
  // Goals
  goal_type: 'cutting' | 'maintaining' | 'bulking' | 'recomposition';
  target_weight_kg: number | null;
  goal_rate_per_week: number;
  
  // Nutrition
  diet_style: 'balanced' | 'high_protein' | 'low_carb' | 'keto';
  protein_per_kg: number;
  tdee_override: number | null;
  
  // Food DNA
  dietary_restrictions: string[];
  allergies: string[];
  cuisine_preferences: string[];
  meal_frequency: number;
}

export function mapGoalTypeToBackend(frontend: GoalType): BackendGoalType {
  const map: Record<GoalType, BackendGoalType> = {
    'lose_fat': 'cutting',
    'build_muscle': 'bulking',
    'maintain': 'maintaining',
    'eat_healthier': 'maintaining',  // No backend equivalent
    'recomposition': 'recomposition',
  };
  return map[frontend] || 'maintaining';
}

export function mapActivityLevelToBackend(frontend: ActivityLevel): BackendActivityLevel {
  const map: Record<ActivityLevel, BackendActivityLevel> = {
    'sedentary': 'sedentary',
    'lightly_active': 'light',
    'moderately_active': 'moderate',
    'highly_active': 'active',
  };
  return map[frontend] || 'moderate';
}

export function buildOnboardingPayload(store: OnboardingStore): OnboardingCompletePayload {
  // Compute age from birth year/month
  const today = new Date();
  const birthDate = new Date(store.birthYear, store.birthMonth - 1, 1);
  const age_years = today.getFullYear() - birthDate.getFullYear();
  
  return {
    age_years,
    sex: store.sex,
    weight_kg: store.weightKg,
    height_cm: store.heightCm,
    body_fat_pct: store.bodyFatSkipped ? null : store.bodyFatPct,
    activity_level: mapActivityLevelToBackend(store.activityLevel),
    exercise_sessions_per_week: store.exerciseSessionsPerWeek,
    exercise_types: store.exerciseTypes,
    goal_type: mapGoalTypeToBackend(store.goalType),
    target_weight_kg: store.targetWeightKg,
    goal_rate_per_week: store.rateKgPerWeek,
    diet_style: store.dietStyle,
    protein_per_kg: store.proteinPerKg,
    tdee_override: store.tdeeOverride,
    dietary_restrictions: store.dietaryRestrictions,
    allergies: store.allergies,
    cuisine_preferences: store.cuisinePreferences,
    meal_frequency: store.mealFrequency,
  };
}
```

**Tests:**
- `buildOnboardingPayload.test.ts` (10 test cases)
- All fields present
- Enum conversions correct
- Age calculation correct
- Body fat null when skipped
- Target weight null when not set

---

#### File 2: `app/screens/onboarding/steps/SummaryStep.tsx` (MODIFY)

**Current:** Calls `onComplete?.()` directly
**New:** Build payload, call API, handle errors, then call onComplete

**Changes:**
```typescript
import { buildOnboardingPayload } from '../../../utils/onboardingPayloadBuilder';
import { ErrorBanner } from '../../../components/common/ErrorBanner';
import api from '../../../services/api';

// Inside SummaryStep component:
const [error, setError] = useState<string | null>(null);

const handleComplete = async () => {
  setSubmitting(true);
  setError(null);
  
  try {
    const payload = buildOnboardingPayload(store);
    await api.post('onboarding/complete', payload);
    
    // Success: reset store and proceed
    await onComplete?.();
  } catch (err: any) {
    const message = err?.response?.data?.message || 'Failed to save your plan. Please try again.';
    setError(message);
  } finally {
    setSubmitting(false);
  }
};

// In JSX, add error banner before the card:
{error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
```

**Tests:**
- Integration test: API success → onComplete called
- Integration test: API failure → error shown, store not reset
- Integration test: Retry after error → works

---

### PHASE 1.2: Remove Skip Option

#### File 3: `app/screens/onboarding/steps/IntentStep.tsx` (MODIFY)

**Remove:**
```typescript
<TouchableOpacity onPress={onSkip} style={styles.skipLink}>
  <Text style={styles.skipText}>Skip for now</Text>
</TouchableOpacity>
```

**Remove from Props:**
```typescript
interface Props { onNext: () => void; onSkip: () => void; }
// Change to:
interface Props { onNext: () => void; }
```

---

#### File 4: `app/screens/onboarding/OnboardingWizard.tsx` (MODIFY)

**Remove:**
- `onSkip` prop from Props interface
- `handleSkip` function
- `onSkip={handleSkip}` from IntentStep render

---

#### File 5: `app/App.tsx` (MODIFY)

**Remove:**
- `handleOnboardingSkip` function
- `onSkip={handleOnboardingSkip}` from OnboardingWizard

---

#### File 6: `app/store/index.ts` (MODIFY)

**Remove:**
- `onboardingSkipped: boolean` from state
- `setOnboardingSkipped` action

---

### PHASE 2.1: Backend diet_style Integration

#### File 7: `src/modules/adaptive/schemas.py` (MODIFY)

**Add to AdaptiveInput:**
```python
@dataclass(frozen=True)
class AdaptiveInput:
    # ... existing fields ...
    diet_style: Optional[Literal['balanced', 'high_protein', 'low_carb', 'keto']] = None
```

---

#### File 8: `src/modules/adaptive/engine.py` (MODIFY)

**Add constant:**
```python
DIET_STYLE_MACROS = {
    'balanced': {'fat_pct': 0.25, 'carb_pct': 0.75},
    'high_protein': {'fat_pct': 0.25, 'carb_pct': 0.75},
    'low_carb': {'fat_pct': 0.40, 'carb_pct': 0.60},
    'keto': {'fat_pct': 0.70, 'carb_pct': 0.30},
}
```

**Modify `_compute_macros()`:**
```python
def _compute_macros(calories: float, weight_kg: float, goal_type: GoalType, diet_style: Optional[str]) -> MacroTargets:
    protein_g_per_kg = PROTEIN_MULTIPLIERS[goal_type]
    protein_g = weight_kg * protein_g_per_kg
    protein_kcal = protein_g * 4
    
    remaining_kcal = calories - protein_kcal
    
    # Use diet style if provided, else default to balanced
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
```

**Modify `compute_snapshot()` signature:**
```python
def compute_snapshot(input: AdaptiveInput) -> AdaptiveSnapshot:
    # ... existing code ...
    macros = _compute_macros(calories, input.weight_kg, input.goal_type, input.diet_style)
```

---

#### File 9: `src/modules/adaptive/service.py` (MODIFY)

**Modify `create_snapshot()`:**
```python
async def create_snapshot(self, user_id: uuid.UUID) -> AdaptiveSnapshot:
    # ... fetch metrics, goals, profile ...
    
    # Fetch diet_style from preferences
    diet_style = profile.preferences.get('diet_style') if profile and profile.preferences else None
    
    input_data = AdaptiveInput(
        # ... existing fields ...
        diet_style=diet_style,
    )
    
    snapshot_data = compute_snapshot(input_data)
```

---

### PHASE 2.2: Backend protein_per_kg Integration

#### File 10: `src/modules/adaptive/schemas.py` (MODIFY)

**Add to AdaptiveInput:**
```python
protein_per_kg_override: Optional[float] = None
```

---

#### File 11: `src/modules/adaptive/engine.py` (MODIFY)

**Modify `_compute_macros()`:**
```python
def _compute_macros(
    calories: float, 
    weight_kg: float, 
    goal_type: GoalType, 
    diet_style: Optional[str],
    protein_per_kg_override: Optional[float]
) -> MacroTargets:
    # Use override if provided and valid, else use goal-based default
    if protein_per_kg_override and 1.2 <= protein_per_kg_override <= 3.5:
        protein_g_per_kg = protein_per_kg_override
    else:
        protein_g_per_kg = PROTEIN_MULTIPLIERS[goal_type]
    
    # ... rest of function ...
```

---

#### File 12: `src/modules/adaptive/service.py` (MODIFY)

**Fetch protein_per_kg from preferences:**
```python
protein_per_kg = profile.preferences.get('protein_per_kg') if profile and profile.preferences else None

input_data = AdaptiveInput(
    # ... existing fields ...
    protein_per_kg_override=protein_per_kg,
)
```

---

### PHASE 2.3: Backend body_fat_pct Integration

#### File 13: `src/modules/adaptive/schemas.py` (MODIFY)

**Add to AdaptiveInput:**
```python
body_fat_pct: Optional[float] = None
```

---

#### File 14: `src/modules/adaptive/engine.py` (MODIFY)

**Modify `_compute_bmr()`:**
```python
def _compute_bmr(input: AdaptiveInput) -> float:
    # If body fat is provided and valid, use Katch-McArdle
    if input.body_fat_pct and 5 <= input.body_fat_pct <= 50:
        lean_mass_kg = input.weight_kg * (1 - input.body_fat_pct / 100)
        bmr = 370 + (21.6 * lean_mass_kg)
        return bmr
    
    # Default: Mifflin-St Jeor
    if input.sex == 'male':
        bmr = (10 * input.weight_kg) + (6.25 * input.height_cm) - (5 * input.age_years) + 5
    else:
        bmr = (10 * input.weight_kg) + (6.25 * input.height_cm) - (5 * input.age_years) - 161
    
    return bmr
```

---

#### File 15: `src/modules/adaptive/service.py` (MODIFY)

**Fetch body_fat_pct from latest metrics:**
```python
body_fat_pct = latest_metric.body_fat_pct if latest_metric else None

input_data = AdaptiveInput(
    # ... existing fields ...
    body_fat_pct=body_fat_pct,
)
```

---

## Continued in onboarding-fix-spec-part2.md...

(Phase 3 detailed specs)
