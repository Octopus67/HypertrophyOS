---
inclusion: manual
---

# Frontend Architecture

## Entry Point
`app/App.tsx` — Auth state check, onboarding flow, navigation container.

## Navigation (4 tabs)

```
BottomTabNavigator
├── Home (DashboardStack)
│   ├── DashboardHome → DashboardScreen
│   ├── ExercisePicker → ExercisePickerScreen
│   ├── ActiveWorkout → ActiveWorkoutScreen
│   ├── WeeklyReport → WeeklyReportScreen
│   ├── ArticleDetail → ArticleDetailScreen
│   └── Learn → LearnScreen
├── Log (LogsStack)
│   ├── LogsHome → LogsScreen
│   ├── ExercisePicker → ExercisePickerScreen
│   ├── ActiveWorkout → ActiveWorkoutScreen
│   └── SessionDetail → SessionDetailView
├── Analytics (AnalyticsStack)
│   ├── AnalyticsHome → AnalyticsScreen (tabs: training/nutrition)
│   ├── NutritionReport → NutritionReportScreen
│   ├── MicronutrientDashboard → MicronutrientDashboardScreen
│   └── WeeklyReport → WeeklyReportScreen
└── Profile (ProfileStack)
    ├── ProfileHome → ProfileScreen
    ├── Learn, ArticleDetail, Coaching, Community
    ├── FounderStory, HealthReports, ProgressPhotos
    └── MealPlan, ShoppingList, PrepSunday
```

## State Management (Zustand)

| Store | Purpose |
|-------|---------|
| `store/index.ts` | Auth, profile, subscription, coaching, goals, metrics |
| `store/activeWorkoutSlice.ts` | Active workout state, set tracking, weekly volume |
| `store/onboardingSlice.ts` | Onboarding wizard state |
| `store/workoutPreferencesStore.ts` | Unit system, rest timer preferences |
| `store/tooltipStore.ts` | Tooltip visibility state |

## Custom Hooks (`app/hooks/`)

| Hook | Purpose |
|------|---------|
| `useFeatureFlag.ts` | Check feature flag for current user |
| `useWNSVolume.ts` | Fetch WNS weekly volume data |
| `useMicroDashboard.ts` | Fetch micronutrient dashboard data |
| `useDailyTargets.ts` | Fetch adaptive daily macro targets |
| `useHealthData.ts` | Fetch health marker data |
| `useHaptics.ts` | Haptic feedback (light/medium/heavy) |
| `useStaggeredEntrance.ts` | Staggered animation for list items |
| `useCountingValue.ts` | Animated counting number display |
| `usePressAnimation.ts` | Press-in scale animation |
| `useReduceMotion.ts` | Respect system reduce-motion setting |
| `useHoverState.ts` | Web hover state tracking |
| `useSkeletonPulse.ts` | Skeleton loading pulse animation |

## Key Utility Modules (`app/utils/`)

| Category | Files | Purpose |
|----------|-------|---------|
| WNS | `wnsCalculator.ts` | Client-side HU estimation (mirrors Python wns_engine.py) |
| Volume | `volumeAggregator.ts`, `volumeCalculation.ts`, `muscleVolumeLogic.ts` | Volume tracking, heat map colors |
| Nutrition | `microNutrientSerializer.ts`, `rdaValues.ts`, `microDashboardLogic.ts` | Micronutrient handling, RDA values |
| Training | `intelligenceLayerLogic.ts`, `restTimerLogic.ts`, `plateCalculator.ts` | Training UX logic |
| Food | `servingOptions.ts`, `quickAddValidation.ts`, `foodSearch*.ts` | Food logging utilities |
| General | `unitConversion.ts`, `dateScrollerLogic.ts`, `greeting.ts` | Common utilities |

## Component Library (`app/components/`)

| Category | Key Components |
|----------|---------------|
| `common/` | Card, Button, Icon, ModalContainer, ErrorBoundary, EmptyState |
| `training/` | VolumeIndicatorPill, VolumePills, FinishConfirmationSheet, PlateCalculatorSheet |
| `analytics/` | HeatMapCard, BodyHeatMap, DrillDownModal, WeekNavigator |
| `nutrition/` | WaterTracker, BarcodeScanner |
| `education/` | HUExplainerSheet |
| `modals/` | AddNutritionModal, QuickAddModal, AddTrainingModal |
| `charts/` | TrendLineChart |

## API Client
`app/services/api.ts` — Axios instance with:
- Base URL: `http://localhost:8000/api/v1/`
- JWT token in Authorization header
- Automatic token refresh on 401
- Request/response interceptors

## Theme System
`app/theme/tokens.ts` — Design tokens:
- `colors` — semantic colors, heatmap palette, accent
- `typography` — size scale, weight scale
- `spacing` — 4px base scale
- `radius` — border radius tokens
- `motion` — animation duration tokens

## Key Patterns

### Data Fetching
```typescript
// Hook pattern (preferred for screens)
const { data, loading, error, refetch } = useWNSVolume(weekStart);

// Direct API call (for modals/one-off)
const { data } = await api.get('endpoint', { params });
```

### Error Handling
```typescript
try {
  const res = await api.post('endpoint', payload);
} catch (err: any) {
  Alert.alert('Error', err?.response?.data?.detail ?? 'Something went wrong');
}
```

### Cancellation (useEffect cleanup)
```typescript
useEffect(() => {
  let cancelled = false;
  fetchData().then(d => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, [deps]);
```
