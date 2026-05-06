export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  code: number;
  details: ApiErrorDetail[];
}