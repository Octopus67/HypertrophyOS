# Feature 2: Volume Landmarks Visualization — Detailed Implementation Plan

═══════════════════════════════════════════════
FEATURE 2: VOLUME LANDMARKS VISUALIZATION
Total Effort: 28 hours (3.5 days)
Dependencies: Existing WNS engine, victory-native charts
Risk Level: 🟢 Low (uses existing data, additive UI)
═══════════════════════════════════════════════

## OVERVIEW

Surface the WNS algorithm's intelligence by visualizing weekly volume relative to landmarks (MV, MEV, MAV, MRV) for each muscle group. Users see exactly where they are in their volume progression and understand the science behind recommendations.

## SUCCESS CRITERIA

- Users can view volume landmarks for all tracked muscle groups
- Visual representation clearly shows current volume vs. landmarks
- Trend chart shows 4-week volume history
- Educational tooltips explain each landmark
- 60%+ weekly active users view landmarks at least once
- Zero performance degradation on Analytics screen

═══════════════════════════════════════════════
PHASE 0: PREREQUISITES
═══════════════════════════════════════════════

Step 1: Install victory-native chart library
Files: app/package.json (M)
Details: Run `cd app && npm install victory-native`. Verify version ≥36.0.0 (compatible with React Native 0.70+). Also install peer dependencies if needed: `npm install react-native-svg` (likely already installed). Verify package.json shows both packages.
Depends on: none
Parallel: sequential
Test: Run `npm list victory-native react-native-svg` — verify both installed
Rollback: `npm uninstall victory-native`
Risk: 🟢 Low — mature charting library
Time: S (<30 min)
PR: Include in PR #3 (Volume Landmarks)

Step 2: Verify WNS volume endpoint returns landmarks
Files: src/modules/training/router.py (review), src/modules/training/wns_volume_service.py (review)
Details: Check GET /training/volume/weekly endpoint response. Verify it returns for each muscle: {muscle_group, current_volume, status, landmarks: {mv, mev, mav, mrv}, trend: [...]}. If landmarks not present, modify wns_volume_service.py to include them in response (they're already computed internally). Document current response schema.
Depends on: none
Parallel: can run alongside Step 1
Test: `curl http://localhost:8000/api/v1/training/volume/weekly -H "Authorization: Bearer <token>"` — verify landmarks present
Rollback: N/A (read-only verification)
Risk: 🟢 Low — landmarks already computed, just need to expose
Time: M (30-45 min)
PR: If modification needed, include in PR #3

Step 3: Create feature flag for volume landmarks
Files: Database seed script OR feature_flags table
Details: Insert feature flag: `{'name': 'volume_landmarks', 'enabled': False, 'description': 'Show volume landmarks visualization on Analytics screen', 'conditions': {}}`. Default to OFF for gradual rollout.
Depends on: none
Parallel: can run alongside Steps 1-2
Test: Query `SELECT * FROM feature_flags WHERE name = 'volume_landmarks'` — verify exists
Rollback: Delete feature flag row
Risk: 🟢 Low — additive
Time: S (<15 min)
PR: Include in PR #3

🚦 CHECKPOINT 0: Prerequisites ready
Run:
  - `npm list victory-native` — verify installed
  - `curl /api/v1/training/volume/weekly` — verify landmarks in response
  - Query feature flag — verify exists
Verify: All dependencies installed. Backend returns landmark data. Feature flag exists.
Gate: Ready to build UI components.

═══════════════════════════════════════════════
PHASE 1: BACKEND ENHANCEMENTS (if needed)
═══════════════════════════════════════════════

Step 4: Add trend data to volume endpoint
Files: src/modules/training/wns_volume_service.py (M)
Details: In get_weekly_muscle_volume(), add 4-week trend calculation. For each muscle, query last 4 weeks of volume: `SELECT DATE_TRUNC('week', session_date) as week, SUM(hard_sets) as volume FROM training_sessions JOIN session_exercises ... WHERE user_id = ? AND session_date >= NOW() - INTERVAL '4 weeks' GROUP BY week ORDER BY week`. Return as trend: [{week: "2026-02-03", volume: 12}, ...]. Include in response for each muscle.
Depends on: Step 2
Parallel: sequential
Test: Unit test — create sessions over 4 weeks, verify trend data correct
Rollback: Remove trend calculation
Risk: 🟢 Low — read-only query, doesn't affect existing logic
Time: M (60-90 min)
PR: Include in PR #3

Step 5: Add landmark explanations to response
Files: src/modules/training/wns_volume_service.py (M)
Details: Add landmark_descriptions field to response: {mv: "Minimum Volume: Lowest effective dose to maintain muscle", mev: "Minimum Effective Volume: Threshold for growth", mav: "Maximum Adaptive Volume: Optimal growth zone", mrv: "Maximum Recoverable Volume: Upper limit before overtraining"}. Return as part of each muscle's data OR as a top-level field (decide based on response size).
Depends on: Step 4
Parallel: sequential
Test: Verify response includes descriptions
Rollback: Remove descriptions field
Risk: 🟢 Low — additive
Time: S (<30 min)
PR: Include in PR #3

🚦 CHECKPOINT 1: Backend ready
Run:
  - `curl /api/v1/training/volume/weekly` — verify trend and descriptions present
  - `pytest tests/test_wns_volume_service.py -v` — verify tests pass
Verify: Endpoint returns all data needed for visualization.
Gate: Backend provides complete data. Ready for frontend.

═══════════════════════════════════════════════
PHASE 2: FRONTEND COMPONENTS
═══════════════════════════════════════════════

Step 6: Create VolumeBar component
Files: app/components/volume/VolumeBar.tsx (C)
Details: Create component that renders horizontal bar with 4 zones (MV-MEV, MEV-MAV, MAV-MRV, >MRV) in different colors. Props: {landmarks: {mv, mev, mav, mrv}, currentVolume: number, muscleGroup: string}. Use View with flex layout. Calculate widths: mvWidth = (mev/mrv)*100%, mevWidth = ((mav-mev)/mrv)*100%, etc. Render colored segments with absolute positioning. Place indicator dot at currentVolume position. Color scheme: MV-MEV = yellow (#FCD34D), MEV-MAV = green (#10B981), MAV-MRV = orange (#F59E0B), >MRV = red (#EF4444). Add accessibility labels.
Depends on: Step 5 (backend data)
Parallel: can start after checkpoint 1
Test: Component test — render with various volume values, verify indicator position correct
Rollback: Delete file
Risk: 🟢 Low — pure UI component
Time: L (2-3 hrs)
PR: Include in PR #3

Step 7: Create VolumeTrendChart component
Files: app/components/volume/VolumeTrendChart.tsx (C)
Details: Create component using VictoryChart, VictoryLine, VictoryAxis from victory-native. Props: {trend: Array<{week: string, volume: number}>, landmarks: {mv, mev, mav, mrv}}. Render line chart with volume over time. Add horizontal reference lines for each landmark (dashed lines with labels). X-axis: week labels (format as "Feb 3", "Feb 10"). Y-axis: volume (0 to max(mrv, max(trend.volume))). Use theme colors. Handle empty trend gracefully (show "Not enough data" message).
Depends on: Step 1 (victory-native)
Parallel: can run alongside Step 6
Test: Component test — render with trend data, verify chart renders, verify landmarks shown
Rollback: Delete file
Risk: 🟡 Medium — charting library can be finicky with React Native
Time: L (3-4 hrs)
PR: Include in PR #3

Step 8: Create LandmarkExplainer component
Files: app/components/volume/LandmarkExplainer.tsx (C)
Details: Create bottom sheet or modal that explains each landmark. Props: {landmark: 'mv'|'mev'|'mav'|'mrv', onClose: () => void}. Content: Title (e.g., "Maximum Adaptive Volume"), Description (from backend), Practical advice (e.g., "MAV: This is your sweet spot. Most growth happens here with manageable fatigue."), Citation (e.g., "Based on Israetel et al. volume landmarks research"). Use existing ModalContainer or BottomSheet component. Add "Learn More" link to full article.
Depends on: none (uses existing components)
Parallel: can run alongside Steps 6-7
Test: Component test — render for each landmark, verify content correct
Rollback: Delete file
Risk: 🟢 Low — simple modal
Time: M (60-90 min)
PR: Include in PR #3

Step 9: Create VolumeLandmarksCard component
Files: app/components/volume/VolumeLandmarksCard.tsx (C)
Details: Create card component that combines VolumeBar and trend chart. Props: {muscleGroup: string, currentVolume: number, landmarks: {...}, trend: [...], status: string}. Layout: Header (muscle group name + status badge), VolumeBar, Current volume text (e.g., "14 hard sets this week"), Trend chart (collapsible), Info icon (opens LandmarkExplainer). Use existing Card component. Status badge colors: below_mev = gray, optimal = green, approaching_mrv = orange, above_mrv = red. Add press handlers for info icons on each landmark.
Depends on: Steps 6-8
Parallel: sequential
Test: Component test — render with all props, verify all sub-components render
Rollback: Delete file
Risk: 🟢 Low — composition of tested components
Time: L (2-3 hrs)
PR: Include in PR #3

🚦 CHECKPOINT 2: Components built
Run:
  - `npm test -- VolumeBar` — verify tests pass
  - `npm test -- VolumeTrendChart` — verify tests pass
  - `npm test -- VolumeLandmarksCard` — verify tests pass
Verify: All components render correctly. No TypeScript errors.
Gate: Components are tested and ready for integration.

═══════════════════════════════════════════════
PHASE 3: ANALYTICS SCREEN INTEGRATION
═══════════════════════════════════════════════

Step 10: Add Volume Landmarks tab to Analytics screen
Files: app/screens/analytics/AnalyticsScreen.tsx (M)
Details: Add third tab to existing tab bar: "Overview" | "Volume" | "Progress". In Volume tab, fetch volume data via `GET /training/volume/weekly`. Render ScrollView with VolumeLandmarksCard for each muscle group. Sort by current volume descending (show highest volume muscles first). Add loading skeleton while fetching. Add empty state if no training data: "Start logging workouts to see your volume landmarks". Add refresh control (pull to refresh).
Depends on: Step 9
Parallel: sequential
Test: Integration test — render screen, verify API called, verify cards render
Rollback: Remove Volume tab
Risk: 🟢 Low — additive tab
Time: L (2-3 hrs)
PR: Include in PR #3

Step 11: Add volume landmarks link to Dashboard
Files: app/screens/dashboard/DashboardScreen.tsx (M)
Details: Add "Volume Insights" card below existing cards. Show summary: "X muscles in optimal range, Y approaching MRV". Add "View Details" button that navigates to Analytics screen Volume tab. Only show if user has training data from last 7 days. Use existing Card component. Add icon (bar chart or activity icon).
Depends on: Step 10
Parallel: sequential
Test: Component test — render with various volume states, verify navigation
Rollback: Remove card
Risk: 🟢 Low — additive card
Time: M (60-90 min)
PR: Include in PR #3

Step 12: Add volume status to training plan cards
Files: app/components/training/MuscleGroupCard.tsx (M) OR app/screens/training/TrainingPlanScreen.tsx (M)
Details: In training plan view, add small volume indicator below each muscle group. Show current volume as badge: "12/28 sets" (current/MAV). Color code: green if in optimal range, orange if approaching MRV, red if above. Add onPress to navigate to Volume tab for that muscle. Only show if volume landmarks feature flag enabled.
Depends on: Step 10
Parallel: can run alongside Step 11
Test: Component test — render with various volume values, verify badge correct
Rollback: Remove volume indicator
Risk: 🟢 Low — additive UI element
Time: M (45-60 min)
PR: Include in PR #3

🚦 CHECKPOINT 3: Integration complete
Run:
  - Build app: `npm run ios` (or android)
  - Navigate to Analytics → Volume tab
  - Verify cards render for all muscle groups
  - Tap info icon, verify explainer opens
  - Pull to refresh, verify data updates
Verify: Volume landmarks visible. Charts render. Navigation works. No crashes.
Gate: Feature is functional end-to-end. Ready for polish.

═══════════════════════════════════════════════
PHASE 4: POLISH & TESTING
═══════════════════════════════════════════════

Step 13: Add animations to volume bar
Files: app/components/volume/VolumeBar.tsx (M)
Details: Animate indicator dot movement using react-native-reanimated. When currentVolume changes, animate dot position over 300ms with easeInOut. Animate bar segment widths on mount (0 → full width over 500ms, staggered by 100ms per segment). Use useSharedValue and useAnimatedStyle. Add haptic feedback when indicator crosses landmark threshold.
Depends on: Step 6
Parallel: can start after checkpoint 2
Test: Manual test — change volume, verify smooth animation
Rollback: Remove animations (keep static version)
Risk: 🟢 Low — animations are polish, not critical
Time: M (60-90 min)
PR: Include in PR #3

Step 14: Add educational onboarding for volume landmarks
Files: app/components/volume/VolumeLandmarksOnboarding.tsx (C), app/screens/analytics/AnalyticsScreen.tsx (M)
Details: Create first-time user experience: overlay with arrows pointing to each landmark, explaining the concept. Show once per user (store in AsyncStorage: 'volume_landmarks_onboarding_seen'). Content: "Welcome to Volume Landmarks" → "This is your current volume" (point to indicator) → "These zones guide your training" (highlight zones) → "Tap any landmark to learn more". Use existing Tooltip or Overlay component. Add "Skip" and "Next" buttons. Show after first render of Volume tab.
Depends on: Step 10
Parallel: can run alongside Step 13
Test: Component test — render onboarding, verify steps advance
Rollback: Delete onboarding component
Risk: 🟢 Low — optional UX enhancement
Time: L (2-3 hrs)
PR: Include in PR #3

Step 15: Add volume landmarks to weekly report
Files: app/components/analytics/WeeklyReportModal.tsx (M) OR create new component
Details: In weekly summary (shown on Sundays or via Analytics), add section: "Volume Status". Show each muscle group with status badge and brief recommendation (e.g., "Chest: Optimal (18 sets). Keep it up!" or "Back: Below MEV (8 sets). Consider adding volume."). Use same color coding as landmarks. Add "View Details" link to Volume tab.
Depends on: Step 10
Parallel: can run alongside Steps 13-14
Test: Component test — render with various volume states, verify recommendations correct
Rollback: Remove volume section from report
Risk: 🟢 Low — additive content
Time: M (60-90 min)
PR: Include in PR #3

Step 16: Write comprehensive tests
Files: app/__tests__/components/volume/*.test.tsx (C), app/__tests__/screens/AnalyticsScreen.test.tsx (M)
Details: Write tests for: (1) VolumeBar with edge cases (volume=0, volume>MRV, landmarks=null), (2) VolumeTrendChart with empty data, (3) VolumeLandmarksCard with all status types, (4) AnalyticsScreen Volume tab with loading/error/success states, (5) Navigation from Dashboard to Volume tab, (6) Landmark explainer modal. Aim for 90%+ coverage of new code. Use @testing-library/react-native.
Depends on: Steps 6-15
Parallel: can write tests alongside implementation
Test: Run `npm test -- volume` — verify all tests pass
Rollback: N/A (tests don't affect functionality)
Risk: 🟢 Low — tests are safety net
Time: L (3-4 hrs)
PR: Include in PR #3

🚦 CHECKPOINT 4: Feature complete
Run:
  - `npm test` — verify all tests pass
  - `npm run lint` — verify no linting errors
  - Build and test on iOS and Android
  - Test with various volume states (below MEV, optimal, above MRV)
  - Test with no training data (empty state)
  - Test onboarding flow
Verify: All tests pass. No crashes. Animations smooth. Educational content clear.
Gate: Feature is production-ready. Ready for code review.

═══════════════════════════════════════════════
PHASE 5: DEPLOYMENT
═══════════════════════════════════════════════

Step 17: Enable feature flag in staging
Files: Database (staging environment)
Details: Update feature flag: `UPDATE feature_flags SET enabled = true WHERE name = 'volume_landmarks'`. Verify in staging app that Volume tab appears. Test with real user data.
Depends on: Checkpoint 4
Parallel: sequential
Test: Open staging app, navigate to Analytics, verify Volume tab visible
Rollback: Set enabled = false
Risk: 🟢 Low — staging only
Time: S (<15 min)
PR: N/A (database operation)

Step 18: Monitor staging metrics
Files: N/A (observability)
Details: Monitor for 24-48 hours: (1) Volume tab view rate (target: 60%+ of users), (2) Crash rate (target: <0.1%), (3) API latency for /volume/weekly (target: <500ms p95), (4) Landmark explainer open rate (target: 20%+). Check Sentry for errors. Check backend logs for slow queries.
Depends on: Step 17
Parallel: sequential
Test: Query analytics: `SELECT COUNT(DISTINCT user_id) FROM events WHERE event_name = 'volume_tab_viewed' AND created_at > NOW() - INTERVAL '24 hours'`
Rollback: N/A (monitoring)
Risk: 🟢 Low — observation only
Time: M (monitoring over 24-48 hrs)
PR: N/A

Step 19: Gradual production rollout
Files: Database (production environment)
Details: Enable for 10% of users first: `UPDATE feature_flags SET enabled = true, conditions = '{"rollout_percentage": 10}' WHERE name = 'volume_landmarks'`. Monitor for 24 hours. If metrics good, increase to 50%, then 100%. If issues detected, rollback to 0%.
Depends on: Step 18 (staging validation)
Parallel: sequential
Test: Verify 10% of users see Volume tab (check analytics)
Rollback: Set rollout_percentage = 0 or enabled = false
Risk: 🟡 Medium — production rollout
Time: L (3-5 days for gradual rollout)
PR: N/A

Step 20: Announce feature
Files: N/A (marketing/comms)
Details: After 100% rollout, announce via: (1) In-app notification: "New: Volume Landmarks! See exactly where you are in your training progression.", (2) Social media post with screenshot, (3) Email to active users. Link to Learn article explaining volume landmarks.
Depends on: Step 19 (100% rollout)
Parallel: sequential
Test: N/A
Rollback: N/A
Risk: 🟢 Low — announcement only
Time: S (<30 min)
PR: N/A

🚦 FINAL CHECKPOINT: Feature shipped
Verify:
  - Feature flag at 100%
  - 60%+ weekly active users viewed Volume tab
  - <0.1% crash rate
  - Positive user feedback
  - No performance degradation
Success: Volume Landmarks feature is live and successful.

═══════════════════════════════════════════════
ROLLBACK PLAN
═══════════════════════════════════════════════

If critical issues detected:
1. Set feature flag enabled = false (immediate)
2. Deploy hotfix if needed (remove Volume tab code)
3. Investigate root cause
4. Fix and re-test in staging
5. Re-enable with gradual rollout

═══════════════════════════════════════════════
METRICS & SUCCESS TRACKING
═══════════════════════════════════════════════

Track these events:
- volume_tab_viewed (user_id, timestamp)
- volume_landmark_info_opened (user_id, landmark, timestamp)
- volume_trend_expanded (user_id, muscle_group, timestamp)
- volume_onboarding_completed (user_id, timestamp)

Success metrics (30 days post-launch):
- 60%+ weekly active users view Volume tab at least once
- 20%+ users open landmark explainer
- 40%+ users expand trend chart
- <0.1% crash rate
- <500ms p95 API latency
- Positive sentiment in user feedback (>80% positive)

═══════════════════════════════════════════════
TOTAL EFFORT: 28 hours
- Backend: 3 hours
- Frontend components: 12 hours
- Integration: 6 hours
- Polish & testing: 5 hours
- Deployment: 2 hours
═══════════════════════════════════════════════
