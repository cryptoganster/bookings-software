import { ValueObject } from '@shared/kernel/value-object';
import { InvalidMessageTypeException } from '@conversation/domain/exceptions/invalid-message-type.exception';

/**
 * MessageType Value Object
 *
 * Representa el tipo de mensaje en una conversación de WhatsApp.
 *
 * @remarks
 * - TEXT: Mensaje de texto simple
 * - BUTTON: Mensaje con botones interactivos
 * - LOCATION: Mensaje con ubicación geográfica
 */
export class MessageType extends ValueObject {
  private static readonly VALID_TYPES = ['TEXT', 'BUTTON', 'LOCATION'] as const;

  private constructor(private readonly value: string) {
    super();
    if (!MessageType.VALID_TYPES.includes(value as any)) {
      throw new InvalidMessageTypeException(value);
    }
  }

  /**
   * Factory method para mensaje de texto
   */
  static text(): MessageType {
    return new MessageType('TEXT');
  }

  /**
   * Factory method para mensaje con botones
   */
  static button(): MessageType {
    return new MessageType('BUTTON');
  }

  /**
   * Factory method para mensaje con ubicación
   */
  static location(): MessageType {
    return new MessageType('LOCATION');
  }

  /**
   * Factory method desde string
   *
   * @param value - Valor del string ('TEXT', 'BUTTON', o 'LOCATION')
   * @throws InvalidMessageTypeException si el valor no es válido
   */
  static fromString(value: string): MessageType {
    return new MessageType(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
