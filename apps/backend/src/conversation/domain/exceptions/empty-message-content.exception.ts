import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception lanzada cuando se intenta crear un mensaje con contenido vacío
 */
export class EmptyMessageContentException extends DomainException {
  constructor() {
    super('Message content cannot be empty');
  }
}
