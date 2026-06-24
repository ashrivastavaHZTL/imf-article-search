export interface ErrorResponse {
  errorCode: string;
  errorDescription: string;
}

export type EdgeErrorResponse = {
  errors?: EdgeApiError[];
  // not set up, but here we could inject user friendly error messages
  freindlyError?: ErrorResponse;
};

export type EdgeApiError = { message: string; locations: Location[] };
