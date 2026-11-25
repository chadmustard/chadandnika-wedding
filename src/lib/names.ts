/** Normalize a guest name for case-insensitive exact matching. */
export function normalizeGuestName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
