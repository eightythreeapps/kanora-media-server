import * as crypto from 'crypto';

/**
 * Hash a PIN
 * @param pin The PIN to hash
 * @returns The hashed PIN with salt
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a PIN against a hash
 * @param pin The PIN to verify
 * @param pinHash The stored hash
 * @returns Whether the PIN is valid
 */
export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  const [salt, storedHash] = pinHash.split(':');
  const hash = crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
}

/**
 * Validate PIN strength
 * @param pin The PIN to validate
 * @returns Validation result and reason if invalid
 */
export function validatePin(pin: string): { isValid: boolean; reason?: string } {
  // Pin must be a string of digits
  if (!/^\d+$/.test(pin)) {
    return { isValid: false, reason: 'PIN must contain only digits' };
  }

  // PIN should be at least 4 digits
  if (pin.length < 4) {
    return { isValid: false, reason: 'PIN must be at least 4 digits' };
  }

  // PIN should not be too long
  if (pin.length > 8) {
    return { isValid: false, reason: 'PIN must not exceed 8 digits' };
  }

  // PIN should not be a simple sequence (like 1234)
  if (/^1234|2345|3456|4567|5678|6789|7890$/.test(pin)) {
    return { isValid: false, reason: 'PIN must not be a simple sequence' };
  }

  // PIN should not have all the same digit
  if (/^(\d)\1+$/.test(pin)) {
    return { isValid: false, reason: 'PIN must not contain all the same digit' };
  }

  return { isValid: true };
} 