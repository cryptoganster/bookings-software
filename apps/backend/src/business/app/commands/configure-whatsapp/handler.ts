import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfigureWhatsAppCommand } from '@business/app/commands/configure-whatsapp/command';
import { IBusinessFactory } from '@business/domain/interfaces/factories/business-factory';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { IBusinessReadRepository } from '@business/domain/interfaces/repositories/business-read';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { BusinessNotFoundException } from '@business/domain/exceptions/business-not-found';
import { WhatsAppPhoneAlreadyExistsException } from '@shared/kernel/exceptions/whatsapp-phone-already-exists';

/**
 * ConfigureWhatsAppHandler
 *
 * Handles configuring WhatsApp phone number for a business.
 * Validates global uniqueness before updating.
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
    @Inject('IBusinessReadRepository')
    private readonly readRepository: IBusinessReadRepository,
  ) {}

  async execute(command: ConfigureWhatsAppCommand): Promise<void> {
    // Load business
    const business = await this.factory.loadById(command.businessId);

    if (!business) {
      throw new BusinessNotFoundException(command.businessId);
    }

    // Validate WhatsAppPhone uniqueness (skip if same as current)
    if (business.getWhatsAppPhone().getValue() !== command.whatsappPhone) {
      const existingBusiness = await this.readRepository.findByWhatsAppPhone(command.whatsappPhone);

      if (existingBusiness) {
        throw new WhatsAppPhoneAlreadyExistsException(command.whatsappPhone);
      }
    }

    // Configure WhatsApp
    const whatsappPhone = WhatsAppPhone.fromString(command.whatsappPhone);
    business.configureWhatsApp(whatsappPhone);

    // Persist
    await this.writeRepository.save(business);
  }
}
