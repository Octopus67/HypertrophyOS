/**
 * Light Mode WCAG AA Contrast Compliance Tests
 * 
 * Validates that the light color palette meets WCAG AA thresholds:
 * - Normal text: ≥ 4.5:1
 * - Interactive/large text: ≥ 3:1
 */

import { lightColors } from '../../theme/lightColors';

// ─── WCAG Helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.substring(0, 2), 16) / 255, parseInt(c.substring(2, 4), 16) / 255, parseInt(c.substring(4, 6), 16) / 255];
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ─── Light Mode Pairs ────────────────────────────────────────────────────────

const normalTextPairs = [
  { fg: lightColors.text.primary, bg: lightColors.bg.base, label: 'text.primary on bg.base' },
  { fg: lightColors.text.primary, bg: lightColors.bg.surface, label: 'text.primary on bg.surface' },
  { fg: lightColors.text.secondary, bg: lightColors.bg.base, label: 'text.secondary on bg.base' },
  { fg: lightColors.text.secondary, bg: lightColors.bg.surface, label: 'text.secondary on bg.surface' },
  { fg: lightColors.text.muted, bg: lightColors.bg.base, label: 'text.muted on bg.base' },
  { fg: lightColors.text.muted, bg: lightColors.bg.surface, label: 'text.muted on bg.surface' },
];

const interactivePairs = [
  { fg: lightColors.accent.primary, bg: lightColors.bg.base, label: 'accent.primary on bg.base' },
  { fg: lightColors.accent.primary, bg: lightColors.bg.surface, label: 'accent.primary on bg.surface' },
  { fg: lightColors.semantic.positive, bg: lightColors.bg.base, label: 'semantic.positive on bg.base' },
  { fg: lightColors.semantic.negative, bg: lightColors.bg.base, label: 'semantic.negative on bg.base' },
  { fg: lightColors.semantic.warning, bg: lightColors.bg.base, label: 'semantic.warning on bg.base' },
];

const semanticOnSubtlePairs = [
  { fg: lightColors.semantic.positive, bg: lightColors.bg.surfaceRaised, label: 'positive on surfaceRaised' },
  { fg: lightColors.semantic.negative, bg: lightColors.bg.surfaceRaised, label: 'negative on surfaceRaised' },
  { fg: lightColors.semantic.warning, bg: lightColors.bg.surfaceRaised, label: 'warning on surfaceRaised' },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Light Mode WCAG AA Contrast Compliance', () => {
  describe('Normal text pairs (≥ 4.5:1)', () => {
    normalTextPairs.forEach(({ fg, bg, label }) => {
      it(`${label} — ratio ≥ 4.5:1`, () => {
        const ratio = contrastRatio(fg, bg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Interactive element pairs (≥ 3:1)', () => {
    interactivePairs.forEach(({ fg, bg, label }) => {
      it(`${label} — ratio ≥ 3:1`, () => {
        const ratio = contrastRatio(fg, bg);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Semantic colors on subtle backgrounds (≥ 3:1)', () => {
    semanticOnSubtlePairs.forEach(({ fg, bg, label }) => {
      it(`${label} — ratio ≥ 3:1`, () => {
        const ratio = contrastRatio(fg, bg);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Actual ratios (informational)', () => {
    [...normalTextPairs, ...interactivePairs, ...semanticOnSubtlePairs].forEach(({ fg, bg, label }) => {
      it(`${label}: ${contrastRatio(fg, bg).toFixed(2)}:1`, () => {
        expect(contrastRatio(fg, bg)).toBeGreaterThan(1);
      });
    });
  });

  describe('Light mode specific — text.inverse on accent', () => {
    it('text.inverse on accent.primary ≥ 4.5:1', () => {
      const ratio = contrastRatio(lightColors.text.inverse, lightColors.accent.primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Macro colors on white background (≥ 3:1)', () => {
    const macros = [
      { color: lightColors.macro.calories, label: 'calories' },
      { color: lightColors.macro.protein, label: 'protein' },
      { color: lightColors.macro.carbs, label: 'carbs' },
      { color: lightColors.macro.fat, label: 'fat' },
    ];

    macros.forEach(({ color, label }) => {
      it(`macro.${label} on bg.base ≥ 3:1`, () => {
        const ratio = contrastRatio(color, lightColors.bg.base);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
