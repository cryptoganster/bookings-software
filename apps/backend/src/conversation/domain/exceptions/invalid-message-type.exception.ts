import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception lanzada cuando se proporciona un tipo de mensaje inválido
 */
export class InvalidMessageTypeException extends DomainException {
  constructor(messageType: string) {
    super(`Invalid message type: ${messageType}. Must be TEXT, BUTTON, or LOCATION`);
  }
}
