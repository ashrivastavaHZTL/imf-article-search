export interface Article {
  title: string;
  subtitle?: string;
  abstract?: string;
  description?: string;
  pageTitle?: string;
  articleId?: string;
  locale?: string; // BCP 47 language code from Sitecore (e.g. "en", "fr", "ar")
}

export interface SearchDocument {
  id: string;
  articleId: string; // GUID — the source system identifier
  title: string;
  subtitle: string;
  abstract: string;
  description: string;
  pageTitle: string;
  locale: string; // BCP 47 language code from Sitecore
  chunkText: string;
  contentVector?: number[];
}

export interface IngestResponse {
  total: number;
  skipped: number;
  indexed: number;
  failed: number;
  warnings?: string[];
  errors?: string[];
}

export interface SearchRequest {
  query: string;
  top?: number;
  locale?: string;
}

export interface SearchResultItem {
  id: string;
  articleId: string; // GUID returned in search results
  title: string;
  subtitle: string;
  abstract: string;
  description: string;
  pageTitle: string;
  locale: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  count: number;
  query: string;
  durationMs: number;
}
