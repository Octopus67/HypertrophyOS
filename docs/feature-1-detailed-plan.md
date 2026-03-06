# Feature Implementation Plan — Phase 0: Prerequisites

═══════════════════════════════════════════════
PHASE 0: SETUP & PREREQUISITES
═══════════════════════════════════════════════

Step 1: Review current notification infrastructure
Files: src/modules/notifications/ (review existing), src/models/ (review device_tokens, notification_preferences tables)
Details: Verify device_tokens table exists with columns: id, user_id, token, platform, is_active, created_at, updated_at. Verify notification_preferences table exists. Document current schema in a schema.md file for reference.
Depends on: none
Parallel: sequential
Test: Run `psql -d repwise -c "\d device_tokens"` and `\d notification_preferences` — verify tables exist
Rollback: N/A (read-only)
Risk: 🟢 Low — read-only verification
Time: S (<30 min)
PR: N/A

Step 2: Install frontend dependencies
Files: app/package.json (M)
Details: Run `cd app && npx expo install expo-notifications expo-device expo-constants`. Verify package.json shows: "expo-notifications": "~0.28.19", "expo-device": "~6.0.2", "expo-constants": "~16.0.2" (versions may vary by Expo SDK). Run `npm install` to ensure lockfile updates.
Depends on: none
Parallel: can run alongside Step 1
Test: Run `npm list expo-notifications expo-device expo-constants` — verify installed
Rollback: `npm uninstall expo-notifications expo-device expo-constants`
Risk: 🟢 Low — standard Expo packages
Time: S (<30 min)
PR: Include in PR #1 (Push Notifications)

Step 3: Install backend dependencies
Files: pyproject.toml (M)
Details: Add to [project].dependencies: "httpx>=0.27.0" (if not already present — check first). Run `pip install --upgrade httpx` in virtual environment. Verify httpx can make async requests.
Depends on: none
Parallel: can run alongside Steps 1-2
Test: Run `python -c "import httpx; print(httpx.__version__)"` — verify ≥0.27.0
Rollback: Remove httpx from dependencies if it was added
Risk: 🟢 Low — httpx likely already present for other features
Time: S (<30 min)
PR: Include in PR #1

Step 4: Configure Expo Push Notifications plugin
Files: app/app.json (M)
Details: Add to "expo.plugins" array: "expo-notifications". If plugins array doesn't exist, create it: "plugins": ["expo-notifications"]. Verify app.json is valid JSON after edit.
Depends on: Step 2
Parallel: sequential (needs Step 2 packages)
Test: Run `npx expo config --type introspect` — verify no errors, plugin listed
Rollback: Remove "expo-notifications" from plugins array
Risk: 🟢 Low — standard plugin
Time: S (<30 min)
PR: Include in PR #1

Step 5: Create feature flag for push notifications
Files: src/modules/feature_flags/seed_flags.py (M) OR database seed script
Details: Add feature flag entry: `{'name': 'push_notifications', 'enabled': False, 'description': 'Enable push notifications for workout reminders, PR celebrations, etc.', 'conditions': {}}`. Insert into feature_flags table via migration or seed script. Default to OFF for gradual rollout.
Depends on: none
Parallel: can run alongside Steps 1-4
Test: Query `SELECT * FROM feature_flags WHERE name = 'push_notifications'` — verify exists and enabled=false
Rollback: Delete the feature flag row
Risk: 🟢 Low — additive
Time: S (<30 min)
PR: Include in PR #1

🚦 CHECKPOINT 0: Prerequisites verified
Run: 
  - `npm list expo-notifications` (frontend)
  - `python -c "import httpx"` (backend)
  - `psql -d repwise -c "SELECT * FROM feature_flags WHERE name = 'push_notifications'"` (DB)
Verify: 
  - All dependencies installed
  - Feature flag exists and is OFF
  - Existing tables documented
Gate: All commands succeed with expected output. No errors.

═══════════════════════════════════════════════
PHASE 1: DATABASE MIGRATIONS
═══════════════════════════════════════════════

Step 6: Write migration — add notification columns
Files: alembic/versions/20260307_add_notification_columns.py (C)
Details: Create Alembic migration with upgrade() and downgrade(). Upgrade: ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(512), ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ; ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS workout_reminders BOOLEAN DEFAULT TRUE, ADD COLUMN IF NOT EXISTS meal_reminders BOOLEAN DEFAULT TRUE, ADD COLUMN IF NOT EXISTS pr_celebrations BOOLEAN DEFAULT TRUE, ADD COLUMN IF NOT EXISTS weekly_checkin_alerts BOOLEAN DEFAULT TRUE, ADD COLUMN IF NOT EXISTS volume_warnings BOOLEAN DEFAULT TRUE, ADD COLUMN IF NOT EXISTS quiet_hours_start TIME, ADD COLUMN IF NOT EXISTS quiet_hours_end TIME. Downgrade: ALTER TABLE device_tokens DROP COLUMN IF EXISTS expo_push_token, DROP COLUMN IF EXISTS last_used_at; ALTER TABLE notification_preferences DROP COLUMN IF EXISTS workout_reminders, ... (all 7 columns).
Depends on: Step 5 (feature flag)
Parallel: sequential
Test: Run `alembic check` — verify no errors
Rollback: Delete migration file
Risk: 🟢 Low — additive columns with defaults
Time: M (30-60 min)
PR: Include in PR #1

Step 7: Write migration — create notification_log table
Files: alembic/versions/20260307_create_notification_log.py (C)
Details: Create Alembic migration. Upgrade: CREATE TABLE notification_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, body TEXT, data JSONB, sent_at TIMESTAMPTZ DEFAULT NOW(), read_at TIMESTAMPTZ, clicked_at TIMESTAMPTZ); CREATE INDEX idx_notification_log_user_sent ON notification_log(user_id, sent_at DESC); CREATE INDEX idx_notification_log_type ON notification_log(type). Downgrade: DROP TABLE IF EXISTS notification_log CASCADE.
Depends on: Step 6
Parallel: sequential (must run after Step 6)
Test: Run `alembic check` — verify no errors
Rollback: Delete migration file
Risk: 🟢 Low — new table, no foreign key dependencies
Time: M (30-60 min)
PR: Include in PR #1

Step 8: Review migrations with senior engineer
Files: alembic/versions/20260307_*.py (review)
Details: Code review of both migration files. Verify: (1) upgrade() and downgrade() are inverses, (2) IF NOT EXISTS used for idempotency, (3) indexes created for query patterns, (4) foreign keys have ON DELETE CASCADE, (5) no data loss on downgrade (acceptable for new tables). Get approval before proceeding.
Depends on: Steps 6-7
Parallel: sequential
Test: Run both migrations up and down on a test database: `alembic upgrade head && alembic downgrade -1 && alembic upgrade head` — verify no errors
Rollback: N/A (review step)
Risk: 🟡 Medium — bad migrations can corrupt production DB
Time: M (30-60 min)
PR: Part of PR #1 review

Step 9: Apply migrations to development database
Files: N/A (database operation)
Details: Run `alembic upgrade head` against local dev database. Verify tables and columns created. Run `\d device_tokens`, `\d notification_preferences`, `\d notification_log` to confirm schema matches migration.
Depends on: Step 8 (review approval)
Parallel: sequential
Test: Query new columns: `SELECT expo_push_token, workout_reminders FROM device_tokens LIMIT 1` — should return without error (even if no rows)
Rollback: Run `alembic downgrade -2` to undo both migrations
Risk: 🟢 Low — dev database only
Time: S (<30 min)
PR: N/A

🚦 CHECKPOINT 1: Database schema ready
Run: 
  - `alembic current` — verify at head
  - `psql -d repwise -c "\d notification_log"` — verify table exists
  - `psql -d repwise -c "\d+ device_tokens"` — verify new columns exist
Verify: All new tables and columns present. Indexes created. No errors.
Gate: Schema matches design. Up and down migrations both work.

═══════════════════════════════════════════════
PHASE 2: BACKEND API — PUSH SERVICE
═══════════════════════════════════════════════

Step 10: Create push notification service
Files: src/services/push_notifications.py (C)
Details: Create PushNotificationService class with methods: send_notification(user_id, title, body, data, sound, badge), _get_active_tokens(user_id), _should_send(user_id, notification_type), _process_receipts(receipts), _log_notification(...). Use httpx.AsyncClient to POST to https://exp.host/--/api/v2/push/send. Batch messages in groups of 100. Handle Expo API response format: {"data": [{"status": "ok"|"error", "id": "...", "message": "..."}]}. Mark tokens inactive if status="error" and message contains "DeviceNotRegistered". Log all sent notifications to notification_log table.
Depends on: Step 9 (DB schema)
Parallel: can start after checkpoint 1
Test: Unit test with mocked httpx client — verify batch logic, receipt processing, token deactivation
Rollback: Delete file
Risk: 🟡 Medium — external API dependency, error handling critical
Time: L (3-4 hrs)
PR: Include in PR #1

Step 11: Create notification models
Files: src/modules/notifications/models.py (C)
Details: Create SQLAlchemy models: DeviceToken (if not exists — check first), NotificationPreference (if not exists), NotificationLog. Use existing Base, SoftDeleteMixin if applicable. DeviceToken: id, user_id (FK), token, expo_push_token, platform, is_active, last_used_at, created_at, updated_at. NotificationPreference: id, user_id (FK, unique), workout_reminders (bool), meal_reminders (bool), pr_celebrations (bool), weekly_checkin_alerts (bool), volume_warnings (bool), quiet_hours_start (time), quiet_hours_end (time), created_at, updated_at. NotificationLog: id, user_id (FK), type, title, body, data (JSONB), sent_at, read_at, clicked_at.
Depends on: Step 9
Parallel: can run alongside Step 10
Test: Import models in Python REPL — verify no errors
Rollback: Delete file
Risk: 🟢 Low — standard SQLAlchemy models
Time: M (45-60 min)
PR: Include in PR #1

Step 12: Create notification schemas
Files: src/modules/notifications/schemas.py (C)
Details: Create Pydantic schemas: RegisterTokenRequest (token: str, platform: Literal['ios','android','web']), NotificationPreferencesResponse (all preference fields), NotificationPreferencesUpdate (all fields Optional), NotificationLogResponse (id, type, title, body, data, sent_at, read_at, clicked_at). Use Field validators: token max_length=512, platform enum validation.
Depends on: Step 11
Parallel: sequential (needs models for reference)
Test: Instantiate each schema with valid/invalid data — verify validation works
Rollback: Delete file
Risk: 🟢 Low — standard Pydantic schemas
Time: M (30-45 min)
PR: Include in PR #1

Step 13: Create notification service layer
Files: src/modules/notifications/service.py (C)
Details: Create NotificationService class with methods: register_token(user_id, token, platform), unregister_token(user_id, token), get_preferences(user_id), update_preferences(user_id, updates), get_notification_history(user_id, pagination), mark_as_read(user_id, notification_ids). Use SQLAlchemy async session. For register_token: upsert pattern (INSERT ... ON CONFLICT (user_id, token) DO UPDATE SET is_active=true, last_used_at=NOW()). For get_preferences: return default preferences if no row exists.
Depends on: Steps 11-12
Parallel: sequential
Test: Unit tests with in-memory SQLite — test each method
Rollback: Delete file
Risk: 🟢 Low — standard CRUD service
Time: L (2-3 hrs)
PR: Include in PR #1

Step 14: Create notification API endpoints
Files: src/modules/notifications/router.py (C)
Details: Create FastAPI router with 6 endpoints: POST /register-token (body: RegisterTokenRequest, calls service.register_token), DELETE /unregister-token (body: {token}, calls service.unregister_token), GET /preferences (returns NotificationPreferencesResponse, calls service.get_preferences), PUT /preferences (body: NotificationPreferencesUpdate, calls service.update_preferences), GET /history (query: PaginationParams, returns PaginatedResult[NotificationLogResponse]), POST /mark-read (body: {notification_ids: List[UUID]}, calls service.mark_as_read). All endpoints require authentication via get_current_user dependency.
Depends on: Steps 12-13
Parallel: sequential
Test: Integration tests with TestClient — test each endpoint with valid/invalid inputs
Rollback: Delete file
Risk: 🟢 Low — standard REST endpoints
Time: L (2-3 hrs)
PR: Include in PR #1

Step 15: Register notifications router in main app
Files: src/main.py (M)
Details: Add import: `from src.modules.notifications.router import router as notifications_router`. Add to app.include_router() calls: `app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])`. Place after existing router registrations (around line 200-250).
Depends on: Step 14
Parallel: sequential
Test: Run `uvicorn src.main:app --reload` — verify app starts, check http://localhost:8000/docs — verify /api/v1/notifications endpoints listed
Rollback: Remove import and include_router line
Risk: 🟢 Low — additive
Time: S (<15 min)
PR: Include in PR #1

Step 16: Wire PushNotificationService into notification service
Files: src/modules/notifications/service.py (M)
Details: Add method `async def send_push(self, user_id: UUID, title: str, body: str, notification_type: str, data: dict = None)`. Inside: (1) check feature flag `push_notifications`, (2) check user preferences for notification_type, (3) check quiet hours, (4) get active tokens via `select(DeviceToken).where(DeviceToken.user_id == user_id, DeviceToken.is_active == True)`, (5) call `PushNotificationService().send_notification(...)`, (6) log to notification_log table. Return bool indicating success.
Depends on: Steps 10, 13
Parallel: sequential
Test: Unit test with mocked PushNotificationService — verify preference checks, quiet hours logic
Rollback: Remove send_push method
Risk: 🟡 Medium — integrates multiple services
Time: M (60-90 min)
PR: Include in PR #1

🚦 CHECKPOINT 2: Backend API complete
Run:
  - `pytest tests/test_notifications.py -v` (write these tests in parallel with Steps 10-16)
  - `curl -X POST http://localhost:8000/api/v1/notifications/register-token -H "Authorization: Bearer <token>" -d '{"token":"test","platform":"ios"}'` — verify 200
  - `curl http://localhost:8000/api/v1/notifications/preferences -H "Authorization: Bearer <token>"` — verify returns preferences
Verify: All tests pass. All endpoints return expected responses. No 500 errors.
Gate: Backend API is fully functional and tested. Ready for frontend integration.

═══════════════════════════════════════════════
PHASE 3: FRONTEND — NOTIFICATION SERVICE
═══════════════════════════════════════════════

Step 17: Create frontend notification service
Files: app/services/notifications.ts (C)
Details: Implement registerForPushNotifications() function: (1) check Device.isDevice, (2) create Android notification channel if Platform.OS === 'android', (3) check/request permissions via Notifications.getPermissionsAsync() and requestPermissionsAsync(), (4) get Expo push token via getExpoPushTokenAsync({projectId}), (5) POST to /api/v1/notifications/register-token with {token, platform: Platform.OS}, (6) return boolean success. Implement setupNotificationListeners(navigation) function: (1) addNotificationReceivedListener for foreground, (2) addNotificationResponseReceivedListener for taps, (3) handle data.screen navigation. Export both functions.
Depends on: Steps 2, 4, 14 (backend endpoint)
Parallel: can start after checkpoint 2
Test: Unit test with mocked Notifications API — verify permission flow, token extraction, API call
Rollback: Delete file
Risk: 🟡 Medium — permissions can be denied, token extraction can fail
Time: L (2-3 hrs)
PR: Include in PR #1

Step 18: Integrate notification service into App.tsx
Files: app/App.tsx (M)
Details: Import registerForPushNotifications and setupNotificationListeners. In the useEffect after successful restoreSession (when isAuthenticated becomes true), call `registerForPushNotifications().catch(err => console.warn('Push registration failed:', err))`. Call `setupNotificationListeners(navigation)` once on mount (separate useEffect with empty deps). Handle notification that launched app: `Notifications.getLastNotificationResponseAsync().then(response => { if (response) handleNotificationTap(response.notification.request.content.data, navigation); })`.
Depends on: Step 17
Parallel: sequential
Test: Manual test on physical device — login, verify permission prompt, grant, verify token registered in DB
Rollback: Remove notification service calls
Risk: 🟡 Medium — must test on physical device (simulator doesn't support push)
Time: M (45-60 min)
PR: Include in PR #1

Step 19: Create notification preferences screen
Files: app/screens/settings/NotificationSettingsScreen.tsx (C)
Details: Create screen with: (1) Permission status indicator (granted/denied with re-request button), (2) Toggle switches for each notification type (workout_reminders, meal_reminders, pr_celebrations, weekly_checkin_alerts, volume_warnings), (3) Quiet hours time pickers (start/end), (4) "Send Test Notification" button (calls backend test endpoint). Fetch preferences via `GET /notifications/preferences` on mount. On toggle change, call `PUT /notifications/preferences` with updated field. Use existing Switch, Button, Card components. Follow existing settings screen patterns.
Depends on: Step 14 (backend endpoints)
Parallel: can run alongside Step 17-18
Test: Component test — render all toggles, simulate toggle change, verify API call
Rollback: Delete file
Risk: 🟢 Low — standard settings screen
Time: L (2-3 hrs)
PR: Include in PR #1

Step 20: Add notification settings to profile navigation
Files: app/navigation/BottomTabNavigator.tsx (M) OR app/screens/profile/ProfileScreen.tsx (M)
Details: Add navigation link in Profile screen's Features section: `<FeatureNavItem icon="bell" label="Notifications" onPress={() => navigation.navigate('NotificationSettings')} />`. Register route in ProfileStack: `<ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{title: 'Notification Settings'}} />`.
Depends on: Step 19
Parallel: sequential
Test: Manual test — navigate to Profile → tap Notifications → verify screen opens
Rollback: Remove FeatureNavItem and route registration
Risk: 🟢 Low — additive navigation
Time: S (<30 min)
PR: Include in PR #1

🚦 CHECKPOINT 3: Frontend notification infrastructure complete
Run:
  - Build app: `cd app && npx expo prebuild && npm run ios` (or android)
  - Login on physical device
  - Grant notification permission
  - Navigate to Profile → Notifications
  - Toggle a preference
Verify:
  - Permission prompt appears
  - Token registered in database (check via SQL query)
  - Preferences screen renders
  - Toggle changes persist
Gate: Can register for notifications. Can update preferences. No crashes.

═══════════════════════════════════════════════
PHASE 4: NOTIFICATION TRIGGERS
═══════════════════════════════════════════════

Step 21: Implement PR celebration notification
Files: src/modules/training/service.py (M)
Details: In create_session() method, after PR detection logic (search for "personal_records" or "pr_detection"), add: `if prs: await notification_service.send_push(user_id, "New PR!", f"You hit {len(prs)} personal record(s)!", "pr_celebration", {"screen": "SessionDetail", "sessionId": str(session.id)})`. Import NotificationService at top. Instantiate with self.db.
Depends on: Step 16 (send_push method)
Parallel: can run after checkpoint 2
Test: Integration test — create session with PR → verify notification sent (mock push service)
Rollback: Remove notification call
Risk: 🟢 Low — additive, doesn't affect core training logic
Time: M (30-45 min)
PR: Include in PR #2 (Notification Triggers)

Step 22: Implement weekly check-in notification
Files: src/modules/adaptive/service.py (M)
Details: In weekly_checkin() method (or wherever check-in is generated), after creating coaching suggestions, add: `await notification_service.send_push(user_id, "Weekly Check-In Ready", "Review your progress and get personalized recommendations", "weekly_checkin", {"screen": "WeeklyCheckin"})`. Only send if suggestions exist.
Depends on: Step 16
Parallel: can run alongside Step 21
Test: Integration test — trigger check-in → verify notification sent
Rollback: Remove notification call
Risk: 🟢 Low — additive
Time: M (30-45 min)
PR: Include in PR #2

Step 23: Implement volume warning notification
Files: src/modules/training/wns_volume_service.py (M)
Details: In get_weekly_muscle_volume(), after computing status for each muscle, if status == "above_mrv", call: `await notification_service.send_push(user_id, "Volume Warning", f"Your {muscle_group} volume is above MRV. Consider reducing volume to avoid overtraining.", "volume_warning", {"screen": "Analytics"})`. Only send once per week per muscle (check notification_log for duplicates).
Depends on: Step 16
Parallel: can run alongside Steps 21-22
Test: Integration test — create workout exceeding MRV → verify notification sent
Rollback: Remove notification call
Risk: 🟢 Low — additive
Time: M (45-60 min)
PR: Include in PR #2

Step 24: Implement workout reminder (cron job)
Files: src/jobs/workout_reminders.py (C), src/main.py (M for cron registration if using APScheduler)
Details: Create async function `send_workout_reminders()`: (1) query users who haven't trained in 24 hours (SELECT user_id FROM users WHERE user_id NOT IN (SELECT DISTINCT user_id FROM training_sessions WHERE session_date >= CURRENT_DATE - INTERVAL '1 day')), (2) for each user, check notification_preferences.workout_reminders, (3) send push: "Time to train!", "You haven't logged a workout today. Keep your streak going!", "workout_reminder", {"screen": "Logs"}. Schedule to run daily at 6pm user local time (or use a fixed time like 18:00 UTC for v1). If using APScheduler, register in main.py lifespan. If using external cron (Railway cron, GitHub Actions), create a dedicated endpoint POST /jobs/workout-reminders (auth with internal API key).
Depends on: Step 16
Parallel: can run alongside Steps 21-23
Test: Unit test — mock user query, verify notification sent. Integration test — run job, verify notifications sent to eligible users only.
Rollback: Delete file, remove cron registration
Risk: 🟡 Medium — cron scheduling can be tricky, timezone handling
Time: L (2-3 hrs)
PR: Include in PR #2

🚦 CHECKPOINT 4: All notification triggers working
Run:
  - Trigger each notification type manually (create PR, generate check-in, exceed MRV, run cron job)
  - Verify notifications appear on physical device
  - Tap notification, verify deep link navigation works
Verify: All 4 notification types send successfully. Deep links work. No crashes.
Gate: Notifications are functional end-to-end. Ready for frontend polish.

═══════════════════════════════════════════════
CONTINUED IN PART 2...
═══════════════════════════════════════════════

(Phases 5-6 for remaining features: Volume Landmarks, Body Measurements, Light Mode, Social Sharing, WNS Feedback, Data Export, Free Trial)

**This is Phase 0-4 for Feature 1 (Push Notifications) only. The full plan for all 8 features would be ~200-300 steps across 15-20 phases.**

**Given the scope, recommend implementing features sequentially with approval gates between each feature, rather than one massive plan.**

**Approve Feature 1 plan to proceed with detailed plans for Features 2-8?**
