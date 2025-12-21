import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessFactory } from '@business/domain/interfaces/factories/business-factory';
import { Business } from '@business/domain/aggregates/business';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Timezone } from '@business/domain/vo/timezone';
import { BusinessAddress } from '@business/domain/vo/business-address';

/**
 * BusinessFactory
 *
 * Implements IBusinessFactory to load Business aggregates from persistence
 * Used by command handlers to load aggregates for modification
 * Follows Factory Pattern for CQRS strict separation
 *
 * Requirements: 9.2
 */
@Injectable()
export class BusinessFactory implements IBusinessFactory {
  constructor(
    @InjectRepository(BusinessModel)
    private readonly repository: Repository<BusinessModel>,
  ) {}

  /**
   * Loads a Business aggregate by ID
   * Reconstructs aggregate with business logic using fromPersistence()
   * Preserves version for optimistic locking
   *
   * @param id Business ID
   * @returns Business aggregate or null if not found
   */
  async loadById(id: string): Promise<Business | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    // Reconstruct aggregate with business logic
    return Business.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.ownerId),
      model.name,
      WhatsAppPhone.fromString(model.whatsappPhone),
      BusinessAddress.create(
        model.addressStreet,
        model.addressCity,
        model.addressState || undefined,
        model.addressCountry || undefined,
        model.addressPostalCode || undefined,
      ),
      Timezone.create(model.timezone),
      model.isActive,
      model.createdAt,
      model.version, // ← Preserve version for optimistic locking
    );
  }
}
