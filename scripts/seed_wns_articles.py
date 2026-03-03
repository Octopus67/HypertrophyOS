"""Seed script for new WNS-era research articles.

Adds 7 new articles covering concepts that directly tie into the app's
WNS volume tracking, micronutrient dashboard, and fatigue engine features.

Run: .venv/bin/python scripts/seed_wns_articles.py
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

NEW_ARTICLES = [
    # ═══════════════════════════════════════════════════════════════════
    # 1. Stimulating Reps — ties directly into HU display
    # ═══════════════════════════════════════════════════════════════════
    {
        "module_slug": "hypertrophy-science",
        "title": "Not All Reps Are Created Equal: The Stimulating Reps Model",
        "tags": ["stimulating-reps", "mechanical-tension", "motor-units", "hypertrophy"],
        "estimated_read_time_min": 6,
        "is_premium": False,
        "content_markdown": """# Not All Reps Are Created Equal: The Stimulating Reps Model

## The Concept

When you perform a set of 10 reps, how many of those reps actually contribute to muscle growth? According to researcher Chris Beardsley and the mechanical tension model of hypertrophy, the answer is: **only the last ~5.**

## The Science

Muscle growth is driven by **mechanical tension on individual muscle fibers** — not the total force your muscle produces. For a fiber to experience high mechanical tension, two conditions must be met simultaneously:

1. **The fiber must be activated** — high-threshold motor units (which control the largest, most growth-capable fibers) are only recruited when the muscle is working hard
2. **The fiber must be contracting slowly** — due to the force-velocity relationship, slower contractions produce more tension per fiber

During the early reps of a moderate-load set, your body recruits only low-threshold motor units and moves the weight quickly. It's only in the **final ~5 reps before failure** — when fatigue forces full motor unit recruitment and bar speed slows dramatically — that both conditions are met.

**Beardsley CB.** Hypertrophy: Muscle fiber growth caused by mechanical tension. *S&C Research.* 2019.

## What This Means for Your Training

| Set Scenario | Total Reps | Stimulating Reps |
|-------------|-----------|-----------------|
| 10 reps to failure | 10 | ~5 |
| 20 reps to failure | 20 | ~5 |
| 5 reps to failure (heavy) | 5 | 5 (all) |
| 10 reps with 4 reps left in tank | 10 | ~0 |

This explains two surprising findings:
- **All rep ranges produce similar hypertrophy** when taken close to failure (because they all produce ~5 stimulating reps)
- **Easy sets are "junk volume"** — if you stop 4+ reps from failure, you get almost zero growth stimulus

## The Exception: Heavy Loads

At loads ≥85% of your 1RM (roughly a 5-rep max), motor unit recruitment is high from the very first rep. This means **every rep is a stimulating rep** — making heavy training uniquely efficient.

---

## 🎯 Practical Takeaway

**Quality beats quantity.** Three hard sets taken within 1-3 reps of failure produce more growth stimulus than six easy sets with plenty left in the tank. When Repwise shows your Hypertrophy Units, it's counting these stimulating reps — not just your total sets.

---

*Based on: Beardsley CB. Hypertrophy (2019); Schoenfeld BJ et al. J Strength Cond Res. 2017. PMID: 28834797*
""",
    },
    # ═══════════════════════════════════════════════════════════════════
    # 2. Junk Volume — explains why HU penalizes easy sets
    # ═══════════════════════════════════════════════════════════════════
    {
        "module_slug": "hypertrophy-science",
        "title": "Junk Volume: When More Training Actually Hurts Your Gains",
        "tags": ["junk-volume", "overtraining", "fatigue", "recovery"],
        "estimated_read_time_min": 5,
        "is_premium": False,
        "content_markdown": """# Junk Volume: When More Training Actually Hurts Your Gains

## The Problem

You've heard "more volume = more growth." So you add sets. And more sets. But your progress stalls — or worse, reverses. What happened?

You ran into **junk volume**: training that creates fatigue without producing meaningful growth stimulus.

## What Makes Volume "Junk"?

Based on the stimulating reps model, a set becomes junk volume when it fails to produce stimulating reps. This happens in two scenarios:

**1. Sets too far from failure (RPE ≤ 6 / RIR ≥ 4)**

If you finish a set and could have done 4+ more reps, your high-threshold motor units were barely recruited. The set created metabolic fatigue and joint stress but almost zero growth signal.

**2. Excessive sets in a single session**

Even hard sets suffer diminishing returns. Research shows that **6 sets produce only ~2× the stimulus of 1 set** — not 6×. By your 8th or 10th set for the same muscle in one session, each additional set contributes almost nothing while piling on fatigue.

**Schoenfeld BJ, Ogborn D, Krieger JW.** Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci.* 2017;35(11):1073-1082. **PMID: 27433992**

## The Net Stimulus Problem

Your body doesn't just grow from training — it also experiences **atrophy between sessions** when the growth signal fades (~48 hours post-workout). Junk volume adds fatigue that impairs recovery without adding stimulus, effectively *reducing* your net weekly growth.

This is why the Weekly Net Stimulus model subtracts atrophy from gross stimulus. A lifter doing 20 junk sets per week may have a *lower* net stimulus than someone doing 9 hard sets.

---

## 🎯 Practical Takeaway

**If your RPE is below 7 on most sets, you're accumulating junk volume.** Cut your sets by 30-40% and push the remaining ones harder (RPE 7-9). Your Hypertrophy Units will likely go *up* even though your total sets went down. That's the power of training quality over quantity.

---

*Based on: Beardsley CB. S&C Research (2019); Schoenfeld et al. J Sports Sci. 2017. PMID: 27433992*
""",
    },
    # ═══════════════════════════════════════════════════════════════════
    # 3. Training Frequency — ties into atrophy model
    # ═══════════════════════════════════════════════════════════════════
    {
        "module_slug": "hypertrophy-science",
        "title": "Why Training a Muscle 3× Per Week Beats 1× (Even With the Same Sets)",
        "tags": ["frequency", "atrophy", "protein-synthesis", "programming"],
        "estimated_read_time_min": 5,
        "is_premium": False,
        "content_markdown": """# Why Training a Muscle 3× Per Week Beats 1× (Even With the Same Sets)

## The Study

**Schoenfeld BJ, Ogborn D, Krieger JW.** Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis. *Sports Med.* 2016;46(11):1689-1697. **PMID: 27102172**

## What They Found

Training a muscle group at least twice per week produced significantly greater hypertrophy than training it once per week — even when total weekly volume was identical.

But *why*? The answer lies in the biology of muscle protein synthesis (MPS).

## The 48-Hour Window

After a training session, muscle protein synthesis stays elevated for approximately **36-48 hours**. After that, it returns to baseline — and if you don't train again, a small amount of atrophy begins.

Here's what a week looks like for two lifters doing the same 6 total sets:

**Lifter A: 1×/week (6 sets Monday)**
- Mon: Train → MPS elevated
- Tue-Wed: MPS elevated → growth
- Thu-Sun: MPS at baseline → slow atrophy (4 days of loss)

**Lifter B: 3×/week (2 sets Mon/Wed/Fri)**
- Mon: Train → MPS elevated
- Tue: MPS elevated → growth
- Wed: Train again → MPS re-elevated (zero atrophy days)
- Thu: MPS elevated → growth
- Fri: Train again → MPS re-elevated
- Sat-Sun: MPS elevated → growth

Lifter B has **zero atrophy days** while Lifter A loses stimulus for 4 days. Same total sets, dramatically different net growth.

---

## 🎯 Practical Takeaway

**Spread your volume across 2-3 sessions per week per muscle group.** An upper/lower split (4 days) or push/pull/legs rotation (6 days) naturally achieves this. Your Hypertrophy Units account for this — you'll see higher net HU with the same sets spread across more sessions.

---

*Citation: Schoenfeld BJ et al. Sports Med. 2016;46(11):1689-1697. PMID: 27102172*
""",
    },
    # ═══════════════════════════════════════════════════════════════════
    # 4. Stretch-Mediated Hypertrophy — hot topic, high engagement
    # ═══════════════════════════════════════════════════════════════════
    {
        "module_slug": "hypertrophy-science",
        "title": "Stretch-Mediated Hypertrophy: Why Lengthened Partials Are Trending",
        "tags": ["stretch-mediated", "lengthened-partials", "ROM", "hypertrophy"],
        "estimated_read_time_min": 5,
        "is_premium": True,
        "content_markdown": """# Stretch-Mediated Hypertrophy: Why Lengthened Partials Are Trending

## The Discovery

One of the most exciting findings in recent hypertrophy research: **training muscles at long lengths produces more growth than training at short lengths** — sometimes dramatically more.

## The Evidence

**Pedrosa GF et al.** Partial range of motion training elicits favorable improvements in muscular adaptations when carried out at long muscle lengths. *Eur J Sport Sci.* 2023;23(6):986-995. **PMID: 35819335**

Multiple studies now show that exercises emphasizing the stretched position of a muscle produce 1.5-2× more growth than the same exercises emphasizing the shortened position. This has been demonstrated in:

- **Preacher curls** (stretched biceps) vs. concentration curls (shortened)
- **Incline curls** vs. standing curls
- **Overhead tricep extensions** vs. pushdowns
- **Romanian deadlifts** vs. leg curls (for hamstrings)
- **Deep squats** vs. half squats

## Why It Works

The mechanism appears to involve **titin**, a giant protein that acts as a molecular spring inside muscle fibers. When a muscle is stretched under load, titin generates additional mechanical tension that adds to the active tension from the contractile proteins. This extra tension signal may trigger a unique growth pathway — potentially even adding new sarcomeres (contractile units) in series.

## Practical Exercise Swaps

| Standard Exercise | Stretch-Emphasis Alternative |
|------------------|----------------------------|
| Pushdowns | Overhead tricep extensions |
| Standing curls | Incline dumbbell curls |
| Leg curls | Romanian deadlifts |
| Half squats | Full-depth squats |
| Lateral raises | Cable lateral raises (behind body) |

---

## 🎯 Practical Takeaway

**Prioritize exercises that load the muscle in its stretched position.** You don't need to do only lengthened partials — full range of motion with emphasis on the stretch is sufficient. This is one of the few "free" gains available: same effort, more growth, just by choosing the right exercises.

---

*Citation: Pedrosa GF et al. Eur J Sport Sci. 2023;23(6):986-995. PMID: 35819335*
""",
    },
    # ═══════════════════════════════════════════════════════════════════
    # 5. Deloads — ties into fatigue engine
    # ═══════════════════════════════════════════════════════════════════
    {
        "module_slug": "strength-programming",
        "title": "When to Deload: Reading Your Body's Fatigue Signals",
        "tags": ["deload", "fatigue", "recovery", "periodization"],
        "estimated_read_time_min": 5,
        "is_premium": True,
        "content_markdown": """# When to Deload: Reading Your Body's Fatigue Signals

## The Problem With Scheduled Deloads

Many programs prescribe deloads every 4th week regardless of how you feel. But research suggests that **reactive deloads** — triggered by actual fatigue signals — are more effective than arbitrary schedules.

## The Three Fatigue Signals

**1. Strength Regression (Most Reliable)**

If your estimated 1RM on a key lift declines for 2-3 consecutive sessions, accumulated fatigue is likely exceeding your recovery capacity. This is the strongest signal that a deload is needed.

**2. Elevated RPE at Same Loads**

If weights that used to feel like RPE 7 now feel like RPE 9, your neuromuscular system is fatigued even if you're still hitting your numbers.

**3. Motivation and Sleep Quality**

Persistent lack of training motivation combined with disrupted sleep often indicates systemic fatigue that goes beyond a single muscle group.

**Pritchard HJ et al.** Tapering practices of New Zealand's elite raw powerlifters. *J Strength Cond Res.* 2016;30(7):1796-1804. **PMID: 26670990**

## How to Deload

The research supports two effective approaches:

**Volume Deload (Recommended):** Keep intensity (weight) the same but cut volume by 40-60%. Do 2-3 sets per muscle instead of your normal 4-6. This maintains the neural adaptations while allowing tissue recovery.

**Intensity Deload:** Reduce weight by 10-15% while keeping volume similar. Less effective for maintaining strength but useful when joints are the limiting factor.

---

## 🎯 Practical Takeaway

**Don't deload on a schedule — deload when your body tells you to.** Repwise's fatigue detection tracks your strength trends automatically. When you see a "High Fatigue" warning with declining e1RM, that's your signal. Cut volume by half for one week, then resume.

---

*Based on: Pritchard HJ et al. J Strength Cond Res. 2016. PMID: 26670990; Beardsley CB. S&C Research (2019)*
""",
    },
    # ═══════════════════════════════════════════════════════════════════
    # 6. Micronutrient Deficiencies in Lifters — ties into micro dashboard
    # ═══════════════════════════════════════════════════════════════════
    {
        "module_slug": "nutrition-protein",
        "title": "The 5 Micronutrient Deficiencies That Silently Kill Your Gains",
        "tags": ["micronutrients", "deficiency", "recovery", "performance"],
        "estimated_read_time_min": 6,
        "is_premium": False,
        "content_markdown": """# The 5 Micronutrient Deficiencies That Silently Kill Your Gains

## The Hidden Problem

You track your protein. You hit your calories. But you're still not recovering well, your strength is plateauing, and you feel run down. The culprit might not be your training — it might be **micronutrient deficiencies** that you're not tracking.

Research shows that even mild deficiencies in key micronutrients can impair muscle protein synthesis, reduce testosterone, increase inflammation, and slow recovery.

## The Big 5 Deficiencies for Lifters

### 1. Vitamin D (40%+ of adults are deficient)

Vitamin D receptors exist in muscle tissue. Low levels are associated with reduced muscle protein synthesis, lower testosterone, and increased injury risk. Most lifters who train indoors are deficient.

**Fix:** 2,000-4,000 IU daily, or get 15 minutes of midday sun. **RDA: 15 mcg (600 IU).**

### 2. Magnesium (50%+ of athletes are deficient)

Critical for muscle contraction, protein synthesis, and sleep quality. Intense training increases magnesium loss through sweat. Deficiency causes muscle cramps, poor sleep, and impaired recovery.

**Fix:** 400-420mg daily for men, 310-320mg for women. Dark chocolate, spinach, almonds, and avocados are excellent sources.

### 3. Iron (Especially for female lifters)

Iron carries oxygen to muscles. Deficiency causes fatigue, reduced work capacity, and impaired adaptation to training. Female lifters are at particularly high risk due to menstrual losses.

**Fix:** 8mg daily for men, 18mg for women. Red meat, lentils, and spinach. Pair with vitamin C for better absorption.

### 4. Zinc (Common in plant-based diets)

Zinc is essential for testosterone production and immune function. Heavy training increases zinc requirements. Deficiency impairs muscle growth and increases illness frequency.

**Fix:** 11mg daily for men, 8mg for women. Oysters, beef, pumpkin seeds, and chickpeas.

### 5. Omega-3 Fatty Acids (Most Western diets are deficient)

EPA and DHA reduce exercise-induced inflammation, improve muscle protein synthesis signaling, and may reduce muscle soreness. The typical Western diet has an omega-6:omega-3 ratio of 15:1 (optimal is 2-4:1).

**Fix:** 1.6g daily for men, 1.1g for women. Fatty fish 2-3× per week, or supplement with fish oil.

---

## 🎯 Practical Takeaway

**Track your micronutrients, not just your macros.** Repwise's Micronutrient Dashboard shows your daily intake vs. RDA for all 27 tracked nutrients. Focus on the "Needs Work" section first — fixing your worst deficiencies will have the biggest impact on recovery and performance.

---

*Based on: Thomas DT et al. J Acad Nutr Diet. 2016;116(3):501-528. PMID: 26920240*
""",
    },
    # ═══════════════════════════════════════════════════════════════════
    # 7. Compound vs Isolation — ties into fractional volume
    # ═══════════════════════════════════════════════════════════════════
    {
        "module_slug": "strength-programming",
        "title": "Compound vs. Isolation: How Exercises Share Volume Across Muscles",
        "tags": ["compound", "isolation", "volume", "exercise-selection"],
        "estimated_read_time_min": 5,
        "is_premium": False,
        "content_markdown": """# Compound vs. Isolation: How Exercises Share Volume Across Muscles

## The Volume Counting Problem

When you do a bench press, does it count as chest volume? Tricep volume? Shoulder volume? The answer matters more than you think — and most apps get it wrong by only counting the "primary" muscle.

## How Volume Actually Distributes

Research using EMG (electromyography) and the fractional volume counting method from meta-analyses shows that compound exercises distribute their growth stimulus across multiple muscles:

| Exercise | Primary (1.0×) | Secondary (0.5×) |
|----------|---------------|-----------------|
| Bench Press | Chest | Triceps, Front Delts |
| Barbell Row | Back | Biceps, Rear Delts |
| Squat | Quads | Glutes, Adductors |
| Overhead Press | Shoulders | Triceps |
| Pull-ups | Lats | Biceps |
| Romanian Deadlift | Hamstrings | Glutes, Erectors |

**Pelland JC et al.** The Resistance Training Dose-Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gain. *SportRxiv.* 2022. **Preprint #460**

## Why This Matters

If you do 9 sets of bench press and 6 sets of overhead press per week, your triceps are getting:

- 9 × 0.5 = 4.5 sets from bench
- 6 × 0.5 = 3.0 sets from OHP
- **Total: 7.5 effective sets for triceps** — without a single isolation exercise

This means many lifters are already hitting adequate tricep and bicep volume through compounds alone. Adding 6 more sets of isolation work might push them past their Maximum Recoverable Volume.

## The Practical Framework

**Step 1:** Count your compound volume with fractional credits
**Step 2:** Check if secondary muscles are already near their MAV
**Step 3:** Only add isolation work for muscles that are genuinely under-stimulated

---

## 🎯 Practical Takeaway

**Repwise tracks fractional volume automatically.** When you see "Triceps: 8.2 HU" and you haven't done a single tricep isolation exercise, that's your compound movements contributing fractional volume. Check your muscle dashboard before adding isolation work — you might already be in the optimal zone.

---

*Based on: Pelland JC et al. SportRxiv Preprint #460 (2022); Beardsley CB. S&C Research (2019)*
""",
    },
]


async def seed_articles():
    import sys
    sys.path.insert(0, ".")
    from src.config.database import async_session_factory
    from src.modules.content.models import ContentArticle, ContentModule

    async with async_session_factory() as session:
        # Get existing modules
        result = await session.execute(select(ContentModule))
        modules = {m.slug: m for m in result.scalars().all()}

        inserted = 0
        for article_data in NEW_ARTICLES:
            module_slug = article_data["module_slug"]
            module = modules.get(module_slug)
            if not module:
                print(f"Module '{module_slug}' not found, skipping: {article_data['title']}")
                continue

            # Check if article already exists
            existing = await session.execute(
                select(ContentArticle).where(ContentArticle.title == article_data["title"])
            )
            if existing.scalar_one_or_none():
                print(f"Already exists: {article_data['title']}")
                continue

            article = ContentArticle(
                id=uuid.uuid4(),
                module_id=module.id,
                title=article_data["title"],
                content_markdown=article_data["content_markdown"].strip(),
                status="published",
                is_premium=article_data["is_premium"],
                version=1,
                tags=article_data["tags"],
                estimated_read_time_min=article_data["estimated_read_time_min"],
                published_at=datetime.now(timezone.utc),
            )
            session.add(article)
            inserted += 1
            print(f"Inserted: {article_data['title']}")

        await session.commit()
        print(f"\nDone. Inserted {inserted} new articles.")


if __name__ == "__main__":
    asyncio.run(seed_articles())
