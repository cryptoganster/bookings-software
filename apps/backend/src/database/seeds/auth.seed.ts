import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export async function seedAuth(dataSource: DataSource): Promise<{ userId: string; businessId: string }> {
  console.log('👤 Seeding Auth BC...');

  const userId = uuidv4();
  const businessId = uuidv4();
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  await dataSource.query(
    `INSERT INTO users (id, email, password, name, "businessId", version, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId, 'test@example.com', hashedPassword, 'Test Business Owner', businessId, 0],
  );

  console.log('✅ Auth BC seeded');
  console.log('   Email: test@example.com');
  console.log('   Password: Test123!');

  return { userId, businessId };
}
