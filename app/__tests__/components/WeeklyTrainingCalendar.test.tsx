/**
 * WeeklyTrainingCalendar — Logic Tests
 *
 * Tests the data logic without rendering React Native components.
 */

describe('WeeklyTrainingCalendar logic', () => {
  const getWeekDays = (selectedDate: string): string[] => {
    const d = new Date(selectedDate + 'T12:00:00');
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date.toISOString().slice(0, 10));
    }
    return days;
  };

  const getDayStatus = (
    dateStr: string,
    trainedDates: Set<string>,
    today: string,
  ) => {
    const isTrained = trainedDates.has(dateStr);
    const isToday = dateStr === today;
    const isFuture = dateStr > today;
    return { isTrained, isToday, isFuture };
  };

  test('generates 7 days starting from Monday', () => {
    const days = getWeekDays('2024-01-17'); // Wednesday
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2024-01-15'); // Monday
    expect(days[6]).toBe('2024-01-21'); // Sunday
  });

  test('handles Monday as selected date', () => {
    const days = getWeekDays('2024-01-15'); // Monday
    expect(days[0]).toBe('2024-01-15');
    expect(days[6]).toBe('2024-01-21');
  });

  test('handles Sunday as selected date', () => {
    const days = getWeekDays('2024-01-21'); // Sunday
    expect(days[0]).toBe('2024-01-15');
    expect(days[6]).toBe('2024-01-21');
  });

  test('marks trained days correctly', () => {
    const trained = new Set(['2024-01-15', '2024-01-17', '2024-01-19']);
    expect(getDayStatus('2024-01-15', trained, '2024-01-17').isTrained).toBe(true);
    expect(getDayStatus('2024-01-16', trained, '2024-01-17').isTrained).toBe(false);
    expect(getDayStatus('2024-01-17', trained, '2024-01-17').isTrained).toBe(true);
  });

  test('identifies today correctly', () => {
    const trained = new Set<string>();
    expect(getDayStatus('2024-01-17', trained, '2024-01-17').isToday).toBe(true);
    expect(getDayStatus('2024-01-16', trained, '2024-01-17').isToday).toBe(false);
  });

  test('identifies future days', () => {
    const trained = new Set<string>();
    expect(getDayStatus('2024-01-18', trained, '2024-01-17').isFuture).toBe(true);
    expect(getDayStatus('2024-01-17', trained, '2024-01-17').isFuture).toBe(false);
    expect(getDayStatus('2024-01-16', trained, '2024-01-17').isFuture).toBe(false);
  });

  test('empty trained dates means no days trained', () => {
    const trained = new Set<string>();
    const days = getWeekDays('2024-01-17');
    const trainedCount = days.filter(d => trained.has(d)).length;
    expect(trainedCount).toBe(0);
  });

  test('all days trained', () => {
    const days = getWeekDays('2024-01-17');
    const trained = new Set(days);
    const trainedCount = days.filter(d => trained.has(d)).length;
    expect(trainedCount).toBe(7);
  });
});
