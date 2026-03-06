# Feature 3: Body Measurements Tracking — Part 2 (Service Layer & API)

═══════════════════════════════════════════════
PHASE 3: BACKEND API — SERVICE LAYER
═══════════════════════════════════════════════

Step 11: Create measurement service
Files: src/modules/measurements/service.py (C)
Details: Create MeasurementService class with methods: create_measurement(user_id, data: MeasurementCreate), get_measurements(user_id, start_date, end_date, pagination), get_latest_measurement(user_id), update_measurement(user_id, measurement_id, updates), delete_measurement(user_id, measurement_id), get_trend_data(user_id, days=90). In create_measurement: (1) check if measurement exists for date (UNIQUE constraint), (2) if waist/neck/height present, calculate Navy BF% and store, (3) return created measurement. In get_trend_data: query measurements ordered by date, return simplified data for charting.
Depends on: Steps 9-10
Parallel: sequential
Test: Unit tests with in-memory SQLite — test each method, test BF% calculation integration
Rollback: Delete file
Risk: 🟢 Low — standard CRUD service
Time: L (3-4 hrs)
PR: Include in PR #4

Step 12: Create photo upload service
Files: src/modules/measurements/photo_service.py (C)
Details: Create PhotoService class with methods: upload_photo(user_id, measurement_id, file, photo_type), get_photos(user_id, measurement_id), delete_photo(user_id, photo_id), generate_presigned_url(photo_id). Use S3 or local storage (decide based on infrastructure). For S3: use boto3, upload to bucket repwise-progress-photos/{user_id}/{photo_id}.jpg. Store URL in progress_photos table. For local: save to /uploads/progress_photos/{user_id}/{photo_id}.jpg, serve via static file endpoint. Implement privacy: only user can access their own photos.
Depends on: Step 8 (models)
Parallel: can run alongside Step 11
Test: Unit tests with mocked S3 client OR temp directory for local storage
Rollback: Delete file
Risk: 🟡 Medium — file storage can be complex, privacy critical
Time: L (3-4 hrs)
PR: Include in PR #4

Step 13: Create measurement router
Files: src/modules/measurements/router.py (C)
Details: Create FastAPI router with endpoints: POST /measurements (body: MeasurementCreate, calls service.create_measurement), GET /measurements (query: start_date, end_date, pagination, calls service.get_measurements), GET /measurements/latest (calls service.get_latest_measurement), GET /measurements/{id} (calls service.get_measurement_by_id), PUT /measurements/{id} (body: MeasurementUpdate, calls service.update_measurement), DELETE /measurements/{id} (calls service.delete_measurement), GET /measurements/trend (query: days, calls service.get_trend_data), POST /measurements/{id}/photos (multipart form with file, calls photo_service.upload_photo), GET /measurements/{id}/photos (calls photo_service.get_photos), DELETE /photos/{id} (calls photo_service.delete_photo). All require authentication.
Depends on: Steps 11-12
Parallel: sequential
Test: Integration tests with TestClient — test each endpoint, test file upload
Rollback: Delete file
Risk: 🟢 Low — standard REST API
Time: L (3-4 hrs)
PR: Include in PR #4

Step 14: Register measurements router
Files: src/main.py (M)
Details: Add import: `from src.modules.measurements.router import router as measurements_router`. Add: `app.include_router(measurements_router, prefix="/api/v1/measurements", tags=["measurements"])`.
Depends on: Step 13
Parallel: sequential
Test: Run app, check /docs — verify endpoints listed
Rollback: Remove import and include_router
Risk: 🟢 Low
Time: S (<15 min)
PR: Include in PR #4

🚦 CHECKPOINT 2: Backend API complete
Run:
  - `pytest tests/test_measurements.py -v`
  - `curl -X POST /api/v1/measurements -H "Authorization: Bearer <token>" -d '{"weight_kg": 80, "measured_at": "2026-03-07"}'` — verify 201
  - `curl /api/v1/measurements/latest` — verify returns measurement
Verify: All tests pass. All endpoints functional.

═══════════════════════════════════════════════
PHASE 4: ADAPTIVE ENGINE INTEGRATION
═══════════════════════════════════════════════

Step 15: Integrate measurements into adaptive engine
Files: src/modules/adaptive/engine.py (M)
Details: Modify calculate_tdee() to use latest body_fat_pct if available. Current logic uses Katch-McArdle if BF% provided in onboarding. Enhance: (1) query latest measurement with BF%, (2) if found and <30 days old, use it instead of onboarding value, (3) if waist/neck measurements present but no BF%, calculate Navy BF% on the fly, (4) log which BF% source used (onboarding vs measurement). This improves TDEE accuracy over time.
Depends on: Step 11 (measurement service)
Parallel: can start after checkpoint 2
Test: Unit test — create measurement with BF%, verify TDEE calculation uses it
Rollback: Remove measurement query, revert to onboarding-only BF%
Risk: 🟡 Medium — affects core TDEE calculation
Time: L (2-3 hrs)
PR: Include in PR #4

Step 16: Add weight trend to adaptive engine
Files: src/modules/adaptive/engine.py (M)
Details: Enhance weekly check-in to use measurement weight trend instead of only nutrition log weight. In generate_weekly_insights(): (1) query last 4 weeks of measurements, (2) calculate average weekly weight change, (3) compare to target rate (from goal), (4) adjust TDEE if deviation >10% (e.g., losing 0.3 kg/week when target is 0.5 kg/week → increase calories). This makes adaptive engine more responsive.
Depends on: Step 15
Parallel: sequential
Test: Integration test — create measurements showing weight plateau, trigger check-in, verify TDEE adjusted
Rollback: Remove weight trend logic
Risk: 🟡 Medium — affects TDEE adjustments
Time: L (2-3 hrs)
PR: Include in PR #4

🚦 CHECKPOINT 3: Adaptive engine integration complete
Verify: TDEE uses latest BF%. Weight trend affects adjustments. Tests pass.

═══════════════════════════════════════════════
PHASE 5: FRONTEND COMPONENTS
═══════════════════════════════════════════════

Step 17: Create MeasurementInput component
Files: app/components/measurements/MeasurementInput.tsx (C)
Details: Create form component with inputs for all measurement types. Props: {onSubmit: (data) => void, initialValues?: Partial<Measurement>}. Layout: Date picker (default today), Weight input (kg or lbs based on user preference), Body fat % input (optional, with "Calculate" button), Circumference inputs (collapsible sections: "Upper Body", "Lower Body"), Notes textarea. Use existing Input, Button components. Add unit conversion (kg ↔ lbs, cm ↔ inches). Validate: weight > 0, BF% 0-100, circumferences > 0. Show Navy calculator modal when "Calculate BF%" tapped.
Depends on: none (can start early)
Parallel: can run alongside backend work
Test: Component test — render, fill inputs, submit, verify validation
Rollback: Delete file
Risk: 🟢 Low — standard form
Time: L (3-4 hrs)
PR: Include in PR #4

Step 18: Create NavyBFCalculator component
Files: app/components/measurements/NavyBFCalculator.tsx (C)
Details: Create modal with inputs: Sex (male/female radio), Height (cm or inches), Waist (cm or inches), Neck (cm or inches), Hips (cm or inches, only for females). Calculate button calls Navy formula (replicate backend logic in TypeScript). Display result: "Estimated Body Fat: 18.5%". Add disclaimer: "This is an estimate. For accuracy, use DEXA or hydrostatic weighing." Add "Use This Value" button that fills BF% in parent form. Add "Learn More" link to article about body fat measurement methods.
Depends on: Step 10 (Navy formula)
Parallel: can run alongside Step 17
Test: Component test — input values, verify calculation matches backend
Rollback: Delete file
Risk: 🟢 Low — pure UI component
Time: M (60-90 min)
PR: Include in PR #4

Step 19: Create MeasurementTrendChart component
Files: app/components/measurements/MeasurementTrendChart.tsx (C)
Details: Create chart component using victory-native. Props: {data: Array<{date, weight, bodyFat}>, metric: 'weight'|'bodyFat'}. Render line chart with date on X-axis, metric on Y-axis. Add trend line (linear regression). Color code: weight loss = green (if goal is cutting), weight gain = green (if goal is bulking). Add annotations for significant changes (>2% in one week). Handle empty data gracefully.
Depends on: Step 1 (victory-native from Feature 2)
Parallel: can run alongside Steps 17-18
Test: Component test — render with various data, verify chart renders
Rollback: Delete file
Risk: 🟢 Low — similar to Feature 2 charts
Time: L (2-3 hrs)
PR: Include in PR #4

Step 20: Create ProgressPhotoGrid component
Files: app/components/measurements/ProgressPhotoGrid.tsx (C)
Details: Create grid component displaying progress photos. Props: {photos: Array<ProgressPhoto>, onPhotoPress: (photo) => void, onAddPhoto: () => void}. Layout: 2-column grid, each cell shows thumbnail with date overlay. Add photo button at end. On press, open full-screen viewer with swipe navigation. Add delete button (with confirmation). Use expo-image-picker for adding photos. Implement privacy indicator (lock icon if private).
Depends on: Step 1 (expo-image-picker)
Parallel: can run alongside Steps 17-19
Test: Component test — render with photos, simulate add/delete
Rollback: Delete file
Risk: 🟡 Medium — image handling can be complex
Time: L (3-4 hrs)
PR: Include in PR #4

═══════════════════════════════════════════════
CONTINUED IN PART 3...
═══════════════════════════════════════════════
