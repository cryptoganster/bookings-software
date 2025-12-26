import { Inject, Injectable } from '@nestjs/common';
import { ICustomerExistenceChecker } from '@customer/domain/interfaces/services/customer-existence-checker.interface';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';
import { CustomerReadModel } from '@customer/domain/read-models/customer';

/**
 * Domain Service: CustomerExistenceChecker
 *
 * Validates customer existence in Customer BC.
 *
 * This service encapsulates read operations for validation purposes,
 * allowing command handlers to maintain CQRS strict separation by
 * not directly injecting read repositories.
 *
 * @implements {ICustomerExistenceChecker}
 */
@Injectable()
export class CustomerExistenceChecker implements ICustomerExistenceChecker {
  constructor(
    @Inject('ICustomerReadRepository')
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  /**
   * Checks if a customer exists
   *
   * @param customerId - Customer ID to check
   * @returns true if exists, false otherwise
   */
  async exists(customerId: string): Promise<boolean> {
    try {
      const customer = await this.readRepo.findById(customerId);
      return customer !== null;
    } catch {
      // findById throws CustomerNotFoundException if not found
      // We want to return false instead of throwing
      return false;
    }
  }

  /**
   * Gets customer data if exists
   *
   * @param customerId - Customer ID to retrieve
   * @returns CustomerReadModel if found, null otherwise
   */
  async getCustomer(customerId: string): Promise<CustomerReadModel | null> {
    try {
      return await this.readRepo.findById(customerId);
    } catch {
      // findById throws CustomerNotFoundException if not found
      // We want to return null instead of throwing
      return null;
    }
  }
}
