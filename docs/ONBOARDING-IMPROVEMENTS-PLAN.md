# Onboarding Improvements - Phased Implementation Plan

## Issues Summary

**Total:** 16 issues (1 CRITICAL bug, 2 CRITICAL UX, 5 HIGH, 8 MEDIUM)

---

## Phase 1: Critical Bugs (2-3 hours) - MUST FIX

### Issue 1.1: Protein Slider Doesn't Update on Slow Drag [CRITICAL BUG]
**Problem:** Slider only has `onMomentumScrollEnd`. If user drags slowly without flicking, the handler never fires.  
**Impact:** Macros don't update, user thinks slider is broken  
**Fix:** Add `onScrollEndDrag={handleScrollEnd}` to the ScrollView  
**File:** `app/screens/onboarding/steps/DietStyleStep.tsx` line 165  
**Effort:** 5 minutes  
**Test:** Drag slider slowly, release - macros should update

### Issue 1.2: Default Protein Doesn't Match Recommendation [CRITICAL UX]
**Problem:** Store defaults to 2.0 g/kg for ALL users. Recommendation varies (1.4-2.4 based on goal).  
**Impact:** Users with maintain/no-strength goals see protein that's 25-40% too high  
**Fix:** Auto-set proteinPerKg to recommendation on DietStyleStep mount  
**File:** `app/screens/onboarding/steps/DietStyleStep.tsx`  
**Code:**
```typescript
useEffect(() => {
  const rec = getProteinRecommendation(store.goalType, store.exerciseTypes);
  if (store.proteinPerKg === 2.0) { // Only if still at default
    store.updateField('proteinPerKg', rec.default);
  }
}, []);
```
**Effort:** 30 minutes  
**Test:** Start onboarding with "maintain" goal - protein should be ~1.6 g/kg, not 2.0

### Issue 1.3: getThemeColors() Performance Issue [CRITICAL PERFORMANCE]
**Problem:** All 6 onboarding steps call `getThemeColors()` dozens of times per render instead of using the `c` variable  
**Impact:** Unnecessary function calls on every render, poor performance  
**Fix:** Replace all `getThemeColors()` with `c` in StyleSheet and JSX  
**Files:** All 6 step files + OnboardingTrialPrompt  
**Effort:** 1-2 hours (automated find/replace across 7 files)  
**Test:** No visual change, but React DevTools Profiler should show fewer function calls

---

## Phase 2: High Priority UX (4-6 hours) - SHOULD FIX

### Issue 2.1: No Per-Session Calorie Display [HIGH]
**Problem:** Activity step shows daily averages (503-600 cal). Users expect per-session burn.  
**Impact:** Confusing - "Why is cardio only 100 cal more than strength?"  
**Fix:** Add per-session display alongside daily average  
**File:** `app/screens/onboarding/steps/LifestyleStep.tsx`  
**Design:**
```
Cardio (3x/week)
~440 cal per session
~600 cal/day average
```
**Effort:** 2 hours  
**Test:** Select cardio 3x/week - should show both per-session and daily

### Issue 2.2: "High Protein" Diet Style Misleading [HIGH]
**Problem:** All diet styles show same protein. "High Protein" doesn't have more protein.  
**Impact:** User confusion - "Why is high protein the same as balanced?"  
**Fix Option A:** Rename to "Balanced Carb/Fat" or "Equal Split"  
**Fix Option B:** Make it actually increase protein by 0.3 g/kg  
**File:** `app/screens/onboarding/steps/DietStyleStep.tsx`  
**Effort:** 1 hour (Option A), 2 hours (Option B)  
**Test:** Select "High Protein" - should either have different name or more protein

### Issue 2.3: Trial Prompt Visually Flat [HIGH]
**Problem:** Static screen, small icon, generic copy, no animation  
**Impact:** Poor conversion - this is the monetization gate  
**Fix:** Add entrance animation, larger icon (80-100px), gradient background, personalized copy  
**File:** `app/components/premium/OnboardingTrialPrompt.tsx`  
**Design:**
- Gradient background (gold/purple)
- Animated premium icon with glow
- Personalized: "Your 2,200 kcal cutting plan is ready!"
- Free vs Premium comparison table
**Effort:** 3-4 hours  
**Test:** Visual improvement, more engaging

### Issue 2.4: Smart Training Not Personalized [HIGH]
**Problem:** Shows cutting/bulking for all users, even "maintain"  
**Impact:** Irrelevant content for maintain/eat_healthier users  
**Fix:** Show only the card relevant to user's goal, or make step conditional  
**File:** `app/screens/onboarding/steps/SmartTrainingStep.tsx`  
**Effort:** 1-2 hours  
**Test:** Select "maintain" goal - should show maintenance-specific content or skip step

### Issue 2.5: No Tooltip Explaining Protein Consistency [HIGH]
**Problem:** Users don't understand why protein is the same across diet styles  
**Impact:** Confusion, think slider is broken  
**Fix:** Add info icon with tooltip: "Protein is based on your body weight (X g/kg). Diet styles only change how remaining calories are split between carbs and fat."  
**File:** `app/screens/onboarding/steps/DietStyleStep.tsx`  
**Effort:** 1 hour  
**Test:** Tap info icon - tooltip explains the logic

---

## Phase 3: Medium Priority (6-8 hours) - NICE TO HAVE

### Issue 3.1: Weight Scale Limited to 0.5 kg [MEDIUM]
**Problem:** Can't select 82.6 kg, only 82.5 or 83.0  
**Impact:** Users who know exact weight can't enter it  
**Fix Option A:** Change step to 0.1 kg (may impact performance - 2,701 ticks)  
**Fix Option B:** Add tap-to-edit - long press opens numeric input  
**File:** `app/screens/onboarding/steps/BodyMeasurementsStep.tsx`  
**Effort:** 1 hour (Option A), 3 hours (Option B)  
**Test:** Should be able to enter 82.6 kg

### Issue 3.2: Food DNA Allows Contradictions [MEDIUM]
**Problem:** Can select "Vegan" + "Pescatarian" or "None" + "Dairy"  
**Impact:** Contradictory data, confusing food search results  
**Fix:** Add mutual exclusion - "No restrictions" clears others, "None" clears others  
**File:** `app/screens/onboarding/steps/FoodDNAStep.tsx`  
**Effort:** 1-2 hours  
**Test:** Select "No restrictions" - other dietary selections should clear

### Issue 3.3: Summary Missing Data [MEDIUM]
**Problem:** Only shows 8 fields, missing weight, height, age, activity, exercise, Food DNA  
**Impact:** Incomplete review, users can't verify all data  
**Fix:** Add comprehensive data display with sections  
**File:** `app/screens/onboarding/steps/SummaryStep.tsx`  
**Design:**
```
Body Stats: 80 kg, 175 cm, 28 years
Activity: Moderately active, Strength 3x/week
Nutrition: 2,200 kcal, 160g protein, 220g carbs, 73g fat
Goal: Lose fat, 0.5 kg/week
Diet: Balanced, 2.0 g/kg protein
Food DNA: Vegetarian, No dairy, Indian cuisine
```
**Effort:** 2-3 hours  
**Test:** All entered data should be visible

### Issue 3.4: No Visual Macro Breakdown [MEDIUM]
**Problem:** Just numbers (160g, 220g, 73g), no chart  
**Impact:** Hard to visualize macro split  
**Fix:** Add stacked bar or donut chart  
**File:** `app/screens/onboarding/steps/SummaryStep.tsx`  
**Effort:** 2 hours  
**Test:** Should see visual representation of 29% protein, 40% carbs, 31% fat

### Issue 3.5: Target Weight No Directional Validation [MEDIUM]
**Problem:** Can set target > current for "lose fat" goal  
**Impact:** Nonsensical goal, confusing projected date  
**Fix:** Add validation warning if direction doesn't match goal  
**File:** `app/screens/onboarding/steps/GoalStep.tsx`  
**Effort:** 1 hour  
**Test:** Set target 90 kg when current is 80 kg with "lose fat" - should show warning

### Issue 3.6: "Eggetarian" Niche Term [MEDIUM]
**Problem:** Western users may not know this term  
**Impact:** Minor confusion  
**Fix:** Add tooltip or rename to "Ovo-vegetarian"  
**File:** `app/screens/onboarding/steps/FoodDNAStep.tsx`  
**Effort:** 30 minutes  
**Test:** Tooltip explains the term

### Issue 3.7: Hardcoded Edit Step Indices [MEDIUM]
**Problem:** Summary edit links use hardcoded step numbers (editStep: 6, 7, etc.)  
**Impact:** Breaks if step order changes  
**Fix:** Use step name constants or enum  
**File:** `app/screens/onboarding/steps/SummaryStep.tsx`  
**Effort:** 1 hour  
**Test:** Edit links should still work after fix

### Issue 3.8: No Confirmation Before Submission [MEDIUM]
**Problem:** "Start Your Journey" immediately submits, no confirmation  
**Impact:** Accidental submissions  
**Fix:** Add confirmation dialog: "Ready to start your journey?"  
**File:** `app/screens/onboarding/steps/SummaryStep.tsx`  
**Effort:** 30 minutes  
**Test:** Should see confirmation dialog

---

## Phase 4: Polish (4-6 hours) - POST-LAUNCH

### Issue 4.1: Trial Prompt Enhancements
- Add social proof ("Join 10,000+ users")
- Add free vs premium comparison table
- Add urgency ("Limited time offer")
- Add testimonial or rating

### Issue 4.2: Smart Training Interactivity
- Add toggle to compare cutting vs bulking
- Show user's actual volume numbers
- Add "Learn More" link to full article

### Issue 4.3: Imperial Weight Scale Precision
- Change from 1 lb to 0.5 lb steps (match metric precision)

### Issue 4.4: Protein Slider Visual Improvements
- Add drag handle indicator
- Add haptic feedback on snap
- Add "tap to reset to recommended" button

---

## Implementation Priority

### Must Fix Before Launch (Phase 1)
1. ✅ Protein slider onScrollEndDrag (5 min)
2. ✅ Auto-set protein to recommendation (30 min)
3. ✅ Fix getThemeColors() performance (1-2 hrs)

**Total: 2-3 hours**

### Should Fix Before Launch (Phase 2)
4. Per-session calorie display (2 hrs)
5. Rename "High Protein" or make it actually high (1 hr)
6. Improve trial prompt UI (3-4 hrs)
7. Personalize Smart Training (1-2 hrs)
8. Add protein explanation tooltip (1 hr)

**Total: 8-10 hours**

### Nice to Have (Phase 3)
9-16. All medium priority items

**Total: 6-8 hours**

### Post-Launch (Phase 4)
17-20. Polish items

**Total: 4-6 hours**

---

## Recommended Approach

**Option A: Fix Critical Only (2-3 hours)**
- Phase 1 only
- Slider works, protein defaults correct, performance fixed
- Ship and iterate

**Option B: Fix Critical + High (10-13 hours)**
- Phase 1 + Phase 2
- All major UX issues resolved
- Professional onboarding experience

**Option C: Complete Overhaul (20-27 hours)**
- All phases
- Perfect onboarding
- Maximum conversion

---

## My Recommendation

**Implement Phase 1 (2-3 hours) immediately:**
- Fixes the slider bug you experienced
- Fixes the "protein too high" confusion
- Fixes performance issue

**Then decide on Phase 2** based on user feedback after testing.

---

## Next Steps

1. **First:** Get registration working (AWS SES)
2. **Then:** Implement Phase 1 fixes (2-3 hours)
3. **Test:** Complete onboarding flow
4. **Decide:** Whether to do Phase 2 before launch

**Shall I implement Phase 1 fixes now?**
