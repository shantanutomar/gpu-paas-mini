import { describe, it, expect } from 'vitest';
import { normalizeError, isAuthError } from '../../utils/errorNormalizer';

describe('errorNormalizer', () => {
  describe('normalizeError', () => {
    it('should normalize RTK Query error with data', () => {
      const error = {
        status: 401,
        data: {
          message: 'API key is required',
          code: 'API_KEY_MISSING',
        },
      };

      const result = normalizeError(error);

      expect(result).toEqual({
        message: 'API key is required',
        code: 'API_KEY_MISSING',
      });
    });

    it('should normalize RTK Query error with string data', () => {
      const error = {
        status: 500,
        data: 'Internal server error',
      };

      const result = normalizeError(error);

      expect(result).toEqual({
        message: 'Internal server error - please try again',
        code: 'HTTP_500',
      });
    });

    it('should normalize fetch error', () => {
      const error = {
        message: 'Network Error',
      };

      const result = normalizeError(error);

      expect(result).toEqual({
        message: 'Network Error',
        code: 'NETWORK_ERROR',
      });
    });

    it('should normalize error object with message', () => {
      const error = new Error('Something went wrong');

      const result = normalizeError(error);

      expect(result).toEqual({
        message: 'Something went wrong',
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle unknown error format', () => {
      const error = { foo: 'bar' };

      const result = normalizeError(error);

      expect(result).toEqual({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      });
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 error', () => {
      const error = {
        status: 401,
        data: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      };

      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for API_KEY_MISSING code', () => {
      const error = {
        data: {
          message: 'API key is required',
          code: 'API_KEY_MISSING',
        },
      };

      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for API_KEY_INVALID code', () => {
      const error = {
        data: {
          message: 'Invalid API key',
          code: 'API_KEY_INVALID',
        },
      };

      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for non-auth error', () => {
      const error = {
        status: 500,
        data: {
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      expect(isAuthError(error)).toBe(false);
    });

    it('should return false for unknown error format', () => {
      const error = new Error('Some error');

      expect(isAuthError(error)).toBe(false);
    });
  });
});
