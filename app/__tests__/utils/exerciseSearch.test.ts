describe('Exercise search word-order matching', () => {
  const exercises = [
    'Overhead Tricep Extension',
    'Close-Grip Lat Pulldown',
    'Barbell Curl',
    'Barbell Bench Press',
    'Squat',
  ];

  function filterExercises(query: string, list: string[]): string[] {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return list;
    return list.filter(e => {
      const name = e.toLowerCase();
      return words.every(w => name.includes(w));
    });
  }

  test('word order independent - tricep overhead', () => {
    expect(filterExercises('tricep overhead', exercises)).toContain('Overhead Tricep Extension');
  });

  test('word order independent - pull lat', () => {
    expect(filterExercises('pull lat', exercises)).toContain('Close-Grip Lat Pulldown');
  });

  test('word order independent - curl barbell', () => {
    expect(filterExercises('curl barbell', exercises)).toContain('Barbell Curl');
  });

  test('all words must match', () => {
    expect(filterExercises('tricep squat', exercises)).toHaveLength(0);
  });

  test('single word works', () => {
    expect(filterExercises('squat', exercises)).toContain('Squat');
  });

  test('empty query returns all', () => {
    expect(filterExercises('', exercises)).toHaveLength(exercises.length);
  });

  test('case insensitive', () => {
    expect(filterExercises('BENCH PRESS', exercises)).toContain('Barbell Bench Press');
  });
});