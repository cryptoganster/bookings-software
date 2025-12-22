/**
 * Customer Fixture
 *
 * Provides utilities for creating test customers in E2E tests
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UUID } from '@shared/vo/uuid';

export interface Customer {
  id: string;
  business_id: string;
  whatsapp_phone: string;
  name: string | null;
  user_id: string | null;
}

export class CustomerFixture {
  private createdCustomers: string[] = [];

  constructor(
    private readonly app: INestApplication,
    private readonly businessId: string,
  ) {}

  /**
   * Create an anonymous customer (userId = null)
   */
  async createAnonymousCustomer(whatsappPhone?: string): Promise<Customer> {
    const dataSource = this.app.get(DataSource);
    const customer: Customer = {
      id: UUID.generate().getValue(),
      business_id: this.businessId,
      whatsapp_phone: whatsappPhone || `+1809555${Math.floor(1000 + Math.random() * 9000)}`,
      name: null,
      user_id: null,
    };

    await dataSource.query(
      'INSERT INTO customers (id, business_id, whatsapp_phone, name, user_id) VALUES ($1, $2, $3, $4, $5)',
      [customer.id, customer.business_id, customer.whatsapp_phone, customer.name, customer.user_id],
    );

    this.createdCustomers.push(customer.id);
    return customer;
  }

  /**
   * Create a registered customer (userId != null)
   */
  async createRegisteredCustomer(
    userId: string,
    whatsappPhone?: string,
    name?: string,
  ): Promise<Customer> {
    const dataSource = this.app.get(DataSource);
    const customer: Customer = {
      id: UUID.generate().getValue(),
      business_id: this.businessId,
      whatsapp_phone: whatsappPhone || `+1809555${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || 'Test Customer',
      user_id: userId,
    };

    await dataSource.query(
      'INSERT INTO customers (id, business_id, whatsapp_phone, name, user_id) VALUES ($1, $2, $3, $4, $5)',
      [customer.id, customer.business_id, customer.whatsapp_phone, customer.name, customer.user_id],
    );

    this.createdCustomers.push(customer.id);
    return customer;
  }

  /**
   * Create multiple anonymous customers
   */
  async createMultipleCustomers(count: number): Promise<Customer[]> {
    const customers: Customer[] = [];
    for (let i = 0; i < count; i++) {
      const customer = await this.createAnonymousCustomer();
      customers.push(customer);
    }
    return customers;
  }

  /**
   * Clean up all created customers
   */
  async cleanup(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const errors: Error[] = [];

    for (const customerId of this.createdCustomers) {
      try {
        await dataSource.query('DELETE FROM customers WHERE id = $1', [customerId]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup customer ${customerId}:`, error);
      }
    }

    this.createdCustomers = [];

    if (errors.length > 0) {
      console.warn(`Customer cleanup completed with ${errors.length} errors`);
    }
  }

  /**
   * Get list of created customer IDs
   */
  getCreatedCustomerIds(): string[] {
    return [...this.createdCustomers];
  }
}
