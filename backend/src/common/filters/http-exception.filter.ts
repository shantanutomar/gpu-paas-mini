import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global exception filter to ensure consistent error response format across the API
 *
 * Error format:
 * {
 *   message: string;       // Human-readable error message
 *   code: string;          // Machine-readable error code
 *   details?: any;         // Optional additional details
 *   requestId?: string;    // Optional request ID for tracing
 * }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error information
    let message = 'An error occurred';
    let code = this.getDefaultCodeForStatus(status);
    let details: any = undefined;

    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;

      // Use provided message or code if available
      message = responseObj.message || message;
      code = responseObj.code || code;
      details = responseObj.details;

      // Handle validation errors (class-validator)
      if (Array.isArray(responseObj.message)) {
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
        details = responseObj.message;
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    // Build consistent error response
    const errorResponse: any = {
      message,
      code,
    };

    if (details) {
      errorResponse.details = details;
    }

    // Optional: Add request ID if you have request tracking
    // errorResponse.requestId = request.id;

    response.status(status).json(errorResponse);
  }

  /**
   * Get default error code based on HTTP status
   */
  private getDefaultCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_ERROR';
      default:
        return 'ERROR';
    }
  }
}
