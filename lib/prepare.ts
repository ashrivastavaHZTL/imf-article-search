import { createHash } from "crypto";
import type { Article, SearchDocument } from "@/types";

// ─── Stable ID ────────────────────────────────────────────────────────────────

function stableId(title: string, locale: string): string {
  return createHash("sha256")
    .update(`${title.trim().toLowerCase()}|${locale.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 16);
}

// ─── HTML stripping ───────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  "&laquo;": "«", "&raquo;": "»", "&nbsp;": " ", "&amp;": "&",
  "&quot;": '"',  "&#39;":  "'",  "&lt;":   "<", "&gt;":  ">",
  "&ndash;": "–", "&mdash;": "—",
};

export function stripHtml(raw: string): string {
  if (!raw) return "";
  let t = raw.replace(/<[^>]*>/g, " ");
  for (const [ent, ch] of Object.entries(ENTITIES)) t = t.split(ent).join(ch);
  return t.replace(/\s+/g, " ").trim();
}

// ─── Near-duplicate check ─────────────────────────────────────────────────────

function isNearDuplicate(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 100);
  return norm(a) === norm(b);
}

// ─── Field normalisation ──────────────────────────────────────────────────────

export function normaliseArticle(raw: Record<string, unknown>): Article {
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    return "";
  };
  return {
    title:       pick("title",     "Title"),
    subtitle:    pick("subtitle",  "Subtitle"),
    abstract:    pick("abstract",  "Abstract"),
    description: pick("description", "Description"),
    pageTitle:   pick("pageTitle", "Page Title", "page_title", "PageTitle"),
    articleId:   pick("articleId", "ArticleId", "article_id", "articleID"),
    locale:      pick("locale",    "Locale", "language", "Language"),
  };
}

// ─── Chunk text builder ───────────────────────────────────────────────────────
// Builds the single enriched string that gets embedded.
// Deduplicates subtitle/description when they mirror the title/abstract.

export function buildChunkText(fields: {
  title:       string;
  subtitle:    string;
  abstract:    string;
  description: string;
  pageTitle:   string;
}): string {
  const parts: string[] = [];

  if (fields.title)
    parts.push(`Title: ${fields.title}`);

  if (
    fields.subtitle &&
    !isNearDuplicate(fields.subtitle, fields.title)
  ) {
    parts.push(`Subtitle: ${fields.subtitle}`);
  }

  if (fields.abstract)
    parts.push(`Abstract: ${fields.abstract}`);

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

// ─── PrepareResult ────────────────────────────────────────────────────────────

export interface PrepareResult {
  document: Omit<SearchDocument, "contentVector">;
}

// ─── Main preparation function ────────────────────────────────────────────────

export function prepareDocument(
  raw: Record<string, unknown>,
  _index: number
): PrepareResult {
  const a = normaliseArticle(raw);

  // Clean every field explicitly — no spread that could mask undefined
  const title       = stripHtml(a.title);
  const subtitle    = stripHtml(a.subtitle    ?? "");
  const abstract    = stripHtml(a.abstract    ?? "");
  const description = stripHtml(a.description ?? "");
  const pageTitle   = stripHtml(a.pageTitle   ?? "");

  // Build chunkText from cleaned fields
  const chunkText = buildChunkText({
    title,
    subtitle,
    abstract,
    description,
    pageTitle,
  });

  // Hard guard — chunkText must never be empty
  if (!chunkText) {
    throw new Error(
      `buildChunkText produced an empty string for title: "${title}". ` +
      `Ensure at least 'title' or 'abstract' is non-empty.`
    );
  }

  const articleId = (a.articleId ?? "").trim();
  const locale    = (a.locale    ?? "").trim();

  // Build document with explicit field assignment — no spread reordering risk
  const document: Omit<SearchDocument, "contentVector"> = {
    id: stableId(title, locale),
    articleId,
    title,
    subtitle,
    abstract,
    description,
    pageTitle,
    locale,
    chunkText,
  };

  return { document };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateArticle(raw: unknown): string | undefined {
  if (typeof raw !== "object" || raw === null) return "must be an object";
  const a = normaliseArticle(raw as Record<string, unknown>);
  if (!a.title?.trim())
    return "missing 'title'";
  if (!a.abstract?.trim() && !a.description?.trim())
    return "needs at least one of 'abstract' or 'description'";
  return undefined;
}
