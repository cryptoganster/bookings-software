import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed: Create Test Business for WhatsApp Integration
 *
 * This seed creates a test business with the real WhatsApp number
 * configured in the system. This is a temporary solution for MVP
 * single-tenant mode.
 *
 * In the future multi-tenant implementation, businesses will be
 * created through the UI by business owners.
 *
 * Requirements: Immediate Configuration (Pre-Multi-Tenant)
 */
export async function seed001CreateTestBusiness(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if business already exists
    const existing = await queryRunner.query(
      `SELECT id FROM businesses WHERE whatsapp_phone = $1`,
      ['+18097982896'],
    );

    if (existing.length > 0) {
      console.log('✅ Test business already exists, skipping seed');
      await queryRunner.commitTransaction();
      return;
    }

    // Generate UUIDs
    const userId = uuidv4();
    const businessOwnerId = uuidv4();
    const businessId = uuidv4();

    // 1. Create test user (business owner)
    await queryRunner.query(
      `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        userId,
        'test@bookings.com',
        '$2b$10$YourHashedPasswordHere', // bcrypt hash of "password123"
        'Test Business Owner',
        JSON.stringify(['BUSINESS_OWNER']),
        true,
        true,
      ],
    );

    // 2. Create business owner profile
    await queryRunner.query(
      `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [businessOwnerId, userId, 'FREE', 'ACTIVE', true, 0],
    );

    // 3. Create business with real WhatsApp number
    await queryRunner.query(
      `INSERT INTO businesses (
        id, owner_id, name, whatsapp_phone,
        address_street, address_city, address_state, address_country, address_postal_code,
        timezone, is_active, version, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        businessId,
        userId,
        'Test Business - Bookings Bot',
        '+18097982896', // Real WhatsApp number from .env
        'Calle Principal 123',
        'Santo Domingo',
        'Distrito Nacional',
        'Dominican Republic',
        '10001',
        'America/Santo_Domingo',
        true,
        0,
      ],
    );

    await queryRunner.commitTransaction();
    console.log('✅ Test business created successfully');
    console.log(`   Business ID: ${businessId}`);
    console.log(`   WhatsApp: +18097982896`);
    console.log(`   Owner: test@bookings.com`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error creating test business:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
