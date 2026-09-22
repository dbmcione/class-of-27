/** Indian mobile numbers: 10 digits starting 6-9. Mirrors the CHECK constraint. */
const INDIAN_MOBILE = /^[6-9][0-9]{9}$/;

/** Strips spaces, dashes and a leading +91 / 0 so paste-from-contacts works. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidPhone(raw: string): boolean {
  return INDIAN_MOBILE.test(normalisePhone(raw));
}
