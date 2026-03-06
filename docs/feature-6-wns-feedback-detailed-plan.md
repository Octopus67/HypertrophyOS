# Feature 6: In-Workout WNS Feedback — Detailed Implementation Plan

═══════════════════════════════════════════════
FEATURE 6: IN-WORKOUT WNS FEEDBACK
Total Effort: 32 hours (4 days)
Dependencies: Existing wnsCalculator.ts refactor
Risk Level: 🟡 Medium (depends on calculator accuracy)
═══════════════════════════════════════════════

## OVERVIEW

Make WNS intelligence visible during workouts. Show real-time volume accumulation (Hard Units), per-exercise stimulus, and post-workout summary explaining recommendations. Users understand WHY the app recommends certain volumes.

## SUCCESS CRITERIA

- Users understand HU concept (survey: 70%+ can explain "Hard Units")
- 50%+ users view post-workout summary at least once
- Reduced support questions about "why this many sets?"
- HU calculations match backend within ±0.1 HU
- Real-time updates <100ms after set logged
- Zero performance degradation during workouts

═══════════════════════════════════════════════
PHASE 0: WNS CALCULATOR REFACTOR
═══════════════════════════════════════════════

Step 1: Extract stimulus calculation functions
Files: app/utils/wnsCalculator.ts (M)
Details: Refactor existing wnsCalculator into modular functions: (1) calculateSetStimulus(reps, rir, weight, oneRM) → HU for single set, (2) calculateExerciseStimulus(sets: Array<{reps, rir, weight}>, oneRM) → total HU for exercise, (3) calculateSessionStimulus(exercises, muscleGroupMap) → {muscleGroup: HU} for session, (4) calculateWeeklyStimulus(sessions, landmarks) → {muscleGroup: {current, mv, mev, mav, mrv, status}}. Keep existing constants (MAX_STIM_REPS=5, DEFAULT_RIR=2.0, DIMINISHING_K=0.96). Add JSDoc comments explaining formulas.
Depends on: none
Parallel: sequential
Test: Unit tests for each function with known inputs/outputs
Rollback: Revert to monolithic calculator
Risk: 🟡 Medium — affects core algorithm
Time: L (3-4 hrs)
PR: Include in PR #7 (WNS Feedback)

Step 2: Validate calculations against backend
Files: app/utils/__tests__/wnsCalculator.test.ts (M)
Details: Create integration tests that compare frontend calculations to backend API responses. For 10 sample workouts, calculate HU on frontend and fetch from backend, verify difference <0.1 HU. If discrepancies found, fix frontend to match backend (backend is source of truth).
Depends on: Step 1
Parallel: sequential
Test: Run tests, verify all pass
Rollback: N/A (tests don't affect functionality)
Risk: 🟡 Medium — may reveal calculation bugs
Time: L (2-3 hrs)
PR: Include in PR #7

Step 3: Add muscle group mapping utility
Files: app/utils/muscleGroupMapping.ts (C)
Details: Create utility to map exercises to muscle groups. Function: getMuscleGroupsForExercise(exerciseName: string) → Array<{muscleGroup: string, contribution: number}>. Use existing exercise database or hardcoded mapping. Example: "Bench Press" → [{muscleGroup: "chest", contribution: 1.0}, {muscleGroup: "triceps", contribution: 0.3}, {muscleGroup: "front_delts", contribution: 0.2}]. Handle compound exercises correctly.
Depends on: none
Parallel: can run alongside Steps 1-2
Test: Unit tests for common exercises
Rollback: Delete file
Risk: 🟢 Low — utility function
Time: M (60-90 min)
PR: Include in PR #7

🚦 CHECKPOINT 0: Calculator refactored and validated
Run:
  - `npm test -- wnsCalculator` — verify all tests pass
  - Compare frontend vs backend calculations — verify <0.1 HU difference
Verify: Calculator is modular, accurate, and tested.
Gate: Ready to build UI components.

═══════════════════════════════════════════════
PHASE 1: IN-WORKOUT HU DISPLAY
═══════════════════════════════════════════════

Step 4: Create HUFloatingPill component
Files: app/components/training/HUFloatingPill.tsx (C)
Details: Create floating pill that shows cumulative HU for current muscle group. Props: {muscleGroup: string, currentHU: number, landmarks: {mv, mev, mav, mrv}, onPress: () => void}. Layout: Pill shape (rounded rectangle), icon (muscle icon or bar chart), text: "Chest: 8.2 HU", color-coded background (green if in optimal range [MEV-MAV], yellow if below MEV, orange if approaching MRV, red if above MRV). Position: floating above exercise list (absolute positioning, top: 60, right: 16). Add subtle shadow. Animate entrance (slide in from right).
Depends on: Step 1 (calculator functions)
Parallel: can start after checkpoint 0
Test: Component test — render with various HU values, verify color coding correct
Rollback: Delete file
Risk: 🟢 Low — pure UI component
Time: L (2-3 hrs)
PR: Include in PR #7

Step 5: Add HU calculation to ActiveWorkoutScreen
Files: app/screens/training/ActiveWorkoutScreen.tsx (M)
Details: Add state: `const [sessionHU, setSessionHU] = useState<Record<string, number>>({})`. After each set logged, recalculate HU: (1) get all logged sets for current session, (2) call calculateSessionStimulus(exercises, muscleGroupMap), (3) update sessionHU state. Determine primary muscle group for current exercise (use getMuscleGroupsForExercise, take highest contribution). Pass to HUFloatingPill: muscleGroup, currentHU=sessionHU[muscleGroup], landmarks (fetch from API or use cached).
Depends on: Steps 1, 3, 4
Parallel: sequential
Test: Integration test — log sets, verify HU updates
Rollback: Remove HU calculation
Risk: 🟡 Medium — affects workout flow
Time: L (2-3 hrs)
PR: Include in PR #7

Step 6: Add HU breakdown modal
Files: app/components/training/HUBreakdownModal.tsx (C)
Details: Create modal that shows HU breakdown by exercise. Props: {exercises: Array<{name, sets, hu}>, muscleGroup: string, onClose: () => void}. Layout: Title: "Chest Volume Breakdown", list of exercises with HU contribution (e.g., "Bench Press: 4.2 HU", "Incline DB Press: 2.8 HU"), total HU, landmarks visualization (horizontal bar showing current position). Add "Learn More" button linking to WNS explainer article.
Depends on: Step 4
Parallel: can run alongside Step 5
Test: Component test — render with sample data, verify breakdown correct
Rollback: Delete file
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #7

Step 7: Wire HUFloatingPill to breakdown modal
Files: app/screens/training/ActiveWorkoutScreen.tsx (M)
Details: Add state: `const [showHUBreakdown, setShowHUBreakdown] = useState(false)`. On HUFloatingPill press, set showHUBreakdown=true. Render HUBreakdownModal with current session exercises and HU data. Add haptic feedback on press.
Depends on: Steps 5-6
Parallel: sequential
Test: Manual test — tap pill, verify modal opens with correct data
Rollback: Remove modal wiring
Risk: 🟢 Low
Time: S (<30 min)
PR: Include in PR #7

🚦 CHECKPOINT 1: In-workout HU display working
Run:
  - Start workout
  - Log sets for an exercise
  - Verify HUFloatingPill appears and updates
  - Tap pill, verify breakdown modal opens
Verify: HU updates in real-time. Breakdown is accurate. No lag.

═══════════════════════════════════════════════
PHASE 2: PER-EXERCISE HU DISPLAY
═══════════════════════════════════════════════

Step 8: Add HU badge to ExerciseCard
Files: app/components/training/ExerciseCardPremium.tsx (M)
Details: Add HU badge below exercise name. Show after first set logged. Format: "2.4 HU" with info icon. Color code: green if contributing to optimal volume, orange if approaching MRV, gray if below MEV. Position: below exercise name, aligned left. Use small font (12px). Add subtle background (semi-transparent).
Depends on: Step 1 (calculator)
Parallel: can start after checkpoint 0
Test: Component test — render with various HU values, verify badge appears
Rollback: Remove badge
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #7

Step 9: Update HU badge after each set
Files: app/components/training/ExerciseCardPremium.tsx (M)
Details: Add prop: `currentHU: number`. Recalculate after each set logged. Use calculateExerciseStimulus(sets, oneRM). Update badge text. Animate change (fade out old value, fade in new value over 200ms).
Depends on: Step 8
Parallel: sequential
Test: Integration test — log multiple sets, verify HU updates
Rollback: Remove dynamic updates (keep static badge)
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #7

Step 10: Add HU explainer modal for exercises
Files: app/components/training/HUExplainerModal.tsx (C)
Details: Create modal explaining HU for specific exercise. Props: {exerciseName: string, currentHU: number, targetRange: {min, max}, onClose: () => void}. Content: "What are Hard Units?", "HU measures effective stimulus per set, accounting for proximity to failure and diminishing returns.", "Your [exercise]: [currentHU] HU", "Target range: [min]-[max] HU", "Learn more" link. Use simple language. Add illustration (optional).
Depends on: none
Parallel: can run alongside Steps 8-9
Test: Component test — render, verify content correct
Rollback: Delete file
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #7

Step 11: Wire info icon to explainer modal
Files: app/components/training/ExerciseCardPremium.tsx (M)
Details: Add onPress to info icon next to HU badge. Open HUExplainerModal with current exercise data. Add haptic feedback.
Depends on: Steps 8, 10
Parallel: sequential
Test: Manual test — tap info icon, verify modal opens
Rollback: Remove onPress handler
Risk: 🟢 Low
Time: S (<15 min)
PR: Include in PR #7

🚦 CHECKPOINT 2: Per-exercise HU display working
Run:
  - Start workout
  - Log sets for multiple exercises
  - Verify HU badge appears on each exercise
  - Tap info icon, verify explainer opens
Verify: Per-exercise HU is accurate and educational.

═══════════════════════════════════════════════
PHASE 3: POST-WORKOUT SUMMARY
═══════════════════════════════════════════════

Step 12: Create WorkoutSummaryModal component
Files: app/components/training/WorkoutSummaryModal.tsx (C)
Details: Create modal shown after ending workout. Props: {session: TrainingSession, huByMuscle: Record<string, number>, landmarks: Record<string, Landmarks>, onClose: () => void, onShare: () => void}. Layout: (1) Header: "Workout Complete! 💪", (2) Duration and total volume, (3) HU by muscle group with status badges (e.g., "Chest: 8.2 HU - Optimal ✓"), (4) Recommendations (e.g., "Great session! You're in the optimal range for chest. Consider adding 1-2 sets for back next time."), (5) "Why?" button (opens detailed WNS explanation), (6) "Share Workout" button, (7) "Done" button. Use existing Modal component. Add celebration animation (confetti if PR hit).
Depends on: Steps 1, 3
Parallel: can start after checkpoint 0
Test: Component test — render with various session data, verify recommendations correct
Rollback: Delete file
Risk: 🟢 Low
Time: L (3-4 hrs)
PR: Include in PR #7

Step 13: Generate recommendations based on volume status
Files: app/utils/wnsRecommendations.ts (C)
Details: Create function: generateRecommendations(huByMuscle, landmarks) → Array<string>. Logic: For each muscle, if below MEV: "Consider adding volume for [muscle]", if in optimal range: "Great work on [muscle]!", if approaching MRV: "You're near your limit for [muscle]. Maintain or reduce volume.", if above MRV: "Warning: [muscle] volume is very high. Consider deloading." Return array of recommendation strings. Use friendly, encouraging tone.
Depends on: Step 1
Parallel: can run alongside Step 12
Test: Unit tests with various volume scenarios
Rollback: Delete file
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #7

Step 14: Show WorkoutSummaryModal after ending workout
Files: app/screens/training/ActiveWorkoutScreen.tsx (M)
Details: After user taps "End Workout", calculate final HU by muscle, fetch landmarks, generate recommendations, show WorkoutSummaryModal. Add state: `const [showSummary, setShowSummary] = useState(false)`. On "End Workout" press: (1) save session to backend, (2) calculate HU, (3) set showSummary=true. On modal close, navigate back to Logs screen.
Depends on: Steps 12-13
Parallel: sequential
Test: Integration test — end workout, verify summary appears with correct data
Rollback: Remove summary modal (go straight to Logs)
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #7

Step 15: Add "Why?" detailed explanation
Files: app/components/training/WNSDetailedExplainer.tsx (C)
Details: Create modal with detailed WNS explanation. Content: (1) "What is the WNS Algorithm?", (2) "Volume Landmarks Explained" (MV, MEV, MAV, MRV with definitions), (3) "How Hard Units Work" (formula explanation in simple terms), (4) "Why This Matters" (benefits of volume-based training), (5) "Learn More" link to full article. Use accordion or tabs for organization. Add illustrations (optional).
Depends on: none
Parallel: can run alongside Steps 12-14
Test: Component test — render, verify all sections present
Rollback: Delete file
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #7

Step 16: Wire "Why?" button to detailed explainer
Files: app/components/training/WorkoutSummaryModal.tsx (M)
Details: Add state for showing detailed explainer. On "Why?" button press, open WNSDetailedExplainer modal. Track analytics event: wns_explainer_opened.
Depends on: Steps 12, 15
Parallel: sequential
Test: Manual test — tap "Why?", verify explainer opens
Rollback: Remove button
Risk: 🟢 Low
Time: S (<15 min)
PR: Include in PR #7

🚦 CHECKPOINT 3: Post-workout summary complete
Run:
  - Complete workout
  - Verify summary modal appears
  - Verify HU and recommendations correct
  - Tap "Why?", verify detailed explainer opens
Verify: Summary is informative and educational. Users understand their volume status.

═══════════════════════════════════════════════
PHASE 4: TESTING & POLISH
═══════════════════════════════════════════════

Step 17: Test HU calculation accuracy
Files: N/A (testing)
Details: Create 20 test workouts with known HU values (calculated manually or via backend). Log these workouts in app, verify frontend HU matches expected within ±0.1 HU. Test edge cases: (1) zero sets, (2) very high volume (>20 sets), (3) low RIR (0-1), (4) high RIR (4-5), (5) compound exercises (multiple muscle groups).
Depends on: Checkpoint 1
Parallel: can start after checkpoint 1
Test: Manual testing with test workouts
Rollback: N/A (testing)
Risk: 🟡 Medium — may reveal calculation bugs
Time: L (2-3 hrs)
PR: Bug fixes in PR #7 if needed

Step 18: Test real-time update performance
Files: N/A (testing)
Details: Measure time from set logged to HU update. Target: <100ms. Profile with React DevTools. Test on low-end devices. Optimize if needed: (1) memoize calculations, (2) debounce updates, (3) use web workers for heavy calculations (if necessary).
Depends on: Checkpoint 1
Parallel: can run alongside Step 17
Test: Log 10 sets, measure average update time
Rollback: N/A (testing)
Risk: 🟢 Low
Time: M (60-90 min)
PR: Performance improvements in PR #7 if needed

Step 19: User testing for comprehension
Files: N/A (user testing)
Details: Get 10-20 users to complete workouts with WNS feedback. Survey: (1) "What are Hard Units?" (open-ended), (2) "Do you understand why the app recommends certain volumes?" (yes/no), (3) "Is the HU display helpful?" (1-5 scale), (4) "Any confusion or questions?". Target: 70%+ can explain HU concept. Iterate on messaging based on feedback.
Depends on: Checkpoint 3
Parallel: can start after checkpoint 3
Test: User survey
Rollback: N/A (testing)
Risk: 🟢 Low
Time: L (2-3 days for feedback collection)
PR: Messaging improvements in follow-up PR

Step 20: Write comprehensive tests
Files: app/__tests__/utils/wnsCalculator.test.ts (M), app/__tests__/components/HUFloatingPill.test.tsx (C), app/__tests__/components/WorkoutSummaryModal.test.tsx (C)
Details: Write tests: (1) All calculator functions with edge cases, (2) HUFloatingPill color coding, (3) WorkoutSummaryModal recommendations, (4) HU updates after set logged, (5) Modal interactions. Aim for 90%+ coverage of new code.
Depends on: Steps 1-16
Parallel: can write alongside implementation
Test: Run `npm test -- wns` — verify all tests pass
Rollback: N/A (tests)
Risk: 🟢 Low
Time: L (3-4 hrs)
PR: Include in PR #7

🚦 CHECKPOINT 4: Testing complete
Verify:
  - HU calculations accurate (±0.1 HU)
  - Real-time updates <100ms
  - 70%+ users understand HU concept
  - All tests pass
Gate: Feature is production-ready.

═══════════════════════════════════════════════
PHASE 5: DEPLOYMENT
═══════════════════════════════════════════════

Step 21: Enable feature flag in staging
Files: Database (staging)
Details: `UPDATE feature_flags SET enabled = true WHERE name = 'wns_feedback'` (create flag if doesn't exist). Test in staging app.
Depends on: Checkpoint 4
Parallel: sequential
Test: Complete workout in staging, verify HU display and summary work
Rollback: Set enabled = false
Risk: 🟢 Low
Time: S (<15 min)
PR: N/A

Step 22: Monitor staging metrics
Files: N/A (observability)
Details: Monitor for 24-48 hours: (1) HU pill view rate, (2) Breakdown modal open rate, (3) Summary modal view rate, (4) "Why?" explainer open rate, (5) Crash rate. Check Sentry for errors.
Depends on: Step 21
Parallel: sequential
Test: Query analytics for WNS feedback events
Rollback: N/A (monitoring)
Risk: 🟢 Low
Time: M (24-48 hrs)
PR: N/A

Step 23: Gradual production rollout
Files: Database (production)
Details: Enable for 10% of users. Monitor for 24 hours. If metrics good, increase to 50%, then 100%.
Depends on: Step 22
Parallel: sequential
Test: Verify 10% of users see HU display
Rollback: Set rollout_percentage = 0
Risk: 🟡 Medium — production rollout
Time: L (3-5 days)
PR: N/A

Step 24: Announce feature
Files: N/A (marketing)
Details: After 100% rollout, announce: (1) In-app notification: "New: See your training volume in real-time! Understand exactly how much stimulus you're generating.", (2) Social media post explaining HU concept, (3) Blog post: "Introducing Hard Units: The Science Behind Your Training Volume".
Depends on: Step 23 (100% rollout)
Parallel: sequential
Test: N/A
Rollback: N/A
Risk: 🟢 Low
Time: S (<30 min)
PR: N/A

🚦 FINAL CHECKPOINT: Feature shipped
Verify:
  - 50%+ users view post-workout summary
  - 70%+ users understand HU concept
  - Reduced support questions about volume
  - <0.1% crash rate
Success: WNS feedback is live and educational.

═══════════════════════════════════════════════
ROLLBACK PLAN
═══════════════════════════════════════════════

If critical issues:
1. Set feature flag enabled = false (immediate)
2. Deploy hotfix if needed
3. Investigate and fix
4. Re-enable with gradual rollout

═══════════════════════════════════════════════
METRICS & SUCCESS TRACKING
═══════════════════════════════════════════════

Track events:
- hu_pill_viewed (user_id, muscle_group, hu, timestamp)
- hu_breakdown_opened (user_id, muscle_group, timestamp)
- workout_summary_viewed (user_id, session_id, timestamp)
- wns_explainer_opened (user_id, source, timestamp)

Success metrics (30 days):
- 50%+ users view post-workout summary at least once
- 20%+ users open HU breakdown
- 10%+ users open detailed WNS explainer
- 70%+ users can explain HU concept (survey)
- <100ms real-time update latency
- <0.1% crash rate

═══════════════════════════════════════════════
TOTAL EFFORT: 32 hours
- Calculator refactor: 6 hours
- In-workout HU display: 6 hours
- Per-exercise HU: 4 hours
- Post-workout summary: 8 hours
- Testing & polish: 8 hours
═══════════════════════════════════════════════
