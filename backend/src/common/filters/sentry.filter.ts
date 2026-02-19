import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errorDetails = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = { stack: exception.stack };
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Capture in Sentry (only 5xx errors and unexpected exceptions)
    if (status >= 500 || !(exception instanceof HttpException)) {
      Sentry.withScope((scope) => {
        scope.setTag('path', request.url);
        scope.setTag('method', request.method);
        scope.setExtra('body', request.body);
        scope.setExtra('query', request.query);
        scope.setExtra('params', request.params);
        
        const user = (request as any).user;
        if (user) {
          scope.setUser({
            id: user.userId || user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
          });
        }

        if (exception instanceof Error) {
          Sentry.captureException(exception);
        } else {
          Sentry.captureMessage(`Non-Error exception: ${JSON.stringify(exception)}`, 'error');
        }
      });
    }

    // Send response
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'],
      ...(process.env.NODE_ENV !== 'production' && { details: errorDetails }),
    });
  }
}
