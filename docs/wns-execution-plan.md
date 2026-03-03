# WNS Engine — Production Execution Plan

> Stress-tested against the actual codebase. Every step is executable by a developer who joined yesterday.

---

## PHASE 0: SETUP & PREREQUISITES

### Step 1: Seed the `wns_engine` feature flag

**Files:** `scripts/seed_wns_flag.py` (C)
**Details:** Create a seed script following the pattern in `scripts/seed_camera_barcode_flag.py`. Insert a `FeatureFlag` row:
- `flag_name = "wns_engine"`
- `is_enabled = False`
- `conditions = None`
- `description = "Enable Weekly Net Stimulus volume calculation engine"`

Run: `.venv/bin/python scripts/seed_wns_flag.py`
**Depends on:** none
**Parallel:** standalone
**Test:** Query the DB: `SELECT * FROM feature_flags WHERE flag_name = 'wns_engine'` → row exists, `is_enabled = False`
**Rollback:** `DELETE FROM feature_flags WHERE flag_name = 'wns_engine'`
**Risk:** 🟢 Low
**Time:** S
**PR:** PR #1 (Phase 0+1)

### Step 2: Verify existing volume tests pass

**Files:** none (read-only)
**Details:** Run the existing volume test suite to establish a green baseline before any changes.
Run: `.venv/bin/python -m pytest tests/test_volume_service_unit.py -v`
**Depends on:** none
**Parallel:** Can run alongside Step 1
**Test:** All 40+ existing tests pass. Record exact count.
**Rollback:** N/A (read-only)
**Risk:** 🟢 Low
**Time:** S

### 🚦 CHECKPOINT 0: Prerequisites verified

**Run:** `.venv/bin/python -m pytest tests/test_volume_service_unit.py -v`
**Verify:** All tests pass. Feature flag `wns_engine` exists in DB with `is_enabled = False`.
**Gate:** Green test suite + flag seeded. Proceed only if both true.

---

## PHASE 1: WNS ENGINE — PURE FUNCTIONS

### Step 3: Create `wns_engine.py` with core calculation functions

**Files:** `src/modules/training/wns_engine.py` (C)
**Details:** Create a new module with ZERO database dependencies. All functions are pure. Contains:

**Function 1: `stimulating_reps_per_set(reps, rir, intensity_pct) -> float`**
- If `intensity_pct >= 0.85`: return `min(reps, MAX_STIM_REPS)` (all reps stimulating)
- If `rir >= 4`: return `0.0` (junk volume)
- If `rir >= 3`: return `min(2.0, reps)`
- If `rir >= 2`: return `min(3.0, reps)`
- If `rir >= 1`: return `min(4.0, reps)`
- If `rir < 1` (at failure): return `min(MAX_STIM_REPS, reps)`
- `MAX_STIM_REPS = 5.0` (module-level constant)
- Handle `rir is None` → default to `DEFAULT_RIR = 2.0`
- Handle `intensity_pct is None or 0` → default to `0.75`

**Function 2: `rir_from_rpe(rpe: float | None) -> float`**
- If `rpe is None`: return `DEFAULT_RIR`
- Return `max(0.0, 10.0 - min(10.0, max(1.0, rpe)))`

**Function 3: `diminishing_returns(ordered_stim_reps: list[float]) -> float`**
- For each set at index `i`: `factor = 1.0 / (1.0 + DIMINISHING_K * i)`
- `DIMINISHING_K = 0.4` (module-level constant, fitted to Schoenfeld data: 6 sets ≈ 2x stimulus of 1 set)
- Return `sum(stim_reps * factor for i, stim_reps in enumerate(ordered_stim_reps))`

**Function 4: `atrophy_between_sessions(gap_days, stimulus_duration_days, maintenance_sets_per_week) -> float`**
- `atrophy_days = max(0.0, gap_days - stimulus_duration_days)`
- `daily_atrophy_rate = maintenance_sets_per_week / 7.0`
- Return `atrophy_days * daily_atrophy_rate`

**Function 5: `compute_session_muscle_stimulus(sets_data, muscle_group, exercise_coefficients) -> float`**
- `sets_data`: list of dicts with keys `exercise_id`, `reps`, `rir`, `intensity_pct`, `set_type`
- Filter out `set_type == "warm-up"`
- For each set: compute `stim_reps * coefficient` for the target muscle
- Collect into ordered list, apply `diminishing_returns()`
- Return total session stimulus for that muscle

**Module-level constants:**
```python
MAX_STIM_REPS: float = 5.0
DEFAULT_RIR: float = 2.0
DIMINISHING_K: float = 0.4
DEFAULT_STIMULUS_DURATION_DAYS: float = 2.0
DEFAULT_MAINTENANCE_SETS: float = 3.0
```

**Depends on:** none
**Parallel:** standalone
**Test:** Step 4
**Rollback:** `git rm src/modules/training/wns_engine.py`
**Risk:** 🟢 Low — pure functions, no side effects
**Time:** M
**PR:** PR #1

### Step 4: Write unit tests for `wns_engine.py`

**Files:** `tests/test_wns_engine_unit.py` (C)
**Details:** Follow the exact test class pattern from `tests/test_volume_service_unit.py`. Write these test classes:

**Class `TestStimulatingRepsPerSet`** (12+ tests):
- `test_at_failure_returns_max_stim_reps` → `stimulating_reps_per_set(10, 0.0, 0.75)` == 5.0
- `test_rir_1_returns_4` → `stimulating_reps_per_set(10, 1.0, 0.75)` == 4.0
- `test_rir_2_returns_3` → `stimulating_reps_per_set(10, 2.0, 0.75)` == 3.0
- `test_rir_3_returns_2` → `stimulating_reps_per_set(10, 3.0, 0.75)` == 2.0
- `test_rir_4_plus_returns_zero` → `stimulating_reps_per_set(10, 4.0, 0.75)` == 0.0
- `test_rir_5_returns_zero` → `stimulating_reps_per_set(10, 5.0, 0.75)` == 0.0
- `test_heavy_load_all_reps_stimulating` → `stimulating_reps_per_set(3, 2.0, 0.90)` == 3.0
- `test_heavy_load_capped_at_max` → `stimulating_reps_per_set(8, 0.0, 0.90)` == 5.0
- `test_low_reps_capped_by_actual_reps` → `stimulating_reps_per_set(2, 0.0, 0.75)` == 2.0
- `test_zero_reps_returns_zero` → `stimulating_reps_per_set(0, 0.0, 0.75)` == 0.0
- `test_none_rir_uses_default` → `stimulating_reps_per_set(10, None, 0.75)` == 3.0 (default RIR=2)
- `test_none_intensity_uses_default` → `stimulating_reps_per_set(10, 0.0, None)` == 5.0

**Class `TestRirFromRpe`** (6+ tests):
- `test_rpe_10_returns_0` → 0.0
- `test_rpe_8_returns_2` → 2.0
- `test_rpe_6_returns_4` → 4.0
- `test_rpe_none_returns_default` → DEFAULT_RIR
- `test_rpe_clamped_above_10` → `rir_from_rpe(12.0)` == 0.0
- `test_rpe_clamped_below_1` → `rir_from_rpe(-5.0)` == 9.0

**Class `TestDiminishingReturns`** (5+ tests):
- `test_empty_list_returns_zero` → 0.0
- `test_single_set` → `diminishing_returns([5.0])` == 5.0
- `test_two_sets_less_than_double` → result < 10.0
- `test_six_sets_approx_double_one_set` → `diminishing_returns([5.0]*6)` ≈ `2 * diminishing_returns([5.0])` (within 20%)
- `test_order_matters` → `diminishing_returns([5.0, 1.0])` != `diminishing_returns([1.0, 5.0])`

**Class `TestAtrophyBetweenSessions`** (5+ tests):
- `test_no_gap_returns_zero` → gap=0 → 0.0
- `test_gap_within_stimulus_returns_zero` → gap=1.5, duration=2.0 → 0.0
- `test_gap_beyond_stimulus` → gap=5.0, duration=2.0, maintenance=3.0 → 3.0 * 3/7 ≈ 1.286
- `test_zero_maintenance_returns_zero` → maintenance=0 → 0.0
- `test_large_gap` → gap=7.0, duration=2.0, maintenance=3.0 → 5.0 * 3/7 ≈ 2.143

**Class `TestComputeSessionMuscleStimulus`** (4+ tests):
- `test_empty_sets_returns_zero`
- `test_warmup_sets_excluded`
- `test_direct_coefficient_applied`
- `test_fractional_coefficient_applied`

**Depends on:** Step 3
**Parallel:** sequential (needs Step 3)
**Test:** `.venv/bin/python -m pytest tests/test_wns_engine_unit.py -v` → all pass
**Rollback:** `git rm tests/test_wns_engine_unit.py`
**Risk:** 🟢 Low
**Time:** M
**PR:** PR #1

### Step 5: Create `exercise_coefficients.py` — multi-muscle attribution

**Files:** `src/modules/training/exercise_coefficients.py` (C)
**Details:** Create a new module that replaces the 1:1 mapping in `exercise_mapping.py` with multi-muscle coefficients. **Do NOT modify `exercise_mapping.py`** — the old module stays for backward compatibility.

**Function: `get_muscle_coefficients(exercise_name: str, primary_muscle: str, secondary_muscles: list[str]) -> dict[str, float]`**
- Returns `{muscle_group: coefficient}` dict
- Primary muscle → `1.0`
- Each secondary muscle → `0.5`
- If `exercise_name` not found and no primary/secondary provided → fall back to `exercise_mapping.get_muscle_group()` with coefficient `1.0`

**Function: `get_exercise_coefficient(exercise_name: str, target_muscle: str, primary_muscle: str, secondary_muscles: list[str]) -> float`**
- Convenience function returning the coefficient for a single target muscle
- Returns `0.0` if the exercise doesn't target that muscle

**Note:** The exercise database already stores `muscle_group` and `secondary_muscles` per exercise. This module uses those fields dynamically rather than hardcoding a giant dict.

**Depends on:** none
**Parallel:** Can run alongside Step 3-4
**Test:** Step 6
**Rollback:** `git rm src/modules/training/exercise_coefficients.py`
**Risk:** 🟢 Low
**Time:** S
**PR:** PR #1

### Step 6: Write unit tests for `exercise_coefficients.py`

**Files:** `tests/test_exercise_coefficients_unit.py` (C)
**Details:**

**Class `TestGetMuscleCoefficients`** (5+ tests):
- `test_primary_gets_1_0` → `get_muscle_coefficients("bench press", "chest", ["triceps"])["chest"]` == 1.0
- `test_secondary_gets_0_5` → `...["triceps"]` == 0.5
- `test_unlisted_muscle_returns_0` → `...["calves"]` not in result or == 0.0
- `test_no_secondary_returns_primary_only`
- `test_fallback_to_exercise_mapping` → unknown exercise with no primary/secondary → uses `get_muscle_group()`

**Class `TestGetExerciseCoefficient`** (3+ tests):
- `test_direct_muscle` → 1.0
- `test_fractional_muscle` → 0.5
- `test_unrelated_muscle` → 0.0

**Depends on:** Step 5
**Parallel:** sequential
**Test:** `.venv/bin/python -m pytest tests/test_exercise_coefficients_unit.py -v` → all pass
**Rollback:** `git rm tests/test_exercise_coefficients_unit.py`
**Risk:** 🟢 Low
**Time:** S
**PR:** PR #1

### Step 7: Add WNS schemas to `volume_schemas.py`

**Files:** `src/modules/training/volume_schemas.py` (M)
**Details:** ADD new schemas below the existing ones. **Do NOT modify existing schemas** — they're used by the current volume endpoints.

Add these new models at the bottom of the file:

```python
# ─── WNS Schemas ──────────────────────────────────────────────────────────────

class WNSLandmarks(BaseModel):
    mv: float = Field(ge=0, description="Maintenance Volume in HU")
    mev: float = Field(ge=0, description="Minimum Effective Volume in HU")
    mav_low: float = Field(ge=0, description="MAV lower bound in HU")
    mav_high: float = Field(ge=0, description="MAV upper bound in HU")
    mrv: float = Field(ge=0, description="Maximum Recoverable Volume in HU")

class WNSExerciseContribution(BaseModel):
    exercise_name: str
    coefficient: float = Field(ge=0, le=1.0)
    sets_count: int = Field(ge=0)
    stimulating_reps_total: float = Field(ge=0)
    contribution_hu: float = Field(ge=0)

class WNSMuscleVolume(BaseModel):
    muscle_group: str
    gross_stimulus: float = Field(ge=0)
    atrophy_effect: float = Field(ge=0)
    net_stimulus: float = Field(ge=0)
    hypertrophy_units: float = Field(ge=0)
    status: VolumeStatus
    session_count: int = Field(ge=0)
    frequency: int = Field(ge=0, le=14)
    landmarks: WNSLandmarks
    exercises: list[WNSExerciseContribution]

class WNSWeeklyResponse(BaseModel):
    week_start: date
    week_end: date
    muscle_groups: list[WNSMuscleVolume]
    engine: Literal["wns"] = "wns"
```

**Depends on:** none
**Parallel:** Can run alongside Steps 3-6
**Test:** Add schema validation tests in Step 8
**Rollback:** Revert the additions to `volume_schemas.py` (existing schemas untouched)
**Risk:** 🟢 Low — additive only
**Time:** S
**PR:** PR #1

### Step 8: Write schema validation tests for WNS schemas

**Files:** `tests/test_volume_service_unit.py` (M)
**Details:** ADD a new test class `TestWNSSchemaValidation` at the bottom of the existing test file. Follow the exact pattern of `TestSchemaValidation` already in the file.

Tests:
- `test_wns_landmarks_rejects_negative`
- `test_wns_exercise_contribution_valid`
- `test_wns_muscle_volume_valid`
- `test_wns_weekly_response_valid`
- `test_wns_muscle_volume_rejects_invalid_status`

**Depends on:** Step 7
**Parallel:** sequential
**Test:** `.venv/bin/python -m pytest tests/test_volume_service_unit.py -v -k "WNS"` → all pass
**Rollback:** Revert additions to test file
**Risk:** 🟢 Low
**Time:** S
**PR:** PR #1

### 🚦 CHECKPOINT 1: WNS Engine solid

**Run:**
```bash
.venv/bin/python -m pytest tests/test_wns_engine_unit.py tests/test_exercise_coefficients_unit.py tests/test_volume_service_unit.py -v
```
**Verify:** ALL tests pass (old + new). Zero failures.
**Gate:** All pure functions tested. No existing tests broken. Proceed only if green.

---

## PHASE 2: BACKEND INTEGRATION

### Step 9: Create `wns_volume_service.py` — the WNS-aware volume service

**Files:** `src/modules/training/wns_volume_service.py` (C)
**Details:** Create a new service class `WNSVolumeService` that wraps the WNS engine functions with database access. **Do NOT modify `volume_service.py`** — the old service stays as fallback.

**Class `WNSVolumeService`:**
- `__init__(self, session: AsyncSession)`
- `async def get_weekly_muscle_volume(self, user_id, week_start) -> list[WNSMuscleVolume]`
  - Fetch sessions via `TrainingAnalyticsService._fetch_sessions()`
  - Fetch exercise metadata (muscle_group, secondary_muscles) from exercises table
  - For each muscle group in `DEFAULT_WNS_LANDMARKS`:
    - Compute per-session stimulus using `wns_engine.compute_session_muscle_stimulus()`
    - Compute atrophy between sessions using `wns_engine.atrophy_between_sessions()`
    - Net stimulus = gross - atrophy
    - Build `WNSMuscleVolume` response
  - Return list

**`DEFAULT_WNS_LANDMARKS` dict** (module-level):
```python
DEFAULT_WNS_LANDMARKS: dict[str, dict[str, float]] = {
    "chest":      {"mv": 3, "mev": 8,  "mav_low": 14, "mav_high": 20, "mrv": 28},
    "lats":       {"mv": 3, "mev": 8,  "mav_low": 14, "mav_high": 22, "mrv": 30},
    "back":       {"mv": 3, "mev": 8,  "mav_low": 14, "mav_high": 22, "mrv": 30},
    "shoulders":  {"mv": 2, "mev": 6,  "mav_low": 10, "mav_high": 16, "mrv": 22},
    "quads":      {"mv": 3, "mev": 7,  "mav_low": 12, "mav_high": 18, "mrv": 26},
    "hamstrings": {"mv": 2, "mev": 6,  "mav_low": 10, "mav_high": 16, "mrv": 22},
    "glutes":     {"mv": 2, "mev": 6,  "mav_low": 10, "mav_high": 16, "mrv": 24},
    "biceps":     {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "triceps":    {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "abs":        {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "traps":      {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 12, "mrv": 18},
    "calves":     {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "erectors":   {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "forearms":   {"mv": 1, "mev": 4,  "mav_low": 6,  "mav_high": 10, "mrv": 16},
    "adductors":  {"mv": 1, "mev": 4,  "mav_low": 6,  "mav_high": 10, "mrv": 16},
}
```

**Depends on:** Steps 3, 5, 7
**Parallel:** sequential
**Test:** Step 10
**Rollback:** `git rm src/modules/training/wns_volume_service.py`
**Risk:** 🟡 Medium — integrates with existing `TrainingAnalyticsService._fetch_sessions()`. Verify the return type matches expectations.
**Time:** L
**PR:** PR #2 (Phase 2)

### Step 10: Write integration tests for `WNSVolumeService`

**Files:** `tests/test_wns_volume_service.py` (C)
**Details:** Follow the async test pattern from `tests/conftest.py`. Use the test database with JSONB→JSON patching.

**Tests:**
- `test_empty_week_returns_all_muscle_groups_with_zero_hu`
- `test_single_session_computes_stimulus`
- `test_warmup_sets_excluded`
- `test_compound_exercise_credits_multiple_muscles` — bench press → chest (1.0) + triceps (0.5)
- `test_high_rir_sets_produce_less_stimulus`
- `test_junk_volume_rir_4_plus_produces_zero`
- `test_diminishing_returns_applied` — 6 sets < 6x single set stimulus
- `test_two_sessions_less_atrophy_than_one` — same total sets, 2x/week vs 1x/week → higher net
- `test_frequency_reduces_atrophy`

**Depends on:** Step 9
**Parallel:** sequential
**Test:** `.venv/bin/python -m pytest tests/test_wns_volume_service.py -v` → all pass
**Rollback:** `git rm tests/test_wns_volume_service.py`
**Risk:** 🟡 Medium — async DB tests can be flaky. Use `pytest-asyncio` with `auto` mode.
**Time:** L
**PR:** PR #2

### Step 11: Wire WNS into the volume router behind feature flag

**Files:** `src/modules/training/router.py` (M)
**Details:** Modify the existing `GET /api/v1/training/volume/weekly` endpoint (and the muscle group detail endpoint) to check the `wns_engine` feature flag. If enabled, delegate to `WNSVolumeService`. If disabled, use existing `VolumeCalculatorService`.

**Implementation pattern:**
```python
from src.modules.feature_flags.service import FeatureFlagService

# Inside the endpoint handler:
ff_svc = FeatureFlagService(session)
use_wns = await ff_svc.is_feature_enabled("wns_engine", user)
if use_wns:
    svc = WNSVolumeService(session)
    result = await svc.get_weekly_muscle_volume(user.id, week_start)
    return WNSWeeklyResponse(week_start=week_start, week_end=week_end, muscle_groups=result)
else:
    # existing code path unchanged
    ...
```

**CRITICAL:** The response shape changes when WNS is enabled (`WNSWeeklyResponse` vs `WeeklyVolumeResponse`). The frontend must handle both. Add an `engine` field to distinguish: `"wns"` vs `"legacy"`. Add `engine: Literal["legacy"] = "legacy"` to the existing `WeeklyVolumeResponse` schema.

**Depends on:** Steps 9, 1 (feature flag)
**Parallel:** sequential
**Test:** Step 12
**Rollback:** Revert router changes. Feature flag OFF = old behavior.
**Risk:** 🟡 Medium — modifying a shared endpoint. The feature flag ensures zero impact when OFF.
**Time:** M
**PR:** PR #2

### Step 12: Write endpoint integration tests

**Files:** `tests/test_wns_volume_service.py` (M) — add to existing file
**Details:** Add API-level tests using `httpx.AsyncClient`:

- `test_weekly_volume_endpoint_returns_legacy_when_flag_off`
- `test_weekly_volume_endpoint_returns_wns_when_flag_on`
- `test_wns_response_has_engine_field_wns`
- `test_legacy_response_has_engine_field_legacy`

**Depends on:** Step 11
**Parallel:** sequential
**Test:** `.venv/bin/python -m pytest tests/test_wns_volume_service.py -v` → all pass
**Rollback:** Revert test additions
**Risk:** 🟢 Low
**Time:** M
**PR:** PR #2

### Step 13: Verify ALL existing tests still pass

**Files:** none (read-only)
**Details:** Run the FULL test suite to confirm zero regressions.
**Run:** `.venv/bin/python -m pytest tests/ -v --timeout=120`
**Depends on:** Steps 11-12
**Parallel:** sequential
**Test:** ALL tests pass. Zero failures. Zero errors.
**Rollback:** N/A
**Risk:** 🟡 Medium — if anything fails, it means Step 11 broke something. Fix before proceeding.
**Time:** M

### 🚦 CHECKPOINT 2: Backend complete and tested

**Run:**
```bash
.venv/bin/python -m pytest tests/ -v --timeout=120
```
**Verify:** ALL tests pass. Manually test with curl:
```bash
# Flag OFF → legacy response
curl -s http://localhost:8000/api/v1/training/volume/weekly?week_start=2026-03-02 \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('engine','missing'))"
# Should print: "legacy"

# Enable flag in DB, then:
# Should print: "wns"
```
**Gate:** Full test suite green. Both legacy and WNS paths work via curl. Proceed only if both verified.


---

## PHASE 3: FRONTEND — TYPES, HOOKS, UTILITIES

### Step 14: Add WNS TypeScript types

**Files:** `app/types/volume.ts` (C)
**Details:** Create shared TypeScript interfaces matching the backend WNS schemas exactly. These are consumed by hooks, components, and utilities.

```typescript
export interface WNSLandmarks {
  mv: number;
  mev: number;
  mav_low: number;
  mav_high: number;
  mrv: number;
}

export interface WNSExerciseContribution {
  exercise_name: string;
  coefficient: number;
  sets_count: number;
  stimulating_reps_total: number;
  contribution_hu: number;
}

export interface WNSMuscleVolume {
  muscle_group: string;
  gross_stimulus: number;
  atrophy_effect: number;
  net_stimulus: number;
  hypertrophy_units: number;
  status: 'below_mev' | 'optimal' | 'approaching_mrv' | 'above_mrv';
  session_count: number;
  frequency: number;
  landmarks: WNSLandmarks;
  exercises: WNSExerciseContribution[];
}

export interface WNSWeeklyResponse {
  week_start: string;
  week_end: string;
  muscle_groups: WNSMuscleVolume[];
  engine: 'wns' | 'legacy';
}
```

**Depends on:** Step 7 (schema must be finalized)
**Parallel:** Can start after Checkpoint 1. Parallelizable with Phase 2.
**Test:** `cd app && npx tsc --noEmit` → no type errors
**Rollback:** `git rm app/types/volume.ts`
**Risk:** 🟢 Low
**Time:** S
**PR:** PR #3 (Phase 3+4)

### Step 15: Create `wnsCalculator.ts` — client-side HU estimation

**Files:** `app/utils/wnsCalculator.ts` (C)
**Details:** Port the pure functions from `wns_engine.py` to TypeScript for real-time volume pill updates during active workouts. These run client-side without API calls.

```typescript
export const MAX_STIM_REPS = 5.0;
export const DEFAULT_RIR = 2.0;
export const DIMINISHING_K = 0.4;

export function stimulatingRepsPerSet(
  reps: number,
  rir: number | null,
  intensityPct: number | null,
): number { /* mirror Python logic exactly */ }

export function rirFromRpe(rpe: number | null): number { /* mirror Python */ }

export function diminishingReturns(orderedStimReps: number[]): number { /* mirror Python */ }

export function estimateSessionHU(
  sets: Array<{ stimReps: number; coefficient: number }>,
): number { /* apply diminishing returns to weighted stim reps */ }
```

**CRITICAL:** These must produce identical results to the Python functions. Use the same constants and logic.

**Depends on:** Step 14
**Parallel:** Can run alongside Step 16
**Test:** Step 17
**Rollback:** `git rm app/utils/wnsCalculator.ts`
**Risk:** 🟡 Medium — must match Python exactly. Test with same inputs.
**Time:** M
**PR:** PR #3

### Step 16: Create `useWNSVolume.ts` hook

**Files:** `app/hooks/useWNSVolume.ts` (C)
**Details:** React hook that fetches WNS volume data from the API and provides it to components. Handles the `engine` field to determine response shape.

```typescript
export function useWNSVolume(weekStart: string) {
  const [data, setData] = useState<WNSWeeklyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch from /api/v1/training/volume/weekly?week_start=...
    // Check response.engine === 'wns'
    // If 'legacy', transform legacy response to WNS shape with default values
  }, [weekStart]);

  return { data, loading, error, isWNS: data?.engine === 'wns' };
}
```

**Depends on:** Steps 14, 15
**Parallel:** sequential
**Test:** Step 17
**Rollback:** `git rm app/hooks/useWNSVolume.ts`
**Risk:** 🟢 Low
**Time:** S
**PR:** PR #3

### Step 17: Write frontend unit tests

**Files:** `app/__tests__/wnsCalculator.test.ts` (C)
**Details:** Test the TypeScript calculator functions with the SAME inputs and expected outputs as the Python tests in Step 4. This ensures parity.

Tests (mirror Python exactly):
- `stimulatingRepsPerSet` — all 12 cases from `TestStimulatingRepsPerSet`
- `rirFromRpe` — all 6 cases from `TestRirFromRpe`
- `diminishingReturns` — all 5 cases from `TestDiminishingReturns`
- `estimateSessionHU` — 3 cases

**Run:** `cd app && npx jest __tests__/wnsCalculator.test.ts`

**Depends on:** Steps 15, 16
**Parallel:** sequential
**Test:** All tests pass. Results match Python test expectations exactly.
**Rollback:** `git rm app/__tests__/wnsCalculator.test.ts`
**Risk:** 🟢 Low
**Time:** M
**PR:** PR #3

### 🚦 CHECKPOINT 3: Frontend utilities ready

**Run:**
```bash
cd app && npx tsc --noEmit && npx jest __tests__/wnsCalculator.test.ts
```
**Verify:** Zero type errors. All calculator tests pass. Results match Python backend.
**Gate:** Types compile. Calculator parity verified. Proceed only if green.

---

## PHASE 4: FRONTEND — COMPONENTS & SCREENS

### Step 18: Update `VolumeIndicatorPill.tsx` to show HU

**Files:** `app/components/training/VolumeIndicatorPill.tsx` (M)
**Details:** Modify the pill to display HU when WNS data is available. Keep backward compatibility with legacy data.

Changes:
- Accept new optional prop: `wnsData?: WNSMuscleVolume`
- If `wnsData` provided: show `"{hu} HU"` instead of `"{sets}/{mav} sets"`
- Progress bar: fill based on `hypertrophy_units / landmarks.mrv`
- Color logic: use existing `intelligenceLayerLogic.ts` pattern but with HU thresholds
- If `wnsData` not provided: render exactly as before (backward compat)

**Depends on:** Steps 14, 16
**Parallel:** Can run alongside Step 19
**Test:** Visual verification on simulator. Existing pill behavior unchanged when `wnsData` is undefined.
**Rollback:** Revert file changes. Feature flag OFF = old data = old rendering.
**Risk:** 🟡 Medium — modifying existing component. Backward compat is critical.
**Time:** M
**PR:** PR #3

### Step 19: Update `volumeAggregator.ts` for real-time WNS

**Files:** `app/utils/volumeAggregator.ts` (M)
**Details:** Modify `aggregateVolume()` to use `wnsCalculator.ts` when WNS mode is active. The function currently adds raw set counts from active workout to API weekly data. With WNS, it should add estimated HU from active sets.

Add a new function:
```typescript
export function aggregateWNSVolume(
  weeklyWNSData: WNSMuscleVolume[],
  activeExercises: ActiveExercise[],
  exerciseCoefficients: Record<string, Record<string, number>>,
): WNSMuscleVolume[]
```

Keep the existing `aggregateVolume()` unchanged.

**Depends on:** Steps 15, 14
**Parallel:** Can run alongside Step 18
**Test:** Unit test with mock data → HU increases as active sets are added
**Rollback:** Revert file changes. Old function untouched.
**Risk:** 🟡 Medium — real-time calculation must be fast (<16ms for 60fps)
**Time:** M
**PR:** PR #3

### Step 20: Update `HeatMapCard.tsx` and `DrillDownModal.tsx`

**Files:** `app/components/analytics/HeatMapCard.tsx` (M), `app/components/analytics/DrillDownModal.tsx` (M)
**Details:**

**HeatMapCard changes:**
- Use `useWNSVolume` hook instead of direct API call
- Pass WNS data to `BodyHeatMap` for coloring
- Show "HU" label instead of "sets" when WNS active

**DrillDownModal changes:**
- Show per-exercise HU contribution breakdown
- Show `coefficient` badge (Direct 1.0 / Fractional 0.5)
- Show gross vs net stimulus
- Add "ⓘ How is this calculated?" link (wired in Phase 5)

**Depends on:** Steps 16, 18
**Parallel:** sequential
**Test:** Visual verification. Drill-down shows exercise contributions with coefficients.
**Rollback:** Revert both files. Feature flag OFF = old data = old rendering.
**Risk:** 🟡 Medium — modifying analytics UI. Must handle both legacy and WNS data shapes.
**Time:** L
**PR:** PR #3

### Step 21: Update `muscleVolumeLogic.ts` for WNS status colors

**Files:** `app/utils/muscleVolumeLogic.ts` (M)
**Details:** Add a new function `getWNSHeatMapColor(hu: number, landmarks: WNSLandmarks): string` alongside the existing `getHeatMapColor()`. Do NOT modify the existing function.

Color mapping:
- `hu < mev` → cold (blue/gray)
- `mev <= hu < mav_low` → warm (yellow)
- `mav_low <= hu <= mav_high` → hot (green — optimal zone)
- `mav_high < hu <= mrv` → warning (orange)
- `hu > mrv` → danger (red)

**Depends on:** Step 14
**Parallel:** Can run alongside Steps 18-20
**Test:** Unit test with boundary values
**Rollback:** Revert additions. Existing function untouched.
**Risk:** 🟢 Low — additive only
**Time:** S
**PR:** PR #3

### 🚦 CHECKPOINT 4: Feature works end-to-end

**Run:**
```bash
# Backend
.venv/bin/python -m pytest tests/ -v --timeout=120

# Frontend
cd app && npx tsc --noEmit && npx jest
```
**Verify:**
1. All backend tests pass
2. All frontend tests pass
3. Enable `wns_engine` flag in DB
4. Open app on simulator → Analytics tab → Heat map shows HU values
5. Start a workout → Volume pills show HU updating in real-time
6. Tap a muscle on heat map → Drill-down shows exercise contributions with coefficients
7. Disable flag → app shows legacy set counts
**Gate:** Full end-to-end flow works with flag ON. Legacy flow works with flag OFF. All tests green.

---

## PHASE 5: EDUCATION LAYER & POLISH

### Step 22: Create `HUExplainerSheet.tsx`

**Files:** `app/components/education/HUExplainerSheet.tsx` (C)
**Details:** Bottom sheet component (using `@gorhom/bottom-sheet` already in dependencies) explaining how HU works. Content:

- Title: "How Hypertrophy Units Work"
- Section 1: "Not all reps build muscle equally" — explain stimulating reps
- Section 2: "Your HU score accounts for:" — bullet list (proximity to failure, muscle targeting, diminishing returns, recovery)
- Section 3: "What the colors mean" — MEV/MAV/MRV explanation with color swatches

Triggered by "ⓘ" icon tap anywhere in volume UI.

**Depends on:** none (standalone component)
**Parallel:** Can run alongside Phase 4
**Test:** Component renders without crash. Bottom sheet opens/closes.
**Rollback:** `git rm app/components/education/HUExplainerSheet.tsx`
**Risk:** 🟢 Low
**Time:** M
**PR:** PR #4 (Phase 5)

### Step 23: Wire "ⓘ" buttons to explainer sheet

**Files:** `app/components/training/VolumeIndicatorPill.tsx` (M), `app/components/analytics/DrillDownModal.tsx` (M)
**Details:** Add a small "ⓘ" icon button that opens `HUExplainerSheet`. Only visible when WNS mode is active.

**Depends on:** Steps 22, 18, 20
**Parallel:** sequential
**Test:** Tap "ⓘ" → sheet opens. Dismiss → sheet closes.
**Rollback:** Revert icon additions.
**Risk:** 🟢 Low
**Time:** S
**PR:** PR #4

### Step 24: Add `engine` field to legacy `WeeklyVolumeResponse`

**Files:** `src/modules/training/volume_schemas.py` (M)
**Details:** Add `engine: Literal["legacy"] = "legacy"` to the existing `WeeklyVolumeResponse` class. This is a non-breaking additive change — existing consumers ignore unknown fields.

**Depends on:** none
**Parallel:** Should have been done in Step 11 but listed separately for clarity
**Test:** Existing tests still pass. Legacy endpoint returns `"engine": "legacy"`.
**Rollback:** Remove the field.
**Risk:** 🟢 Low — additive, backward compatible
**Time:** S
**PR:** PR #2 (backfill into Phase 2 PR)

### Step 25: Run full test suite — final verification

**Files:** none
**Details:**
```bash
# Backend
.venv/bin/python -m pytest tests/ -v --timeout=120

# Frontend
cd app && npx tsc --noEmit && npx jest
```

**Depends on:** All previous steps
**Test:** ZERO failures across entire suite
**Rollback:** N/A
**Risk:** 🟢 Low
**Time:** M

### 🚦 CHECKPOINT 5: Production-ready

**Run:** Full test suites (backend + frontend)
**Verify:**
1. All tests pass
2. Feature flag OFF → zero behavior change (legacy path)
3. Feature flag ON → WNS path with HU display
4. Explainer sheet accessible from volume pills and drill-down
5. No TypeScript errors
6. No Python type errors (mypy)
**Gate:** Ready for staged rollout.

---

## PHASE 6: SHIP

### Step 26: Enable feature flag for internal testing

**Details:** Set `wns_engine` flag `is_enabled = True` with `conditions = {"user_ids": ["<your-user-id>"]}` for internal-only testing.
**Rollback:** Set `is_enabled = False`
**Risk:** 🟢 Low — only affects specified users
**Time:** S

### Step 27: Internal testing — 48 hours

**Details:** Use the app normally for 48 hours with WNS enabled. Verify:
- HU values make intuitive sense
- Volume pills update in real-time during workouts
- Heat map colors reflect training distribution
- Drill-down shows correct exercise contributions
- No crashes or performance issues
**Risk:** 🟡 Medium — may surface edge cases
**Time:** XL (calendar time, not effort)

### Step 28: Staged rollout — 10% → 50% → 100%

**Details:**
1. Remove `conditions` from flag (enables for all) but keep `is_enabled = True`
2. Monitor for 24 hours at each stage
3. Check error rates, latency, crash reports
**Rollback:** Set `is_enabled = False` at any stage
**Risk:** 🟡 Medium
**Time:** XL (calendar time)

### 🚦 FINAL CHECKPOINT: Launched and stable

**Verify:** All metrics within thresholds for 48+ hours post-100% rollout.
**Gate:** Feature flag can be hardcoded to `True` and flag check removed in a cleanup PR.

---

## POST-LAUNCH MONITORING

| What to Monitor | How | Alert Threshold | Action If Triggered |
|----------------|-----|-----------------|---------------------|
| Error rate (`/volume/weekly`) | Sentry + logs | > 1% of requests | Disable flag, investigate |
| Latency (`/volume/weekly`) | Structured logging | p99 > 500ms | Check query plans, add caching |
| WNS calculation errors | `logger.exception` in `wns_volume_service.py` | Any | Investigate, fix, or fall back to legacy |
| Frontend crash rate | Sentry React Native | Any increase > 0.1% | Disable flag |
| Feature adoption | Check `engine: "wns"` in responses | < 50% after flag ON | Verify flag propagation |
| Volume endpoint usage | Request count logs | Drop > 20% | Investigate — users may be confused |

---

## DEFERRED TO V2

| Item | Why Deferred | Effort Saved | When to Revisit |
|------|-------------|-------------|-----------------|
| Personalized WNS landmarks (adaptive over time) | Needs weeks of user data to calibrate | L | After 4 weeks of WNS data collection |
| User-configurable WNS parameters (stimulus duration, maintenance volume) | Settings UI complexity, most users won't touch | M | After v1 feedback shows demand |
| Coaching nudges during workout ("This set was junk volume") | Requires real-time RIR estimation UX | L | v2 sprint |
| Weekly net stimulus report (email/push) | Notification infrastructure needed | M | After report module exists |
| Atrophy visualization in analytics | Nice-to-have polish | M | v2 sprint |
| Premium gating of exercise breakdown | Need to decide free vs premium boundary | S | After launch metrics |
| Onboarding card for existing users ("We upgraded your volume tracking") | Onboarding flow changes are risky | M | After v1 is stable |
| Property-based tests with Hypothesis for WNS engine | Good but not blocking for v1 | M | Post-launch hardening sprint |

---

## PLAN SUMMARY

```
═══════════════════════════════════════════════
Total steps:        28
Total phases:       6 (+ Phase 0)
Total checkpoints:  6
Estimated time:     5 days (1 developer) / 3 days (2 developers parallel after Checkpoint 1)
Critical path:      Phase 0 → 1 → 2 (sequential) | Phase 3-4 parallel with Phase 2 after Checkpoint 1
PR count:           4 PRs
  PR #1: Phase 0+1 (pure functions + tests)
  PR #2: Phase 2 (backend integration + feature flag)
  PR #3: Phase 3+4 (frontend types, hooks, components)
  PR #4: Phase 5 (education layer)
Migration count:    0 (no schema changes — WNS uses existing tables + feature flags)
New files:          8
Modified files:     9
New test count:     ~55 tests
═══════════════════════════════════════════════
```
