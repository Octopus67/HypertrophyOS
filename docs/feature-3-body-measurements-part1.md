# Feature 3: Body Measurements Tracking — Detailed Implementation Plan (Part 1)

═══════════════════════════════════════════════
FEATURE 3: BODY MEASUREMENTS TRACKING
Total Effort: 39 hours (5 days)
Dependencies: expo-image-picker, recharts or victory-native
Risk Level: 🟢 Low (standalone feature, additive)
═══════════════════════════════════════════════

## OVERVIEW

Allow users to track body measurements (weight, body fat %, circumferences, progress photos) over time. Calculate body fat % using Navy method (waist, neck, height). Visualize trends. Integrate with adaptive engine for more accurate TDEE calculations.

## SUCCESS CRITERIA

- Users can log 8+ measurement types (weight, BF%, waist, neck, chest, arms, thighs, calves)
- Navy body fat calculator accurate within ±3.5% (validated against DEXA)
- Progress photos stored securely with privacy controls
- Trend charts show 12-week history
- 30%+ users log measurements at least once
- Measurements feed into adaptive engine for TDEE refinement

═══════════════════════════════════════════════
PHASE 0: PREREQUISITES
═══════════════════════════════════════════════

Step 1: Install image picker library
Files: app/package.json (M)
Details: Run `cd app && npx expo install expo-image-picker expo-file-system`. Verify versions: expo-image-picker ~15.0.0, expo-file-system ~17.0.0. These handle photo selection and local storage.
Depends on: none
Parallel: sequential
Test: `npm list expo-image-picker expo-file-system` — verify installed
Rollback: `npm uninstall expo-image-picker expo-file-system`
Risk: 🟢 Low — standard Expo packages
Time: S (<30 min)
PR: Include in PR #4 (Body Measurements)

Step 2: Configure image picker permissions
Files: app/app.json (M)
Details: Add to "expo.ios.infoPlist": {"NSPhotoLibraryUsageDescription": "Repwise needs access to your photos to save progress pictures.", "NSCameraUsageDescription": "Repwise needs camera access to take progress pictures."}. Add to "expo.android.permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]. Verify app.json valid JSON.
Depends on: Step 1
Parallel: sequential
Test: Build app, verify permission prompts appear when accessing camera/photos
Rollback: Remove permission entries
Risk: 🟢 Low — standard permissions
Time: S (<15 min)
PR: Include in PR #4

Step 3: Create feature flag
Files: Database seed script
Details: Insert: `{'name': 'body_measurements', 'enabled': False, 'description': 'Enable body measurements tracking and progress photos', 'conditions': {}}`. Default OFF.
Depends on: none
Parallel: can run alongside Steps 1-2
Test: Query `SELECT * FROM feature_flags WHERE name = 'body_measurements'`
Rollback: Delete row
Risk: 🟢 Low
Time: S (<15 min)
PR: Include in PR #4

🚦 CHECKPOINT 0: Prerequisites ready
Verify: Dependencies installed. Permissions configured. Feature flag exists.

═══════════════════════════════════════════════
PHASE 1: DATABASE SCHEMA
═══════════════════════════════════════════════

Step 4: Write migration — create body_measurements table
Files: alembic/versions/20260307_create_body_measurements.py (C)
Details: Create migration. Upgrade: CREATE TABLE body_measurements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), weight_kg DECIMAL(5,2), body_fat_pct DECIMAL(4,2), waist_cm DECIMAL(5,2), neck_cm DECIMAL(5,2), hips_cm DECIMAL(5,2), chest_cm DECIMAL(5,2), bicep_left_cm DECIMAL(5,2), bicep_right_cm DECIMAL(5,2), thigh_left_cm DECIMAL(5,2), thigh_right_cm DECIMAL(5,2), calf_left_cm DECIMAL(5,2), calf_right_cm DECIMAL(5,2), notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX idx_body_measurements_user_measured ON body_measurements(user_id, measured_at DESC); CREATE UNIQUE INDEX idx_body_measurements_user_date ON body_measurements(user_id, DATE(measured_at)). Downgrade: DROP TABLE IF EXISTS body_measurements CASCADE.
Depends on: Step 3
Parallel: sequential
Test: `alembic check` — no errors
Rollback: Delete migration file
Risk: 🟢 Low — new table
Time: M (45-60 min)
PR: Include in PR #4

Step 5: Write migration — create progress_photos table
Files: alembic/versions/20260307_create_progress_photos.py (C)
Details: Create migration. Upgrade: CREATE TABLE progress_photos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, measurement_id UUID REFERENCES body_measurements(id) ON DELETE CASCADE, photo_url VARCHAR(512) NOT NULL, photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('front', 'side', 'back', 'other')), taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), is_private BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX idx_progress_photos_user_taken ON progress_photos(user_id, taken_at DESC); CREATE INDEX idx_progress_photos_measurement ON progress_photos(measurement_id). Downgrade: DROP TABLE IF EXISTS progress_photos CASCADE.
Depends on: Step 4
Parallel: sequential
Test: `alembic check` — no errors
Rollback: Delete migration file
Risk: 🟢 Low — new table
Time: M (45-60 min)
PR: Include in PR #4

Step 6: Review migrations
Files: Both migration files (review)
Details: Code review: verify (1) up/down are inverses, (2) indexes for query patterns, (3) CHECK constraints valid, (4) foreign keys correct, (5) UNIQUE constraint on user_id + date prevents duplicate daily entries. Get approval.
Depends on: Steps 4-5
Parallel: sequential
Test: Run up and down on test DB: `alembic upgrade head && alembic downgrade -2 && alembic upgrade head`
Rollback: N/A (review)
Risk: 🟡 Medium — schema changes
Time: M (30-45 min)
PR: Part of PR #4 review

Step 7: Apply migrations to dev database
Files: N/A (database operation)
Details: Run `alembic upgrade head`. Verify tables created: `\d body_measurements`, `\d progress_photos`.
Depends on: Step 6
Parallel: sequential
Test: Query tables — should return without error
Rollback: `alembic downgrade -2`
Risk: 🟢 Low — dev only
Time: S (<15 min)
PR: N/A

🚦 CHECKPOINT 1: Database schema ready
Verify: Tables exist. Indexes created. Constraints enforced.

═══════════════════════════════════════════════
PHASE 2: BACKEND API — MODELS & SCHEMAS
═══════════════════════════════════════════════

Step 8: Create measurement models
Files: src/modules/measurements/models.py (C)
Details: Create SQLAlchemy models: BodyMeasurement (all fields from table), ProgressPhoto (all fields from table). Use existing Base, add relationships: BodyMeasurement.photos = relationship("ProgressPhoto", back_populates="measurement"). Add __repr__ for debugging.
Depends on: Step 7
Parallel: can start after checkpoint 1
Test: Import in Python REPL — no errors
Rollback: Delete file
Risk: 🟢 Low
Time: M (45-60 min)
PR: Include in PR #4

Step 9: Create measurement schemas
Files: src/modules/measurements/schemas.py (C)
Details: Create Pydantic schemas: MeasurementCreate (all measurement fields Optional except measured_at), MeasurementResponse (all fields, includes photos array), MeasurementUpdate (all fields Optional), ProgressPhotoCreate (photo_url, photo_type, taken_at), ProgressPhotoResponse (all fields), MeasurementTrendResponse (date, weight, body_fat_pct for charting). Add validators: weight_kg > 0, body_fat_pct 0-100, all cm measurements > 0.
Depends on: Step 8
Parallel: sequential
Test: Instantiate with valid/invalid data — verify validation
Rollback: Delete file
Risk: 🟢 Low
Time: M (60-90 min)
PR: Include in PR #4

Step 10: Create Navy body fat calculator
Files: src/modules/measurements/calculators.py (C)
Details: Implement Navy method: For males: BF% = 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76. For females: BF% = 163.205 × log10(waist + hips - neck) - 97.684 × log10(height) - 78.387. Function signature: calculate_navy_body_fat(sex: str, height_cm: float, waist_cm: float, neck_cm: float, hips_cm: float = None) -> float. Return None if required measurements missing. Add docstring with citation (US Navy circumference method).
Depends on: none
Parallel: can run alongside Steps 8-9
Test: Unit tests with known values (validate against online calculators)
Rollback: Delete file
Risk: 🟢 Low — pure math function
Time: M (45-60 min)
PR: Include in PR #4

═══════════════════════════════════════════════
CONTINUED IN PART 2...
═══════════════════════════════════════════════
