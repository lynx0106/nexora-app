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

    const logPayload = {
      requestId,
      method: request.method,
      path: request.originalUrl || request.url,
      statusCode: status,
      tenantId: user?.tenantId,
      userId: user?.userId,
      error: exception instanceof Error ? exception.message : exception,
    };

    this.logger.error(JSON.stringify(logPayload));

    await reportError(exception, {
      requestId,
      method: logPayload.method,
      path: logPayload.path,
      statusCode: status,
      tenantId: logPayload.tenantId,
      userId: logPayload.userId,
    });

    const responseBody =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Error interno del servidor' };

    response.status(status).json(responseBody);
  }
}
