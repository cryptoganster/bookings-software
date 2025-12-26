import { IQuery } from '@nestjs/cqrs';

/**
 * Base class for Queries with typed result
 *
 * @template TResult - The type of the result returned by the query handler
 *
 * @example
 * ```typescript
 * export class GetAppointmentQuery extends Query<AppointmentReadModel> {
 *   constructor(public readonly appointmentId: string) {
 *     super();
 *   }
 * }
 * ```
 */
export abstract class Query<TResult> implements IQuery {
  // Marker property for type inference (not used at runtime)
  readonly __resultType?: TResult;
}
