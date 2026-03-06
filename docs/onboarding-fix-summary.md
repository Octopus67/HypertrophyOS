# Onboarding Critical Bugs — Implementation Plan Summary

## Overview

**Total Scope:**
- 3 phases (Immediate, High Priority, Medium Priority)
- 18 new files, 29 modified files
- ~2,500 lines of code
- 60+ new tests
- 3-4 day implementation timeline

---

## Phase Breakdown

### Phase 1: Critical Bugs (Day 1 — 8 hours)
**Goal:** Fix data loss and infinite loop

1. Wire up onboarding completion API call
2. Remove skip option
3. Fix enum mismatches

**Files:** 6 modified, 1 new
**Tests:** 15 new tests
**Risk:** Medium (touches critical flow)

### Phase 2: Backend Preference Integration (Day 2 — 8 hours)
**Goal:** Make backend respect user preferences

1. Integrate diet_style into adaptive engine
2. Integrate protein_per_kg into adaptive engine
3. Integrate body_fat_pct into BMR calculation

**Files:** 3 modified
**Tests:** 15 new tests
**Risk:** Low (backward compatible, defaults for existing users)

### Phase 3: Advanced Settings UI (Day 3-4 — 16 hours)
**Goal:** Let users edit all onboarding fields

1. Create AdvancedSettingsSection with 8 sub-components
2. Add "Redo Onboarding" option
3. Wire up preference updates

**Files:** 10 new, 2 modified
**Tests:** 30 new tests
**Risk:** Low (additive, can be hidden if issues)

---

## Critical Path Dependencies

```
Phase 1.1 (API call) → MUST complete before 1.2 (remove skip)
Phase 1 → MUST complete before Phase 2 (backend needs data)
Phase 2 → MUST complete before Phase 3 (UI needs backend support)
```

---

## Success Metrics

**Phase 1:**
- Zero users stuck in onboarding loop
- 100% onboarding completion rate persists data
- Zero enum conversion errors

**Phase 2:**
- Keto users get <30g carbs (not 250g)
- Custom protein targets respected
- Body fat users get Katch-McArdle BMR

**Phase 3:**
- Users can edit all 12 onboarding fields
- Users can redo onboarding
- Zero support tickets about "can't change X"

---

## Rollback Strategy

Each phase is independently rollbackable:
- Phase 1: Revert 6 files, re-add skip
- Phase 2: Revert 3 files, backend ignores preferences (same as before)
- Phase 3: Hide AdvancedSettingsSection, remove redo button

---

## Documents Created

1. `docs/onboarding-fix-plan.md` — High-level plan
2. `docs/onboarding-fix-spec-part1.md` — Phase 1-2 detailed spec
3. `docs/onboarding-fix-spec-part2.md` — Phase 3 detailed spec

**All plans committed to git for review.**

---

## Approval Required

**Before implementation:**
- [ ] Scope approved (60+ tests, 47 files, 3-4 days)
- [ ] Phased approach approved
- [ ] Risk mitigation approved
- [ ] Test coverage approved

**After approval, I will:**
1. Implement Phase 1 (Day 1)
2. Run tests, get approval
3. Implement Phase 2 (Day 2)
4. Run tests, get approval
5. Implement Phase 3 (Day 3-4)
6. Full regression testing
7. Request final approval to commit & push

**No code will be committed without your explicit approval at each phase.**
