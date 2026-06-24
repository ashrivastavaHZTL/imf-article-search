import { toNumber } from "../type-casting/number";
import { isNumber } from "../type-safe-checks";

export function getpublishedAfterDate(): string {
  //default to 6 weeks
  const configDateRange = toNumber(
    process.env.ARTICLE_RETRIEVAL_LOOKBACK_DAYS ?? "42",
  );

  const now = new Date();
  const lookbackDays = new Date();
  lookbackDays.setDate(
    now.getDate() - (isNumber(configDateRange) ? configDateRange : 42),
  );

  return lookbackDays.toISOString();
}
