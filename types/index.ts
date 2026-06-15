export interface Article {
  title:        string;
  subtitle?:    string;
  abstract?:    string;
  description?: string;
  pageTitle?:   string;
}

export interface SearchDocument {
  id:             string;
  title:          string;
  subtitle:       string;
  abstract:       string;
  description:    string;
  pageTitle:      string;
  language:       string;
  chunkText:      string;
  contentVector?: number[];
}

export interface IngestResponse {
  total:    number;
  skipped:  number;
  indexed:  number;
  failed:   number;
  errors?:  string[];
}

export interface SearchRequest {
  query:     string;
  top?:      number;
  language?: string;
}

export interface SearchResultItem {
  id:          string;
  title:       string;
  subtitle:    string;
  abstract:    string;
  description: string;
  pageTitle:   string;
  language:    string;
  score:       number;
}

export interface SearchResponse {
  results:    SearchResultItem[];
  count:      number;
  query:      string;
  durationMs: number;
}
