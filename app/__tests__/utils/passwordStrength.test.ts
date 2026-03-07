import { getPasswordStrength } from '../../utils/passwordStrength';

describe('getPasswordStrength', () => {
  it('returns weak for empty password', () => {
    const result = getPasswordStrength('');
    expect(result.level).toBe('weak');
    expect(result.isValid).toBe(false);
  });

  it('validates minimum length', () => {
    expect(getPasswordStrength('Ab1!').validation.minLength).toBe(false);
    expect(getPasswordStrength('Abcdefg1!').validation.minLength).toBe(true);
  });

  it('validates uppercase requirement', () => {
    expect(getPasswordStrength('abcdefg1!').validation.hasUppercase).toBe(false);
    expect(getPasswordStrength('Abcdefg1!').validation.hasUppercase).toBe(true);
  });

  it('validates lowercase requirement', () => {
    expect(getPasswordStrength('ABCDEFG1!').validation.hasLowercase).toBe(false);
    expect(getPasswordStrength('Abcdefg1!').validation.hasLowercase).toBe(true);
  });

  it('validates number requirement', () => {
    expect(getPasswordStrength('Abcdefg!').validation.hasNumber).toBe(false);
    expect(getPasswordStrength('Abcdefg1!').validation.hasNumber).toBe(true);
  });

  it('validates special character requirement', () => {
    expect(getPasswordStrength('Abcdefg1').validation.hasSpecial).toBe(false);
    expect(getPasswordStrength('Abcdefg1!').validation.hasSpecial).toBe(true);
  });

  it('isValid is true only when all rules pass', () => {
    expect(getPasswordStrength('Abcdefg1!').isValid).toBe(true);
    expect(getPasswordStrength('abcdefg1!').isValid).toBe(false); // no uppercase
  });

  it('returns strong for complex passwords', () => {
    const result = getPasswordStrength('C0mpl3x!P@ssw0rd#2024');
    expect(result.level).toBe('strong');
    expect(result.score).toBe(4);
  });

  it('returns weak for simple passwords', () => {
    const result = getPasswordStrength('aaa');
    expect(result.level).toBe('weak');
  });
});
