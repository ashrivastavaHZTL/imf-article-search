export function toNumber(value: string): number | null {
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}
