import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { DomainException } from '@shared/kernel/exceptions/domain';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const statusCode = this.getStatusCode(exception);

    response.status(statusCode).send({
      statusCode,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }

  private getStatusCode(exception: DomainException): number {
    // Handle concurrency exceptions
    if (exception instanceof ConcurrencyException) {
      return HttpStatus.CONFLICT;
    }

    // Handle *NotFoundException -> 404
    if (exception.name.endsWith('NotFoundException')) {
      return HttpStatus.NOT_FOUND;
    }

    // Handle *AlreadyExistsException -> 409
    if (exception.name.endsWith('AlreadyExistsException')) {
      return HttpStatus.CONFLICT;
    }

    // Handle *ForbiddenException -> 403
    if (exception.name.endsWith('ForbiddenException')) {
      return HttpStatus.FORBIDDEN;
    }

    // Default to 400 Bad Request for other domain exceptions
    return HttpStatus.BAD_REQUEST;
  }
}
