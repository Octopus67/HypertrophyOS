import {
  computeDaysRemaining,
  getTrialCountdownLabel,
  getTrialReminderType,
} from '../../utils/trialLogic';
import { getTrialReminder } from '../../utils/trialReminders';

describe('trialLogic', () => {
  describe('computeDaysRemaining', () => {
    it('returns 0 for null input', () => {
      expect(computeDaysRemaining(null)).toBe(0);
    });

    it('returns 0 for past date', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(computeDaysRemaining(past)).toBe(0);
    });

    it('returns positive days for future date', () => {
      const future = new Date(Date.now() + 3 * 86400000).toISOString();
      const result = computeDaysRemaining(future);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(4);
    });

    it('returns 7 for date 7 days in future', () => {
      const future = new Date(Date.now() + 7 * 86400000).toISOString();
      const result = computeDaysRemaining(future);
      expect(result).toBeGreaterThanOrEqual(6);
      expect(result).toBeLessThanOrEqual(8);
    });
  });

  describe('getTrialCountdownLabel', () => {
    it('returns "Trial expired" for 0 days', () => {
      expect(getTrialCountdownLabel(0)).toBe('Trial expired');
    });

    it('returns "1 day left" for 1 day', () => {
      expect(getTrialCountdownLabel(1)).toBe('1 day left');
    });

    it('returns "5 days left" for 5 days', () => {
      expect(getTrialCountdownLabel(5)).toBe('5 days left');
    });
  });

  describe('getTrialReminderType', () => {
    it('returns halfway at 4 days remaining', () => {
      expect(getTrialReminderType(4)).toBe('halfway');
    });

    it('returns last_day_tomorrow at 1 day remaining', () => {
      expect(getTrialReminderType(1)).toBe('last_day_tomorrow');
    });

    it('returns last_day at 0 days remaining', () => {
      expect(getTrialReminderType(0)).toBe('last_day');
    });

    it('returns null for other days', () => {
      expect(getTrialReminderType(6)).toBeNull();
      expect(getTrialReminderType(3)).toBeNull();
    });
  });
});

describe('trialReminders', () => {
  it('returns halfway reminder at 4 days', () => {
    const reminder = getTrialReminder(4);
    expect(reminder).not.toBeNull();
    expect(reminder!.title).toContain('halfway');
  });

  it('returns last day tomorrow reminder at 1 day', () => {
    const reminder = getTrialReminder(1);
    expect(reminder).not.toBeNull();
    expect(reminder!.title).toContain('Last day');
  });

  it('returns trial ends today at 0 days', () => {
    const reminder = getTrialReminder(0);
    expect(reminder).not.toBeNull();
    expect(reminder!.title).toContain('ends today');
  });

  it('returns null for non-reminder days', () => {
    expect(getTrialReminder(6)).toBeNull();
    expect(getTrialReminder(3)).toBeNull();
    expect(getTrialReminder(2)).toBeNull();
  });
});
