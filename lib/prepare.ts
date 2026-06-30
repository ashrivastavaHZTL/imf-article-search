import type { Article, SearchDocument } from "@/types";
import { stableId } from "./utils/string/id";
import { stripHtml } from "./utils/string/string";
import { buildChunkText } from "./builder/search/search-doucment-builder";

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
    title: pick("title", "Title"),
    subtitle: pick("subtitle", "Subtitle"),
    abstract: pick("abstract", "Abstract"),
    description: pick("description", "Description"),
    pageTitle: pick("pageTitle", "Page Title", "page_title", "PageTitle"),
    articleId: pick("articleId", "ArticleId", "article_id", "articleID"),
    locale: pick("locale", "Locale", "language", "Language"),
  };
}

// ─── PrepareResult ────────────────────────────────────────────────────────────

export interface PrepareResult {
  document: Omit<SearchDocument, "contentVector">;
  articleIdWarning?: string;
}

// ─── Main preparation function ────────────────────────────────────────────────

export function prepareDocument(
  raw: Record<string, unknown>,
  _index: number,
): PrepareResult {
  const a = normaliseArticle(raw);

  // Clean every field explicitly — no spread that could mask undefined
  const title = stripHtml(a.title);
  const subtitle = stripHtml(a.subtitle ?? "");
  const abstract = stripHtml(a.abstract ?? "");
  const description = stripHtml(a.description ?? "");
  const pageTitle = stripHtml(a.pageTitle ?? "");

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
        `Ensure at least 'title' or 'abstract' is non-empty.`,
    );
  }

  const articleId = (a.articleId ?? "").trim();
  const locale = (a.locale ?? "").trim();

  // Build document with explicit field assignment — no spread reordering risk
  const document: Omit<SearchDocument, "contentVector"> = {
    id: stableId(articleId, locale),
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
  if (!a.title?.trim()) return "missing 'title'";
  if (!a.abstract?.trim() && !a.description?.trim())
    return "needs at least one of 'abstract' or 'description'";
  return undefined;
}
