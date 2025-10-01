/**
 * 공통 에러 처리 핸들러
 * API 호출 시 발생하는 에러들을 통일된 방식으로 처리
 */

import { type ApiErrorResponse, type HttpStatusCode } from '../types/apiResponse';

// 에러 타입 정의
export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

// 커스텀 에러 클래스
export class ApiException extends Error {
  public readonly type: ErrorType;
  public readonly status: HttpStatusCode;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    type: ErrorType,
    message: string,
    status: HttpStatusCode = 500,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiException';
    this.type = type;
    this.status = status;
    this.code = code || type;
    this.details = details;
  }
}

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
  [ErrorType.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다.',
  [ErrorType.VALIDATION_ERROR]: '입력 정보를 다시 확인해주세요.',
  [ErrorType.AUTHENTICATION_ERROR]: '로그인이 필요합니다.',
  [ErrorType.AUTHORIZATION_ERROR]: '접근 권한이 없습니다.',
  [ErrorType.NOT_FOUND_ERROR]: '요청한 정보를 찾을 수 없습니다.',
  [ErrorType.SERVER_ERROR]: '서버 오류가 발생했습니다.',
  [ErrorType.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
};

// HTTP 상태 코드를 에러 타입으로 매핑
const mapStatusToErrorType = (status: HttpStatusCode): ErrorType => {
  switch (status) {
    case 400:
      return ErrorType.VALIDATION_ERROR;
    case 401:
      return ErrorType.AUTHENTICATION_ERROR;
    case 403:
      return ErrorType.AUTHORIZATION_ERROR;
    case 404:
      return ErrorType.NOT_FOUND_ERROR;
    case 500:
      return ErrorType.SERVER_ERROR;
    default:
      return ErrorType.UNKNOWN_ERROR;
  }
};

// 에러 처리 핸들러 클래스
export class CommonExceptionHandler {
  /**
   * 에러를 분석하고 적절한 ApiException으로 변환
   */
  static handleError(error: any): ApiException {
    // 이미 ApiException인 경우 그대로 반환
    if (error instanceof ApiException) {
      return error;
    }

    // 네트워크 에러 처리
    if (!navigator.onLine) {
      return new ApiException(
        ErrorType.NETWORK_ERROR,
        ERROR_MESSAGES[ErrorType.NETWORK_ERROR],
        0 as HttpStatusCode
      );
    }

    // Fetch API 에러 처리
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new ApiException(
        ErrorType.NETWORK_ERROR,
        ERROR_MESSAGES[ErrorType.NETWORK_ERROR],
        0 as HttpStatusCode
      );
    }

    // HTTP 응답 에러 처리
    if (error.response) {
      const status = error.response.status as HttpStatusCode;
      const errorType = mapStatusToErrorType(status);
      const message = error.response.data?.message || ERROR_MESSAGES[errorType];
      
      return new ApiException(
        errorType,
        message,
        status,
        error.response.data?.code,
        error.response.data?.details
      );
    }

    // 타임아웃 에러 처리
    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      return new ApiException(
        ErrorType.TIMEOUT_ERROR,
        ERROR_MESSAGES[ErrorType.TIMEOUT_ERROR],
        408 as HttpStatusCode
      );
    }

    // 알 수 없는 에러
    return new ApiException(
      ErrorType.UNKNOWN_ERROR,
      error.message || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR],
      500,
      undefined,
      error
    );
  }

  /**
   * 에러를 사용자 친화적인 메시지로 변환
   */
  static getUserFriendlyMessage(error: ApiException): string {
    return ERROR_MESSAGES[error.type] || error.message;
  }

  /**
   * 에러 로깅
   */
  static logError(error: ApiException, context?: string): void {
    const logData = {
      type: error.type,
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
      context,
      timestamp: new Date().toISOString(),
    };

    // 개발 환경에서는 콘솔에 로그 출력
    if (import.meta.env.NODE_ENV === 'development') {
      console.error('API Error:', logData);
    }

    // 프로덕션에서는 외부 로깅 서비스로 전송
    // TODO: 실제 로깅 서비스 연동
  }

  /**
   * 에러를 ApiErrorResponse 형태로 변환
   */
  static toApiErrorResponse(error: ApiException): ApiErrorResponse {
    return {
      success: false,
      status: error.status,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// 편의 함수들
export const handleApiError = (error: any): ApiException => {
  return CommonExceptionHandler.handleError(error);
};

export const getUserFriendlyMessage = (error: ApiException): string => {
  return CommonExceptionHandler.getUserFriendlyMessage(error);
};

export const logApiError = (error: ApiException, context?: string): void => {
  CommonExceptionHandler.logError(error, context);
};

// 특정 에러 타입 생성 헬퍼 함수들
export const createValidationError = (message: string, details?: any): ApiException => {
  return new ApiException(ErrorType.VALIDATION_ERROR, message, 400, undefined, details);
};

export const createAuthenticationError = (message?: string): ApiException => {
  return new ApiException(
    ErrorType.AUTHENTICATION_ERROR,
    message || ERROR_MESSAGES[ErrorType.AUTHENTICATION_ERROR],
    401
  );
};

export const createAuthorizationError = (message?: string): ApiException => {
  return new ApiException(
    ErrorType.AUTHORIZATION_ERROR,
    message || ERROR_MESSAGES[ErrorType.AUTHORIZATION_ERROR],
    403
  );
};

export const createNotFoundError = (message?: string): ApiException => {
  return new ApiException(
    ErrorType.NOT_FOUND_ERROR,
    message || ERROR_MESSAGES[ErrorType.NOT_FOUND_ERROR],
    404
  );
};

export const createServerError = (message?: string): ApiException => {
  return new ApiException(
    ErrorType.SERVER_ERROR,
    message || ERROR_MESSAGES[ErrorType.SERVER_ERROR],
    500
  );
};
