import { Message } from '@conversation/domain/aggregates/message';

/**
 * IMessageWriteRepository Interface
 *
 * Repositorio de escritura para el aggregate Message.
 * Siguiendo CQRS estricto, solo contiene operaciones de escritura.
 *
 * @remarks
 * - save(): Persiste un mensaje (insert only, messages are immutable)
 * - No incluye métodos de lectura (usar IMessageReadRepository)
 */
export interface IMessageWriteRepository {
  /**
   * Persiste un mensaje en la base de datos
   *
   * @param message - Aggregate Message a persistir
   * @returns Promise que se resuelve cuando el mensaje es persistido
   */
  save(message: Message): Promise<void>;
}
