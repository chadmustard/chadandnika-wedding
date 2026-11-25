function splitName(displayName: string) {
  const parts = displayName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1]! : '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]!;
  return { first, last };
}

export function firstName(displayName: string): string {
  return splitName(displayName).first;
}

/**
 * How an envelope is addressed: "Rick & Cindy Mustard",
 * "Chad Mustard & Veronika Matsuk", or a single name.
 */
export function formatAddressee(names: string[]): string {
  const unique = Array.from(new Set(names.filter(Boolean)));
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0]!;

  const split = unique.map(splitName);
  const sharedLast =
    split[0]!.last && split.every((n) => n.last === split[0]!.last)
      ? split[0]!.last
      : null;

  const joined = (items: string[]) =>
    items.length <= 2
      ? items.join(' & ')
      : `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;

  return sharedLast
    ? `${joined(split.map((n) => n.first))} ${sharedLast}`
    : joined(unique);
}
