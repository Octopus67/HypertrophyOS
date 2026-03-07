/**
 * Trial reminder notification content by days remaining.
 */

export interface TrialReminder {
  title: string;
  body: string;
}

export function getTrialReminder(daysRemaining: number): TrialReminder | null {
  switch (daysRemaining) {
    case 4: // day 3 of trial
      return {
        title: "You're halfway through your trial! 🏋️",
        body: 'Keep exploring premium features — coaching, analytics & more.',
      };
    case 1: // day 6 of trial
      return {
        title: 'Last day of your trial tomorrow ⏰',
        body: 'Upgrade now to keep all your premium features.',
      };
    case 0: // day 7 of trial
      return {
        title: 'Your trial ends today 🔔',
        body: "Upgrade to keep premium access to coaching, analytics & insights.",
      };
    default:
      return null;
  }
}
