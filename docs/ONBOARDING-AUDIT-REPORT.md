# Onboarding Flow - Complete Audit & Recommendations

## Executive Summary

**Issues Found:** 15 total (3 CRITICAL, 5 HIGH, 7 MEDIUM)  
**Research Completed:** Activity calculations, macro formulas, protein recommendations  
**Verdict:** Onboarding is functionally correct but has UX gaps and one critical performance issue

---

## Step 3: Height/Weight Scale

### Current Implementation
- **Weight increment:** 0.5 kg (metric) or 1 lb (imperial)
- **Can select 82.6 kg?** ❌ NO - only 82.5 or 83.0 kg possible
- **Component:** Custom HorizontalScale (scroll ruler with snap-to-tick)
- **Precision:** Fixed at 0.5 kg steps

### Issue Analysis
**MEDIUM:** Limited precision may frustrate users who know their exact weight.

**Why 0.5 kg increment:**
- Keeps tick count manageable (541 ticks for 30-300 kg range)
- Prevents scroll performance issues
- 0.1 kg precision would create 2,701 ticks (5x more rendering)

### Recommendations
1. **Keep 0.5 kg for onboarding** (performance)
2. **Add decimal precision post-onboarding** (MeasurementInput already supports it)
3. **OR: Add tap-to-edit** - Long press scale → opens numeric input for exact value

---

## Step 5: Activity Level Calculations

### User's Concern
"Walking 503 cal/day vs Cardio 600 cal/day seems too close. Cardio should burn way more!"

### Research Findings

**✅ CALCULATIONS ARE CORRECT**

The numbers represent **daily average activity burn** (NEAT + EAT), not per-session burn.

**Math breakdown (for ~82 kg user):**
- **NEAT (base activity):** 411 cal/day (same for all)
- **EAT (exercise):** Varies by type
  - Walking: 92 cal/day (216 cal/session ÷ 7 days × 3 sessions)
  - Cardio: 189 cal/day (440 cal/session ÷ 7 days × 3 sessions)
  - Strength: 118 cal/day (275 cal/session ÷ 7 days × 3 sessions)
  - Sports: 158 cal/day (369 cal/session ÷ 7 days × 3 sessions)
- **Total:** NEAT + EAT = displayed number

**Why differences are small:**
1. Exercise is only 3 days out of 7 (daily average is lower)
2. NEAT (daily movement) is the same regardless of exercise type
3. Exercise is ~5% of total TDEE, NEAT is ~15%

**Per-session burns (what user expects to see):**
- Cardio: ~440 cal/hour ✅ Highest
- Sports: ~369 cal/hour
- Strength: ~275 cal/hour
- Walking: ~216 cal/hour ✅ Lowest

### Recommendations
**HIGH:** Add per-session calorie display alongside daily average:
```
Cardio (3x/week)
~440 cal per session
~600 cal/day average
```

This matches user expectations and educates them on the difference.

---

## Step 7: Smart Training Presentation

### Current Implementation
- Two cards (Cutting 🔥, Bulking 💪)
- Arrow-prefixed bullet points
- Science citations
- "Why This Matters" section

### Issues Found
**MEDIUM:** 
1. Purely informational (no interaction)
2. Shows cutting/bulking even for "maintain" users
3. Percentages (15% less, 10% more) are hardcoded text, not user's actual values
4. Could feel like filler content

### Recommendations
1. **Personalize:** Show only the card relevant to user's goal
2. **Make interactive:** Add a toggle to compare scenarios
3. **Show actual numbers:** "Your plan: 12 sets/week for chest (vs 14 sets on maintenance)"
4. **OR: Make conditional** - Skip this step for maintain/eat_healthier goals

---

## Step 8: Target Weight

### User's Question
"Does target weight actually do something?"

### Answer: YES ✅

**What it does:**
1. Shows projected goal date ("You'll reach X kg by March 2026")
2. Stored in database (user_goals.target_weight_kg)
3. Used by nudge service to trigger proximity alerts
4. Displayed and editable in Profile
5. Included in data exports

**What happens if skipped:**
- No projected date shown
- No weight-proximity nudges
- Everything else works fine

### Issues Found
**LOW:** No validation that target makes sense for goal (e.g., target > current for lose_fat)

### Recommendations
1. **Add directional validation:** Warn if target doesn't match goal direction
2. **Keep it optional** (current behavior is correct)

---

## Step 9: Diet Style & Macros

### User's Concerns
1. "Why is protein the same for all diet styles?"
2. "228g protein, 83g fat seems way too much"
3. "Does the protein slider actually change the numbers?"
4. "Recommended value should be 1.6-2.2 g/kg, not so high"

### Answers

**1. Why protein is the same:** ✅ BY DESIGN

Protein is calculated FIRST as `weightKg × proteinPerKg`, then remaining calories are split between carbs/fat based on diet style.

**Example (80 kg, 2200 cal budget, 2.0 g/kg protein):**
- Protein: 80 × 2.0 = 160g (640 cal)
- Remaining: 2200 - 640 = 1560 cal
- Balanced: 55% carbs (214g), 45% fat (78g)
- Keto: 10% carbs (39g), 90% fat (156g)

**All 4 diet styles show 160g protein because they all use the same proteinPerKg value.**

**2. Why numbers seem high:** ❌ DEFAULT MISMATCH

**CRITICAL ISSUE:** Store defaults to `proteinPerKg = 2.0` for ALL users, but recommendations vary:
- Lose fat + strength: 2.0-2.4 g/kg ✅ (2.0 is appropriate)
- Maintain + no strength: 1.4-1.8 g/kg ❌ (2.0 is too high)

**For an 80 kg person:**
- At 2.0 g/kg: 160g protein (appropriate for strength trainers)
- At 1.6 g/kg: 128g protein (appropriate for maintainers)

**3. Does slider change numbers?** ✅ YES

The protein slider updates `proteinPerKg` and macros recalculate reactively. It works correctly.

**4. Recommended range:** ✅ CORRECT (1.6-2.2 g/kg)

The green "recommended" zone on the slider shows 1.6-2.2 g/kg, which is evidence-based. The issue is the DEFAULT doesn't auto-set to the recommendation.

### Issues Found

**CRITICAL:**
1. **Default protein doesn't match recommendation** - Always 2.0 g/kg regardless of goal
2. **Performance issue:** `getThemeColors()` called dozens of times per render instead of using `c` variable

**HIGH:**
3. **"High Protein" diet style is misleading** - Protein is the same, it's really "Equal Carb/Fat Split"

**MEDIUM:**
4. **No explanation of why protein is the same** - Users expect "High Protein" to have more protein
5. **Slider UX unclear** - No drag handle, unclear it's scrollable

### Recommendations

**P0 - Must Fix:**
1. **Auto-set proteinPerKg to recommendation on step load:**
   ```typescript
   useEffect(() => {
     const rec = getProteinRecommendation(goal, exerciseTypes);
     if (proteinPerKg === 2.0) { // Only if still at default
       updateField('proteinPerKg', rec.default);
     }
   }, []);
   ```

2. **Fix getThemeColors() performance issue** - Use `c` variable throughout

**P1 - Should Fix:**
3. **Rename "High Protein"** to "Balanced Carb/Fat" or make it actually increase protein by 0.3 g/kg
4. **Add tooltip** explaining why protein is the same across diet styles
5. **Show per-gram breakdown** in addition to percentages

---

## Step 10: Food DNA

### User's Question
"What happens when I select dietary identity? Is it mandatory?"

### Answers

**What it does:** ✅ AFFECTS APP BEHAVIOR

Selections personalize food search results:
- **Cuisine preferences:** Boost matching foods by +50% in search ranking
- **Allergies:** Demote allergens by -80%
- **Dietary restrictions:** 
  - Vegetarian: Demote meat by -50%
  - Vegan: Demote meat by -70%, dairy by -70%
  - Pescatarian: Demote meat by -50%, allow fish

**Is it mandatory?** ❌ NO

Has "Set this up later" skip link. Can be configured post-onboarding in Advanced Settings.

### Issues Found

**MEDIUM:**
1. **Multi-select allows contradictions** - Can select "Vegan" + "Pescatarian" simultaneously
2. **"None" doesn't clear others** - Can select "None" + "Dairy" allergy
3. **"Eggetarian" is niche** - May confuse users (consider "Ovo-vegetarian")

### Recommendations
1. **Add mutual exclusion** - "No restrictions" clears other dietary selections
2. **Add tooltips** for niche terms
3. **Keep it optional** (current behavior is correct)

---

## Step 11: Summary

### Current Implementation
- 8 rows showing: Calories, Protein, Carbs, Fat, Goal, Rate, TDEE, Diet Style
- Each row tappable to edit
- Staggered entrance animation
- Submits to backend on "Start Your Journey"

### Issues Found

**MEDIUM:**
1. **Missing data** - Doesn't show weight, height, age, activity level, exercise info, Food DNA
2. **No visual macro breakdown** - Just numbers, no pie chart or bar
3. **Hardcoded edit step indices** - Fragile if step order changes

### Recommendations
1. **Add comprehensive review** - Show ALL entered data
2. **Add visual elements** - Macro pie chart, calorie breakdown chart
3. **Add confirmation dialog** - "Ready to start your journey?"

---

## Step 12: Trial Prompt

### User's Concern
"UI looks quite dead"

### Analysis

**Current UI:**
- Star icon (small, size 40)
- Title + subtitle
- 5 generic feature checkmarks
- Two buttons

**Issues Found:**

**HIGH:**
1. **No visual engagement** - Static, no animation, feels flat
2. **Generic features** - Doesn't reference user's specific plan
3. **No social proof** - No user count, ratings, testimonials
4. **No urgency** - No countdown, limited offer, or FOMO
5. **Small icon** - Underwhelming for premium upsell

### Recommendations

**P0 - Visual Improvements:**
1. **Add entrance animation** - Fade in + scale up
2. **Larger premium icon** - Size 80-100 with gradient or glow
3. **Personalized copy** - "Your 2,200 kcal cutting plan is ready!"
4. **Add gradient background** - Premium feel (gold/purple gradient)

**P1 - Content Improvements:**
5. **Show free vs premium comparison** - Table or side-by-side cards
6. **Add social proof** - "Join 10,000+ users" or testimonial
7. **Add urgency** - "Limited time: 7-day trial" or countdown

---

## Critical Issues Summary

### CRITICAL (Must Fix)
1. **getThemeColors() performance issue** - Called dozens of times per render in all steps
2. **Default protein doesn't match recommendation** - Always 2.0 g/kg regardless of goal

### HIGH (Should Fix Soon)
3. **No per-session calorie display** - Users expect to see per-workout burn
4. **"High Protein" diet style misleading** - Protein is actually the same
5. **Trial prompt visually underwhelming** - Monetization gate needs better design

### MEDIUM (Nice to Have)
6. **Weight scale limited to 0.5 kg** - Can't select 82.6 kg
7. **Smart Training not personalized** - Shows cutting/bulking for all users
8. **Food DNA allows contradictions** - Can select Vegan + Pescatarian
9. **Summary missing data** - Only shows 8 of ~20 data points
10. **No visual macro breakdown** - Just numbers

---

## Immediate Action Items

**To test registration NOW:**
1. Stop backend (Ctrl+C)
2. Run: `./START-BACKEND-WITH-ENV.sh`
3. Register with `0000006mm@gmail.com`
4. Email will arrive! ✅

**To fix onboarding issues:**
1. Fix default protein (auto-set to recommendation)
2. Fix getThemeColors() performance
3. Add per-session calorie display
4. Improve trial prompt UI
5. Add mutual exclusion to Food DNA

**Estimated effort:** 8-12 hours for all fixes

---

**First, let's get registration working. Run `./START-BACKEND-WITH-ENV.sh` and test!**
