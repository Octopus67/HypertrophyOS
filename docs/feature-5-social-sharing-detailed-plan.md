# Feature 5: Social Sharing (Phase 1) — Detailed Implementation Plan

═══════════════════════════════════════════════
FEATURE 5: SOCIAL SHARING (PHASE 1)
Total Effort: 28 hours (3.5 days)
Dependencies: react-native-view-shot, expo-sharing
Risk Level: 🟢 Low (no social feed, just export)
═══════════════════════════════════════════════

## OVERVIEW

Allow users to share workout summaries as branded images to social media. Phase 1: export only (no in-app social feed). Phase 2 (future): social feed, follows, likes, comments.

## SUCCESS CRITERIA

- 10%+ users share at least one workout within 30 days
- 5% conversion from shared links (clicks → signups)
- Shared images look professional (no pixelation, good branding)
- Share flow completes in <3 seconds
- Works on iOS and Android native share sheets
- Referral tracking works (credit referrer when user signs up from shared link)

═══════════════════════════════════════════════
PHASE 0: PREREQUISITES
═══════════════════════════════════════════════

Step 1: Install react-native-view-shot
Files: app/package.json (M)
Details: Run `cd app && npm install react-native-view-shot`. Verify version ≥3.8.0. This library captures React Native views as images. No native linking required (auto-linked).
Depends on: none
Parallel: sequential
Test: `npm list react-native-view-shot` — verify installed
Rollback: `npm uninstall react-native-view-shot`
Risk: 🟢 Low — mature library
Time: S (<15 min)
PR: Include in PR #6 (Social Sharing)

Step 2: Install expo-sharing
Files: app/package.json (M)
Details: Run `cd app && npx expo install expo-sharing`. Verify version ~12.0.0. This provides native share sheet access.
Depends on: none
Parallel: can run alongside Step 1
Test: `npm list expo-sharing` — verify installed
Rollback: `npm uninstall expo-sharing`
Risk: 🟢 Low — standard Expo package
Time: S (<15 min)
PR: Include in PR #6

Step 3: Create feature flag
Files: Database seed script
Details: Insert: `{'name': 'social_sharing', 'enabled': False, 'description': 'Enable workout sharing to social media', 'conditions': {}}`. Default OFF for gradual rollout.
Depends on: none
Parallel: can run alongside Steps 1-2
Test: Query `SELECT * FROM feature_flags WHERE name = 'social_sharing'`
Rollback: Delete row
Risk: 🟢 Low
Time: S (<15 min)
PR: Include in PR #6

🚦 CHECKPOINT 0: Prerequisites ready
Verify: Dependencies installed. Feature flag exists.

═══════════════════════════════════════════════
PHASE 1: WORKOUT SHARE CARD COMPONENT
═══════════════════════════════════════════════

Step 4: Design share card template
Files: docs/share-card-design.md (C) OR Figma mockup
Details: Design branded workout share card. Layout: (1) Header: Repwise logo + "Workout Summary", (2) Date and duration, (3) Exercise list (name + sets×reps@weight), (4) Total volume (e.g., "12,450 kg total"), (5) PR badges if any, (6) Footer: "Track your workouts on Repwise" + QR code/short link, (7) Attribution: "Shared by @username". Color scheme: gradient background (brand colors), white text, clean typography. Size: 1080×1920 (Instagram story) or 1200×630 (Twitter/Facebook).
Depends on: none
Parallel: can start early
Test: Review with design team or stakeholders
Rollback: N/A (design only)
Risk: 🟢 Low — design iteration
Time: M (60-90 min)
PR: Design doc for reference

Step 5: Create WorkoutShareCard component
Files: app/components/social/WorkoutShareCard.tsx (C)
Details: Create component that renders workout as shareable image. Props: {session: TrainingSession, user: User, showExercises: boolean, showWeights: boolean, colorTheme: 'blue'|'purple'|'green'}. Layout matches design from Step 4. Use View, Text, Image components. Apply gradient background via LinearGradient. Format exercises: "Bench Press: 4×8 @ 100kg". Show PR badges as icons. Add QR code via react-native-qrcode-svg (install if needed). Render off-screen (position: 'absolute', top: -10000) so it's not visible but can be captured.
Depends on: Step 4
Parallel: sequential
Test: Component test — render with sample session, verify layout correct
Rollback: Delete file
Risk: 🟢 Low — pure UI component
Time: L (3-4 hrs)
PR: Include in PR #6

Step 6: Add customization options
Files: app/components/social/ShareCardCustomizer.tsx (C)
Details: Create modal with customization options: (1) Show/hide exercises (toggle), (2) Show/hide weights (toggle), (3) Color theme picker (3 options), (4) Preview of share card. Props: {session: TrainingSession, onConfirm: (options) => void, onCancel: () => void}. Use existing Modal, Switch, Button components. Show live preview of WorkoutShareCard with selected options.
Depends on: Step 5
Parallel: sequential
Test: Component test — change options, verify preview updates
Rollback: Delete file
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #6

🚦 CHECKPOINT 1: Share card component ready
Run:
  - Render WorkoutShareCard with sample data
  - Verify layout matches design
  - Test customization options
Verify: Share card looks professional. Customization works.

═══════════════════════════════════════════════
PHASE 2: SHARE FLOW IMPLEMENTATION
═══════════════════════════════════════════════

Step 7: Create share service
Files: app/services/sharing.ts (C)
Details: Create sharing service with methods: captureWorkoutAsImage(sessionId, options), shareImage(uri, message), saveImageToGallery(uri). Implement captureWorkoutAsImage: (1) render WorkoutShareCard off-screen with ref, (2) use captureRef from react-native-view-shot to capture as PNG, (3) return local file URI. Implement shareImage: use Sharing.shareAsync(uri, {mimeType: 'image/png', dialogTitle: 'Share Workout'}). Implement saveImageToGallery: use MediaLibrary.saveToLibraryAsync (requires permission).
Depends on: Steps 1-2, 5
Parallel: can start after checkpoint 1
Test: Unit test with mocked captureRef and Sharing APIs
Rollback: Delete file
Risk: 🟡 Medium — image capture can fail
Time: L (2-3 hrs)
PR: Include in PR #6

Step 8: Add share button to SessionDetailScreen
Files: app/screens/training/SessionDetailScreen.tsx (M)
Details: Add "Share" button to header (right side, next to edit button). Icon: share icon (iOS: square with arrow up, Android: share icon). On press: (1) check feature flag, (2) open ShareCardCustomizer modal, (3) on confirm, call sharing service, (4) show loading indicator, (5) open native share sheet, (6) track analytics event.
Depends on: Steps 6-7
Parallel: sequential
Test: Integration test — press share button, verify modal opens, verify share sheet opens
Rollback: Remove share button
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #6

Step 9: Add share prompt after PR
Files: app/screens/training/ActiveWorkoutScreen.tsx (M) OR post-workout modal
Details: After workout ends, if user hit PR(s), show prompt: "You hit a PR! Share your achievement?" with "Share Workout" and "Maybe Later" buttons. On "Share Workout", open ShareCardCustomizer with current session. Track conversion rate (PR → share).
Depends on: Steps 6-7
Parallel: can run alongside Step 8
Test: Integration test — complete workout with PR, verify prompt appears
Rollback: Remove prompt
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #6

Step 10: Handle permissions
Files: app/services/sharing.ts (M)
Details: Add permission handling for saving to gallery. Before saveImageToGallery, check MediaLibrary.getPermissionsAsync(). If not granted, request via requestPermissionsAsync(). If denied, show alert: "Permission required to save images. Enable in Settings." Handle iOS photo library permission (NSPhotoLibraryAddUsageDescription in app.json).
Depends on: Step 7
Parallel: sequential
Test: Manual test — try to save image, verify permission prompt
Rollback: Remove permission handling (share still works, just can't save)
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #6

🚦 CHECKPOINT 2: Share flow complete
Run:
  - Complete workout
  - Tap share button
  - Customize card
  - Verify native share sheet opens
  - Share to messaging app, verify image received
Verify: Share flow works end-to-end. Image quality good.

═══════════════════════════════════════════════
PHASE 3: BACKEND SUPPORT FOR SHAREABLE LINKS
═══════════════════════════════════════════════

Step 11: Create shareable workout links
Files: src/modules/training/router.py (M)
Details: Add public endpoint: GET /share/workout/{session_id} (no auth required). Return HTML page with workout summary. Include: user's first name (or "A Repwise user"), date, exercises, volume, PR badges. Add meta tags for link previews (Open Graph, Twitter Cards). Style: simple, clean, mobile-responsive. Add "Get Repwise" CTA button linking to app store.
Depends on: none (backend only)
Parallel: can run alongside frontend work
Test: `curl /share/workout/{id}` — verify HTML returned, verify meta tags present
Rollback: Remove endpoint
Risk: 🟢 Low — read-only endpoint
Time: L (2-3 hrs)
PR: Include in PR #6

Step 12: Generate share URLs
Files: app/services/sharing.ts (M)
Details: Modify shareImage to include share URL in message. Format: "Just crushed a workout on Repwise! 💪\n\n[workout summary]\n\nView details: https://repwise.app/share/workout/{sessionId}". Generate short link via backend (optional: use link shortener service like Bitly or custom short domain).
Depends on: Step 11
Parallel: sequential
Test: Share workout, verify message includes link, tap link, verify opens web page
Rollback: Remove link from message
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #6

Step 13: Add Open Graph meta tags
Files: src/modules/training/router.py (M) — share endpoint
Details: Add meta tags to share page HTML: og:title="[User]'s Workout on Repwise", og:description="[Exercise count] exercises, [volume] total volume", og:image="[generated image URL]", og:url="[share URL]", twitter:card="summary_large_image". Generate og:image by rendering WorkoutShareCard server-side (use puppeteer or similar) and uploading to S3. Cache generated images (key: session_id).
Depends on: Step 11
Parallel: sequential
Test: Share link to Slack/Twitter, verify preview shows workout image and details
Rollback: Remove meta tags (link still works, just no preview)
Risk: 🟡 Medium — server-side image generation can be complex
Time: L (3-4 hrs)
PR: Include in PR #6

🚦 CHECKPOINT 3: Shareable links working
Run:
  - Share workout with link
  - Open link in browser
  - Verify workout details shown
  - Share link to Slack/Twitter, verify preview
Verify: Links work. Previews look good.

═══════════════════════════════════════════════
PHASE 4: VIRAL GROWTH & REFERRAL TRACKING
═══════════════════════════════════════════════

Step 14: Add attribution to share cards
Files: app/components/social/WorkoutShareCard.tsx (M)
Details: Add "Shared by @{username}" text at bottom of card. Use user's username (or first name if username not set). Make it subtle but visible. This creates social proof and encourages others to join.
Depends on: Step 5
Parallel: can run after checkpoint 1
Test: Render card, verify attribution present
Rollback: Remove attribution
Risk: 🟢 Low
Time: S (<30 min)
PR: Include in PR #6

Step 15: Add QR code or short link to app download
Files: app/components/social/WorkoutShareCard.tsx (M)
Details: Add QR code at bottom right of card linking to app store (iOS: App Store, Android: Play Store). Use react-native-qrcode-svg. Alternatively, add short text link: "Get Repwise: repwise.app/download". Make it easy for viewers to download app.
Depends on: Step 5
Parallel: can run alongside Step 14
Test: Render card, scan QR code, verify opens app store
Rollback: Remove QR code
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #6

Step 16: Implement referral tracking
Files: src/modules/referrals/service.py (C), src/modules/referrals/models.py (C)
Details: Create referral system. Database: referrals table (id, referrer_user_id, referred_user_id, source='share_link', created_at). When user signs up from share link (URL param: ?ref={user_id}), create referral record. Track conversion: share link clicked → app installed → account created. Reward referrer (optional: unlock premium feature, badge, etc.).
Depends on: Step 11 (share links)
Parallel: can run alongside Steps 14-15
Test: Sign up from share link with ?ref param, verify referral recorded
Rollback: Delete referral tables and service
Risk: 🟢 Low — additive feature
Time: L (3-4 hrs)
PR: Include in PR #6

Step 17: Add referral link to share URLs
Files: app/services/sharing.ts (M)
Details: Modify share URL to include referral param: https://repwise.app/share/workout/{sessionId}?ref={userId}. When link opened, if user not logged in, redirect to signup with ref param preserved. After signup, credit referrer.
Depends on: Step 16
Parallel: sequential
Test: Share workout, open link, sign up, verify referral tracked
Rollback: Remove ?ref param
Risk: 🟢 Low
Time: M (30-45 min)
PR: Include in PR #6

Step 18: Track share analytics
Files: app/services/analytics.ts (M)
Details: Track events: workout_shared (user_id, session_id, platform, timestamp), share_link_clicked (session_id, referrer_user_id, timestamp), share_link_signup (referred_user_id, referrer_user_id, timestamp). Use existing analytics service (Amplitude, Mixpanel, or custom). Calculate conversion funnel: shares → clicks → signups.
Depends on: Steps 8-9, 16-17
Parallel: can run alongside implementation
Test: Share workout, verify event tracked, click link, verify event tracked
Rollback: Remove event tracking
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #6

🚦 CHECKPOINT 4: Viral growth features complete
Run:
  - Share workout with attribution and QR code
  - Scan QR code, verify opens app store
  - Share link with ?ref param
  - Sign up from link, verify referral tracked
Verify: All viral growth features working. Referral tracking accurate.

═══════════════════════════════════════════════
PHASE 5: TESTING & POLISH
═══════════════════════════════════════════════

Step 19: Test image quality
Files: N/A (testing)
Details: Test share card image quality on various devices and screen sizes. Verify: (1) no pixelation, (2) text readable, (3) colors accurate, (4) QR code scannable, (5) file size reasonable (<2MB). Test on iPhone SE (small screen), iPhone 15 Pro Max (large screen), budget Android. Adjust captureRef options if needed (format: 'png', quality: 1.0, width/height for consistent sizing).
Depends on: Checkpoint 2
Parallel: can start after checkpoint 2
Test: Share workout, inspect image file, verify quality
Rollback: N/A (testing)
Risk: 🟢 Low
Time: M (60-90 min)
PR: Quality improvements in PR #6 if needed

Step 20: Test share flow performance
Files: N/A (testing)
Details: Measure time from "Share" button press to share sheet opening. Target: <3 seconds. Profile with React DevTools. Optimize if needed: (1) pre-render WorkoutShareCard, (2) cache captured images, (3) compress images. Test on low-end devices.
Depends on: Checkpoint 2
Parallel: can run alongside Step 19
Test: Press share button 10 times, measure average time
Rollback: N/A (testing)
Risk: 🟢 Low
Time: M (60-90 min)
PR: Performance improvements in PR #6 if needed

Step 21: Test on multiple platforms
Files: N/A (testing)
Details: Test sharing to: Instagram Stories, Instagram Feed, Twitter, Facebook, WhatsApp, iMessage, SMS. Verify: (1) image displays correctly, (2) message text included, (3) link clickable. Note: Instagram Stories requires special handling (use Sharing.shareAsync with UTI type). Document any platform-specific quirks.
Depends on: Checkpoint 2
Parallel: can run alongside Steps 19-20
Test: Share to each platform, verify works
Rollback: N/A (testing)
Risk: 🟡 Medium — platform-specific issues possible
Time: L (2-3 hrs)
PR: Platform-specific fixes in PR #6 if needed

Step 22: Write comprehensive tests
Files: app/__tests__/services/sharing.test.ts (C), app/__tests__/components/WorkoutShareCard.test.tsx (C)
Details: Write tests: (1) WorkoutShareCard renders correctly with various session data, (2) ShareCardCustomizer updates preview on option change, (3) sharing service captures image successfully, (4) sharing service handles errors gracefully, (5) referral tracking works. Mock react-native-view-shot and expo-sharing. Aim for 90%+ coverage.
Depends on: Steps 5-7, 16
Parallel: can write alongside implementation
Test: Run `npm test -- sharing` — verify all tests pass
Rollback: N/A (tests don't affect functionality)
Risk: 🟢 Low
Time: L (2-3 hrs)
PR: Include in PR #6

🚦 CHECKPOINT 5: Testing complete
Verify:
  - Image quality excellent on all devices
  - Share flow <3 seconds
  - Works on all major platforms
  - All tests pass
Gate: Feature is production-ready.

═══════════════════════════════════════════════
PHASE 6: DEPLOYMENT
═══════════════════════════════════════════════

Step 23: Enable feature flag in staging
Files: Database (staging)
Details: `UPDATE feature_flags SET enabled = true WHERE name = 'social_sharing'`. Test in staging app.
Depends on: Checkpoint 5
Parallel: sequential
Test: Share workout in staging, verify works
Rollback: Set enabled = false
Risk: 🟢 Low
Time: S (<15 min)
PR: N/A

Step 24: Monitor staging metrics
Files: N/A (observability)
Details: Monitor for 24-48 hours: (1) Share button click rate, (2) Share completion rate (clicks → shares), (3) Share link click rate, (4) Crash rate. Check Sentry for errors.
Depends on: Step 23
Parallel: sequential
Test: Query analytics for share events
Rollback: N/A (monitoring)
Risk: 🟢 Low
Time: M (24-48 hrs)
PR: N/A

Step 25: Gradual production rollout
Files: Database (production)
Details: Enable for 10% of users: `UPDATE feature_flags SET enabled = true, conditions = '{"rollout_percentage": 10}' WHERE name = 'social_sharing'`. Monitor for 24 hours. If metrics good, increase to 50%, then 100%.
Depends on: Step 24
Parallel: sequential
Test: Verify 10% of users see share button
Rollback: Set rollout_percentage = 0
Risk: 🟡 Medium — production rollout
Time: L (3-5 days for gradual rollout)
PR: N/A

Step 26: Announce feature
Files: N/A (marketing)
Details: After 100% rollout, announce: (1) In-app notification: "New: Share your workouts! Show off your PRs to friends.", (2) Social media post with example shared workout, (3) Email to active users. Encourage sharing with incentive (optional: "Share 3 workouts, unlock premium feature").
Depends on: Step 25 (100% rollout)
Parallel: sequential
Test: N/A
Rollback: N/A
Risk: 🟢 Low
Time: S (<30 min)
PR: N/A

🚦 FINAL CHECKPOINT: Feature shipped
Verify:
  - 10%+ users share workouts
  - 5% conversion from shared links
  - <0.1% crash rate
  - Positive user feedback
Success: Social sharing is live and driving growth.

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
- workout_shared (user_id, session_id, platform, timestamp)
- share_customization_opened (user_id, session_id, timestamp)
- share_link_clicked (session_id, referrer_user_id, timestamp)
- share_link_signup (referred_user_id, referrer_user_id, timestamp)

Success metrics (30 days):
- 10%+ users share at least one workout
- 5% conversion from shared links (clicks → signups)
- 20%+ share completion rate (share button clicks → actual shares)
- <3 seconds share flow time
- <0.1% crash rate

═══════════════════════════════════════════════
TOTAL EFFORT: 28 hours
- Prerequisites: 1 hour
- Share card component: 6 hours
- Share flow: 5 hours
- Backend support: 6 hours
- Viral growth: 6 hours
- Testing & polish: 4 hours
═══════════════════════════════════════════════
