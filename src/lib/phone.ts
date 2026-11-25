/**
 * Normalize a phone number to E.164. Numbers without a leading `+` are
 * treated as US/Canada. Returns null when it can't be a real number.
 */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) {
    // International: country code + subscriber number, 8–15 digits total.
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}
