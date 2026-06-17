export interface PageInfo {
  endCursor: string;
  hasNext: boolean;
}

export interface SearchResponse<T> {
  search: SearchResult<T>;
}

export interface SearchResult<T> {
  total: number;
  pageInfo: PageInfo;
  results: T[];
}
