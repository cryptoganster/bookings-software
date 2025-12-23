import { ValueObject } from '@shared/kernel/value-object';
import { InvalidMessageDirectionException } from '@conversation/domain/exceptions/invalid-message-direction.exception';

/**
 * MessageDirection Value Object
 *
 * Representa la dirección de un mensaje en una conversación.
 *
 * @remarks
 * - INBOUND: Mensaje recibido del cliente (vía WhatsApp)
 * - OUTBOUND: Mensaje enviado al cliente (vía WhatsApp)
 */
export class MessageDirection extends ValueObject {
  private static readonly VALID_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;

  private constructor(private readonly value: string) {
    super();
    if (!MessageDirection.VALID_DIRECTIONS.includes(value as any)) {
      throw new InvalidMessageDirectionException(value);
    }
  }

  /**
   * Factory method para mensaje entrante (del cliente)
   */
  static inbound(): MessageDirection {
    return new MessageDirection('INBOUND');
  }

  /**
   * Factory method para mensaje saliente (al cliente)
   */
  static outbound(): MessageDirection {
    return new MessageDirection('OUTBOUND');
  }

  /**
   * Factory method desde string
   *
   * @param value - Valor del string ('INBOUND' o 'OUTBOUND')
   * @throws InvalidMessageDirectionException si el valor no es válido
   */
  static fromString(value: string): MessageDirection {
    return new MessageDirection(value);
  }

  /**
   * Verifica si el mensaje es entrante
   */
  isInbound(): boolean {
    return this.value === 'INBOUND';
  }

  /**
   * Verifica si el mensaje es saliente
   */
  isOutbound(): boolean {
    return this.value === 'OUTBOUND';
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
