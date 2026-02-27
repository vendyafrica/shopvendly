export type NormalizePhoneOptions = {
  defaultCountryCallingCode?: string;
};

/**
 * Normalizes a user-supplied phone string to an E.164-like representation.
 * Returns null when the value cannot be safely normalized.
 */
export function normalizePhoneToE164(input: string, opts: NormalizePhoneOptions = {}): string | null {
  const defaultCode = opts.defaultCountryCallingCode || "256";

  let value = input.trim();
  if (!value) return null;

  value = value.replace(/[\s\-()]/g, "");

  if (value.startsWith("+")) {
    const digits = value.slice(1).replace(/\D/g, "");
    if (!digits) return null;
    return `+${digits}`;
  }

  if (/^0\d{9}$/.test(value)) {
    return `+${defaultCode}${value.slice(1)}`;
  }

  if (/^7\d{8}$/.test(value)) {
    return `+${defaultCode}${value}`;
  }

  if (new RegExp(`^${defaultCode}\\d+$`).test(value)) {
    return `+${value}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}
