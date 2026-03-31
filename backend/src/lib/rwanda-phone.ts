/** Normalize user input to Rwanda MTN/MoMo style (E.164 250…). Returns null if invalid. */
export function normalizeRwandaMtnPhone(input: string): string | null {
  const digits = input.trim().replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `250${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `250${digits}`;
  return null;
}
