import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessReadRepository } from '@business/domain/interfaces/repositories/business-read';
import { BusinessReadModel } from '@business/domain/read-models/business';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessReadMapper } from '@business/infra/persistence/mappers/business-read.mapper';

/**
 * BusinessReadRepository
 *
 * Implements IBusinessReadRepository for optimized read queries
 * Returns read models (DTOs) for display
 * Following CQRS strict pattern - only read operations
 *
 * Requirements: 9.3
 */
@Injectable()
export class BusinessReadRepository implements IBusinessReadRepository {
  constructor(
    @InjectRepository(BusinessModel)
    private readonly repository: Repository<BusinessModel>,
  ) {}

  /**
   * Finds a business by ID
   */
  async findById(id: string): Promise<BusinessReadModel | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    return BusinessReadMapper.toReadModel(model);
  }

  /**
   * Finds all businesses owned by a user
   * Used to list businesses in panel web
   */
  async findByOwnerId(ownerId: string): Promise<BusinessReadModel[]> {
    const models = await this.repository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });

    return models.map((model) => BusinessReadMapper.toReadModel(model));
  }

  /**
   * Finds a business by WhatsApp phone number
   * Used by Conversation BC to identify business from incoming messages
   */
  async findByWhatsAppPhone(whatsappPhone: string): Promise<BusinessReadModel | null> {
    const model = await this.repository.findOne({
      where: { whatsappPhone },
    });

    if (!model) {
      return null;
    }

    return BusinessReadMapper.toReadModel(model);
  }
}
