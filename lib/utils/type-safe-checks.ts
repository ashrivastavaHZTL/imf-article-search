export function isNumber(val: number | null | undefined): val is number {
  return typeof val === "number" && !Number.isNaN(val);
}
