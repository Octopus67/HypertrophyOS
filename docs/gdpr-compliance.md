# GDPR Compliance — Data Export (Article 20)

## Overview

This document covers GDPR Article 20 (Right to Data Portability) compliance for the Repwise platform.

## GDPR Article 20 Requirements

### 1. Right to Data Portability
Users have the right to receive their personal data in a **structured, commonly used, and machine-readable format**.

### 2. Scope of Data Exported
All user-provided data is included in exports:

| Data Category | Tables | Format |
|---|---|---|
| Profile | `user_profiles`, `users` (email only) | JSON, CSV, PDF |
| Body Metrics | `user_metrics`, `bodyweight_logs` | JSON, CSV, PDF |
| Nutrition | `nutrition_entries`, `custom_meals`, `meal_favorites` | JSON, CSV, PDF |
| Training | `training_sessions` | JSON, CSV, PDF |
| Measurements | `body_measurements` | JSON, CSV, PDF |
| Progress Photos | `progress_photos` (URLs only) | JSON, CSV, PDF |
| Achievements | `user_achievements` | JSON, CSV, PDF |
| Goals | `user_goals` | JSON, CSV, PDF |

### 3. Supported Export Formats
- **JSON**: Machine-readable, single file with all data categories
- **CSV**: One CSV per data category, bundled in a ZIP with a README
- **PDF**: Human-readable formatted report with summary statistics

### 4. Timing Requirements
- Exports must be fulfilled **without undue delay** and within **one month** (Article 12(3))
- Our target: background processing completes within **5 minutes** for typical users

### 5. Rate Limiting
- Maximum **1 export request per 24 hours** per user (prevents abuse per Article 12(5))
- Excessive or manifestly unfounded requests may be refused

### 6. Data Retention for Exports
- Generated export files are retained for **7 days** after creation
- Expired exports are automatically cleaned up by a background job
- Users are notified when their export is ready for download

### 7. Security Measures
- Exports are stored in user-scoped directories: `/exports/{user_id}/{export_id}.{ext}`
- Download endpoints verify user ownership before serving files
- Files are deleted after expiry to minimize data exposure

### 8. Implementation
- **ExportService**: Handles export generation in JSON, CSV, and PDF formats
- **Background Worker** (`src/jobs/export_worker.py`): Processes export requests asynchronously
- **Cleanup Job** (`src/jobs/cleanup_exports.py`): Removes expired export files
- **Export Router**: 5 REST endpoints for requesting, checking, downloading, listing, and deleting exports

### 9. Audit Trail
All export requests and downloads are logged for compliance auditing.
