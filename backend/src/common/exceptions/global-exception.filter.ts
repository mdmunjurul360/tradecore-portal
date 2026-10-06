import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = 
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Normalize message string from NestJS built-in error objects
    if (typeof message === 'object' && message !== null) {
      message = (message as any).message || (message as any).error || 'Internal server error';
      if (Array.isArray(message)) {
        message = message[0]; // Take first validation error if it's an array
      }
    }
    if (status >= 500) {
      this.logger.error(
        { err: exception, req: { method: request.method, url: request.url } },
        'Unhandled Exception'
      );
    } else {
      this.logger.warn(
        { err: exception, req: { method: request.method, url: request.url } },
        'Client Error'
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
