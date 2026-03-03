"""Rule-based recommendation engine — pure function, no DB access."""

from __future__ import annotations

from src.modules.reports.mev_reference import MEV_SETS
from src.modules.reports.schemas import ReportContext

FALLBACK = "Keep logging consistently — more data means better insights."


def generate_recommendations(ctx: ReportContext) -> list[str]:
    """Return 3–5 actionable recommendations based on weekly metrics."""
    matched: list[str] = []

    # Rule 1: No data at all
    if ctx.days_logged_training == 0 and ctx.days_logged_nutrition == 0:
        matched.append("Start logging your meals and workouts — even one entry helps build your baseline.")
        matched.append("Consistency is key. Try logging at least one meal and one workout this week.")
        return matched[:5]

    # Rule 2: WNS-based volume insight (preferred over set counting)
    if ctx.wns_hypertrophy_units:
        # Find the muscle with highest HU
        best_mg = max(ctx.wns_hypertrophy_units, key=ctx.wns_hypertrophy_units.get)
        best_hu = ctx.wns_hypertrophy_units[best_mg]
        # Find muscles with zero HU that have MEV > 0
        neglected = [mg for mg in MEV_SETS if ctx.wns_hypertrophy_units.get(mg, 0) == 0]
        if neglected:
            matched.append(
                f"You haven't trained {neglected[0]} this week — consider adding 2-3 sets to avoid atrophy."
            )
        if best_hu > 0:
            matched.append(
                f"Strongest stimulus this week: {best_mg} at {best_hu:.1f} HU."
            )
    else:
        # Fallback to set-based MEV check
        worst_deficit = 0
        worst_group = ""
        worst_sets = 0
        worst_mev = 0
        for group, mev in MEV_SETS.items():
            current_sets = ctx.sets_by_muscle_group.get(group, 0)
            deficit = mev - current_sets
            if deficit > worst_deficit:
                worst_deficit = deficit
                worst_group = group
                worst_sets = current_sets
                worst_mev = mev
        if worst_group and worst_deficit > 0:
            matched.append(
                f"Increase {worst_group} volume — only {worst_sets} sets this week (MEV is {worst_mev})."
            )

    # Rule 3: Micronutrient score insight
    if ctx.nutrient_score is not None:
        if ctx.nutrient_score >= 80:
            matched.append(
                f"Nutrient Quality Score: {ctx.nutrient_score:.0f}/100 — excellent micronutrient coverage."
            )
        elif ctx.nutrient_score >= 50:
            matched.append(
                f"Nutrient Quality Score: {ctx.nutrient_score:.0f}/100 — check your Micronutrient Dashboard for gaps."
            )
        elif ctx.nutrient_score > 0:
            matched.append(
                f"Nutrient Quality Score: {ctx.nutrient_score:.0f}/100 — several deficiencies detected. Review your Micronutrient Dashboard."
            )

    # Rule 4: Nutrition compliance (relaxed to ±10%)
    if ctx.days_logged_nutrition > 0:
        if ctx.compliance_pct > 80:
            matched.append(
                f"Nutrition compliance: {ctx.compliance_pct:.0f}% — solid consistency."
            )
        elif ctx.compliance_pct < 50:
            matched.append(
                f"Nutrition compliance was {ctx.compliance_pct:.0f}% this week — try prepping meals ahead."
            )

    # Rule 5: Weight-goal alignment
    if ctx.weight_trend is not None:
        if ctx.goal_type == "cutting" and ctx.weight_trend > 0.3:
            matched.append(
                "Weight trending up during a cut — consider reducing calories by ~200kcal."
            )
        elif ctx.goal_type == "cutting" and ctx.weight_trend <= 0:
            matched.append(
                f"Weight down {abs(ctx.weight_trend):.1f}kg this week — on track for your cut."
            )
        elif ctx.goal_type == "bulking" and ctx.weight_trend < -0.3:
            matched.append(
                "Weight trending down during a bulk — consider increasing calories by ~200kcal."
            )
        elif ctx.goal_type == "bulking" and ctx.weight_trend >= 0:
            matched.append(
                f"Weight up {ctx.weight_trend:.1f}kg this week — on track for your bulk."
            )
        elif ctx.goal_type == "maintaining" and abs(ctx.weight_trend) < 0.3:
            matched.append("Weight stable this week — right on target for maintenance.")

    # Rule 6: PR celebration
    if ctx.prs:
        pr = ctx.prs[0]
        matched.append(f"New PR on {pr.exercise_name} — {pr.new_weight_kg}kg × {pr.reps}! 🎉")

    # Ensure at least 2 recommendations
    if len(matched) < 2:
        matched.append(FALLBACK)

    return matched[:5]
