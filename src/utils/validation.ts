/**
 * Validation utilities for BloodLink AI
 * Accurate age calculation from complete DOB (accounting for birthday passage in current year)
 */

import { BloodGroup } from '../types';

export const VALID_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Calculates accurate age from a full date of birth (YYYY-MM-DD).
 * Correctly accounts for whether birthday has occurred in the current year.
 */
export function calculateAgeFromDob(dobString: string, referenceDate: Date = new Date()): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Validates Date of Birth for blood donors:
 * - Must be a valid date
 * - Must not be in the future
 * - Age must be between 18 and 65 years
 */
export function validateDonorDob(dobString: string): {
  valid: boolean;
  age: number;
  error?: string;
  errorTa?: string;
} {
  if (!dobString) {
    return {
      valid: false,
      age: 0,
      error: 'Date of birth is mandatory.',
      errorTa: 'பிறந்த தேதி கட்டாயமாகும்.',
    };
  }

  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) {
    return {
      valid: false,
      age: 0,
      error: 'Invalid date format for date of birth.',
      errorTa: 'செல்லுபடியாகாத பிறந்த தேதி வடிவம்.',
    };
  }

  const today = new Date();
  if (birthDate > today) {
    return {
      valid: false,
      age: 0,
      error: 'Date of birth cannot be in the future.',
      errorTa: 'பிறந்த தேதி எதிர்காலத்தில் இருக்க முடியாது.',
    };
  }

  const age = calculateAgeFromDob(dobString, today);

  if (age < 18) {
    return {
      valid: false,
      age,
      error: `Donor must be at least 18 years old to donate blood (Calculated age: ${age}).`,
      errorTa: `இரத்த தானம் செய்ய குறைந்தபட்ச வயது 18 (கணக்கிடப்பட்ட வயது: ${age}).`,
    };
  }

  if (age > 65) {
    return {
      valid: false,
      age,
      error: `Donor age cannot exceed 65 years according to medical guidelines (Calculated age: ${age}).`,
      errorTa: `மருத்துவ வழிகாட்டுதலின்படி கொடையாளர் வயது 65 ஐ தாண்டக்கூடாது (கணக்கிடப்பட்ட வயது: ${age}).`,
    };
  }

  return { valid: true, age };
}

/**
 * Validates Email address format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Validates Phone number (accepts Indian +91 formats and standard 10-15 digits).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validates Blood Group
 */
export function isValidBloodGroup(bg: string): bg is BloodGroup {
  return VALID_BLOOD_GROUPS.includes(bg as BloodGroup);
}
