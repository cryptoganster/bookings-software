import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception lanzada cuando se proporciona una dirección de mensaje inválida
 */
export class InvalidMessageDirectionException extends DomainException {
  constructor(direction: string) {
    super(`Invalid message direction: ${direction}. Must be INBOUND or OUTBOUND`);
  }
}
