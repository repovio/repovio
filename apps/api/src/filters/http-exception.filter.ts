import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';

/** Produces a stable response shape for unhandled HTTP and application errors. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Translate an exception into the stable HTTP error response.
   *
   * @param exception - Exception to translate into the public error contract.
   * @param host - Nest arguments host providing the HTTP response.
   * @returns No return value.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const status = this.getStatus(exception);
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      exception instanceof ZodValidationException
        ? (exception.getZodError() as z.ZodError).issues.map((issue) => {
            const path = issue.path
              .filter((part) => typeof part === 'number' || (typeof part === 'string' && /^[A-Za-z_]\w*$/.test(part)))
              .join('.');
            return `${path || 'request'}: Invalid value (${issue.code}).`;
          })
        : status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : typeof payload === 'object' && payload && 'message' in payload
            ? payload.message
            : typeof payload === 'string'
              ? payload
              : 'Invalid request';

    response.code(status).send({
      error: HttpStatus[status] ?? 'Error',
      message,
      statusCode: status,
    });
  }

  /**
   * Resolve framework exceptions and Fastify client errors without exposing arbitrary server errors.
   *
   * @param exception - Exception raised during request handling.
   * @returns The public HTTP status code.
   */
  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (typeof exception === 'object' && exception && 'statusCode' in exception) {
      const { statusCode } = exception;
      if (typeof statusCode === 'number' && Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500) {
        return statusCode;
      }
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
