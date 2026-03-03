import { scaleToServing } from '../../utils/servingOptions';

describe('scaleToServing', () => {
  test('scale_with_zero_base_defaults_to_100g', () => {
    // When base serving is 0, should default to 100g base
    const result = scaleToServing(0, 150, 200);
    
    // Expected: (200 * 150) / 100 = 300
    expect(result).toBe(300);
  });

  test('scale_with_negative_base_defaults_to_100g', () => {
    // When base serving is negative, should default to 100g base
    const result = scaleToServing(-50, 200, 100);
    
    // Expected: (100 * 200) / 100 = 200
    expect(result).toBe(200);
  });

  test('normal_scaling_works_correctly', () => {
    // Normal case should work as before
    const result = scaleToServing(100, 150, 200);
    
    // Expected: (200 * 150) / 100 = 300
    expect(result).toBe(300);
  });
});