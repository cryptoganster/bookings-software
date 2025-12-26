import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export async function seedAccount(
  dataSource: DataSource,
  userId: string,
): Promise<{ businessOwnerId: string }> {
  console.log('💼 Seeding Account BC...');

  const businessOwnerId = uuidv4();

  // Create BusinessOwner with FREE plan
  await dataSource.query(
    `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [
      businessOwnerId,
      userId,
      'FREE', // subscriptionPlan
      'ACTIVE', // subscriptionStatus
      true, // onboardingCompleted (for testing convenience)
      0, // version
    ],
  );

  console.log('✅ Account BC seeded');
  console.log(`   BusinessOwner ID: ${businessOwnerId}`);
  console.log(`   User ID: ${userId}`);
  console.log('   Subscription Plan: FREE');
  console.log('   Subscription Status: ACTIVE');
  console.log('   Onboarding Completed: true');

  // Create second BusinessOwner with PRO plan (for testing different plans)
  const userId2 = uuidv4();
  const businessOwnerId2 = uuidv4();
  const hashedPassword = await import('bcryptjs').then((bcrypt) => bcrypt.hash('Test456!', 10));

  // Create second user
  await dataSource.query(
    `INSERT INTO users (id, email, password, name, roles, is_active, email_verified, version, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      userId2,
      'test2@example.com',
      hashedPassword,
      'Test Business Owner 2',
      ['BUSINESS_OWNER'],
      true,
      true,
      0,
    ],
  );

  // Create second BusinessOwner with PRO plan
  await dataSource.query(
    `INSERT INTO business_owners (id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [
      businessOwnerId2,
      userId2,
      'PRO', // subscriptionPlan
      'ACTIVE', // subscriptionStatus
      true, // onboardingCompleted
      0, // version
    ],
  );

  console.log('✅ Second BusinessOwner seeded');
  console.log(`   BusinessOwner ID: ${businessOwnerId2}`);
  console.log(`   User ID: ${userId2}`);
  console.log('   Email: test2@example.com');
  console.log('   Password: Test456!');
  console.log('   Subscription Plan: PRO');

  return { businessOwnerId };
}
