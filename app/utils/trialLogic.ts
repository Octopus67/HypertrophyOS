/**
 * Trial-related utility functions and types.
 */

export interface TrialStatus {
  active: boolean;
  has_used_trial: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  days_remaining: number;
}

export interface TrialEligibility {
  eligible: boolean;
  has_used_trial: boolean;
}

export interface TrialInsights {
  workouts_logged: number;
  prs_hit: number;
  total_volume_kg: number;
  meals_logged: number;
  measurements_tracked: number;
  trial_started_at: string;
  trial_ends_at: string;
}

/** Compute days remaining from an ISO end date string. */
export function computeDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Get a human-readable trial countdown label. */
export function getTrialCountdownLabel(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'Trial expired';
  if (daysRemaining === 1) return '1 day left';
  return `${daysRemaining} days left`;
}

/** Determine which reminder notification to show based on days remaining. */
export function getTrialReminderType(
  daysRemaining: number,
): 'halfway' | 'last_day_tomorrow' | 'last_day' | null {
  if (daysRemaining === 4) return 'halfway'; // day 3 of 7
  if (daysRemaining === 1) return 'last_day_tomorrow'; // day 6
  if (daysRemaining === 0) return 'last_day'; // day 7
  return null;
}
