import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export async function seedAuth(dataSource: DataSource): Promise<{ userId: string }> {
  console.log('👤 Seeding Auth BC...');

  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  // Create test user with BUSINESS_OWNER role
  await dataSource.query(
    `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, version, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      userId,
      'test@example.com',
      hashedPassword,
      'Test Business Owner',
      ['BUSINESS_OWNER'], // roles array
      true, // isActive
      true, // emailVerified (for testing convenience)
      0, // version
    ],
  );

  console.log('✅ Auth BC seeded');
  console.log('   Email: test@example.com');
  console.log('   Password: Test123!');
  console.log('   Roles: BUSINESS_OWNER');

  return { userId };
}
