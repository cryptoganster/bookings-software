import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
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
    if (exception instanceof ConcurrencyException) {
      return HttpStatus.CONFLICT;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
