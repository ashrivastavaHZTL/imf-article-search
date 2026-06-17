import { EdgeErrorResponse } from "../error-response.model";

export interface EdgeResponse<T> extends EdgeErrorResponse {
  data?: T;
}

export interface DescendantsChildren<T> {
  results: T;
}

export interface DescendantsResult<T> {
  children: T;
}

export interface ItemQueryResult<T> {
  item: T;
}

export interface QueryResults<T> {
  results?: T;
}
