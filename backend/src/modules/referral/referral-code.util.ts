import { randomInt } from 'crypto';

// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to read and share.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const REFERRAL_PREFIX = 'TC-';

/** Generates a referral code such as `TC-7H29QX`. Uniqueness is checked by the caller. */
export function generateReferralCode(length = 6): string {
  let suffix = '';
  for (let i = 0; i < length; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${REFERRAL_PREFIX}${suffix}`;
}

/** Normalises user supplied codes (trim + upper-case). */
export function normalizeReferralCode(code?: string | null): string | undefined {
  const trimmed = code?.trim();
  return trimmed ? trimmed.toUpperCase() : undefined;
}
