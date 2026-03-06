# Feature 8: Free Trial — Detailed Implementation Plan

═══════════════════════════════════════════════
FEATURE 8: FREE TRIAL
Total Effort: 64 hours (8 days)
Dependencies: Stripe/RevenueCat integration
Risk Level: 🟡 Medium (payment flow changes)
═══════════════════════════════════════════════

## OVERVIEW

Offer 7-day free trial of premium features. No credit card required. Auto-downgrade to free tier after trial. Conversion prompt with trial insights showing value delivered during trial.

## SUCCESS CRITERIA

- 15-20% trial-to-paid conversion rate
- Zero payment failures during trial (no charges)
- Zero accidental charges during trial
- 80%+ eligible users activate trial (vs. skipping to free tier)
- Trial insights are compelling (show value: workouts logged, PRs hit, etc.)
- Smooth downgrade experience (no data loss, no confusion)

═══════════════════════════════════════════════
PHASE 0: BUSINESS LOGIC DEFINITION
═══════════════════════════════════════════════

Step 1: Define trial eligibility rules
Files: docs/free-trial-spec.md (C)
Details: Document eligibility: (1) New users only (never subscribed before), (2) One trial per user (tracked via has_used_trial flag), (3) Trial available immediately after signup, (4) Trial can be activated anytime (no expiration), (5) Users who previously paid cannot use trial. Document edge cases: (1) User signs up, doesn't activate trial, deletes account, signs up again → still eligible (track by email/device), (2) User activates trial, cancels immediately → trial continues for 7 days.
Depends on: none
Parallel: sequential
Test: Review with product team
Rollback: N/A (documentation)
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #9 (Free Trial)

Step 2: Define trial duration and features
Files: docs/free-trial-spec.md (M)
Details: Document: (1) Duration: 7 days from activation, (2) Features: all premium features unlocked (WNS algorithm, advanced analytics, unlimited workouts, nutrition tracking, body measurements, data export), (3) Post-trial: auto-downgrade to free tier (limited features), (4) No credit card required upfront, (5) User can upgrade to paid anytime during trial (trial ends immediately, paid subscription starts).
Depends on: Step 1
Parallel: sequential
Test: Review with product team
Rollback: N/A (documentation)
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #9

Step 3: Define conversion incentives
Files: docs/free-trial-spec.md (M)
Details: Document trial insights to show at end: (1) Workouts logged during trial, (2) PRs hit during trial, (3) Total volume lifted, (4) Meals logged, (5) Measurements tracked, (6) Personalized message: "You logged 12 workouts and hit 3 PRs during your trial. Keep your momentum going with Repwise Premium!" Design conversion prompt with insights, pricing, and CTA.
Depends on: Step 2
Parallel: sequential
Test: Review with product/marketing team
Rollback: N/A (documentation)
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #9

🚦 CHECKPOINT 0: Business logic defined
Verify: Eligibility rules clear. Duration and features defined. Conversion strategy documented.

═══════════════════════════════════════════════
PHASE 1: DATABASE SCHEMA
═══════════════════════════════════════════════

Step 4: Add trial fields to users table
Files: alembic/versions/20260307_add_trial_fields.py (C)
Details: Create migration. Upgrade: ALTER TABLE users ADD COLUMN has_used_trial BOOLEAN DEFAULT FALSE, ADD COLUMN trial_started_at TIMESTAMPTZ, ADD COLUMN trial_ends_at TIMESTAMPTZ; CREATE INDEX idx_users_trial_ends ON users(trial_ends_at) WHERE trial_ends_at IS NOT NULL. Downgrade: ALTER TABLE users DROP COLUMN has_used_trial, DROP COLUMN trial_started_at, DROP COLUMN trial_ends_at.
Depends on: Step 3
Parallel: can start after checkpoint 0
Test: `alembic check` — no errors
Rollback: Delete migration
Risk: 🟢 Low — additive columns
Time: M (30-45 min)
PR: Include in PR #9

Step 5: Add is_trial field to subscriptions table
Files: alembic/versions/20260307_add_trial_to_subscriptions.py (C)
Details: Create migration. Upgrade: ALTER TABLE subscriptions ADD COLUMN is_trial BOOLEAN DEFAULT FALSE; CREATE INDEX idx_subscriptions_trial ON subscriptions(is_trial) WHERE is_trial = TRUE. Downgrade: ALTER TABLE subscriptions DROP COLUMN is_trial.
Depends on: Step 4
Parallel: sequential
Test: `alembic check` — no errors
Rollback: Delete migration
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #9

Step 6: Apply migrations
Files: N/A (database operation)
Details: Run `alembic upgrade head`. Verify columns added.
Depends on: Steps 4-5
Parallel: sequential
Test: `\d users`, `\d subscriptions` — verify new columns
Rollback: `alembic downgrade -2`
Risk: 🟢 Low — dev only
Time: S (<15 min)
PR: N/A

🚦 CHECKPOINT 1: Database schema ready
Verify: Trial fields exist in users and subscriptions tables.

═══════════════════════════════════════════════
PHASE 2: BACKEND — TRIAL SERVICE
═══════════════════════════════════════════════

Step 7: Create TrialService class
Files: src/modules/trial/service.py (C)
Details: Create TrialService with methods: check_eligibility(user_id) → bool, start_trial(user_id) → Subscription, get_trial_status(user_id) → {is_active, days_remaining, ends_at}, get_trial_insights(user_id) → {workouts_logged, prs_hit, total_volume, meals_logged, measurements_tracked}, end_trial(user_id) → None. Implement check_eligibility: (1) query user.has_used_trial, (2) if True, return False, (3) if False, return True. Implement start_trial: (1) check eligibility, (2) create subscription with is_trial=True, tier='premium', (3) set user.trial_started_at=NOW(), trial_ends_at=NOW()+7 days, has_used_trial=True, (4) return subscription.
Depends on: Step 6
Parallel: can start after checkpoint 1
Test: Unit tests for each method
Rollback: Delete file
Risk: 🟢 Low — service layer
Time: L (2-3 hrs)
PR: Include in PR #9

Step 8: Implement trial insights calculation
Files: src/modules/trial/service.py (M)
Details: Implement get_trial_insights(user_id): (1) Query training_sessions WHERE user_id = ? AND session_date BETWEEN trial_started_at AND trial_ends_at, count workouts, (2) Query personal_records WHERE user_id = ? AND achieved_at BETWEEN trial_started_at AND trial_ends_at, count PRs, (3) Calculate total volume: SUM(sets * reps * weight) for trial period, (4) Query nutrition_logs WHERE user_id = ? AND log_date BETWEEN trial_started_at AND trial_ends_at, count meals, (5) Query body_measurements WHERE user_id = ? AND measured_at BETWEEN trial_started_at AND trial_ends_at, count measurements, (6) Return insights object.
Depends on: Step 7
Parallel: sequential
Test: Integration test — create trial user with activity, verify insights correct
Rollback: Remove method
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #9

Step 9: Implement trial expiration job
Files: src/jobs/trial_expiration.py (C)
Details: Create cron job that runs hourly: (1) Query users WHERE trial_ends_at < NOW() AND trial_ends_at IS NOT NULL, (2) For each user: (a) end trial (update subscription to free tier or delete if no paid subscription), (b) send notification: "Your trial has ended. Upgrade to keep using premium features.", (c) set trial_ends_at=NULL. Use existing job scheduler (APScheduler, Railway cron, etc.).
Depends on: Step 7
Parallel: can run alongside Step 8
Test: Create trial user with trial_ends_at in past, run job, verify downgraded
Rollback: Delete file
Risk: 🟡 Medium — affects user access
Time: L (2-3 hrs)
PR: Include in PR #9

Step 10: Modify subscription service to support trials
Files: src/modules/payments/service.py (M)
Details: Modify create_subscription() to accept is_trial parameter. If is_trial=True: (1) skip payment processing (no Stripe/RevenueCat call), (2) create subscription with is_trial=True, tier='premium', status='active', (3) set trial fields on user, (4) return subscription. Modify check_subscription_status() to handle trials: if is_trial=True and trial_ends_at > NOW(), return 'active', else return 'expired'.
Depends on: Steps 5, 7
Parallel: can run alongside Steps 8-9
Test: Unit test — create trial subscription, verify no payment call
Rollback: Revert changes
Risk: 🟡 Medium — affects payment flow
Time: L (2-3 hrs)
PR: Include in PR #9

🚦 CHECKPOINT 2: Backend trial logic complete
Run:
  - Call start_trial for test user
  - Verify subscription created with is_trial=True
  - Verify user has premium access
  - Verify no payment processed
  - Run expiration job, verify trial ends
Verify: Trial activation and expiration work correctly.

═══════════════════════════════════════════════
PHASE 3: BACKEND — API ENDPOINTS
═══════════════════════════════════════════════

Step 11: Create trial router
Files: src/modules/trial/router.py (C)
Details: Create FastAPI router with endpoints: GET /trial/eligibility (calls service.check_eligibility, returns {eligible: bool, reason: string}), POST /trial/start (calls service.start_trial, returns subscription), GET /trial/status (calls service.get_trial_status, returns {is_active, days_remaining, ends_at}), GET /trial/insights (calls service.get_trial_insights, returns insights object). All require authentication.
Depends on: Steps 7-8
Parallel: can start after checkpoint 2
Test: Integration tests for each endpoint
Rollback: Delete file
Risk: 🟢 Low — standard REST API
Time: M (60-90 min)
PR: Include in PR #9

Step 12: Register trial router
Files: src/main.py (M)
Details: Add import and include_router for trial router. Prefix: /api/v1/trial.
Depends on: Step 11
Parallel: sequential
Test: Run app, check /docs, verify endpoints listed
Rollback: Remove router registration
Risk: 🟢 Low
Time: S (<15 min)
PR: Include in PR #9

🚦 CHECKPOINT 3: Backend API complete
Run:
  - `curl /api/v1/trial/eligibility` — verify returns eligible=true for new user
  - `curl -X POST /api/v1/trial/start` — verify starts trial
  - `curl /api/v1/trial/status` — verify returns trial status
  - `curl /api/v1/trial/insights` — verify returns insights
Verify: All endpoints work correctly.

═══════════════════════════════════════════════
PHASE 4: FRONTEND — TRIAL ACTIVATION
═══════════════════════════════════════════════

Step 13: Create TrialBadge component
Files: app/components/premium/TrialBadge.tsx (C)
Details: Create badge component shown in app header during trial. Props: {daysRemaining: number, onPress: () => void}. Layout: Pill shape, gradient background (brand colors), text: "Trial: X days left", icon (clock or star). Position: top right of header (or below header). Animate entrance (slide down). On press, navigate to upgrade screen.
Depends on: none
Parallel: can start early
Test: Component test — render with various days remaining
Rollback: Delete file
Risk: 🟢 Low — pure UI component
Time: M (60-90 min)
PR: Include in PR #9

Step 14: Create TrialCountdown component
Files: app/components/premium/TrialCountdown.tsx (C)
Details: Create component showing detailed countdown. Props: {endsAt: Date}. Layout: Large text: "X days, Y hours left in your trial", progress bar showing time elapsed, "Upgrade Now" button. Use in upgrade modal or dedicated trial screen.
Depends on: none
Parallel: can run alongside Step 13
Test: Component test — render with various end dates, verify countdown updates
Rollback: Delete file
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #9

Step 15: Modify UpgradeModal to show trial CTA
Files: app/components/premium/UpgradeModal.tsx (M)
Details: Add trial eligibility check on mount. If eligible, show "Start 7-Day Free Trial" button (primary CTA) instead of "Upgrade to Premium". Add secondary button: "See Pricing" (shows paid plans). If not eligible, show standard upgrade flow. On "Start Trial" press: (1) call POST /trial/start, (2) show success message: "Trial activated! Enjoy 7 days of premium features.", (3) close modal, (4) show TrialBadge in header.
Depends on: Steps 11, 13
Parallel: can start after checkpoint 3
Test: Component test — render for eligible user, verify trial CTA shown
Rollback: Revert to standard upgrade flow
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #9

Step 16: Add trial activation flow to onboarding
Files: app/screens/onboarding/OnboardingWizard.tsx (M) OR create new step
Details: Add trial activation prompt at end of onboarding (after summary step). Content: "Start Your Free Trial", "Get 7 days of premium features: unlimited workouts, advanced analytics, personalized coaching, and more.", "Start Trial" button (primary), "Skip for Now" button (secondary). On "Start Trial", call POST /trial/start, show success message, navigate to dashboard with TrialBadge visible. Track conversion rate (onboarding → trial activation).
Depends on: Steps 11, 13
Parallel: can run alongside Step 15
Test: Integration test — complete onboarding, verify trial prompt appears
Rollback: Remove trial prompt
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #9

Step 17: Show TrialBadge in app header
Files: app/navigation/BottomTabNavigator.tsx (M) OR app/App.tsx (M)
Details: Add TrialBadge to app header if user has active trial. Fetch trial status on app mount via GET /trial/status. If is_active=true, render TrialBadge with days_remaining. Update daily (or on app foreground). On press, navigate to upgrade screen with trial insights.
Depends on: Steps 11, 13
Parallel: can run alongside Steps 15-16
Test: Manual test — activate trial, verify badge appears, verify updates daily
Rollback: Remove badge
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #9

🚦 CHECKPOINT 4: Trial activation flow complete
Run:
  - Complete onboarding as new user
  - Verify trial prompt appears
  - Activate trial
  - Verify TrialBadge appears in header
  - Verify premium features unlocked
Verify: Trial activation is smooth and intuitive.

═══════════════════════════════════════════════
PHASE 5: FRONTEND — TRIAL EXPIRATION & CONVERSION
═══════════════════════════════════════════════

Step 18: Create TrialExpirationModal component
Files: app/components/premium/TrialExpirationModal.tsx (C)
Details: Create modal shown when trial expires. Props: {insights: TrialInsights, onUpgrade: () => void, onContinueFree: () => void}. Layout: (1) Header: "Your Trial Has Ended", (2) Insights section: "During your trial, you: • Logged X workouts • Hit X PRs • Lifted X kg total • Logged X meals • Tracked X measurements", (3) Value prop: "Keep your momentum going with Repwise Premium", (4) Pricing (monthly/annual options), (5) "Upgrade Now" button (primary), (6) "Continue with Free" button (secondary, subtle). Use compelling copy and visuals.
Depends on: Step 8 (insights)
Parallel: can start after checkpoint 2
Test: Component test — render with sample insights, verify layout correct
Rollback: Delete file
Risk: 🟢 Low
Time: L (3-4 hrs)
PR: Include in PR #9

Step 19: Show TrialExpirationModal on day 7
Files: app/App.tsx (M) OR app/screens/dashboard/DashboardScreen.tsx (M)
Details: Check trial status on app mount. If trial expired today (trial_ends_at is today), show TrialExpirationModal. Fetch insights via GET /trial/insights. On "Upgrade Now", navigate to payment flow. On "Continue with Free", dismiss modal, downgrade to free tier (backend handles this via expiration job). Show modal only once per expiration (store in AsyncStorage: 'trial_expiration_modal_shown_{user_id}').
Depends on: Steps 11, 18
Parallel: sequential
Test: Manual test — set trial_ends_at to today, open app, verify modal appears
Rollback: Remove modal trigger
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #9

Step 20: Add trial reminder notifications
Files: src/modules/trial/service.py (M)
Details: Send push notifications during trial: (1) Day 3: "You're halfway through your trial! Keep logging workouts to see your progress.", (2) Day 6: "Your trial ends tomorrow. Upgrade to keep using premium features.", (3) Day 7 (expiration): "Your trial has ended. Upgrade to continue." Use existing push notification service. Schedule via cron or trigger from expiration job.
Depends on: Step 7, Feature 1 (push notifications)
Parallel: can run alongside Steps 18-19
Test: Create trial user, advance time, verify notifications sent
Rollback: Remove notifications
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #9

Step 21: Handle trial-to-paid upgrade
Files: app/components/premium/UpgradeModal.tsx (M), src/modules/payments/service.py (M)
Details: When trial user upgrades to paid: (1) End trial immediately (set trial_ends_at=NOW()), (2) Create paid subscription (call Stripe/RevenueCat), (3) Update subscription: is_trial=False, tier='premium', status='active', (4) Show success message: "Welcome to Repwise Premium! Your trial has been converted to a paid subscription.", (5) Remove TrialBadge, show premium badge instead. Ensure no double-charging (trial is free, paid starts immediately).
Depends on: Steps 10, 15
Parallel: can run alongside Steps 18-20
Test: Integration test — activate trial, upgrade to paid, verify trial ends and paid starts
Rollback: Revert upgrade logic
Risk: 🟡 Medium — payment flow
Time: L (2-3 hrs)
PR: Include in PR #9

🚦 CHECKPOINT 5: Trial expiration and conversion complete
Run:
  - Activate trial
  - Advance time to day 7 (or set trial_ends_at to today)
  - Open app, verify expiration modal appears with insights
  - Tap "Upgrade Now", complete payment, verify trial ends and paid starts
  - Verify no charges during trial
Verify: Expiration flow is smooth. Conversion is compelling. No payment errors.

═══════════════════════════════════════════════
PHASE 6: TESTING & EDGE CASES
═══════════════════════════════════════════════

Step 22: Test trial eligibility edge cases
Files: N/A (testing)
Details: Test: (1) User activates trial, cancels immediately → trial continues for 7 days, (2) User activates trial, upgrades on day 3 → trial ends, paid starts, (3) User activates trial, lets it expire → downgraded to free, (4) User tries to activate trial twice → second attempt fails, (5) User deletes account during trial, signs up again → still not eligible (has_used_trial=True persists). Document behavior.
Depends on: Checkpoint 5
Parallel: can start after checkpoint 5
Test: Manual testing of edge cases
Rollback: N/A (testing)
Risk: 🟡 Medium — may reveal logic bugs
Time: L (2-3 hrs)
PR: Bug fixes in PR #9 if needed

Step 23: Test payment integration
Files: N/A (testing)
Details: Test with Stripe/RevenueCat test mode: (1) Activate trial → verify no charge, (2) Upgrade during trial → verify charge correct (monthly or annual), (3) Let trial expire, then upgrade → verify charge correct, (4) Test failed payment → verify user stays on free tier, (5) Test refund → verify subscription cancelled. Use Stripe test cards.
Depends on: Step 21
Parallel: can run alongside Step 22
Test: Manual testing with test payment methods
Rollback: N/A (testing)
Risk: 🔴 High — payment errors can lose revenue
Time: L (3-4 hrs)
PR: Payment fixes in PR #9 if needed

Step 24: Test downgrade experience
Files: N/A (testing)
Details: Test free tier after trial expires: (1) Verify premium features locked (WNS, advanced analytics, etc.), (2) Verify basic features still work (workout logging, basic nutrition), (3) Verify no data loss (all workouts/meals preserved), (4) Verify upgrade prompts appear when accessing premium features, (5) Verify user can re-upgrade anytime. Ensure smooth experience (no confusion, no errors).
Depends on: Step 19
Parallel: can run alongside Steps 22-23
Test: Manual testing of downgrade flow
Rollback: N/A (testing)
Risk: 🟡 Medium — bad downgrade experience hurts retention
Time: L (2-3 hrs)
PR: UX improvements in PR #9 if needed

Step 25: A/B test trial duration
Files: src/modules/trial/service.py (M)
Details: Implement A/B test for trial duration: 7 days vs 14 days. Randomly assign users to cohorts (50/50 split). Track conversion rates for each cohort. Use feature flag or experiment framework. Run for 30 days, analyze results, choose winning duration.
Depends on: Step 7
Parallel: can run alongside Steps 22-24
Test: Activate trials for test users, verify assigned to cohorts
Rollback: Remove A/B test, use fixed 7-day duration
Risk: 🟢 Low — A/B test is optional optimization
Time: L (2-3 hrs)
PR: Include in PR #9 or follow-up PR

Step 26: Write comprehensive tests
Files: tests/test_trial_service.py (C), app/__tests__/components/TrialBadge.test.tsx (C), app/__tests__/components/TrialExpirationModal.test.tsx (C)
Details: Write tests: (1) Trial eligibility checks, (2) Trial activation, (3) Trial expiration, (4) Trial insights calculation, (5) Trial-to-paid upgrade, (6) TrialBadge rendering, (7) TrialExpirationModal rendering, (8) Edge cases. Aim for 90%+ coverage.
Depends on: Steps 7-21
Parallel: can write alongside implementation
Test: Run `pytest tests/test_trial_service.py -v` and `npm test -- Trial`
Rollback: N/A (tests)
Risk: 🟢 Low
Time: L (4-5 hrs)
PR: Include in PR #9

🚦 CHECKPOINT 6: Testing complete
Verify:
  - All edge cases handled
  - Payment integration works (no charges during trial)
  - Downgrade experience is smooth
  - A/B test running (optional)
  - All tests pass
Gate: Feature is production-ready.

═══════════════════════════════════════════════
PHASE 7: DEPLOYMENT & OPTIMIZATION
═══════════════════════════════════════════════

Step 27: Deploy to staging
Files: N/A (deployment)
Details: Deploy backend and frontend to staging. Start trial expiration job. Test full flow: activation, usage, expiration, conversion.
Depends on: Checkpoint 6
Parallel: sequential
Test: Complete trial flow in staging
Rollback: Revert deployment
Risk: 🟢 Low — staging only
Time: M (30-45 min)
PR: N/A

Step 28: Monitor staging metrics
Files: N/A (observability)
Details: Monitor for 48 hours: (1) Trial activation rate (target: 80%+ of eligible users), (2) Trial-to-paid conversion rate (target: 15-20%), (3) Trial completion rate (users who use trial for full 7 days), (4) Crash rate, (5) Payment errors. Check Sentry for errors.
Depends on: Step 27
Parallel: sequential
Test: Query analytics
Rollback: N/A (monitoring)
Risk: 🟢 Low
Time: L (48 hrs)
PR: N/A

Step 29: Production deployment
Files: N/A (deployment)
Details: Deploy to production. Enable for all new users (no feature flag needed — core monetization feature). Announce via: (1) Update app store description: "Try premium free for 7 days", (2) In-app notification for existing free users: "New: Try premium features free for 7 days!", (3) Social media post, (4) Email to free users.
Depends on: Step 28
Parallel: sequential
Test: Sign up as new user, verify trial offered
Rollback: Revert deployment if critical issues
Risk: 🟡 Medium — affects monetization
Time: M (30-45 min)
PR: N/A

Step 30: Monitor production metrics
Files: N/A (observability)
Details: Monitor for 30 days: (1) Trial activation rate, (2) Trial-to-paid conversion rate (target: 15-20%), (3) Revenue impact, (4) User feedback, (5) Support tickets related to trial. Track events: trial_activated, trial_expired, trial_converted, trial_insights_viewed.
Depends on: Step 29
Parallel: sequential
Test: Query analytics daily
Rollback: N/A (monitoring)
Risk: 🟢 Low
Time: L (30 days)
PR: N/A

Step 31: Optimize conversion based on data
Files: Various (based on findings)
Details: After 30 days, analyze data: (1) Which insights correlate with conversion? (2) What's the optimal trial duration? (3) When do users convert (day 3, day 6, after expiration)? (4) What messaging works best? Iterate on: (1) Trial duration (if A/B test shows 14 days better), (2) Insights shown in expiration modal, (3) Reminder notification timing, (4) Pricing display. Implement improvements in follow-up PR.
Depends on: Step 30
Parallel: sequential
Test: A/B test improvements
Rollback: Revert to original implementation
Risk: 🟢 Low — optimization is iterative
Time: L (varies, ongoing)
PR: Follow-up PRs

🚦 FINAL CHECKPOINT: Feature shipped and optimized
Verify:
  - 15-20% trial-to-paid conversion rate
  - 80%+ trial activation rate
  - Zero payment errors
  - Positive user feedback
  - Revenue impact positive
Success: Free trial is live and driving conversions.

═══════════════════════════════════════════════
ROLLBACK PLAN
═══════════════════════════════════════════════

If critical issues:
1. Disable trial activation (return 503 on POST /trial/start)
2. Let existing trials complete normally
3. Investigate and fix
4. Re-enable trial activation

If conversion rate <10%:
1. Analyze user feedback and data
2. Iterate on messaging and insights
3. Test improvements in staging
4. Re-deploy

═══════════════════════════════════════════════
METRICS & SUCCESS TRACKING
═══════════════════════════════════════════════

Track events:
- trial_offered (user_id, timestamp)
- trial_activated (user_id, timestamp)
- trial_expired (user_id, timestamp)
- trial_converted (user_id, plan, price, timestamp)
- trial_insights_viewed (user_id, timestamp)
- trial_reminder_sent (user_id, day, timestamp)

Success metrics (30 days):
- 80%+ eligible users activate trial
- 15-20% trial-to-paid conversion rate
- 70%+ trial users complete full 7 days
- Zero accidental charges during trial
- <1% payment errors
- Positive revenue impact (trial conversions > lost direct upgrades)

Conversion funnel:
1. Eligible users (100%)
2. Trial offered (100%)
3. Trial activated (target: 80%)
4. Trial completed (target: 70%)
5. Trial converted to paid (target: 15-20%)

═══════════════════════════════════════════════
TOTAL EFFORT: 64 hours
- Business logic: 3 hours
- Database: 2 hours
- Backend trial service: 10 hours
- Backend API: 3 hours
- Frontend activation: 10 hours
- Frontend expiration & conversion: 12 hours
- Testing & edge cases: 16 hours
- Deployment & optimization: 8 hours
═══════════════════════════════════════════════
