import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to standardize column naming in users table
 *
 * Changes:
 * - Rename createdAt to created_at (snake_case)
 * - Rename emailVerified to email_verified (already done)
 * - Rename isActive to is_active (already done)
 *
 * This ensures consistency with PostgreSQL naming conventions
 */
export class StandardizeUsersTableNaming1734481000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if createdAt column exists (camelCase)
    const hasCreatedAt = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'createdAt'
    `);

    if (hasCreatedAt.length > 0) {
      // Rename createdAt to created_at
      await queryRunner.query(`
        ALTER TABLE users 
        RENAME COLUMN "createdAt" TO created_at
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: rename created_at back to createdAt
    await queryRunner.query(`
      ALTER TABLE users 
      RENAME COLUMN created_at TO "createdAt"
    `);
  }
}
