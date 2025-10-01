/**
 * API 응답 타입 정의
 * Spring Boot에서 받아오는 API 응답 구조
 */

// HTTP 메서드 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// HTTP 상태 코드 타입
export type HttpStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500;

// API 응답 헤더 정보
export interface ApiHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'Cache-Control'?: string;
  [key: string]: string | undefined;
}

// API 요청 정보
export interface ApiRequest {
  method: HttpMethod;
  url: string;
  headers?: ApiHeaders;
  data?: any;
}

// 성공 응답 타입
export interface ApiSuccessResponse<T = any> {
  success: true;
  status: HttpStatusCode;
  data: T;
  message?: string;
  timestamp: string;
  headers?: ApiHeaders;
}

// 에러 응답 타입
export interface ApiErrorResponse {
  success: false;
  status: HttpStatusCode;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  headers?: ApiHeaders;
}

// 통합 API 응답 타입
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// API 요청 옵션
export interface ApiRequestOptions {
  method: HttpMethod;
  headers?: ApiHeaders;
  timeout?: number;
  retryCount?: number;
}

// API 응답 생성 헬퍼 함수
export const createApiResponse = <T>(
  data: T,
  status: HttpStatusCode = 200,
  message?: string,
  headers?: ApiHeaders
): ApiSuccessResponse<T> => ({
  success: true,
  status,
  data,
  message,
  timestamp: new Date().toISOString(),
  headers,
});

// API 에러 응답 생성 헬퍼 함수
export const createApiErrorResponse = (
  code: string,
  message: string,
  status: HttpStatusCode = 500,
  details?: any,
  headers?: ApiHeaders
): ApiErrorResponse => ({
  success: false,
  status,
  error: {
    code,
    message,
    details,
  },
  timestamp: new Date().toISOString(),
  headers,
});
