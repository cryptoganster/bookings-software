import { Inject, Injectable } from '@nestjs/common';
import { IBusinessUniquenessChecker } from '../interfaces/services/business-uniqueness-checker.interface';
import { IBusinessReadRepository } from '../interfaces/repositories/business-read';

/**
 * Domain Service: BusinessUniquenessChecker
 *
 * Validates uniqueness of WhatsApp phone numbers in Business BC.
 *
 * This service encapsulates read operations for validation purposes,
 * allowing command handlers to maintain CQRS strict separation by
 * not directly injecting read repositories.
 *
 * @implements {IBusinessUniquenessChecker}
 */
@Injectable()
export class BusinessUniquenessChecker implements IBusinessUniquenessChecker {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepo: IBusinessReadRepository,
  ) {}

  /**
   * Checks if a WhatsApp phone number is unique
   *
   * @param phone - WhatsApp phone number to check
   * @param excludeBusinessId - Optional business ID to exclude (for updates)
   * @returns true if unique, false if already exists
   */
  async isWhatsAppPhoneUnique(phone: string, excludeBusinessId?: string): Promise<boolean> {
    const existing = await this.readRepo.findByWhatsAppPhone(phone);

    // Phone not found - it's unique
    if (!existing) {
      return true;
    }

    // If we're updating a business, allow the same business to keep its phone
    if (excludeBusinessId && existing.id === excludeBusinessId) {
      return true;
    }

    // Phone exists and belongs to a different business
    return false;
  }
}
