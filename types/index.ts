export interface Article {
  title: string;
  subtitle?: string;
  abstract?: string;
  description?: string;
  pageTitle?: string;
  articleId?: string; // GUID from source CMS (e.g. Sitecore item ID)
}

export interface SearchDocument {
  id: string;
  articleId: string; // GUID — the source system identifier
  title: string;
  subtitle: string;
  abstract: string;
  description: string;
  pageTitle: string;
  language: string;
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
  language?: string;
}

export interface SearchResultItem {
  id: string;
  articleId: string; // GUID returned in search results
  title: string;
  subtitle: string;
  abstract: string;
  description: string;
  pageTitle: string;
  language: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  count: number;
  query: string;
  durationMs: number;
}
