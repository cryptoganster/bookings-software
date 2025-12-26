import { ICommand } from '@nestjs/cqrs';

/**
 * Base class for Commands with typed result
 *
 * @template TResult - The type of the result returned by the command handler
 *
 * @example
 * ```typescript
 * export class CreateAppointmentCommand extends Command<{ appointmentId: string }> {
 *   constructor(
 *     public readonly businessId: string,
 *     public readonly customerId: string,
 *   ) {
 *     super();
 *   }
 * }
 * ```
 */
export abstract class Command<TResult = void> implements ICommand {
  // Marker property for type inference (not used at runtime)
  readonly __resultType?: TResult;
}
