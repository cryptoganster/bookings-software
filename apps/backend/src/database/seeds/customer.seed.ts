import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Customer Seed Data
 *
 * Creates test customers for the system:
 * - 2 anonymous customers (userId = null)
 * - 1 registered customer (userId linked to test user)
 *
 * These customers are referenced by appointments in booking.seed.ts
 *
 * @see .kiro/steering/user-customer-businessowner-architecture.md
 */
export async function seedCustomer(
  dataSource: DataSource,
  businessId: string,
  userId: string,
): Promise<{
  customerId1: string;
  customerId2: string;
  customerId3: string;
}> {
  console.log('👥 Seeding Customer BC...');

  const customerId1 = uuidv4();
  const customerId2 = uuidv4();
  const customerId3 = uuidv4();

  // Customer 1 - Anonymous (userId = null)
  // WhatsApp: +18095551111
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [customerId1, null, businessId, '+18095551111', 'Juan Pérez', 0],
  );

  // Customer 2 - Registered (userId linked to test user)
  // WhatsApp: +18095552222
  // This customer is linked to the test user (test@example.com)
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [customerId2, userId, businessId, '+18095552222', 'María García', 0],
  );

  // Customer 3 - Anonymous (userId = null)
  // WhatsApp: +18095553333
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [customerId3, null, businessId, '+18095553333', 'Carlos López', 0],
  );

  console.log('✅ Customer BC seeded: 3 customers');
  console.log('   - Customer 1 (Juan Pérez): Anonymous, +18095551111');
  console.log(
    '   - Customer 2 (María García): Registered (linked to test@example.com), +18095552222',
  );
  console.log('   - Customer 3 (Carlos López): Anonymous, +18095553333');

  return { customerId1, customerId2, customerId3 };
}
