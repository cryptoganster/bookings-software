/**
 * Business Fixture
 *
 * Provides utilities for creating test businesses in E2E tests
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { CreateBusinessDto } from '@test-utils/e2e/types';

export class BusinessFixture {
  private createdBusinesses: string[] = [];

  constructor(
    private readonly app: INestApplication,
    private readonly authToken: string,
  ) {}

  /**
   * Create a test business
   */
  async createBusiness(data?: Partial<CreateBusinessDto>): Promise<{ id: string; name: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/businesses')
      .set('Authorization', `Bearer ${this.authToken}`)
      .send({
        name: data?.name || 'Test Business',
        whatsappNumber: data?.whatsappNumber || '+18095551234',
        address: data?.address || '123 Test St',
        timezone: data?.timezone || 'America/Santo_Domingo',
      })
      .expect(201);

    this.createdBusinesses.push(response.body.id);
    return {
      id: response.body.id,
      name: response.body.name,
    };
  }

  /**
   * Clean up all created businesses
   */
  async cleanup(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const errors: Error[] = [];

    for (const businessId of this.createdBusinesses) {
      try {
        await dataSource.query('DELETE FROM businesses WHERE id = $1', [businessId]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup business ${businessId}:`, error);
      }
    }

    this.createdBusinesses = [];

    if (errors.length > 0) {
      console.warn(`Business cleanup completed with ${errors.length} errors`);
    }
  }

  /**
   * Get list of created business IDs
   */
  getCreatedBusinessIds(): string[] {
    return [...this.createdBusinesses];
  }
}
