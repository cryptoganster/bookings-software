/**
 * BusinessWhatsAppConfigured Domain Event
 *
 * Published when business WhatsApp phone is configured.
 *
 * Requirements: 6.3
 */
export class BusinessWhatsAppConfigured {
  constructor(
    public readonly businessId: string,
    public readonly whatsappPhone: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
