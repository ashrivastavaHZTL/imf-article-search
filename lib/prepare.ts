import { createHash } from "crypto";
import type { Article, SearchDocument } from "@/types";

// ─── Stable ID ────────────────────────────────────────────────────────────────

function stableId(title: string): string {
  return createHash("sha256")
    .update(title.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

// ─── GUID validation ──────────────────────────────────────────────────────────

function isValidGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(value.trim());
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

// ─── Language detection ───────────────────────────────────────────────────────

export function detectLanguage(text: string): string {
  const n = text.length || 1;
  const checks: [string, RegExp][] = [
    ["ar", /[\u0600-\u06FF]/g],
    ["ru", /[\u0400-\u04FF]/g],
    ["zh", /[\u3000-\u9FFF\uF900-\uFAFF]/g],
  ];
  for (const [code, re] of checks) {
    if (((text.match(re) ?? []).length) / n > 0.15) return code;
  }
  return "latin";
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

  const titleLang      = detectLanguage(fields.title);
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
  document:          Omit<SearchDocument, "contentVector">;
  articleIdWarning?: string;
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

  // articleId GUID validation
  const rawArticleId     = (a.articleId ?? "").trim();
  const validGuid        = rawArticleId !== "" && isValidGuid(rawArticleId);
  const articleId        = validGuid ? rawArticleId : "";
  const articleIdWarning = rawArticleId !== "" && !validGuid
    ? `articleId "${rawArticleId}" is not a valid GUID ` +
      `(expected: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) — stored as empty`
    : undefined;

  // Build document with explicit field assignment — no spread reordering risk
  const document: Omit<SearchDocument, "contentVector"> = {
    id:          stableId(title),
    articleId,
    title,
    subtitle,
    abstract,
    description,
    pageTitle,
    language:    detectLanguage(title),
    chunkText,
  };

  return { document, articleIdWarning };
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
