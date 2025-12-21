/**
 * BusinessWhatsAppConfigured Domain Event
 *
 * Published when WhatsApp Business phone is configured or updated
 */
export class BusinessWhatsAppConfigured {
  constructor(
    public readonly businessId: string,
    public readonly whatsappPhone: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
