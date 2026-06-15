import { createHash } from "crypto";
import type { Article, SearchDocument } from "@/types";

/**
 * Generate a stable, content-based ID from the article title.
 * Same title always produces the same ID — different titles always
 * produce different IDs. This makes mergeOrUploadDocuments idempotent:
 * re-ingesting the same article updates it in place rather than
 * creating a duplicate or overwriting a different article.
 */
function stableId(title: string): string {
  return createHash("sha256")
    .update(title.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

const ENTITIES: Record<string, string> = {
  "&laquo;": "«", "&raquo;": "»", "&nbsp;": " ", "&amp;": "&",
  "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">",
  "&ndash;": "–", "&mdash;": "—",
};

export function stripHtml(raw: string): string {
  let t = raw.replace(/<[^>]*>/g, " ");
  for (const [ent, ch] of Object.entries(ENTITIES)) t = t.split(ent).join(ch);
  return t.replace(/\s+/g, " ").trim();
}

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

function isNearDuplicate(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 100);
  return norm(a) === norm(b);
}

export function normaliseArticle(raw: Record<string, unknown>): Article {
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    return "";
  };
  return {
    title:       pick("title", "Title"),
    subtitle:    pick("subtitle", "Subtitle"),
    abstract:    pick("abstract", "Abstract"),
    description: pick("description", "Description"),
    pageTitle:   pick("pageTitle", "Page Title", "page_title", "PageTitle"),
  };
}

export function buildChunkText(a: {
  title: string; subtitle: string; abstract: string;
  description: string; pageTitle: string;
}): string {
  const parts: string[] = [`Title: ${a.title}`];
  const titleLang = detectLanguage(a.title);
  const sub = a.subtitle;
  const subIsBoilerplate =
    sub && titleLang !== "latin" && detectLanguage(sub) === "latin";
  if (sub && !isNearDuplicate(sub, a.title) && !subIsBoilerplate) {
    parts.push(`Subtitle: ${sub}`);
  }
  if (a.abstract) parts.push(`Abstract: ${a.abstract}`);
  if (a.description && !isNearDuplicate(a.description, a.abstract)) {
    parts.push(`Description: ${a.description}`);
  }
  if (a.pageTitle && !isNearDuplicate(a.pageTitle, a.title)
      && !a.pageTitle.includes(a.title.trim().slice(0, 60))) {
    parts.push(`Page: ${a.pageTitle}`);
  }
  return parts.join("\n");
}

export function prepareDocument(
  raw: Record<string, unknown>,
  _index: number          // kept for signature compatibility; no longer used for id
): Omit<SearchDocument, "contentVector"> {
  const a = normaliseArticle(raw);
  const cleaned = {
    title:       stripHtml(a.title),
    subtitle:    stripHtml(a.subtitle ?? ""),
    abstract:    stripHtml(a.abstract ?? ""),
    description: stripHtml(a.description ?? ""),
    pageTitle:   stripHtml(a.pageTitle ?? ""),
  };
  return {
    id:        stableId(cleaned.title),   // content-based, not position-based
    ...cleaned,
    language:  detectLanguage(cleaned.title),
    chunkText: buildChunkText(cleaned),
  };
}

export function validateArticle(raw: unknown): string | undefined {
  if (typeof raw !== "object" || raw === null) return "must be an object";
  const a = normaliseArticle(raw as Record<string, unknown>);
  if (!a.title?.trim()) return "missing 'title'";
  if (!a.abstract?.trim() && !a.description?.trim())
    return "needs at least one of 'abstract' or 'description'";
  return undefined;
}
