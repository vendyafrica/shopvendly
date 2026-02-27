const onceStore = new Set<string>();

function toKey(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  return trimmed;
}

export const buyerPreferenceStore = {
  isOnce(phone: string | null | undefined): boolean {
    const key = toKey(phone);
    if (!key) return false;
    if (onceStore.has(key)) return true;
    onceStore.add(key);
    return false;
  },
  clear() {
    onceStore.clear();
  },
};
