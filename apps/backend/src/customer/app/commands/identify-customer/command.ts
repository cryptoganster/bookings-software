import { Command } from '@nestjs/cqrs';

/**
 * IdentifyCustomerCommand
 *
 * Identifies or creates a customer based on WhatsApp phone
 * Used when a customer sends a message via WhatsApp
 *
 * Behavior:
 * - If customer exists: returns existing customerId, updates name if changed
 * - If customer doesn't exist: creates new anonymous customer (userId = null)
 *
 * Idempotent: calling multiple times with same data returns same result
 *
 * @see Property 2: Idempotency - calling twice returns same customerId
 */
export class IdentifyCustomerCommand extends Command<{ customerId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly whatsappPhone: string,
    public readonly name: string | null,
  ) {
    super();
  }
}
