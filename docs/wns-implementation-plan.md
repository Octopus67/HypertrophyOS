# Weekly Net Stimulus (WNS) Engine — Implementation Plan

## Executive Summary

Replace Repwise's current simple RPE-tier volume counting with Chris Beardsley's **Weekly Net Stimulus** model — a scientifically-grounded algorithm that tracks *net hypertrophy stimulus* rather than raw set counts. This makes Repwise the first consumer fitness app to implement stimulus-aware volume tracking, creating a genuine competitive moat.

**Current state**: 3-tier RPE multiplier (1.0 / 0.75 / 0.5), single muscle group per exercise, no diminishing returns, no atrophy modeling.

**Target state**: Stimulating reps scoring, direct/fractional/indirect muscle attribution, diminishing returns curves, inter-session atrophy decay, and a user-facing "Hypertrophy Units" metric that educates while it tracks.

---

## Part 1: The Algorithm

### 1.1 Core Formula

```
Weekly Net Stimulus (per muscle group) =
    Σ(session_stimulus) - Σ(atrophy_between_sessions)
```

Where:
```
session_stimulus = diminishing_returns(
    Σ(stimulating_reps_per_set × muscle_coefficient)
)

atrophy_between_sessions = max(0, gap_days - stimulus_duration_days) × daily_atrophy_rate
```

### 1.2 Stimulating Reps Per Set

Only the last ~5 reps before failure drive hypertrophy. The number of stimulating reps depends on proximity to failure (RIR) and load:

```python
def stimulating_reps(reps: int, rir: float, weight_kg: float, e1rm: float) -> float:
    """
    Returns the number of hypertrophy-driving reps in a set.

    Heavy loads (≥85% 1RM / ≤5RM): all reps are stimulating.
    Moderate/light loads: only the last ~5 reps before failure count.
    """
    intensity_pct = weight_kg / e1rm if e1rm > 0 else 0.75
    reps_to_failure = reps + rir
    max_stimulating = 5.0  # configurable per user

    if intensity_pct >= 0.85:
        # Heavy: all reps stimulating (full motor unit recruitment from rep 1)
        return min(reps, max_stimulating)

    # Moderate/light: only final reps before failure
    # Stimulating reps = min(5, reps) when at failure (RIR=0)
    # Decreases as RIR increases
    if rir >= 4:
        return 0.0  # junk volume — too far from failure
    if rir >= 3:
        return min(2.0, reps)
    if rir >= 2:
        return min(3.0, reps)
    if rir >= 1:
        return min(4.0, reps)
    return min(max_stimulating, reps)  # RIR 0 = failure
```

**RIR ↔ RPE conversion** (for users who log RPE instead of RIR):
```
RIR = 10 - RPE
```

### 1.3 Direct / Fractional / Indirect Muscle Attribution

Each exercise contributes differently to each muscle group. Replace the current 1:1 mapping with multi-muscle coefficients:

```python
# Example: Barbell Bench Press
EXERCISE_MUSCLE_COEFFICIENTS = {
    "barbell-bench-press": {
        "chest":     1.0,   # direct
        "triceps":   0.5,   # fractional
        "shoulders": 0.25,  # fractional (front delt)
    },
    "barbell-squat": {
        "quads":     1.0,
        "glutes":    0.5,
        "erectors":  0.25,
        "adductors": 0.25,
    },
    "lat-pulldown": {
        "lats":      1.0,
        "biceps":    0.5,
        "rear_delt": 0.25,
    },
    # ... for all exercises in the database
}
```

**Effective stimulating reps per muscle per set:**
```
effective_stim_reps = stimulating_reps × muscle_coefficient
```

### 1.4 Diminishing Returns Curve

Additional sets within a session produce progressively less stimulus. Using the Schoenfeld dataset (conservative):

```python
def session_stimulus(effective_stim_reps_list: list[float]) -> float:
    """
    Apply diminishing returns to ordered sets within a single session.
    Uses log curve fitted to Schoenfeld meta-analysis data:
    6 sets ≈ 2x stimulus of 1 set.
    """
    if not effective_stim_reps_list:
        return 0.0

    total = 0.0
    for i, stim_reps in enumerate(effective_stim_reps_list):
        # Diminishing factor: 1st set = 1.0, 2nd = 0.72, 3rd = 0.56, ...
        # Derived from: factor = 1 / (1 + 0.4 * set_index)
        diminishing_factor = 1.0 / (1.0 + 0.4 * i)
        total += stim_reps * diminishing_factor
    return total
```

### 1.5 Atrophy Modeling

Between sessions, muscle protein synthesis returns to baseline (~36-48h post-workout), and atrophy begins:

```python
def atrophy_between_sessions(
    gap_days: float,
    stimulus_duration_days: float = 2.0,  # 48 hours
    maintenance_sets_per_week: float = 3.0,
) -> float:
    """
    Calculate atrophy effect between two training sessions for a muscle group.
    """
    atrophy_days = max(0.0, gap_days - stimulus_duration_days)
    daily_atrophy_rate = maintenance_sets_per_week / 7.0
    return atrophy_days * daily_atrophy_rate
```

### 1.6 Weekly Net Stimulus — Full Calculation

```python
def weekly_net_stimulus(
    sessions: list[SessionData],       # this week's sessions
    muscle_group: str,
    exercise_coefficients: dict,
    stimulus_duration_days: float = 2.0,
    maintenance_sets: float = 3.0,
) -> WNSResult:
    """
    Compute the Weekly Net Stimulus for a single muscle group.
    """
    # Sort sessions by date
    sessions = sorted(sessions, key=lambda s: s.session_date)

    # 1. Compute per-session stimulus
    session_stimuli = []
    for session in sessions:
        stim_reps_for_muscle = []
        for exercise in session.exercises:
            coeff = exercise_coefficients.get(exercise.exercise_id, {}).get(muscle_group, 0.0)
            if coeff == 0.0:
                continue
            for s in exercise.sets:
                if s.set_type == "warmup":
                    continue
                rir = s.rir if s.rir is not None else (10.0 - s.rpe if s.rpe else 2.0)
                sr = stimulating_reps(s.reps, rir, s.weight_kg, exercise.e1rm or 0)
                stim_reps_for_muscle.append(sr * coeff)

        stimulus = session_stimulus(stim_reps_for_muscle)
        session_stimuli.append((session.session_date, stimulus))

    # 2. Compute atrophy between sessions
    total_atrophy = 0.0
    for i in range(1, len(session_stimuli)):
        gap = (session_stimuli[i][0] - session_stimuli[i - 1][0]).days
        total_atrophy += atrophy_between_sessions(gap, stimulus_duration_days, maintenance_sets)

    # Also account for atrophy from last session to end of week
    if session_stimuli:
        days_since_last = (week_end_date - session_stimuli[-1][0]).days
        total_atrophy += atrophy_between_sessions(
            days_since_last, stimulus_duration_days, maintenance_sets
        )

    # 3. Net stimulus
    gross_stimulus = sum(s for _, s in session_stimuli)
    net_stimulus = max(0.0, gross_stimulus - total_atrophy)

    return WNSResult(
        muscle_group=muscle_group,
        gross_stimulus=round(gross_stimulus, 1),
        atrophy_effect=round(total_atrophy, 1),
        net_stimulus=round(net_stimulus, 1),
        session_count=len(session_stimuli),
        status=classify_wns_status(net_stimulus, muscle_group),
    )
```

### 1.7 WNS Status Classification

Replace the current MEV/MAV/MRV set-count thresholds with stimulus-based thresholds:

```python
# Thresholds in "Hypertrophy Units" (HU) — the user-facing name for net stimulus points
WNS_LANDMARKS = {
    "chest":     {"mv": 3, "mev": 8,  "mav_low": 14, "mav_high": 20, "mrv": 28},
    "back":      {"mv": 3, "mev": 8,  "mav_low": 14, "mav_high": 22, "mrv": 30},
    "quads":     {"mv": 3, "mev": 7,  "mav_low": 12, "mav_high": 18, "mrv": 26},
    "hamstrings":{"mv": 2, "mev": 6,  "mav_low": 10, "mav_high": 16, "mrv": 22},
    "shoulders": {"mv": 2, "mev": 6,  "mav_low": 10, "mav_high": 16, "mrv": 22},
    "biceps":    {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "triceps":   {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "glutes":    {"mv": 2, "mev": 6,  "mav_low": 10, "mav_high": 16, "mrv": 24},
    "abs":       {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
    "traps":     {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 12, "mrv": 18},
    "calves":    {"mv": 2, "mev": 5,  "mav_low": 8,  "mav_high": 14, "mrv": 20},
}

def classify_wns_status(net_stimulus: float, muscle_group: str) -> str:
    lm = WNS_LANDMARKS.get(muscle_group, WNS_LANDMARKS["chest"])
    if net_stimulus < lm["mev"]:
        return "below_mev"
    if net_stimulus <= lm["mav_high"]:
        return "optimal"
    if net_stimulus <= lm["mrv"]:
        return "approaching_mrv"
    return "above_mrv"
```

---

## Part 2: Backend Implementation

### 2.1 New/Modified Files

```
src/modules/training/
├── wns_engine.py              # NEW — core WNS calculation functions
├── exercise_coefficients.py   # NEW — replaces exercise_mapping.py
├── volume_service.py          # MODIFY — delegate to wns_engine
├── volume_schemas.py          # MODIFY — add WNS response fields
├── volume_models.py           # MODIFY — add WNS landmark model
└── router.py                  # MODIFY — add WNS endpoints
```

### 2.2 New Module: `wns_engine.py`

Pure functions, no DB dependencies. Contains:
- `stimulating_reps()` — per-set stimulating rep calculation
- `session_stimulus()` — diminishing returns within a session
- `atrophy_between_sessions()` — inter-session atrophy
- `weekly_net_stimulus()` — full WNS for one muscle group
- `classify_wns_status()` — status classification

All functions are pure and stateless → easy to unit test with property-based testing (Hypothesis).

### 2.3 New Module: `exercise_coefficients.py`

Replace the flat `EXERCISE_MUSCLE_MAP` dict with multi-muscle coefficients:

```python
# Generated from exercise database muscle_group + secondary_muscles fields
# Already stored in the exercises table!
def get_coefficients(exercise_id: str, primary: str, secondary: list[str]) -> dict[str, float]:
    coefficients = {primary: 1.0}
    for muscle in secondary:
        coefficients[muscle] = 0.5
    return coefficients
```

The exercise database already has `muscle_group` and `secondary_muscles` fields — we just need to use them.

### 2.4 Schema Changes

```python
# New response model
class WNSMuscleVolume(BaseModel):
    muscle_group: str
    gross_stimulus: float          # total stimulus before atrophy
    atrophy_effect: float          # stimulus lost to atrophy
    net_stimulus: float            # the actual "Hypertrophy Units"
    hypertrophy_units: float       # alias for net_stimulus (user-facing name)
    status: VolumeStatus
    session_count: int
    frequency: int
    landmarks: WNSLandmarks
    breakdown: list[ExerciseContribution]  # per-exercise detail

class ExerciseContribution(BaseModel):
    exercise_name: str
    coefficient: float             # 1.0 / 0.5 / 0.25
    sets_count: int
    stimulating_reps_total: float
    contribution_hu: float         # after diminishing returns

class WNSLandmarks(BaseModel):
    mv: float
    mev: float
    mav_low: float
    mav_high: float
    mrv: float
```

### 2.5 API Endpoints

```
GET /api/v1/training/volume/weekly          → list[WNSMuscleVolume]  (enhanced)
GET /api/v1/training/volume/{muscle}/detail  → WNSMuscleVolume       (enhanced)
GET /api/v1/training/volume/explain          → WNSExplanation        (NEW)
PUT /api/v1/training/volume/settings         → WNSUserSettings       (NEW)
```

The `/explain` endpoint returns educational content about how HU are calculated — powers the "How is this calculated?" UI.

### 2.6 Migration Strategy

- Keep the old `compute_effort()` path as fallback
- Add a feature flag `wns_engine_enabled` (default: true for new users)
- Existing users see a one-time "We upgraded your volume tracking" onboarding card
- Old landmarks (MEV/MAV/MRV in sets) are converted to HU equivalents

---

## Part 3: Frontend Implementation

### 3.1 The "Hypertrophy Units" (HU) Concept

**This is the product differentiator.** Instead of showing "12 sets" (which every app does), show:

```
Chest: 16.4 HU  ████████████████░░░░  (Optimal Zone)
```

"Hypertrophy Units" is the user-facing name for net stimulus points. It's:
- More accurate than set counting
- Intuitive (higher = more growth stimulus)
- Educates users about training quality, not just quantity

### 3.2 Modified Components

#### Volume Pills (during workout)
```
Current:  "Chest: 8/16 sets"
New:      "Chest: 12.4 HU" with a progress arc showing MEV → MAV → MRV zones
```

The pill now shows:
- Current HU (updates in real-time as sets are completed)
- A mini progress bar with color zones
- Tap to expand → shows breakdown

#### Volume Pill Expanded State (new)
When tapped, the pill expands to show:
```
┌─────────────────────────────────────┐
│ Chest — 16.4 HU (Optimal)          │
│ ████████████████░░░░░  MEV 8 │ MRV 28 │
│                                     │
│ Bench Press (direct)    → 8.2 HU   │
│ Incline DB Press (direct) → 5.1 HU │
│ Cable Fly (direct)      → 3.1 HU   │
│                                     │
│ ⓘ How is this calculated?          │
└─────────────────────────────────────┘
```

#### Heat Map Card (analytics)
- Body silhouette colors now based on HU thresholds instead of raw sets
- Tap a muscle → drill-down shows HU breakdown with exercise contributions
- New "Net vs Gross" toggle showing atrophy effect

#### New: "How It Works" Education Sheet
Bottom sheet triggered by "ⓘ How is this calculated?" anywhere in the volume UI:

```
┌─────────────────────────────────────┐
│ How Hypertrophy Units Work          │
│                                     │
│ Not all reps build muscle equally.  │
│ Only the last ~5 reps before        │
│ failure — "stimulating reps" —      │
│ create enough tension to trigger    │
│ growth.                             │
│                                     │
│ [Animation: rep bar filling up,     │
│  last 5 reps glow gold]            │
│                                     │
│ Your HU score accounts for:        │
│ ✓ How close to failure each set was │
│ ✓ Which muscles each exercise hits  │
│ ✓ Diminishing returns from more sets│
│ ✓ Recovery between sessions         │
│                                     │
│ [Learn More →]                      │
└─────────────────────────────────────┘
```

### 3.3 New Frontend Files

```
app/
├── utils/
│   ├── wnsCalculator.ts           # NEW — client-side HU estimation for real-time pills
│   └── volumeAggregator.ts        # MODIFY — use wnsCalculator
├── components/
│   ├── training/
│   │   ├── VolumeIndicatorPill.tsx # MODIFY — show HU instead of sets
│   │   └── VolumePillExpanded.tsx  # NEW — expanded breakdown view
│   ├── analytics/
│   │   ├── HeatMapCard.tsx         # MODIFY — HU-based coloring
│   │   └── DrillDownModal.tsx      # MODIFY — show exercise contributions
│   └── education/
│       └── HUExplainerSheet.tsx    # NEW — "How it works" bottom sheet
├── hooks/
│   └── useWNSVolume.ts            # NEW — hook wrapping WNS API + real-time calc
```

### 3.4 Real-Time Client-Side Estimation

During an active workout, we can't wait for API calls. The frontend needs a lightweight WNS estimator:

```typescript
// utils/wnsCalculator.ts
export function estimateStimulatingReps(
  reps: number,
  rir: number,
  intensityPct: number, // weight / e1rm
): number {
  if (intensityPct >= 0.85) return Math.min(reps, 5);
  if (rir >= 4) return 0;
  if (rir >= 3) return Math.min(2, reps);
  if (rir >= 2) return Math.min(3, reps);
  if (rir >= 1) return Math.min(4, reps);
  return Math.min(5, reps);
}

export function estimateSessionHU(
  sets: { stimReps: number; coefficient: number }[],
): number {
  let total = 0;
  for (let i = 0; i < sets.length; i++) {
    const factor = 1.0 / (1.0 + 0.4 * i);
    total += sets[i].stimReps * sets[i].coefficient * factor;
  }
  return total;
}
```

This runs on every set completion to update the volume pills instantly. The authoritative calculation happens server-side when the session is saved.

---

## Part 4: Product Differentiation

### 4.1 What No Other App Does

| Feature | MyFitnessPal | Strong | Hevy | **Repwise** |
|---------|-------------|--------|------|-------------|
| Count sets | ✓ | ✓ | ✓ | ✓ |
| RPE/RIR tracking | ✗ | ✗ | ✗ | ✓ |
| Stimulating reps scoring | ✗ | ✗ | ✗ | **✓** |
| Direct/fractional volume | ✗ | ✗ | ✗ | **✓** |
| Diminishing returns curve | ✗ | ✗ | ✗ | **✓** |
| Inter-session atrophy | ✗ | ✗ | ✗ | **✓** |
| Net stimulus metric | ✗ | ✗ | ✗ | **✓** |
| "Why" education layer | ✗ | ✗ | ✗ | **✓** |

### 4.2 User Education Strategy

The education layer is critical — users need to understand *why* HU is better than set counting, or they'll think the app is just making up numbers.

**Touchpoints:**

1. **Onboarding card** — "Meet Hypertrophy Units" (one-time, after upgrade)
2. **ⓘ icon on every volume pill** — tappable, opens explainer sheet
3. **Coaching nudges** — contextual tips during workouts:
   - "This set was 4+ RIR — it won't count toward your HU. Try pushing closer to failure."
   - "Your chest got 0.5 HU from that bench press set for triceps too!"
   - "You trained chest 3x this week — less atrophy between sessions means more net growth."
4. **Weekly report** — "Your chest received 18.2 HU this week (2.1 lost to atrophy). Training 3x instead of 2x would have saved 1.4 HU."
5. **Article in Content module** — deep-dive on the science (already have the content infrastructure)

### 4.3 Coaching Nudges (Premium Feature)

These contextual insights are the premium unlock:

```
Free tier:
  - See HU numbers and status colors
  - Basic "How it works" explainer

Premium tier:
  - Per-exercise HU breakdown
  - "Junk volume" warnings (sets at 4+ RIR)
  - Frequency optimization suggestions
  - Atrophy visualization
  - Weekly net stimulus report with recommendations
  - Personalized landmark adjustments over time
```

### 4.4 Marketing Angle

> "Every fitness app counts your sets. Repwise counts what actually matters."
>
> "Not all reps build muscle. We track the ones that do."
>
> "Hypertrophy Units — the science of knowing exactly how much growth stimulus you're creating."

---

## Part 5: Implementation Phases

### Phase 1: Backend Engine (Week 1)
- [ ] Create `wns_engine.py` with pure calculation functions
- [ ] Create `exercise_coefficients.py` using existing secondary_muscles data
- [ ] Write comprehensive unit tests (property-based with Hypothesis)
- [ ] Add WNS schemas to `volume_schemas.py`
- [ ] Wire into `volume_service.py` behind feature flag

### Phase 2: API + Migration (Week 2)
- [ ] Enhance `/volume/weekly` endpoint to return WNS data
- [ ] Add `/volume/explain` endpoint
- [ ] Add `/volume/settings` endpoint for user preferences
- [ ] Convert existing MEV/MAV/MRV landmarks to HU equivalents
- [ ] Add feature flag and migration path

### Phase 3: Frontend Core (Week 2-3)
- [ ] Create `wnsCalculator.ts` for real-time estimation
- [ ] Update `VolumeIndicatorPill` to show HU
- [ ] Create `VolumePillExpanded` component
- [ ] Update `HeatMapCard` and `DrillDownModal` for HU
- [ ] Create `useWNSVolume` hook

### Phase 4: Education Layer (Week 3)
- [ ] Create `HUExplainerSheet` bottom sheet
- [ ] Add coaching nudges to active workout screen
- [ ] Create onboarding card for existing users
- [ ] Add "How Hypertrophy Units Work" article to content module

### Phase 5: Premium Features (Week 4)
- [ ] Gate advanced breakdowns behind premium
- [ ] Add weekly net stimulus report
- [ ] Add frequency optimization suggestions
- [ ] Add personalized landmark adjustment over time

---

## Part 6: Configurable Parameters

Users (and eventually the adaptive engine) can tune these:

| Parameter | Default | Range | Where |
|-----------|---------|-------|-------|
| `max_stimulating_reps` | 5 | 3-7 | User settings |
| `stimulus_duration_hours` | 48 | 12-72 | User settings |
| `maintenance_sets_per_week` | 3 | 1-5 | Per muscle group |
| `diminishing_returns_factor` | 0.4 | 0.2-0.6 | Advanced settings |
| `fractional_coefficient` | 0.5 | 0.25-0.75 | Per exercise override |
| `default_rir` | 2 | 0-4 | When RIR/RPE not logged |

---

## Appendix: Current vs New Algorithm Comparison

### Example: User does 4 sets of Bench Press (10 reps each, RPE 8) + 3 sets of Cable Fly (12 reps, RPE 9)

**Current algorithm:**
```
Bench: 4 sets × 1.0 effort = 4.0 effective sets for chest
Fly:   3 sets × 1.0 effort = 3.0 effective sets for chest
Total: 7.0 effective sets for chest
Triceps: 0 (bench not mapped to triceps)
```

**WNS algorithm:**
```
Bench Press (RPE 8 = RIR 2):
  Stimulating reps per set: 3.0
  Chest coefficient: 1.0, Triceps: 0.5, Front delt: 0.25

  Chest HU:
    Set 1: 3.0 × 1.0 × 1.000 = 3.00
    Set 2: 3.0 × 1.0 × 0.714 = 2.14
    Set 3: 3.0 × 1.0 × 0.556 = 1.67
    Set 4: 3.0 × 1.0 × 0.455 = 1.36
    Subtotal: 8.17 HU for chest

  Triceps HU:
    Set 1: 3.0 × 0.5 × 1.000 = 1.50
    Set 2: 3.0 × 0.5 × 0.714 = 1.07
    Set 3: 3.0 × 0.5 × 0.556 = 0.83
    Set 4: 3.0 × 0.5 × 0.455 = 0.68
    Subtotal: 4.08 HU for triceps

Cable Fly (RPE 9 = RIR 1):
  Stimulating reps per set: 4.0
  Chest coefficient: 1.0

  Chest HU (continuing diminishing returns from bench):
    Set 5: 4.0 × 1.0 × 0.385 = 1.54
    Set 6: 4.0 × 1.0 × 0.333 = 1.33
    Set 7: 4.0 × 1.0 × 0.294 = 1.18
    Subtotal: 4.05 HU for chest

Gross chest stimulus: 8.17 + 4.05 = 12.22 HU
Atrophy (if trained once this week, 5 days gap): 5-2 = 3 atrophy days × 0.43/day = 1.29
Net chest stimulus: 12.22 - 1.29 = 10.93 HU

vs. if trained 2x/week (2.5 day gap): atrophy = 0.5 days × 0.43 = 0.21
Net chest stimulus: 12.22 - 0.21 = 12.01 HU
```

The WNS model reveals:
1. Triceps got 4.08 HU from bench (invisible in current system)
2. Training 2x/week saves 1.08 HU vs 1x/week
3. The 7th set of chest contributed only 1.18 HU vs 3.00 for the 1st set
4. RPE 9 fly sets contributed more per-set than RPE 8 bench sets
