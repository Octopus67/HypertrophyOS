import { zxcvbn } from '@zxcvbn-ts/core';

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0-4 from zxcvbn
  level: StrengthLevel;
  validation: PasswordValidation;
  isValid: boolean;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const validation: PasswordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isValid = Object.values(validation).every(Boolean);

  if (!password) {
    return { score: 0, level: 'weak', validation, isValid };
  }

  const { score } = zxcvbn(password);

  let level: StrengthLevel;
  if (score <= 1) level = 'weak';
  else if (score === 2) level = 'fair';
  else if (score === 3) level = 'good';
  else level = 'strong';

  return { score, level, validation, isValid };
}
