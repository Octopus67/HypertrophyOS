// DEPRECATED: Use OnboardingWizard instead
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { radius, spacing, typography, letterSpacing } from '../../theme/tokens';
import { useThemeColors, getThemeColors, ThemeColors } from '../../hooks/useThemeColors';
import { Button } from '../../components/common/Button';
import api from '../../services/api';

// ─── Storage helpers (web: localStorage, native: expo-secure-store) ──────────

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'rw_onboarding_state';

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

async function loadPersistedState(): Promise<Partial<OnboardingData> & { step?: number } | null> {
  try {
    const raw = await storageGet(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function persistState(data: Partial<OnboardingData> & { step: number }) {
  try {
    await storageSet(STORAGE_KEY, JSON.stringify(data));
  } catch { /* best-effort */ }
}

async function clearPersistedState() {
  try {
    await storageRemove(STORAGE_KEY);
  } catch { /* best-effort */ }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type GoalType = 'bulking' | 'cutting' | 'maintaining';
type Sex = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface OnboardingData {
  goal_type: GoalType | null;
  height_cm: string;
  weight_kg: string;
  body_fat_pct: string;
  age: string;
  sex: Sex;
  activity_level: ActivityLevel;
}

interface OnboardingResult {
  snapshot: {
    target_calories: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
  };
}

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const INITIAL_DATA: OnboardingData = {
  goal_type: null,
  height_cm: '',
  weight_kg: '',
  body_fat_pct: '',
  age: '',
  sex: 'male',
  activity_level: 'moderate',
};

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

// ─── Validation ──────────────────────────────────────────────────────────────

interface ValidationErrors {
  height_cm?: string;
  weight_kg?: string;
  body_fat_pct?: string;
  age?: string;
}

function validateBodyStats(data: OnboardingData): ValidationErrors {
  const errors: ValidationErrors = {};
  const h = parseFloat(data.height_cm);
  const w = parseFloat(data.weight_kg);
  const a = parseInt(data.age, 10);

  if (!data.height_cm || isNaN(h) || h < 100 || h > 250) {
    errors.height_cm = 'Height must be 100–250 cm';
  }
  if (!data.weight_kg || isNaN(w) || w < 30 || w > 300) {
    errors.weight_kg = 'Weight must be 30–300 kg';
  }
  if (data.body_fat_pct) {
    const bf = parseFloat(data.body_fat_pct);
    if (isNaN(bf) || bf < 3 || bf > 60) {
      errors.body_fat_pct = 'Body fat must be 3–60%';
    }
  }
  if (!data.age || isNaN(a) || a < 13 || a > 120) {
    errors.age = 'Age must be 13–120';
  }
  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const c = useThemeColors();
  const styles = getThemedStyles(c);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Restore persisted state on mount
  useEffect(() => {
    (async () => {
      const saved = await loadPersistedState();
      if (saved) {
        if (saved.step) setStep(saved.step);
        setData((prev) => ({ ...prev, ...saved, step: undefined } as OnboardingData));
      }
      setRestoring(false);
    })();
  }, []);

  // Persist state on changes
  useEffect(() => {
    if (!restoring) {
      persistState({ ...data, step });
    }
  }, [step, data, restoring]);

  const updateField = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  // ─── Step 1 → 2 ─────────────────────────────────────────────────────────

  const handleNextFromGoal = () => {
    if (!data.goal_type) return;
    setStep(2);
  };

  // ─── Step 2 → 3 (submit) ────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationErrors = validateBodyStats(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      const payload = {
        goal_type: data.goal_type,
        height_cm: parseFloat(data.height_cm),
        weight_kg: parseFloat(data.weight_kg),
        body_fat_pct: data.body_fat_pct ? parseFloat(data.body_fat_pct) : null,
        age_years: parseInt(data.age, 10),
        sex: data.sex,
        activity_level: data.activity_level,
        goal_rate_per_week: data.goal_type === 'bulking' ? 0.25 : data.goal_type === 'cutting' ? -0.5 : 0,
      };
      const { data: res } = await api.post('onboarding/complete', payload);
      setResult({
        snapshot: {
          target_calories: res.snapshot?.target_calories ?? 0,
          target_protein_g: res.snapshot?.target_protein_g ?? 0,
          target_carbs_g: res.snapshot?.target_carbs_g ?? 0,
          target_fat_g: res.snapshot?.target_fat_g ?? 0,
        },
      });
      setStep(3);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Something went wrong. Please try again.';
      setApiError(typeof msg === 'string' ? msg : 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = async () => {
    await clearPersistedState();
    onComplete();
  };

  const handleSkip = async () => {
    await clearPersistedState();
    onSkip();
  };

  if (restoring) {
    return (
      <SafeAreaView style={[getStyles().container, { backgroundColor: getThemeColors().bg.base }]}>
        <View style={getStyles().centered}>
          <ActivityIndicator color={getThemeColors().accent.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[getStyles().container, { backgroundColor: getThemeColors().bg.base }]}>
      <ScrollView contentContainerStyle={getStyles().scroll} keyboardShouldPersistTaps="handled">
        {/* Progress indicator */}
        <View style={getStyles().progressRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[getStyles().dot, s === step && getStyles().dotActive, s < step && getStyles().dotDone]} />
          ))}
        </View>
        <Text style={[getStyles().stepLabel, { color: getThemeColors().text.muted }]}>Step {step} of 3</Text>

        {step === 1 && (
          <StepGoal
            selected={data.goal_type}
            onSelect={(g) => updateField('goal_type', g)}
            onNext={handleNextFromGoal}
            onSkip={handleSkip}
          />
        )}

        {step === 2 && (
          <StepBodyStats
            data={data}
            errors={errors}
            apiError={apiError}
            loading={loading}
            onUpdate={updateField}
            onSubmit={handleSubmit}
            onBack={() => setStep(1)}
            onSkip={handleSkip}
          />
        )}

        {step === 3 && result && (
          <StepResults
            result={result}
            data={data}
            onGetStarted={handleGetStarted}
            onSkip={handleSkip}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Step 1: Goal Selection ──────────────────────────────────────────────────

const GOALS: { type: GoalType; emoji: string; title: string; desc: string }[] = [
  { type: 'bulking', emoji: '💪', title: 'Bulk', desc: 'Build muscle & gain weight' },
  { type: 'cutting', emoji: '🔥', title: 'Cut', desc: 'Lose fat & get lean' },
  { type: 'maintaining', emoji: '⚖️', title: 'Maintain', desc: 'Stay at current weight' },
];

function StepGoal({
  selected,
  onSelect,
  onNext,
  onSkip,
}: {
  selected: GoalType | null;
  onSelect: (g: GoalType) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const c = useThemeColors();
  return (
    <View>
      <Text style={[getStyles().heading, { color: getThemeColors().text.primary }]}>What's your goal?</Text>
      <Text style={[getStyles().subheading, { color: getThemeColors().text.secondary }]}>We'll tailor your targets accordingly</Text>

      {GOALS.map((g) => (
        <TouchableOpacity
          key={g.type}
          style={[getStyles().goalCard, selected === g.type && getStyles().goalCardSelected]}
          onPress={() => onSelect(g.type)}
          activeOpacity={0.7}
        >
          <Text style={getStyles().goalEmoji}>{g.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[getStyles().goalTitle, { color: getThemeColors().text.primary }]}>{g.title}</Text>
            <Text style={[getStyles().goalDesc, { color: getThemeColors().text.secondary }]}>{g.desc}</Text>
          </View>
          {selected === g.type && <Text style={[getStyles().checkmark, { color: getThemeColors().accent.primary }]}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Button title="Next" onPress={onNext} disabled={!selected} style={getStyles().mainBtn} />
      <TouchableOpacity onPress={onSkip} style={getStyles().skipLink}>
        <Text style={[getStyles().skipText, { color: getThemeColors().text.muted }]}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Body Stats ──────────────────────────────────────────────────────

function StepBodyStats({
  data,
  errors,
  apiError,
  loading,
  onUpdate,
  onSubmit,
  onBack,
  onSkip,
}: {
  data: OnboardingData;
  errors: ValidationErrors;
  apiError: string;
  loading: boolean;
  onUpdate: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  onSubmit: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const c = useThemeColors();
  return (
    <View>
      <Text style={[getStyles().heading, { color: getThemeColors().text.primary }]}>Your body stats</Text>
      <Text style={[getStyles().subheading, { color: getThemeColors().text.secondary }]}>Used to calculate your targets</Text>

      {apiError ? <Text style={[getStyles().error, { color: getThemeColors().semantic.negative, backgroundColor: getThemeColors().semantic.negativeSubtle }]}>{apiError}</Text> : null}

      <Text style={[getStyles().fieldLabel, { color: getThemeColors().text.secondary }]}>Height (cm)</Text>
      <TextInput
        style={[getStyles().input, errors.height_cm ? getStyles().inputError : null]}
        placeholder="175"
        placeholderTextColor={getThemeColors().text.muted}
        keyboardType="numeric"
        value={data.height_cm}
        onChangeText={(v) => onUpdate('height_cm', v)}
      />
      {errors.height_cm ? <Text style={[getStyles().fieldError, { color: getThemeColors().semantic.negative }]}>{errors.height_cm}</Text> : null}

      <Text style={[getStyles().fieldLabel, { color: getThemeColors().text.secondary }]}>Weight (kg)</Text>
      <TextInput
        style={[getStyles().input, errors.weight_kg ? getStyles().inputError : null]}
        placeholder="80"
        placeholderTextColor={getThemeColors().text.muted}
        keyboardType="numeric"
        value={data.weight_kg}
        onChangeText={(v) => onUpdate('weight_kg', v)}
      />
      {errors.weight_kg ? <Text style={[getStyles().fieldError, { color: getThemeColors().semantic.negative }]}>{errors.weight_kg}</Text> : null}

      <Text style={[getStyles().fieldLabel, { color: getThemeColors().text.secondary }]}>Body Fat % (optional)</Text>
      <TextInput
        style={[getStyles().input, errors.body_fat_pct ? getStyles().inputError : null]}
        placeholder="15"
        placeholderTextColor={getThemeColors().text.muted}
        keyboardType="numeric"
        value={data.body_fat_pct}
        onChangeText={(v) => onUpdate('body_fat_pct', v)}
      />
      {errors.body_fat_pct ? <Text style={[getStyles().fieldError, { color: getThemeColors().semantic.negative }]}>{errors.body_fat_pct}</Text> : null}

      <Text style={[getStyles().fieldLabel, { color: getThemeColors().text.secondary }]}>Age</Text>
      <TextInput
        style={[getStyles().input, errors.age ? getStyles().inputError : null]}
        placeholder="25"
        placeholderTextColor={getThemeColors().text.muted}
        keyboardType="numeric"
        value={data.age}
        onChangeText={(v) => onUpdate('age', v)}
      />
      {errors.age ? <Text style={[getStyles().fieldError, { color: getThemeColors().semantic.negative }]}>{errors.age}</Text> : null}

      {/* Sex toggle */}
      <Text style={[getStyles().fieldLabel, { color: getThemeColors().text.secondary }]}>Sex</Text>
      <View style={getStyles().toggleRow}>
        {(['male', 'female'] as Sex[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[getStyles().toggleBtn, data.sex === s && getStyles().toggleBtnActive]}
            onPress={() => onUpdate('sex', s)}
          >
            <Text style={[getStyles().toggleText, data.sex === s && getStyles().toggleTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity level */}
      <Text style={[getStyles().fieldLabel, { color: getThemeColors().text.secondary }]}>Activity Level</Text>
      <View style={getStyles().activityRow}>
        {ACTIVITY_LEVELS.map((al) => (
          <TouchableOpacity
            key={al.value}
            style={[getStyles().activityChip, data.activity_level === al.value && getStyles().activityChipActive]}
            onPress={() => onUpdate('activity_level', al.value)}
          >
            <Text style={[getStyles().activityText, data.activity_level === al.value && getStyles().activityTextActive]}>
              {al.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button title="Calculate Targets" onPress={onSubmit} loading={loading} style={getStyles().mainBtn} />

      <View style={getStyles().bottomRow}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[getStyles().backText, { color: getThemeColors().accent.primary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip}>
          <Text style={[getStyles().skipText, { color: getThemeColors().text.muted }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 3: Results ─────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function computeBmrAndTdee(data: OnboardingData) {
  const weight = parseFloat(data.weight_kg) || 70;
  const height = parseFloat(data.height_cm) || 175;
  const age = parseInt(data.age, 10) || 25;
  // Mifflin-St Jeor
  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = data.sex === 'male' ? base + 5 : base - 161;
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[data.activity_level] ?? 1.55);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

function getGoalExplanation(goal: GoalType | null) {
  switch (goal) {
    case 'cutting':
      return "We've set a moderate deficit of ~500 kcal below your TDEE to lose fat while preserving muscle.";
    case 'bulking':
      return "We've added ~250 kcal above your TDEE to support muscle growth without excessive fat gain.";
    case 'maintaining':
    default:
      return 'Your targets match your TDEE to maintain your current weight and body composition.';
  }
}

function getTrainingCallout(goal: GoalType | null) {
  switch (goal) {
    case 'cutting':
      return '💡 Resistance training while cutting is crucial — it signals your body to preserve muscle mass while losing fat.';
    case 'bulking':
      return "💡 Progressive overload is key — your surplus only builds muscle if you're training hard enough to stimulate growth.";
    case 'maintaining':
    default:
      return '💡 Consistent training with proper nutrition is the foundation of body recomposition.';
  }
}

type MacroKey = 'protein' | 'carbs' | 'fat';

function ProteinRangeBar({ value }: { value: number }) {
  const c = useThemeColors();
  const minRange = 1.2;
  const maxRange = 2.5;
  const clampedValue = Math.min(Math.max(value, minRange), maxRange);
  const pct = ((clampedValue - minRange) / (maxRange - minRange)) * 100;

  return (
    <View style={infoStyles.rangeContainer}>
      <Text style={[infoStyles.rangeLabelLeft, { color: getThemeColors().text.muted }]}>1.2 g/kg</Text>
      <View style={[infoStyles.rangeTrack, { backgroundColor: getThemeColors().border.default }]}>
        <View
          style={[
            infoStyles.rangeOptimalZone,
            {
              backgroundColor: getThemeColors().semantic.positiveSubtle,
              left: `${((1.6 - minRange) / (maxRange - minRange)) * 100}%`,
              width: `${((2.2 - 1.6) / (maxRange - minRange)) * 100}%`,
            },
          ]}
        />
        <View style={[infoStyles.rangeMarker, { left: `${pct}%` }]}>
          <View style={[infoStyles.rangeMarkerDot, { backgroundColor: getThemeColors().accent.primary, borderColor: getThemeColors().text.primary }]} />
          <Text style={[infoStyles.rangeMarkerLabel, { color: getThemeColors().accent.primary }]}>{value.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={[infoStyles.rangeLabelRight, { color: getThemeColors().text.muted }]}>2.5 g/kg</Text>
    </View>
  );
}

function MacroInfoPanel({
  macro,
  data,
  result,
  weightKg,
  proteinPerKgNum,
}: {
  macro: MacroKey;
  data: OnboardingData;
  result: OnboardingResult;
  weightKg: number;
  proteinPerKgNum: number;
}) {
  const c = useThemeColors();
  const { target_calories, target_protein_g, target_carbs_g, target_fat_g } = result.snapshot;
  const goalLabel = data.goal_type === 'cutting' ? 'cutting' : data.goal_type === 'bulking' ? 'bulking' : 'maintenance';

  if (macro === 'protein') {
    const rangeEnd = data.goal_type === 'cutting' ? 'higher' : data.goal_type === 'bulking' ? 'middle' : 'middle';
    const goalPhrase = data.goal_type === 'cutting' ? 'cut' : data.goal_type === 'bulking' ? 'bulk' : 'maintain';
    return (
      <View style={[infoStyles.panel, { backgroundColor: getThemeColors().bg.surface }]}>
        <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>How we calculated this</Text>
        <Text style={[infoStyles.sectionBody, { color: getThemeColors().text.secondary }]}>
          We set your protein at {proteinPerKgNum.toFixed(1)} g/kg of bodyweight. Research consistently shows 1.6–2.2 g/kg is optimal for muscle protein synthesis during {goalLabel} phases. We've targeted the {rangeEnd} end of this range based on your goal.
        </Text>
        <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>Why protein matters</Text>
        <Text style={[infoStyles.sectionBody, { color: getThemeColors().text.secondary }]}>
          Protein is the building block of muscle tissue. During a {goalPhrase}, adequate protein:{'\n'}
          (1) maximizes muscle protein synthesis{'\n'}
          (2) preserves lean mass during caloric deficits{'\n'}
          (3) increases satiety helping you feel full longer{'\n'}
          (4) has the highest thermic effect of food (~20-30% of calories burned during digestion).
        </Text>
        <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>Optimal range</Text>
        <ProteinRangeBar value={proteinPerKgNum} />
      </View>
    );
  }

  if (macro === 'carbs') {
    const carbKcal = Math.round(target_carbs_g * 4);
    const carbPct = target_calories > 0 ? Math.round((carbKcal / target_calories) * 100) : 0;
    return (
      <View style={[infoStyles.panel, { backgroundColor: getThemeColors().bg.surface }]}>
        <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>How we calculated this</Text>
        <Text style={[infoStyles.sectionBody, { color: getThemeColors().text.secondary }]}>
          Carbs make up the remaining calories after protein and fat are set. Your {Math.round(target_carbs_g)}g provides {carbKcal} kcal ({carbPct}% of total calories).
        </Text>
        <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>Why carbs matter</Text>
        <Text style={[infoStyles.sectionBody, { color: getThemeColors().text.secondary }]}>
          Carbohydrates are your body's preferred fuel for high-intensity training. They:{'\n'}
          (1) replenish muscle glycogen depleted during resistance training{'\n'}
          (2) support training performance and recovery{'\n'}
          (3) spare protein from being used as fuel{'\n'}
          (4) regulate hormones like leptin and thyroid function — especially important during cutting phases.
        </Text>
        {data.goal_type === 'cutting' && (
          <>
            <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>Note for cutting</Text>
            <Text style={[infoStyles.sectionBody, { color: getThemeColors().text.secondary }]}>
              We keep carbs moderate during a cut to maintain training intensity while still achieving a deficit.
            </Text>
          </>
        )}
      </View>
    );
  }

  // fat
  const fatKcal = Math.round(target_fat_g * 9);
  const fatPct = target_calories > 0 ? Math.round((fatKcal / target_calories) * 100) : 0;
  const fatPerKg = weightKg > 0 ? (target_fat_g / weightKg).toFixed(1) : '—';
  return (
    <View style={[infoStyles.panel, { backgroundColor: getThemeColors().bg.surface }]}>
      <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>How we calculated this</Text>
      <Text style={[infoStyles.sectionBody, { color: getThemeColors().text.secondary }]}>
        We set fat at ~{fatPct}% of total calories ({fatPerKg} g/kg bodyweight). The minimum recommended is 0.5 g/kg for hormonal health.
      </Text>
      <Text style={[infoStyles.sectionHeader, { color: getThemeColors().text.primary }]}>Why fat matters</Text>
      <Text style={[infoStyles.sectionBody, { color: getThemeColors().text.secondary }]}>
        Dietary fat is essential for:{'\n'}
        (1) testosterone and estrogen production — critical for muscle growth and recovery{'\n'}
        (2) absorption of fat-soluble vitamins (A, D, E, K){'\n'}
        (3) brain function and cell membrane integrity{'\n'}
        (4) joint health and inflammation regulation.{'\n\n'}
        Going too low on fat can impair hormonal function and recovery.
      </Text>
    </View>
  );
}

function StepResults({
  result,
  data,
  onGetStarted,
  onSkip,
}: {
  result: OnboardingResult;
  data: OnboardingData;
  onGetStarted: () => void;
  onSkip: () => void;
}) {
  const c = useThemeColors();
  const { target_calories, target_protein_g, target_carbs_g, target_fat_g } = result.snapshot;
  const { bmr, tdee } = computeBmrAndTdee(data);
  const weightKg = parseFloat(data.weight_kg) || 70;
  const proteinPerKgNum = weightKg > 0 ? target_protein_g / weightKg : 0;
  const proteinPerKg = weightKg > 0 ? proteinPerKgNum.toFixed(1) : '—';

  const [expandedMacro, setExpandedMacro] = useState<MacroKey | null>(null);

  const toggleMacro = (macro: MacroKey) => {
    setExpandedMacro((prev) => (prev === macro ? null : macro));
  };

  return (
    <View>
      {/* Personal greeting */}
      <Text style={[getStyles().heading, { color: getThemeColors().text.primary }]}>Your plan is ready! 🎯</Text>
      <Text style={[getStyles().subheading, { color: getThemeColors().text.secondary }]}>
        Here's what we've built for you — backed by science, tailored to your body.
      </Text>

      {/* TDEE breakdown card */}
      <View style={[resultStyles.card, { backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.subtle }]}>
        <Text style={[resultStyles.cardTitle, { color: getThemeColors().text.secondary }]}>Your Energy Expenditure</Text>
        <View style={resultStyles.tdeeRow}>
          <View style={resultStyles.tdeeItem}>
            <Text style={[resultStyles.tdeeValue, { color: getThemeColors().text.primary }]}>{bmr}</Text>
            <Text style={[resultStyles.tdeeLabel, { color: getThemeColors().text.muted }]}>BMR (kcal)</Text>
          </View>
          <Text style={[resultStyles.tdeeArrow, { color: getThemeColors().text.muted }]}>→</Text>
          <View style={resultStyles.tdeeItem}>
            <Text style={[resultStyles.tdeeValue, { color: getThemeColors().accent.primary }]}>{tdee}</Text>
            <Text style={[resultStyles.tdeeLabel, { color: getThemeColors().text.muted }]}>TDEE (kcal)</Text>
          </View>
        </View>
        <Text style={[resultStyles.explanation, { color: getThemeColors().text.secondary }]}>
          Your body burns approximately {bmr} kcal/day at rest (BMR) and ~{tdee} kcal/day with your
          activity level (TDEE).
        </Text>
      </View>

      {/* Goal-adjusted targets card */}
      <View style={[resultStyles.card, { backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.subtle }]}>
        <Text style={[resultStyles.cardTitle, { color: getThemeColors().text.secondary }]}>Daily Calorie Target</Text>
        <Text style={[resultStyles.calorieValue, { color: getThemeColors().chart.calories }]}>
          {Math.round(target_calories)}
          <Text style={resultStyles.calorieUnit}> kcal/day</Text>
        </Text>
        <Text style={[resultStyles.explanation, { color: getThemeColors().text.secondary }]}>{getGoalExplanation(data.goal_type)}</Text>
      </View>

      {/* Macro breakdown with rationale + expandable info panels */}
      <View style={[resultStyles.card, { backgroundColor: getThemeColors().bg.surfaceRaised, borderColor: getThemeColors().border.subtle }]}>
        <Text style={[resultStyles.cardTitle, { color: getThemeColors().text.secondary }]}>Macro Breakdown</Text>

        {/* Protein row */}
        <View style={resultStyles.macroRow}>
          <View style={[resultStyles.macroIndicator, { backgroundColor: getThemeColors().semantic.positive }]} />
          <View style={resultStyles.macroContent}>
            <View style={resultStyles.macroHeader}>
              <Text style={[resultStyles.macroValue, { color: getThemeColors().text.primary, flex: 1 }]}>
                {Math.round(target_protein_g)}g Protein
                <Text style={[resultStyles.macroMeta, { color: getThemeColors().text.muted }]}> ({proteinPerKg} g/kg bodyweight)</Text>
              </Text>
              <TouchableOpacity
                onPress={() => toggleMacro('protein')}
                style={infoStyles.infoBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Protein info"
                accessibilityRole="button"
              >
                <Text style={[infoStyles.infoBtnText, { color: getThemeColors().accent.primary }, expandedMacro === 'protein' && infoStyles.infoBtnTextActive]}>ⓘ</Text>
              </TouchableOpacity>
            </View>
            <Text style={[resultStyles.macroRationale, { color: getThemeColors().text.secondary }]}>
              Higher protein supports muscle recovery and satiety
            </Text>
          </View>
        </View>
        {expandedMacro === 'protein' && (
          <MacroInfoPanel macro="protein" data={data} result={result} weightKg={weightKg} proteinPerKgNum={proteinPerKgNum} />
        )}

        {/* Carbs row */}
        <View style={resultStyles.macroRow}>
          <View style={[resultStyles.macroIndicator, { backgroundColor: getThemeColors().semantic.warning }]} />
          <View style={resultStyles.macroContent}>
            <View style={resultStyles.macroHeader}>
              <Text style={[resultStyles.macroValue, { color: getThemeColors().text.primary, flex: 1 }]}>
                {Math.round(target_carbs_g)}g Carbs
              </Text>
              <TouchableOpacity
                onPress={() => toggleMacro('carbs')}
                style={infoStyles.infoBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Carbs info"
                accessibilityRole="button"
              >
                <Text style={[infoStyles.infoBtnText, { color: getThemeColors().accent.primary }, expandedMacro === 'carbs' && infoStyles.infoBtnTextActive]}>ⓘ</Text>
              </TouchableOpacity>
            </View>
            <Text style={[resultStyles.macroRationale, { color: getThemeColors().text.secondary }]}>
              Fuels your training sessions and recovery
            </Text>
          </View>
        </View>
        {expandedMacro === 'carbs' && (
          <MacroInfoPanel macro="carbs" data={data} result={result} weightKg={weightKg} proteinPerKgNum={proteinPerKgNum} />
        )}

        {/* Fat row */}
        <View style={resultStyles.macroRow}>
          <View style={[resultStyles.macroIndicator, { backgroundColor: getThemeColors().chart.calories }]} />
          <View style={resultStyles.macroContent}>
            <View style={resultStyles.macroHeader}>
              <Text style={[resultStyles.macroValue, { color: getThemeColors().text.primary, flex: 1 }]}>
                {Math.round(target_fat_g)}g Fat
              </Text>
              <TouchableOpacity
                onPress={() => toggleMacro('fat')}
                style={infoStyles.infoBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Fat info"
                accessibilityRole="button"
              >
                <Text style={[infoStyles.infoBtnText, { color: getThemeColors().accent.primary }, expandedMacro === 'fat' && infoStyles.infoBtnTextActive]}>ⓘ</Text>
              </TouchableOpacity>
            </View>
            <Text style={[resultStyles.macroRationale, { color: getThemeColors().text.secondary }]}>
              Essential for hormones, brain function, and nutrient absorption
            </Text>
          </View>
        </View>
        {expandedMacro === 'fat' && (
          <MacroInfoPanel macro="fat" data={data} result={result} weightKg={weightKg} proteinPerKgNum={proteinPerKgNum} />
        )}
      </View>

      {/* Training importance callout */}
      <View style={[resultStyles.calloutCard, { backgroundColor: getThemeColors().accent.primaryMuted, borderColor: getThemeColors().accent.primary }]}>
        <Text style={[resultStyles.calloutText, { color: getThemeColors().text.primary }]}>{getTrainingCallout(data.goal_type)}</Text>
      </View>

      <Button title="Get Started" onPress={onGetStarted} style={getStyles().mainBtn} />

      <TouchableOpacity onPress={onSkip} style={getStyles().skipLink}>
        <Text style={[getStyles().skipText, { color: getThemeColors().text.muted }]}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  infoBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    fontSize: 18,
  },
  infoBtnTextActive: {
    opacity: 0.7,
  },
  panel: {
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
    marginLeft: 4 + spacing[3],
  },
  sectionHeader: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[1],
    marginTop: spacing[2],
    lineHeight: typography.lineHeight.sm,
  },
  sectionBody: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  rangeLabelLeft: {
    fontSize: typography.size.xs,
    marginRight: spacing[2],
    lineHeight: typography.lineHeight.xs,
  },
  rangeLabelRight: {
    fontSize: typography.size.xs,
    marginLeft: spacing[2],
    lineHeight: typography.lineHeight.xs,
  },
  rangeTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  rangeOptimalZone: {
    position: 'absolute',
    top: 0,
    height: 6,
    borderRadius: 3,
  },
  rangeMarker: {
    position: 'absolute',
    top: -5,
    alignItems: 'center',
    marginLeft: -6,
  },
  rangeMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  rangeMarkerLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[0.5],
    lineHeight: typography.lineHeight.xs,
  },
});

const resultStyles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
    marginBottom: spacing[3],
    lineHeight: typography.lineHeight.sm,
  },
  tdeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  tdeeItem: { alignItems: 'center', flex: 1 },
  tdeeValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight['2xl'],
  },
  tdeeLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[1],
    lineHeight: typography.lineHeight.xs,
  },
  tdeeArrow: {
    fontSize: typography.size.xl,
    marginHorizontal: spacing[2],
    lineHeight: typography.lineHeight.xl,
  },
  explanation: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  calorieValue: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: typography.lineHeight['3xl'],
  },
  calorieUnit: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    lineHeight: typography.lineHeight.base,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  macroIndicator: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: spacing[3],
  },
  macroContent: { flex: 1 },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight.md,
  },
  macroMeta: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    lineHeight: typography.lineHeight.sm,
  },
  macroRationale: {
    fontSize: typography.size.sm,
    marginTop: spacing[0.5],
    lineHeight: typography.lineHeight.sm,
  },
  calloutCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  calloutText: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});

// ─── Styles ──────────────────────────────────────────────────────────────────

/** Lazy styles for module-level helpers */
function getStyles() { return getThemedStyles(getThemeColors()); }

const getThemedStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Progress
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing[2], marginTop: spacing[4] },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: getThemeColors().border.default,
  },
  dotActive: { backgroundColor: getThemeColors().accent.primary, width: 24 },
  dotDone: { backgroundColor: getThemeColors().accent.primary },
  stepLabel: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[6],
    lineHeight: typography.lineHeight.sm,
  },

  // Headings
  heading: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    lineHeight: typography.lineHeight['2xl'],
  },
  subheading: {
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[6],
    lineHeight: typography.lineHeight.base,
  },

  // Goal cards
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: getThemeColors().border.subtle,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  goalCardSelected: {
    borderColor: getThemeColors().accent.primary,
    backgroundColor: getThemeColors().accent.primaryMuted,
  },
  goalEmoji: { fontSize: 28, marginRight: spacing[3] },
  goalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight.lg,
  },
  goalDesc: { fontSize: typography.size.sm, marginTop: spacing[0.5], lineHeight: typography.lineHeight.sm },
  checkmark: { fontSize: 20, fontWeight: typography.weight.semibold },

  // Form
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[1],
    marginTop: spacing[3],
    lineHeight: typography.lineHeight.sm,
  },
  input: {
    backgroundColor: getThemeColors().bg.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: getThemeColors().border.subtle,
    color: getThemeColors().text.primary,
    fontSize: typography.size.base,
    padding: spacing[3],
    lineHeight: typography.lineHeight.base,
  },
  inputError: { borderColor: getThemeColors().semantic.negative },
  fieldError: {
    fontSize: typography.size.xs,
    marginTop: spacing[1],
    lineHeight: typography.lineHeight.xs,
  },
  error: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginBottom: spacing[4],
    padding: spacing[3],
    borderRadius: radius.sm,
    lineHeight: typography.lineHeight.sm,
  },

  // Toggles
  toggleRow: { flexDirection: 'row', gap: spacing[2] },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
    alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: getThemeColors().accent.primary,
    backgroundColor: getThemeColors().accent.primaryMuted,
  },
  toggleText: { color: getThemeColors().text.secondary, fontSize: typography.size.base, lineHeight: typography.lineHeight.base },
  toggleTextActive: { color: getThemeColors().accent.primary, fontWeight: typography.weight.semibold },

  // Activity chips
  activityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  activityChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: getThemeColors().border.default,
    minHeight: 44,
    justifyContent: 'center',
  },
  activityChipActive: {
    borderColor: getThemeColors().accent.primary,
    backgroundColor: getThemeColors().accent.primaryMuted,
  },
  activityText: { color: getThemeColors().text.secondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.sm },
  activityTextActive: { color: getThemeColors().accent.primary, fontWeight: typography.weight.semibold },

  // Buttons & links
  mainBtn: { marginTop: spacing[6] },
  skipLink: { alignItems: 'center', marginTop: spacing[4], minHeight: 44, justifyContent: 'center' },
  skipText: { fontSize: typography.size.sm, lineHeight: typography.lineHeight.sm },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
  },
  backText: { fontSize: typography.size.base, lineHeight: typography.lineHeight.base },
});
