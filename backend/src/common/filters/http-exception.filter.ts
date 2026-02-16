import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { reportError } from '../observability/error-tracker';
import { BusinessException, BusinessErrorCode } from '../exceptions/business.exception';

interface ErrorResponse {
  statusCode: number;
  code?: BusinessErrorCode | string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = request.headers['x-request-id'] as string | undefined;
    const user = (request as any).user;

    // Construir respuesta de error estructurada
    const errorResponse = this.buildErrorResponse(exception, status, request, requestId);

    // Logging estructurado
    const logPayload = {
      requestId,
      method: request.method,
      path: request.originalUrl || request.url,
      statusCode: status,
      code: errorResponse.code,
      tenantId: user?.tenantId,
      userId: user?.userId,
      error: exception instanceof Error ? exception.message : exception,
      stack: exception instanceof Error && status >= 500 ? exception.stack : undefined,
    };

    // Solo loggear errores 4xx y 5xx
    if (status >= 400) {
      this.logger.error(JSON.stringify(logPayload));

      // Reportar errores críticos (5xx)
      if (status >= 500) {
        await reportError(exception, {
          requestId,
          method: logPayload.method,
          path: logPayload.path,
          statusCode: status,
          code: errorResponse.code,
          tenantId: logPayload.tenantId,
          userId: logPayload.userId,
        });
      }
    }

    response.status(status).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    status: number,
    request: Request,
    requestId?: string,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.originalUrl || request.url;

    // Manejar BusinessException (errores de negocio)
    if (exception instanceof BusinessException) {
      const businessResponse = exception.getResponse() as any;
      return {
        statusCode: status,
        code: exception.code,
        message: businessResponse.message,
        details: businessResponse.details,
        timestamp,
        path,
        requestId,
      };
    }

    // Manejar HttpException estándar
    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse();
      
      // Si ya es un objeto estructurado
      if (typeof httpResponse === 'object' && httpResponse !== null) {
        return {
          statusCode: status,
          ...(httpResponse as any),
          timestamp,
          path,
          requestId,
        };
      }

      // Si es un string
      return {
        statusCode: status,
        message: httpResponse as string,
        timestamp,
        path,
        requestId,
      };
    }

    // Errores no controlados (500)
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: BusinessErrorCode.INTERNAL_ERROR,
      message: isProduction 
        ? 'Error interno del servidor' 
        : (exception instanceof Error ? exception.message : 'Error desconocido'),
      timestamp,
      path,
      requestId,
    };
  }
}
