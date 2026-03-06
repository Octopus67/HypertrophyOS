# Feature 4: Light Mode — Detailed Implementation Plan

═══════════════════════════════════════════════
FEATURE 4: LIGHT MODE
Total Effort: 32 hours (4 days)
Dependencies: None (uses existing React Native APIs)
Risk Level: 🟡 Medium (touches all components)
═══════════════════════════════════════════════

## OVERVIEW

Add light theme as alternative to existing dark theme (#0A0E13 base). Most users will stay dark (gym use), but 20-30% want light for daytime. Theme persists across sessions and applies system-wide.

## SUCCESS CRITERIA

- 20-30% users switch to light mode within 30 days
- Zero visual bugs in light mode (all text readable, proper contrast)
- All text meets WCAG AA contrast ratio (≥4.5:1 for normal text, ≥3:1 for large text)
- Theme persists across app restarts
- Theme switching is instant (<100ms)
- No crashes when switching themes mid-session

═══════════════════════════════════════════════
PHASE 0: THEME INFRASTRUCTURE
═══════════════════════════════════════════════

Step 1: Create light color palette
Files: app/theme/lightColors.ts (C)
Details: Define complete light theme palette mirroring dark theme structure. Colors: bg.base='#FFFFFF', bg.elevated='#F8FAFC', bg.card='#F1F5F9', text.primary='#0F172A', text.secondary='#475569', text.tertiary='#94A3B8', accent.primary='#0EA5E9' (lighter cyan), accent.secondary='#8B5CF6', semantic.success='#10B981', semantic.error='#EF4444', semantic.warning='#F59E0B', semantic.info='#3B82F6', border.default='#E2E8F0', border.subtle='#F1F5F9', shadow='rgba(0,0,0,0.1)'. Export as lightColors object matching dark theme structure.
Depends on: none
Parallel: sequential
Test: Import and verify all keys match darkColors structure
Rollback: Delete file
Risk: 🟢 Low — pure data structure
Time: M (60-90 min)
PR: Include in PR #5 (Light Mode)

Step 2: Create theme store with Zustand
Files: app/stores/useThemeStore.ts (C)
Details: Create Zustand store: `interface ThemeStore { theme: 'dark' | 'light'; setTheme: (theme: 'dark' | 'light') => void; toggleTheme: () => void; }`. Implement persistence with AsyncStorage: on setTheme, save to '@repwise:theme'. On store init, load from AsyncStorage (default 'dark' if not found). Export useThemeStore hook.
Depends on: none
Parallel: can run alongside Step 1
Test: Unit test — set theme, verify persisted to AsyncStorage, reload, verify restored
Rollback: Delete file
Risk: 🟢 Low — standard Zustand pattern
Time: M (45-60 min)
PR: Include in PR #5

Step 3: Create useThemeColors hook
Files: app/hooks/useThemeColors.ts (C)
Details: Create hook that returns colors based on current theme: `export const useThemeColors = () => { const theme = useThemeStore(state => state.theme); return theme === 'dark' ? darkColors : lightColors; }`. Memoize result to prevent unnecessary re-renders. Export hook.
Depends on: Steps 1-2
Parallel: sequential
Test: Component test — render component using hook, change theme, verify colors update
Rollback: Delete file
Risk: 🟢 Low — simple hook
Time: S (<30 min)
PR: Include in PR #5

Step 4: Update StatusBar to match theme
Files: app/App.tsx (M)
Details: Import useThemeStore. Add useEffect that updates StatusBar when theme changes: `useEffect(() => { StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content'); if (Platform.OS === 'android') StatusBar.setBackgroundColor(colors.bg.base); }, [theme])`. Ensure StatusBar updates immediately on theme change.
Depends on: Step 2
Parallel: can run alongside Step 3
Test: Manual test — switch theme, verify StatusBar updates
Rollback: Remove useEffect
Risk: 🟢 Low — standard StatusBar API
Time: S (<30 min)
PR: Include in PR #5

Step 5: Add theme toggle to Settings
Files: app/screens/profile/ProfileScreen.tsx (M) OR app/screens/settings/SettingsScreen.tsx (M)
Details: Add "Appearance" section with theme toggle. Layout: "Theme" label, Switch component (dark ↔ light), current theme indicator ("Dark Mode" / "Light Mode"). On toggle, call `useThemeStore.getState().toggleTheme()`. Position below "Notifications" section. Use existing Card and Switch components.
Depends on: Step 2
Parallel: can run alongside Steps 3-4
Test: Component test — render, toggle switch, verify theme changes
Rollback: Remove Appearance section
Risk: 🟢 Low — simple UI addition
Time: M (30-45 min)
PR: Include in PR #5

🚦 CHECKPOINT 0: Theme infrastructure ready
Run:
  - Build app, navigate to Settings
  - Toggle theme switch
  - Verify StatusBar updates
  - Kill and restart app
  - Verify theme persisted
Verify: Theme switching works. Persistence works. No crashes.
Gate: Infrastructure is solid. Ready to migrate components.

═══════════════════════════════════════════════
PHASE 1: CORE COMPONENT MIGRATION (Priority 1)
═══════════════════════════════════════════════

Step 6: Migrate Button component
Files: app/components/common/Button.tsx (M)
Details: Replace hardcoded colors with useThemeColors(). Update: backgroundColor (primary button), borderColor, textColor, disabledColor, pressedColor (use opacity adjustments). Ensure all button variants (primary, secondary, outline, ghost) work in both themes. Test pressed states have proper feedback in both themes.
Depends on: Step 3
Parallel: can start after checkpoint 0
Test: Component test — render all variants in both themes, verify colors correct
Rollback: Revert to hardcoded colors
Risk: 🟢 Low — isolated component
Time: M (30-45 min)
PR: Include in PR #5

Step 7: Migrate Card component
Files: app/components/common/Card.tsx (M)
Details: Replace hardcoded backgroundColor, borderColor, shadowColor with theme colors. Light mode: use shadow (shadowColor='rgba(0,0,0,0.1)', shadowOffset={width:0,height:2}, shadowRadius:4). Dark mode: use subtle border glow. Ensure elevated cards have proper depth in both themes.
Depends on: Step 3
Parallel: can run alongside Step 6
Test: Component test — render in both themes, verify appearance
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #5

Step 8: Migrate Input component
Files: app/components/common/Input.tsx (M)
Details: Replace backgroundColor, borderColor, textColor, placeholderTextColor with theme colors. Light mode: border='#E2E8F0', focused border='#0EA5E9'. Dark mode: border='#334155', focused border='#06B6D4'. Ensure cursor visible in both themes.
Depends on: Step 3
Parallel: can run alongside Steps 6-7
Test: Component test — render in both themes, test focus states
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #5

Step 9: Migrate Modal/BottomSheet components
Files: app/components/common/ModalContainer.tsx (M), app/components/common/BottomSheet.tsx (M)
Details: Replace backdrop color (light: 'rgba(0,0,0,0.5)', dark: 'rgba(0,0,0,0.7)'), modal backgroundColor, close button color. Ensure modals are readable in both themes.
Depends on: Step 3
Parallel: can run alongside Steps 6-8
Test: Component test — render in both themes, verify backdrop and content colors
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #5

Step 10: Migrate TabBar component
Files: app/navigation/BottomTabNavigator.tsx (M)
Details: Replace tabBarStyle backgroundColor, activeColor, inactiveColor with theme colors. Light mode: bg='#FFFFFF', active='#0EA5E9', inactive='#94A3B8'. Dark mode: bg='#0A0E13', active='#06B6D4', inactive='#64748B'. Add subtle top border in light mode.
Depends on: Step 3
Parallel: can run alongside Steps 6-9
Test: Manual test — navigate between tabs in both themes
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #5

🚦 CHECKPOINT 1: Core components migrated
Run:
  - Build app in light mode
  - Test all core components (buttons, cards, inputs, modals, tabs)
  - Switch to dark mode, verify still works
Verify: All core components render correctly in both themes. No visual bugs.
Gate: Foundation is solid. Ready for screen-by-screen migration.

═══════════════════════════════════════════════
PHASE 2: SCREEN-BY-SCREEN MIGRATION (Priority 2)
═══════════════════════════════════════════════

Step 11: Migrate Dashboard screen
Files: app/screens/dashboard/DashboardScreen.tsx (M)
Details: Replace all hardcoded colors with useThemeColors(). Update: screen background, card backgrounds, text colors, icon colors, separator colors. Ensure daily tip card, macro ring, streak card all readable in both themes. Test skeleton loaders in both themes.
Depends on: Checkpoint 1
Parallel: can start after checkpoint 1
Test: Visual test — render in both themes, verify all elements visible
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #5

Step 12: Migrate Logs screen
Files: app/screens/logs/LogsScreen.tsx (M), app/components/logs/SessionCard.tsx (M)
Details: Replace colors in session cards, date headers, empty state. Ensure PR badges, volume indicators, exercise names all readable. Test calendar view in both themes (if applicable).
Depends on: Checkpoint 1
Parallel: can run alongside Step 11
Test: Visual test — render with various session data in both themes
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #5

Step 13: Migrate Analytics screen
Files: app/screens/analytics/AnalyticsScreen.tsx (M)
Details: Replace colors in charts, stat cards, tab bar. Ensure chart colors have good contrast in both themes (may need separate chart color palettes). Test volume pills, PR timeline, all chart types.
Depends on: Checkpoint 1
Parallel: can run alongside Steps 11-12
Test: Visual test — render with real data in both themes
Rollback: Revert to hardcoded colors
Risk: 🟡 Medium — charts can be tricky
Time: L (90-120 min)
PR: Include in PR #5

Step 14: Migrate Profile screen
Files: app/screens/profile/ProfileScreen.tsx (M)
Details: Replace colors in profile header, feature cards, settings sections. Ensure avatar, username, subscription badge all visible. Test all navigation links.
Depends on: Checkpoint 1
Parallel: can run alongside Steps 11-13
Test: Visual test — render in both themes
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #5

Step 15: Migrate Nutrition screens
Files: app/screens/nutrition/*.tsx (M) — NutritionScreen, MealBuilder, FoodSearch, etc.
Details: Replace colors in meal cards, macro bars, food items, search results. Ensure barcode scanner overlay works in both themes. Test all nutrition-related components.
Depends on: Checkpoint 1
Parallel: can run alongside Steps 11-14
Test: Visual test — log meal, search food, scan barcode in both themes
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #5

🚦 CHECKPOINT 2: Main screens migrated
Run:
  - Navigate through all main screens in light mode
  - Verify all content readable, no visual bugs
  - Switch to dark mode, verify still works
Verify: Dashboard, Logs, Analytics, Profile, Nutrition all work in both themes.
Gate: Main user flows are themed. Ready for training screens.

═══════════════════════════════════════════════
PHASE 3: TRAINING SCREENS (Priority 3)
═══════════════════════════════════════════════

Step 16: Migrate ActiveWorkoutScreen
Files: app/screens/training/ActiveWorkoutScreen.tsx (M), app/components/training/ExerciseCard*.tsx (M)
Details: Replace colors in exercise cards, set logging UI, timer, rest timer modal. Ensure all interactive elements visible during workout. Test in bright light (simulate gym environment) — light mode should be readable outdoors.
Depends on: Checkpoint 2
Parallel: can start after checkpoint 2
Test: Manual test — start workout, log sets in both themes, test in bright environment
Rollback: Revert to hardcoded colors
Risk: 🟡 Medium — critical user flow
Time: L (2-3 hrs)
PR: Include in PR #5

Step 17: Migrate SessionDetailScreen
Files: app/screens/training/SessionDetailScreen.tsx (M)
Details: Replace colors in exercise list, volume summary, PR badges, notes section. Ensure charts (if any) readable in both themes.
Depends on: Checkpoint 2
Parallel: can run alongside Step 16
Test: Visual test — view past session in both themes
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #5

Step 18: Migrate TrainingPlanScreen and PlanEditor
Files: app/screens/training/TrainingPlanScreen.tsx (M), app/components/training/PlanEditor*.tsx (M)
Details: Replace colors in plan cards, muscle group cards, exercise selection, edit panels. Ensure drag handles, reorder indicators visible in both themes.
Depends on: Checkpoint 2
Parallel: can run alongside Steps 16-17
Test: Visual test — view plan, edit plan in both themes
Rollback: Revert to hardcoded colors
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #5

🚦 CHECKPOINT 3: Training screens migrated
Run:
  - Start workout in light mode, log sets
  - View past session in light mode
  - Edit training plan in light mode
  - Switch to dark mode, verify all still works
Verify: All training flows work in both themes. No visual bugs.
Gate: Core app is fully themed. Ready for onboarding and edge cases.

═══════════════════════════════════════════════
PHASE 4: ONBOARDING & EDGE CASES
═══════════════════════════════════════════════

Step 19: Migrate onboarding flow
Files: app/screens/onboarding/*.tsx (M) — all 11 steps
Details: Replace colors in all onboarding steps. Ensure progress bar, step indicators, input fields, buttons all themed. Pay special attention to first impression — onboarding should look polished in both themes. Test TDEE reveal animation in both themes.
Depends on: Checkpoint 3
Parallel: can start after checkpoint 3
Test: Manual test — complete full onboarding in both themes
Rollback: Revert to hardcoded colors
Risk: 🟡 Medium — first user experience
Time: L (3-4 hrs)
PR: Include in PR #5

Step 20: Fix chart colors for both themes
Files: app/components/analytics/*.tsx (M) — all chart components
Details: Create separate chart color palettes for light and dark themes. Light mode: use darker, more saturated colors (better contrast on white). Dark mode: use lighter, less saturated colors (better contrast on dark). Update all VictoryChart, VictoryLine, VictoryBar components. Test all chart types (line, bar, pie) in both themes.
Depends on: Step 13
Parallel: can run alongside Step 19
Test: Visual test — render all chart types with real data in both themes
Rollback: Revert to single chart palette
Risk: 🟡 Medium — charts are complex
Time: L (2-3 hrs)
PR: Include in PR #5

Step 21: Fix image overlays and text on images
Files: app/components/*/*.tsx (M) — components with images (profile avatar, progress photos, etc.)
Details: Ensure text overlays on images have proper contrast in both themes. Add semi-transparent backgrounds behind text if needed (light: 'rgba(255,255,255,0.9)', dark: 'rgba(0,0,0,0.7)'). Test profile avatar, progress photos, any hero images.
Depends on: Checkpoint 3
Parallel: can run alongside Steps 19-20
Test: Visual test — view images with text overlays in both themes
Rollback: Revert to single overlay style
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #5

Step 22: Adjust shadows and elevation
Files: app/theme/shadows.ts (C or M)
Details: Create theme-aware shadow styles. Light mode: use shadows (shadowColor='rgba(0,0,0,0.1)', shadowOffset, shadowRadius). Dark mode: use subtle borders or glows (borderColor with low opacity, or shadowColor='rgba(255,255,255,0.05)'). Export getShadowStyle(elevation, theme) function. Apply to all elevated components (cards, modals, floating buttons).
Depends on: Step 3
Parallel: can run alongside Steps 19-21
Test: Visual test — view elevated components in both themes
Rollback: Revert to single shadow style
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #5

Step 23: Update skeleton loaders
Files: app/components/common/Skeleton.tsx (M)
Details: Adjust skeleton loader colors for both themes. Light mode: bg='#F1F5F9', shimmer='#E2E8F0'. Dark mode: bg='#1E293B', shimmer='#334155'. Ensure shimmer animation visible in both themes.
Depends on: Step 3
Parallel: can run alongside Steps 19-22
Test: Component test — render skeleton in both themes, verify shimmer visible
Rollback: Revert to single skeleton style
Risk: 🟢 Low
Time: S (<30 min)
PR: Include in PR #5

🚦 CHECKPOINT 4: All screens and edge cases handled
Run:
  - Complete full onboarding in light mode
  - Navigate through entire app in light mode
  - Test all charts, images, shadows, skeletons
  - Switch to dark mode, verify all still works
  - Test theme switching mid-session (no crashes)
Verify: Entire app works flawlessly in both themes. No visual bugs. No crashes.
Gate: Feature is complete. Ready for testing and polish.

═══════════════════════════════════════════════
PHASE 5: TESTING & POLISH
═══════════════════════════════════════════════

Step 24: Accessibility contrast audit
Files: N/A (audit process)
Details: Use accessibility tools (Xcode Accessibility Inspector, Android Accessibility Scanner) to verify contrast ratios. Check all text against backgrounds: normal text ≥4.5:1, large text ≥3:1, interactive elements ≥3:1. Document any failures. Fix by adjusting colors in lightColors.ts or darkColors.ts.
Depends on: Checkpoint 4
Parallel: sequential
Test: Run accessibility scanner on all screens in both themes
Rollback: N/A (audit only)
Risk: 🟡 Medium — may reveal many issues
Time: L (2-3 hrs)
PR: Fixes included in PR #5

Step 25: Visual regression testing
Files: app/__tests__/visual/*.test.tsx (C)
Details: Create screenshot tests for key screens in both themes. Use @testing-library/react-native with snapshot testing. Capture: Dashboard, Logs, Analytics, Profile, ActiveWorkout, Onboarding step 1. Store baseline screenshots. Run tests to detect regressions.
Depends on: Checkpoint 4
Parallel: can run alongside Step 24
Test: Run `npm test -- visual` — verify all snapshots match
Rollback: N/A (tests don't affect functionality)
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #5

Step 26: Performance testing
Files: N/A (performance testing)
Details: Test theme switching performance. Measure time from toggle to full UI update (target: <100ms). Use React DevTools Profiler to identify slow components. Optimize if needed (memoization, useMemo for color calculations). Test on low-end devices (iPhone SE, budget Android).
Depends on: Checkpoint 4
Parallel: can run alongside Steps 24-25
Test: Manual test — toggle theme 10 times, measure average time
Rollback: N/A (testing only)
Risk: 🟢 Low
Time: M (60-90 min)
PR: Optimizations included in PR #5 if needed

Step 27: User testing
Files: N/A (user testing)
Details: Deploy to TestFlight/internal testing. Get 10-20 users to test light mode. Collect feedback: readability, aesthetics, any visual bugs. Iterate on colors if needed. Focus on outdoor readability (light mode should work in bright sunlight).
Depends on: Checkpoint 4
Parallel: can run alongside Steps 24-26
Test: User feedback survey
Rollback: N/A (testing only)
Risk: 🟢 Low
Time: L (2-3 days for feedback collection)
PR: Fixes based on feedback in follow-up PR

🚦 CHECKPOINT 5: Testing complete
Verify:
  - All contrast ratios meet WCAG AA
  - Visual regression tests pass
  - Theme switching <100ms
  - User feedback positive (>80% satisfied)
Gate: Feature is production-ready. Ready for deployment.

═══════════════════════════════════════════════
PHASE 6: DEPLOYMENT
═══════════════════════════════════════════════

Step 28: Enable feature flag in staging
Files: Database (staging)
Details: Update feature flag: `UPDATE feature_flags SET enabled = true WHERE name = 'light_mode'` (if using feature flag). Or deploy directly since it's a UI-only change with no backend dependencies.
Depends on: Checkpoint 5
Parallel: sequential
Test: Open staging app, toggle theme, verify works
Rollback: Set enabled = false
Risk: 🟢 Low — staging only
Time: S (<15 min)
PR: N/A

Step 29: Monitor staging metrics
Files: N/A (observability)
Details: Monitor for 24-48 hours: (1) Theme toggle rate (how many users try it), (2) Theme preference distribution (dark vs light), (3) Crash rate (target: <0.1%), (4) Performance metrics (theme switch time). Check Sentry for errors.
Depends on: Step 28
Parallel: sequential
Test: Query analytics for theme-related events
Rollback: N/A (monitoring)
Risk: 🟢 Low
Time: M (24-48 hrs monitoring)
PR: N/A

Step 30: Production deployment
Files: N/A (deployment)
Details: Deploy to production via standard release process. No feature flag needed (UI-only change, no risk). Announce via in-app notification: "New: Light Mode! Switch between dark and light themes in Settings."
Depends on: Step 29
Parallel: sequential
Test: Verify theme toggle works in production
Rollback: Revert deployment if critical issues
Risk: 🟢 Low — well-tested, UI-only
Time: S (<30 min)
PR: N/A

Step 31: Monitor production metrics
Files: N/A (observability)
Details: Monitor for 7 days: (1) Light mode adoption rate (target: 20-30%), (2) Theme switch frequency, (3) Crash rate, (4) User feedback. Track events: theme_toggled, theme_preference_set.
Depends on: Step 30
Parallel: sequential
Test: Query analytics for adoption metrics
Rollback: N/A (monitoring)
Risk: 🟢 Low
Time: L (7 days monitoring)
PR: N/A

🚦 FINAL CHECKPOINT: Feature shipped
Verify:
  - 20-30% users adopt light mode
  - <0.1% crash rate
  - Positive user feedback
  - No visual bugs reported
Success: Light mode is live and successful.

═══════════════════════════════════════════════
ROLLBACK PLAN
═══════════════════════════════════════════════

If critical issues detected:
1. Revert deployment (git revert + redeploy)
2. Investigate root cause
3. Fix and re-test in staging
4. Re-deploy

Low risk since it's UI-only with no backend dependencies.

═══════════════════════════════════════════════
METRICS & SUCCESS TRACKING
═══════════════════════════════════════════════

Track these events:
- theme_toggled (user_id, from_theme, to_theme, timestamp)
- theme_preference_set (user_id, theme, timestamp)
- theme_switch_time (duration_ms)

Success metrics (30 days post-launch):
- 20-30% users adopt light mode
- <0.1% crash rate
- <100ms theme switch time
- >80% positive sentiment in feedback
- Zero WCAG AA contrast violations

═══════════════════════════════════════════════
TOTAL EFFORT: 32 hours
- Infrastructure: 4 hours
- Core components: 4 hours
- Main screens: 8 hours
- Training screens: 6 hours
- Onboarding & edge cases: 6 hours
- Testing & polish: 4 hours
═══════════════════════════════════════════════
