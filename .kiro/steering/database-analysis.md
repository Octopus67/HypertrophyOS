---
inclusion: always
---

# Database Analysis for Repwise Food Database

## Context

The Repwise app needs to store **2.36M food items** (~1.28 GB) plus user data (nutrition entries, training sessions, profiles). This document analyzes database options for production deployment.

## Storage Requirements

### Food Database (2.37M items)
- **Raw data:** 660 MB (avg 293 bytes/row)
- **PostgreSQL overhead:** 54 MB (row headers)
- **JSONB overhead:** 99 MB (micronutrients)
- **Indexes:** 496 MB (PK, GIN trigram, barcode, composite)
- **Total:** 1.28 GB

### User Data (10K users, 1 year)
- **Nutrition entries:** 3.5 GB (7.3M entries @ 500 bytes each)
- **Training sessions:** 2.9 GB (1.5M sessions @ 2KB each)
- **Other tables:** 477 MB (profiles, goals, achievements)
- **Total:** 6.66 GB

### Combined: **7.94 GB** for 10K users

---

## Database Options Evaluated

### Option 1: Neon (Current Provider)

**Free Tier:**
- Storage: 0.5 GB per project (up to 100 projects)
- Compute: 100 CU-hours/month
- Auto-suspend: 5 min idle, ~350ms cold start
- **Verdict:** ❌ Too small (0.5 GB vs 7.94 GB needed)

**Launch Plan (Usage-Based):**
- Base: $5/month minimum
- Storage: $0.35/GB/month
- Compute: $0.16/CU-hour
- Written data: $0.096/GB

**Cost at 10K users:**
- Storage: 7.94 GB × $0.35 = $2.78/mo
- Compute: 40-60 CU-hours × $0.16 = $6.40-$9.60/mo
- Written: 0.35 GB × $0.096 = $0.03/mo
- **Total: $14-17/month**

**Pros:**
- Full PostgreSQL with extensions (pg_trgm, pgvector, PostGIS)
- Code works as-is (no migration needed)
- Backed by Databricks (acquired 2025)
- Usage-based pricing (only pay for what you use)
- Auto-suspend reduces compute costs

**Cons:**
- Not free
- Cold starts (~350ms) on free tier

---

### Option 2: CockroachDB Serverless

**Free Tier:**
- Storage: 10 GB
- Compute: 50M Request Units (RUs)/month
- $15/month credit applied automatically
- Scales to zero, sub-second cold starts

**Storage Analysis:**
- 7.94 GB needed ✅ Fits with 2.06 GB headroom
- Can support ~13K users before hitting 10GB limit

**Request Units Analysis:**
- Food search (ILIKE on 2.36M rows): ~500 RU per search
- Per user/day: ~2,986 RU (5 searches, 2 logs, 2 dashboard loads, 1 analytics)
- Per user/month: ~89,580 RU
- **10K users = 896M RUs/month**
- Free tier: 50M RUs
- **Overage: 846M RUs = $169/month**

**Cost at 10K users:**
- Storage: $0 (within 10GB)
- RUs: $169/mo (overage)
- **Total: $169/month**

**Max free users:** ~558 users (50M RUs ÷ 89,580 RU/user)

**Pros:**
- 10GB free storage (enough for food database)
- Multi-region by default
- Horizontal scaling built-in
- Sub-second cold starts

**Cons:**
- RU model is expensive for search-heavy apps
- Partial pg_trgm support (missing word_similarity, distance operators)
- Requires `cockroachdb+asyncpg://` dialect (vendor lock-in)
- asyncpg compatibility issues (multiple active portals)
- Can terminate free tier "at any time without notice" (ToS)
- Credit card required for monthly free credits

---

### Option 3: Xata Lite

**Free Tier:**
- Storage: 15 GB (soft limit)
- Compute: Always-on, no cold starts
- Queries: Unlimited (75 req/sec rate limit)
- No credit card required

**Pros:**
- 15GB free — most generous
- Never pauses
- No cold starts

**Cons:**
- ❌ Limited PostgreSQL (no extensions, including pg_trgm)
- ❌ Product deprioritized (moved to lite.xata.io subdomain)
- ❌ Features being removed (search APIs, file APIs removed Jan 2025)
- ❌ Single team member only
- ❌ Can change/terminate free tier at any time (ToS)
- **Not recommended for production**

---

### Option 4: Lazy-Loading Architecture (Stay on Neon Free)

**Approach:**
- Keep 8,034 USDA items in Neon free tier (fits in 512MB)
- Query Open Food Facts API for community items on-demand
- Cache results in PostgreSQL
- DB grows organically to 50K-200K items (not 2.36M)

**Cost:** $0/month

**Pros:**
- Zero cost
- Full PostgreSQL compatibility
- DB never exceeds free tier limits

**Cons:**
- First search for a food is slower (300-500ms API call)
- Requires implementing cache-aside pattern
- Depends on external API availability

---

## Cost Comparison Summary

| Provider | 1K Users | 10K Users | 50K Users | Notes |
|----------|----------|-----------|-----------|-------|
| **Neon Launch** | $6 | $15 | $57 | Usage-based, auto-suspend |
| **CockroachDB** | $8 | $169 | $796 | RU overages expensive |
| **Lazy-Loading** | $0 | $0 | $0 | API-dependent, slower first search |
| **Railway PG** | $5 | $7 | $15 | Simple, same platform as app |

---

## Recommendation

### For Launch (0-2K users):
**Use Neon Launch** at $6-8/month. Full PostgreSQL, your code works as-is, usage-based pricing.

### For Growth (2K-10K users):
**Stay on Neon Launch** at $14-17/month. Still cheaper than alternatives, scales smoothly.

### For Scale (50K+ users):
Consider **Railway PostgreSQL** or **self-hosted** for cost optimization. At 50K users, Neon is $57/mo vs Railway ~$15/mo.

### If Budget is $0:
**Implement lazy-loading** — keep 8K USDA items in Neon free, query OFF API for the rest, cache results. Trade-off: slower first search for each food.

---

## Decision: Neon Launch ($14-17/mo at 10K users)

**Rationale:**
- 10x cheaper than CockroachDB at scale
- Full PostgreSQL (no compatibility issues)
- Zero migration effort
- Stable company (Databricks-backed)
- Usage-based pricing aligns with growth

**Action:** Upgrade Neon project to Launch plan, run OFF import to add 2.36M items.

---

## Current Production Status

**Database:** Neon free tier (512MB)
**Items:** 8,034 (7,890 USDA + 144 verified)
**Coverage:** All whole foods with rich micronutrients (15-20 nutrients per item)
**Status:** ✅ Production-ready for launch

**Next step:** Upgrade to Neon Launch when ready to import full 2.36M items.
