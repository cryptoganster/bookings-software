import { Inject, Injectable } from '@nestjs/common';
import { IBusinessLimitChecker } from '../interfaces/services/business-limit-checker.interface';
import { IBusinessReadRepository } from '../interfaces/repositories/business-read';
import { IBusinessOwnerReadRepository } from '@account/domain/interfaces/repositories/business-owner-read.interface';
import { BusinessOwnerNotFoundException } from '../exceptions/business-owner-not-found';

/**
 * Domain Service: BusinessLimitChecker
 *
 * Validates business creation limits based on subscription plan.
 *
 * This service encapsulates read operations for validation purposes,
 * allowing command handlers to maintain CQRS strict separation by
 * not directly injecting read repositories.
 *
 * @implements {IBusinessLimitChecker}
 */
@Injectable()
export class BusinessLimitChecker implements IBusinessLimitChecker {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly businessReadRepo: IBusinessReadRepository,
    @Inject('IBusinessOwnerReadRepository')
    private readonly ownerReadRepo: IBusinessOwnerReadRepository,
  ) {}

  /**
   * Checks if a business owner can create a new business
   *
   * @param ownerId - User ID of the business owner
   * @returns true if can create, false if limit reached
   * @throws BusinessOwnerNotFoundException if owner not found
   */
  async canCreateBusiness(ownerId: string): Promise<boolean> {
    const [currentCount, maxAllowed] = await Promise.all([
      this.getBusinessCount(ownerId),
      this.getMaxBusinessesAllowed(ownerId),
    ]);

    return currentCount < maxAllowed;
  }

  /**
   * Gets the current number of businesses owned by a user
   *
   * @param ownerId - User ID of the business owner
   * @returns Number of businesses currently owned
   */
  async getBusinessCount(ownerId: string): Promise<number> {
    const businesses = await this.businessReadRepo.findByOwnerId(ownerId);
    return businesses.length;
  }

  /**
   * Gets the maximum number of businesses allowed for a user
   *
   * @param ownerId - User ID of the business owner
   * @returns Maximum businesses allowed by subscription plan
   * @throws BusinessOwnerNotFoundException if owner not found
   */
  async getMaxBusinessesAllowed(ownerId: string): Promise<number> {
    const owner = await this.ownerReadRepo.findByUserId(ownerId);

    if (!owner) {
      throw new BusinessOwnerNotFoundException(ownerId);
    }

    // Return limit from subscription plan
    return owner.maxBusinesses;
  }
}
