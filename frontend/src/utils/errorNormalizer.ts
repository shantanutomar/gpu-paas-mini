import type { ApiError } from '../types/api';

/**
 * Normalize errors from RTK Query into a consistent format
 * 
 * Handles different error shapes:
 * - RTK Query FetchBaseQueryError
 * - RTK Query SerializedError  
 * - Backend API errors with {message, code, details}
 * - Generic errors
 */
export function normalizeError(error: unknown): ApiError {
  // Default fallback error
  const defaultError: ApiError = {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };

  if (!error) {
    return defaultError;
  }

  // RTK Query FetchBaseQueryError (HTTP errors)
  if (typeof error === 'object' && 'status' in error) {
    const fetchError = error as any;
    
    // Extract backend API error format
    if (fetchError.data && typeof fetchError.data === 'object') {
      const { message, code, details, requestId } = fetchError.data;
      return {
        message: message || defaultError.message,
        code: code || `HTTP_${fetchError.status}`,
        details,
        requestId,
      };
    }

    // Fallback to HTTP status
    return {
      message: getMessageForStatus(fetchError.status),
      code: `HTTP_${fetchError.status}`,
    };
  }

  // RTK Query SerializedError (network errors, etc.)
  if (typeof error === 'object' && 'message' in error) {
    const serializedError = error as any;
    return {
      message: serializedError.message || defaultError.message,
      code: serializedError.code || 'NETWORK_ERROR',
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'ERROR',
    };
  }

  return defaultError;
}

/**
 * Get human-readable message for HTTP status codes
 */
function getMessageForStatus(status: number | string): string {
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;

  switch (statusNum) {
    case 400:
      return 'Bad request - please check your input';
    case 401:
      return 'Unauthorized - please check your API key';
    case 403:
      return 'Forbidden - you do not have permission';
    case 404:
      return 'Not found - the requested resource does not exist';
    case 409:
      return 'Conflict - the resource already exists or there is a conflict';
    case 422:
      return 'Validation error - please check your input';
    case 429:
      return 'Too many requests - please try again later';
    case 500:
      return 'Internal server error - please try again';
    case 503:
      return 'Service unavailable - please try again later';
    default:
      if (statusNum >= 500) {
        return 'Server error - please try again';
      }
      if (statusNum >= 400) {
        return 'Client error - please check your request';
      }
      return 'An unexpected error occurred';
  }
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error) {
      return (error as any).status === 401;
    }
    if ('data' in error) {
      const data = (error as any).data;
      if (data && typeof data === 'object' && 'code' in data) {
        return data.code === 'API_KEY_MISSING' || data.code === 'API_KEY_INVALID';
      }
    }
  }
  return false;
}
