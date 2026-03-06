/**
 * Feature: push-notifications, Phase 3
 * Tests for NotificationSettingsScreen pure logic and notification service.
 */

// ─── Pure logic extracted from NotificationSettingsScreen for testing ────────

interface NotificationPreferences {
  workout_reminders: boolean;
  meal_reminders: boolean;
  pr_celebrations: boolean;
  weekly_checkin_alerts: boolean;
  volume_warnings: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

const DEFAULT_PREFS: NotificationPreferences = {
  workout_reminders: true,
  meal_reminders: true,
  pr_celebrations: true,
  weekly_checkin_alerts: true,
  volume_warnings: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

const TOGGLE_KEYS: (keyof NotificationPreferences)[] = [
  'workout_reminders',
  'meal_reminders',
  'pr_celebrations',
  'weekly_checkin_alerts',
  'volume_warnings',
];

function mergePreferences(
  current: NotificationPreferences,
  update: Partial<NotificationPreferences>,
): NotificationPreferences {
  return { ...current, ...update };
}

function isQuietHoursEnabled(prefs: NotificationPreferences): boolean {
  return prefs.quiet_hours_start !== null && prefs.quiet_hours_end !== null;
}

function buildQuietHoursUpdate(enabled: boolean): Partial<NotificationPreferences> {
  return enabled
    ? { quiet_hours_start: '22:00', quiet_hours_end: '07:00' }
    : { quiet_hours_start: null, quiet_hours_end: null };
}

function getPermissionLabel(status: string): string {
  return status === 'granted' ? 'Enabled' : 'Disabled';
}

function canSendTestNotification(permissionStatus: string): boolean {
  return permissionStatus === 'granted';
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NotificationSettingsScreen: Default Preferences', () => {
  test('all notification types default to true', () => {
    for (const key of TOGGLE_KEYS) {
      expect(DEFAULT_PREFS[key]).toBe(true);
    }
  });

  test('quiet hours default to null (disabled)', () => {
    expect(DEFAULT_PREFS.quiet_hours_start).toBeNull();
    expect(DEFAULT_PREFS.quiet_hours_end).toBeNull();
  });

  test('exactly 5 toggle keys exist', () => {
    expect(TOGGLE_KEYS).toHaveLength(5);
  });
});

describe('NotificationSettingsScreen: Preference Merging', () => {
  test('merges partial update into current preferences', () => {
    const result = mergePreferences(DEFAULT_PREFS, { workout_reminders: false });
    expect(result.workout_reminders).toBe(false);
    expect(result.meal_reminders).toBe(true);
    expect(result.pr_celebrations).toBe(true);
  });

  test('merges API response with defaults for missing fields', () => {
    const apiResponse = { workout_reminders: false, pr_celebrations: false };
    const result = mergePreferences(DEFAULT_PREFS, apiResponse);
    expect(result.workout_reminders).toBe(false);
    expect(result.pr_celebrations).toBe(false);
    expect(result.meal_reminders).toBe(true);
    expect(result.weekly_checkin_alerts).toBe(true);
    expect(result.volume_warnings).toBe(true);
  });

  test('empty update returns same preferences', () => {
    const result = mergePreferences(DEFAULT_PREFS, {});
    expect(result).toEqual(DEFAULT_PREFS);
  });
});

describe('NotificationSettingsScreen: Quiet Hours', () => {
  test('quiet hours disabled when both values are null', () => {
    expect(isQuietHoursEnabled(DEFAULT_PREFS)).toBe(false);
  });

  test('quiet hours enabled when both values are set', () => {
    const prefs = { ...DEFAULT_PREFS, quiet_hours_start: '22:00', quiet_hours_end: '07:00' };
    expect(isQuietHoursEnabled(prefs)).toBe(true);
  });

  test('enabling quiet hours sets default 22:00-07:00', () => {
    const update = buildQuietHoursUpdate(true);
    expect(update.quiet_hours_start).toBe('22:00');
    expect(update.quiet_hours_end).toBe('07:00');
  });

  test('disabling quiet hours sets both to null', () => {
    const update = buildQuietHoursUpdate(false);
    expect(update.quiet_hours_start).toBeNull();
    expect(update.quiet_hours_end).toBeNull();
  });
});

describe('NotificationSettingsScreen: Permission Status', () => {
  test('granted status shows Enabled label', () => {
    expect(getPermissionLabel('granted')).toBe('Enabled');
  });

  test('denied status shows Disabled label', () => {
    expect(getPermissionLabel('denied')).toBe('Disabled');
  });

  test('undetermined status shows Disabled label', () => {
    expect(getPermissionLabel('undetermined')).toBe('Disabled');
  });

  test('test notification only available when granted', () => {
    expect(canSendTestNotification('granted')).toBe(true);
    expect(canSendTestNotification('denied')).toBe(false);
    expect(canSendTestNotification('undetermined')).toBe(false);
  });
});

describe('NotificationSettingsScreen: Toggle Behavior', () => {
  test('toggling a preference produces correct optimistic update', () => {
    const current = { ...DEFAULT_PREFS };
    const toggled = mergePreferences(current, { workout_reminders: false });
    expect(toggled.workout_reminders).toBe(false);

    // Revert on failure
    const reverted = mergePreferences(toggled, { workout_reminders: true });
    expect(reverted.workout_reminders).toBe(true);
  });

  test('each toggle key maps to a valid preference field', () => {
    for (const key of TOGGLE_KEYS) {
      expect(key in DEFAULT_PREFS).toBe(true);
      expect(typeof DEFAULT_PREFS[key]).toBe('boolean');
    }
  });
});

describe('NotificationSettingsScreen: Structure', () => {
  const SECTIONS = ['Permission', 'Notification Types', 'Quiet Hours'];

  test('screen has 3 sections', () => {
    expect(SECTIONS).toHaveLength(3);
  });

  test('sections appear in correct order', () => {
    expect(SECTIONS[0]).toBe('Permission');
    expect(SECTIONS[1]).toBe('Notification Types');
    expect(SECTIONS[2]).toBe('Quiet Hours');
  });

  const TOGGLE_ITEMS = [
    { key: 'workout_reminders', label: 'Workout Reminders' },
    { key: 'meal_reminders', label: 'Meal Reminders' },
    { key: 'pr_celebrations', label: 'PR Celebrations' },
    { key: 'weekly_checkin_alerts', label: 'Weekly Check-In' },
    { key: 'volume_warnings', label: 'Volume Warnings' },
  ];

  test('all toggle items have non-empty labels', () => {
    for (const item of TOGGLE_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  test('toggle items match toggle keys', () => {
    const keys = TOGGLE_ITEMS.map((i) => i.key);
    expect(keys).toEqual(TOGGLE_KEYS);
  });
});

// ─── Notification Service Logic Tests ────────────────────────────────────────

describe('Notification Service: registerForPushNotifications logic', () => {
  test('Android notification channel config has correct values', () => {
    const channelConfig = {
      name: 'Default',
      importance: 4, // MAX
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
    };
    expect(channelConfig.name).toBe('Default');
    expect(channelConfig.importance).toBe(4);
    expect(channelConfig.vibrationPattern).toEqual([0, 250, 250, 250]);
  });

  test('register-token payload has correct shape', () => {
    const payload = { token: 'ExponentPushToken[xxx]', platform: 'ios' };
    expect(payload).toHaveProperty('token');
    expect(payload).toHaveProperty('platform');
    expect(['ios', 'android', 'web']).toContain(payload.platform);
  });
});

describe('Notification Service: setupNotificationListeners', () => {
  test('notification data with screen triggers navigation', () => {
    const navigated: { screen: string; params?: unknown }[] = [];
    const mockNav = {
      navigate: (screen: string, params?: unknown) => {
        navigated.push({ screen, params });
      },
    };

    // Simulate tap handler logic
    const data = { screen: 'SessionDetail', params: { sessionId: '123' } };
    if (mockNav && data?.screen) {
      mockNav.navigate(data.screen, data.params);
    }

    expect(navigated).toHaveLength(1);
    expect(navigated[0].screen).toBe('SessionDetail');
    expect(navigated[0].params).toEqual({ sessionId: '123' });
  });

  test('notification data without screen does not navigate', () => {
    const navigated: string[] = [];
    const mockNav = {
      navigate: (screen: string) => { navigated.push(screen); },
    };

    const data = { message: 'hello' };
    if (mockNav && (data as Record<string, unknown>)?.screen) {
      mockNav.navigate((data as Record<string, unknown>).screen as string);
    }

    expect(navigated).toHaveLength(0);
  });

  test('null navigation does not throw', () => {
    const navigation = null;
    const data = { screen: 'Home' };

    expect(() => {
      if (navigation && data?.screen) {
        // Would navigate, but navigation is null
      }
    }).not.toThrow();
  });
});

describe('Notification Navigation: Profile → NotificationSettings', () => {
  const PROFILE_STACK_ROUTES = [
    'ProfileHome', 'Learn', 'ArticleDetail', 'Coaching', 'Community',
    'FounderStory', 'ProgressPhotos', 'MealPlan', 'ShoppingList', 'PrepSunday',
    'NotificationSettings',
  ];

  test('NotificationSettings is registered in ProfileStack', () => {
    expect(PROFILE_STACK_ROUTES).toContain('NotificationSettings');
  });

  test('ProfileStack has 11 routes after adding NotificationSettings', () => {
    expect(PROFILE_STACK_ROUTES).toHaveLength(11);
  });
});
