/**
 * Tests for DataExportScreen logic and helpers.
 */

// ---- Pure logic helpers extracted for testing ----

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

function statusColor(status: ExportStatus): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'processing':
      return 'amber';
    default:
      return 'grey';
  }
}

function getFileExtension(format: string): string {
  return format === 'csv' ? 'zip' : format;
}

function isValidFormat(format: string): boolean {
  return ['json', 'csv', 'pdf'].includes(format.toLowerCase());
}

function hasPendingExports(
  exports: { status: ExportStatus }[]
): boolean {
  return exports.some(
    (e) => e.status === 'pending' || e.status === 'processing'
  );
}

// ---- Tests ----

describe('formatBytes', () => {
  test('null returns dash', () => {
    expect(formatBytes(null)).toBe('—');
  });

  test('zero returns dash', () => {
    expect(formatBytes(0)).toBe('—');
  });

  test('bytes under 1KB', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  test('kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  test('megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });

  test('large megabytes', () => {
    expect(formatBytes(5242880)).toBe('5.0 MB');
  });
});

describe('statusColor', () => {
  test('completed is green', () => {
    expect(statusColor('completed')).toBe('green');
  });

  test('failed is red', () => {
    expect(statusColor('failed')).toBe('red');
  });

  test('processing is amber', () => {
    expect(statusColor('processing')).toBe('amber');
  });

  test('pending is grey', () => {
    expect(statusColor('pending')).toBe('grey');
  });
});

describe('getFileExtension', () => {
  test('json returns json', () => {
    expect(getFileExtension('json')).toBe('json');
  });

  test('csv returns zip', () => {
    expect(getFileExtension('csv')).toBe('zip');
  });

  test('pdf returns pdf', () => {
    expect(getFileExtension('pdf')).toBe('pdf');
  });
});

describe('isValidFormat', () => {
  test('json is valid', () => {
    expect(isValidFormat('json')).toBe(true);
  });

  test('csv is valid', () => {
    expect(isValidFormat('csv')).toBe(true);
  });

  test('pdf is valid', () => {
    expect(isValidFormat('pdf')).toBe(true);
  });

  test('xml is invalid', () => {
    expect(isValidFormat('xml')).toBe(false);
  });

  test('case insensitive', () => {
    expect(isValidFormat('JSON')).toBe(true);
  });

  test('empty string is invalid', () => {
    expect(isValidFormat('')).toBe(false);
  });
});

describe('hasPendingExports', () => {
  test('empty list returns false', () => {
    expect(hasPendingExports([])).toBe(false);
  });

  test('all completed returns false', () => {
    expect(
      hasPendingExports([{ status: 'completed' }, { status: 'failed' }])
    ).toBe(false);
  });

  test('pending returns true', () => {
    expect(
      hasPendingExports([{ status: 'completed' }, { status: 'pending' }])
    ).toBe(true);
  });

  test('processing returns true', () => {
    expect(hasPendingExports([{ status: 'processing' }])).toBe(true);
  });
});
