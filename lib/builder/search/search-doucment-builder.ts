// ─── Chunk text builder ───────────────────────────────────────────────────────
// Builds the single enriched string that gets embedded.
// Deduplicates subtitle/description when they mirror the title/abstract.

import { detectLanguage } from "@/lib/utils/language/detect";
import { isNearDuplicate } from "@/lib/utils/string/string";

export function buildChunkText(fields: {
  title: string;
  subtitle: string;
  abstract: string;
  description: string;
  pageTitle: string;
}): string {
  const parts: string[] = [];

  if (fields.title) parts.push(`Title: ${fields.title}`);

  const titleLang = detectLanguage(fields.title);
  const subIsBoilerplate =
    fields.subtitle &&
    titleLang !== "latin" &&
    detectLanguage(fields.subtitle) === "latin";

  if (
    fields.subtitle &&
    !isNearDuplicate(fields.subtitle, fields.title) &&
    !subIsBoilerplate
  ) {
    parts.push(`Subtitle: ${fields.subtitle}`);
  }

  if (fields.abstract) parts.push(`Abstract: ${fields.abstract}`);

  if (
    fields.description &&
    !isNearDuplicate(fields.description, fields.abstract)
  ) {
    parts.push(`Description: ${fields.description}`);
  }

  if (
    fields.pageTitle &&
    !isNearDuplicate(fields.pageTitle, fields.title) &&
    !fields.pageTitle.includes(fields.title.trim().slice(0, 60))
  ) {
    parts.push(`Page: ${fields.pageTitle}`);
  }

  return parts.join("\n");
}
