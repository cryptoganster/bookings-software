import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfigureWhatsAppCommand } from '@business/app/commands/configure-whatsapp/command';
import { IBusinessFactory } from '@business/domain/interfaces/factories/business-factory';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { IBusinessUniquenessChecker } from '@business/domain/interfaces/services/business-uniqueness-checker.interface';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';
import { WhatsAppPhoneAlreadyExistsException } from '@shared/kernel/exceptions/whatsapp-phone-already-exists';

/**
 * ConfigureWhatsAppHandler
 *
 * Handles configuring WhatsApp phone number for a business.
 * Validates global uniqueness before updating.
 *
 * Architecture:
 * - Uses Domain Service for validation (maintains CQRS strict separation)
 * - Uses Factory to load aggregate for modification
 * - Only injects Write Repository for persistence
 * - No direct Read Repository injection (CQRS compliant)
 *
 * Requirements: 3.1-3.5, 10.3
 */
@CommandHandler(ConfigureWhatsAppCommand)
export class ConfigureWhatsAppHandler implements ICommandHandler<ConfigureWhatsAppCommand> {
  constructor(
    @Inject('IBusinessFactory')
    private readonly factory: IBusinessFactory,
    @Inject('IBusinessWriteRepository')
    private readonly writeRepository: IBusinessWriteRepository,
    @Inject('IBusinessUniquenessChecker')
    private readonly uniquenessChecker: IBusinessUniquenessChecker,
  ) {}

  async execute(command: ConfigureWhatsAppCommand): Promise<void> {
    // Load business
    const business = await this.factory.loadById(command.businessId);

    if (!business) {
      throw new BusinessNotFoundException(command.businessId);
    }

    // Validate WhatsAppPhone uniqueness using domain service
    // Pass current businessId to exclude it from uniqueness check (update scenario)
    const isUnique = await this.uniquenessChecker.isWhatsAppPhoneUnique(
      command.whatsappPhone,
      command.businessId,
    );

    if (!isUnique) {
      throw new WhatsAppPhoneAlreadyExistsException(command.whatsappPhone);
    }

    // Configure WhatsApp
    const whatsappPhone = WhatsAppPhone.fromString(command.whatsappPhone);
    business.configureWhatsApp(whatsappPhone);

    // Persist
    await this.writeRepository.save(business);
  }
}
