# Repwise Features Implementation — Master Index

## Overview

This directory contains detailed SDE3-level implementation plans for 8 major features. Each plan includes prerequisites, database migrations, backend API, frontend components, testing, deployment, rollback plans, and success metrics.

**Total Effort:** 327 hours (~41 days solo, ~20 days with 2 engineers)

## Implementation Order

**Week 1-2: Foundation**
1. Push Notifications (enables engagement)
2. Light Mode (parallel — no dependencies)

**Week 3-4: Core Features**
3. Volume Landmarks (leverages WNS data)
4. WNS Feedback (builds on Volume Landmarks)

**Week 5-6: User Value**
5. Body Measurements (standalone)
6. Social Sharing (standalone)

**Week 7-8: Business Features**
7. Free Trial (monetization)
8. Data Export (compliance)

## Feature Plans

### Feature 1: Push Notifications
**File:** `feature-1-detailed-plan.md`  
**Effort:** 24 hours (3 days)  
**Steps:** 24 steps, 4 checkpoints  
**Risk:** 🟢 Low  
**Dependencies:** expo-notifications, httpx  
**Success Criteria:** 80%+ grant permission, 40%+ open rate

**Key Phases:**
- Phase 0: Prerequisites (dependencies, feature flag)
- Phase 1: Database migrations (device_tokens, notification_preferences, notification_log)
- Phase 2: Backend API (PushNotificationService, models, schemas, router)
- Phase 3: Frontend (notification service, permissions, settings screen)
- Phase 4: Notification triggers (PR celebrations, check-ins, volume warnings, workout reminders)

---

### Feature 2: Volume Landmarks Visualization
**File:** `feature-2-volume-landmarks-detailed-plan.md`  
**Effort:** 28 hours (3.5 days)  
**Steps:** 20 steps, 4 checkpoints  
**Risk:** 🟢 Low  
**Dependencies:** victory-native  
**Success Criteria:** 60%+ view landmarks weekly

**Key Phases:**
- Phase 0: Prerequisites (victory-native, verify WNS endpoint)
- Phase 1: Backend enhancements (trend data, landmark descriptions)
- Phase 2: Frontend components (VolumeBar, VolumeTrendChart, LandmarkExplainer, VolumeLandmarksCard)
- Phase 3: Analytics screen integration (Volume tab, dashboard link)
- Phase 4: Polish (animations, onboarding, weekly report)

---

### Feature 3: Body Measurements Tracking
**Files:** `feature-3-body-measurements-part1.md`, `feature-3-body-measurements-part2.md`  
**Effort:** 39 hours (5 days)  
**Steps:** 20+ steps across 2 files  
**Risk:** 🟢 Low  
**Dependencies:** expo-image-picker, expo-file-system  
**Success Criteria:** 30%+ log measurements, Navy BF% accurate within ±3.5%

**Key Phases:**
- Phase 0: Prerequisites (image picker, permissions)
- Phase 1: Database schema (body_measurements, progress_photos tables)
- Phase 2: Backend API (models, schemas, Navy BF calculator, service, router)
- Phase 3: Adaptive engine integration (use latest BF% for TDEE, weight trend for adjustments)
- Phase 4: Frontend components (MeasurementInput, NavyBFCalculator, MeasurementTrendChart, ProgressPhotoGrid)
- Phase 5: Screen integration (measurements screen, profile link)

---

### Feature 4: Light Mode
**File:** `feature-4-light-mode-detailed-plan.md`  
**Effort:** 32 hours (4 days)  
**Steps:** 31 steps, 6 checkpoints  
**Risk:** 🟡 Medium (touches all components)  
**Dependencies:** None  
**Success Criteria:** 20-30% adoption, WCAG AA contrast compliance

**Key Phases:**
- Phase 0: Theme infrastructure (lightColors, useThemeStore, useThemeColors, StatusBar, theme toggle)
- Phase 1: Core components (Button, Card, Input, Modal, TabBar)
- Phase 2: Main screens (Dashboard, Logs, Analytics, Profile, Nutrition)
- Phase 3: Training screens (ActiveWorkout, SessionDetail, PlanEditor)
- Phase 4: Onboarding & edge cases (onboarding flow, charts, image overlays, shadows, skeletons)
- Phase 5: Testing (accessibility audit, visual regression, performance)

---

### Feature 5: Social Sharing (Phase 1)
**File:** `feature-5-social-sharing-detailed-plan.md`  
**Effort:** 28 hours (3.5 days)  
**Steps:** 26 steps, 6 checkpoints  
**Risk:** 🟢 Low (no social feed)  
**Dependencies:** react-native-view-shot, expo-sharing  
**Success Criteria:** 10%+ share workouts, 5% conversion from shared links

**Key Phases:**
- Phase 0: Prerequisites (view-shot, expo-sharing)
- Phase 1: Workout share card (WorkoutShareCard component, customization)
- Phase 2: Share flow (share service, share button, PR prompt, permissions)
- Phase 3: Backend support (shareable links, Open Graph meta tags)
- Phase 4: Viral growth (attribution, QR code, referral tracking, analytics)
- Phase 5: Testing (image quality, performance, platform compatibility)

---

### Feature 6: In-Workout WNS Feedback
**File:** `feature-6-wns-feedback-detailed-plan.md`  
**Effort:** 32 hours (4 days)  
**Steps:** 24 steps, 5 checkpoints  
**Risk:** 🟡 Medium (calculator refactor)  
**Dependencies:** Existing wnsCalculator.ts  
**Success Criteria:** 50%+ view post-workout summary, 70%+ understand HU concept

**Key Phases:**
- Phase 0: WNS calculator refactor (modular functions, validation, muscle group mapping)
- Phase 1: In-workout HU display (HUFloatingPill, real-time calculation, breakdown modal)
- Phase 2: Per-exercise HU (HU badge on ExerciseCard, explainer modal)
- Phase 3: Post-workout summary (WorkoutSummaryModal, recommendations, detailed explainer)
- Phase 4: Testing (calculation accuracy, performance, user comprehension)

---

### Feature 7: Data Export
**File:** `feature-7-data-export-detailed-plan.md`  
**Effort:** 80 hours (10 days)  
**Steps:** 34 steps, 8 checkpoints  
**Risk:** 🟡 Medium (GDPR compliance critical)  
**Dependencies:** puppeteer, papaparse, boto3  
**Success Criteria:** <5% failure rate, 100% GDPR compliance, <5 min for 2 years of data

**Key Phases:**
- Phase 0: Legal & compliance (GDPR Article 20, retention policy, privacy policy)
- Phase 1: Database schema (export_requests table)
- Phase 2: Backend — JSON export (ExportService, serialization, optimization)
- Phase 3: Backend — CSV export (separate CSVs per table, ZIP, README)
- Phase 4: Backend — PDF export (HTML template, puppeteer, charts, optimization)
- Phase 5: Backend — API & jobs (router, background worker, cleanup job)
- Phase 6: Frontend UI (DataExportScreen, request flow, download flow, email notification)
- Phase 7: Security & testing (rate limiting, authentication, audit logging, GDPR verification, load testing)

---

### Feature 8: Free Trial
**File:** `feature-8-free-trial-detailed-plan.md`  
**Effort:** 64 hours (8 days)  
**Steps:** 31 steps, 7 checkpoints  
**Risk:** 🟡 Medium (payment flow changes)  
**Dependencies:** Stripe/RevenueCat  
**Success Criteria:** 15-20% trial-to-paid conversion, 80%+ activation rate

**Key Phases:**
- Phase 0: Business logic (eligibility rules, duration, conversion incentives)
- Phase 1: Database schema (trial fields in users and subscriptions tables)
- Phase 2: Backend — trial service (TrialService, insights calculation, expiration job)
- Phase 3: Backend — API (trial router, endpoints)
- Phase 4: Frontend — activation (TrialBadge, TrialCountdown, UpgradeModal, onboarding prompt)
- Phase 5: Frontend — expiration & conversion (TrialExpirationModal, reminder notifications, trial-to-paid upgrade)
- Phase 6: Testing (edge cases, payment integration, downgrade experience, A/B testing)
- Phase 7: Deployment & optimization (staging, production, monitoring, iteration)

---

## Files Summary

**New Files:** 48 total
- Backend: 18 files (services, routers, models, schemas, migrations, jobs)
- Frontend: 30 files (screens, components, services, hooks, stores)

**Modified Files:** 35 total
- Backend: 8 files (main.py, existing services, config)
- Frontend: 27 files (existing screens, components, navigation, theme)

**New Tests:** 85 total
- Unit: 40 tests
- Integration: 30 tests
- E2E: 15 tests

---

## Risk Assessment

| Feature | Risk Level | Mitigation |
|---------|-----------|------------|
| Push Notifications | 🟢 Low | Well-documented, feature flag |
| Volume Landmarks | 🟢 Low | Uses existing data, additive |
| Body Measurements | 🟢 Low | Standalone feature |
| Light Mode | 🟡 Medium | Touches all components → comprehensive testing |
| Social Sharing | 🟢 Low | Phase 1 only (no social feed) |
| WNS Feedback | 🟡 Medium | Calculator refactor → extensive validation |
| Data Export | 🟡 Medium | GDPR compliance → legal review |
| Free Trial | 🟡 Medium | Payment flow → thorough testing |

---

## Deployment Strategy

**All features behind feature flags for gradual rollout:**
1. Deploy to staging
2. Monitor for 24-48 hours
3. Enable for 10% of production users
4. Monitor for 24 hours
5. Increase to 50%, then 100%
6. Rollback if issues detected

**Rollback plans documented for each feature.**

---

## Success Metrics (30 days post-launch)

| Feature | Key Metric | Target |
|---------|-----------|--------|
| Push Notifications | Permission grant rate | 80%+ |
| Push Notifications | Notification open rate | 40%+ |
| Volume Landmarks | Weekly view rate | 60%+ |
| Body Measurements | User adoption | 30%+ |
| Light Mode | Theme adoption | 20-30% |
| Social Sharing | Share rate | 10%+ |
| Social Sharing | Link conversion | 5% |
| WNS Feedback | Summary view rate | 50%+ |
| WNS Feedback | HU comprehension | 70%+ |
| Data Export | Failure rate | <5% |
| Data Export | GDPR compliance | 100% |
| Free Trial | Activation rate | 80%+ |
| Free Trial | Conversion rate | 15-20% |

---

## Next Steps

1. ✅ Push 8 onboarding/WNS commits to main (DONE)
2. Review and approve feature plans
3. Begin implementation in priority order
4. Deploy features incrementally with monitoring
5. Iterate based on user feedback and metrics

---

**All 8 features planned with Amazon SDE3-level detail. Ready for implementation.**
