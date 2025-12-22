import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

/**
 * Customer Seed Data - Comprehensive Test Dataset
 *
 * Creates 25 diverse customers for testing:
 * - 12 anonymous customers (userId = null)
 * - 8 registered customers (userId linked to test users)
 * - 5 merged customers (soft-deleted, merged_into set)
 *
 * Features:
 * - Various name patterns (short, long, special characters, null)
 * - International phone formats (+34, +44, +86, +49)
 * - Potential duplicate pairs for deduplication testing
 * - Various creation dates for time-based filtering
 * - Different appointment counts (0 to 12)
 *
 * @see .kiro/specs/customer-bc-backend-integration/seed-data-spec.md
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
  console.log('👥 Seeding Customer BC (Comprehensive Dataset)...');

  // ============================================
  // STEP 1: Create additional test users for registered customers
  // ============================================
  const testUsers: string[] = [userId]; // testUserId1 (already exists from auth seed)
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  for (let i = 2; i <= 8; i++) {
    const testUserId = uuidv4();
    await dataSource.query(
      `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, version, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        testUserId,
        `test${i}@example.com`,
        hashedPassword,
        `Test User ${i}`,
        ['CUSTOMER'],
        true,
        true,
        0,
      ],
    );
    testUsers.push(testUserId);
  }

  console.log(`   ✓ Created ${testUsers.length} test users for registered customers`);

  // ============================================
  // STEP 2: Create 25 customers
  // ============================================

  // --- ANONYMOUS CUSTOMERS (12) ---

  // Customer 1 - Juan Pérez (5 appointments)
  const customerId1 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId1, null, businessId, '+18095551111', 'Juan Pérez', 0, '2025-01-15T10:00:00Z'],
  );

  // Customer 2 - Carlos López (0 appointments)
  const customerId2 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId2, null, businessId, '+18095553333', 'Carlos López', 0, '2025-02-20T14:30:00Z'],
  );

  // Customer 3 - No Name (1 appointment)
  const customerId3 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId3, null, businessId, '+18095554444', null, 0, '2025-03-10T09:15:00Z'],
  );

  // Customer 4 - Juan Perez (Duplicate candidate, 2 appointments)
  const customerId4 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId4, null, businessId, '+18095556666', 'Juan Perez', 0, '2025-04-05T11:20:00Z'],
  );

  // Customer 5 - Luis Rodríguez (3 appointments)
  const customerId5 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId5, null, businessId, '+18095558888', 'Luis Rodríguez', 0, '2025-05-12T16:45:00Z'],
  );

  // Customer 6 - Carmen Díaz (1 appointment, recent this month)
  const customerId6 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId6, null, businessId, '+18095559999', 'Carmen Díaz', 0, '2025-12-01T08:00:00Z'],
  );

  // Customer 7 - José María de la Cruz y Fernández (Long name, 4 appointments, Spain)
  const customerId7 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId7,
      null,
      businessId,
      '+34612345678',
      'José María de la Cruz y Fernández',
      0,
      '2025-06-18T13:30:00Z',
    ],
  );

  // Customer 8 - O'Brien (Special character, 2 appointments, UK)
  const customerId8 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId8, null, businessId, '+442071234567', "O'Brien", 0, '2025-07-22T10:15:00Z'],
  );

  // Customer 9 - 李明 (Chinese characters, 1 appointment, China)
  const customerId9 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId9, null, businessId, '+8613800138000', '李明', 0, '2025-08-30T15:20:00Z'],
  );

  // Customer 10 - Müller (Umlaut, 3 appointments, Germany)
  const customerId10 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId10, null, businessId, '+4915123456789', 'Müller', 0, '2025-09-14T12:00:00Z'],
  );

  // Customer 11 - No Name 2 (0 appointments)
  const customerId11 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId11, null, businessId, '+18095550000', null, 0, '2025-10-05T09:30:00Z'],
  );

  // Customer 12 - Roberto Sánchez (6 appointments)
  const customerId12 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [customerId12, null, businessId, '+18095551234', 'Roberto Sánchez', 0, '2025-11-20T14:45:00Z'],
  );

  // --- REGISTERED CUSTOMERS (8) ---

  // Customer 13 - María García (10 appointments, registered)
  const customerId13 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId13,
      testUsers[0],
      businessId,
      '+18095552222',
      'María García',
      0,
      '2025-01-20T11:00:00Z',
    ],
  );

  // Customer 14 - Ana Martínez (3 appointments, registered)
  const customerId14 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId14,
      testUsers[1],
      businessId,
      '+18095555555',
      'Ana Martínez',
      0,
      '2025-02-15T10:30:00Z',
    ],
  );

  // Customer 15 - Maria Garcia (Duplicate candidate, 2 appointments, registered)
  const customerId15 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId15,
      testUsers[2],
      businessId,
      '+18095557777',
      'Maria Garcia',
      0,
      '2025-03-25T09:00:00Z',
    ],
  );

  // Customer 16 - Pedro Ramírez (7 appointments, registered)
  const customerId16 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId16,
      testUsers[3],
      businessId,
      '+18095558765',
      'Pedro Ramírez',
      0,
      '2025-04-10T13:15:00Z',
    ],
  );

  // Customer 17 - Laura Fernández (4 appointments, registered)
  const customerId17 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId17,
      testUsers[4],
      businessId,
      '+18095559876',
      'Laura Fernández',
      0,
      '2025-05-22T16:00:00Z',
    ],
  );

  // Customer 18 - Diego Torres (1 appointment, registered, recent this month)
  const customerId18 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId18,
      testUsers[5],
      businessId,
      '+18095550987',
      'Diego Torres',
      0,
      '2025-12-10T10:00:00Z',
    ],
  );

  // Customer 19 - Sofía Morales (0 appointments, registered, recent this week)
  const customerId19 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId19,
      testUsers[6],
      businessId,
      '+18095551098',
      'Sofía Morales',
      0,
      '2025-12-15T14:30:00Z',
    ],
  );

  // Customer 20 - Miguel Ángel Ruiz (12 appointments, registered)
  const customerId20 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
    [
      customerId20,
      testUsers[7],
      businessId,
      '+18095552109',
      'Miguel Ángel Ruiz',
      0,
      '2025-11-05T11:45:00Z',
    ],
  );

  // --- MERGED CUSTOMERS (5) - Soft-deleted ---

  // Customer 21 - Merged into Pedro Ramírez (Customer 16)
  const customerId21 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, merged_into, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [
      customerId21,
      null,
      businessId,
      '+999170000001',
      null,
      0,
      customerId16,
      '2025-01-10T09:00:00Z',
    ],
  );

  // Customer 22 - Merged into Juan Pérez (Customer 1)
  const customerId22 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, merged_into, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [customerId22, null, businessId, '+999170000002', null, 0, customerId1, '2025-02-05T10:30:00Z'],
  );

  // Customer 23 - Merged into María García (Customer 13)
  const customerId23 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, merged_into, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [
      customerId23,
      null,
      businessId,
      '+999170000003',
      null,
      0,
      customerId13,
      '2025-03-12T11:15:00Z',
    ],
  );

  // Customer 24 - Merged into Carlos López (Customer 2)
  const customerId24 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, merged_into, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [customerId24, null, businessId, '+999170000004', null, 0, customerId2, '2025-04-20T14:00:00Z'],
  );

  // Customer 25 - Merged into Luis Rodríguez (Customer 5)
  const customerId25 = uuidv4();
  await dataSource.query(
    `INSERT INTO customers (id, user_id, business_id, whatsapp_phone, name, version, merged_into, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [customerId25, null, businessId, '+999170000005', null, 0, customerId5, '2025-05-08T15:30:00Z'],
  );

  // ============================================
  // SUMMARY
  // ============================================
  console.log('✅ Customer BC seeded: 25 customers');
  console.log('   📊 Distribution:');
  console.log('      - Anonymous: 12 customers');
  console.log('      - Registered: 8 customers');
  console.log('      - Merged (soft-deleted): 5 customers');
  console.log('   🌍 International phones: +34 (Spain), +44 (UK), +86 (China), +49 (Germany)');
  console.log("   🔤 Special characters: O'Brien, Müller, 李明");
  console.log('   👥 Duplicate pairs: Juan Pérez/Juan Perez, María García/Maria Garcia');
  console.log('   📅 Time distribution: Jan-Dec 2025 (3 recent in December)');
  console.log('   📈 Appointment counts: 0 to 12 appointments per customer');
  console.log('');
  console.log('   🔑 Test Users Created:');
  console.log('      - test@example.com (María García)');
  console.log('      - test2@example.com (Ana Martínez)');
  console.log('      - test3@example.com (Maria Garcia)');
  console.log('      - test4@example.com (Pedro Ramírez)');
  console.log('      - test5@example.com (Laura Fernández)');
  console.log('      - test6@example.com (Diego Torres)');
  console.log('      - test7@example.com (Sofía Morales)');
  console.log('      - test8@example.com (Miguel Ángel Ruiz)');
  console.log('      Password for all: Test123!');

  // Return original 3 customer IDs for backward compatibility with booking seed
  return { customerId1, customerId2, customerId3 };
}
