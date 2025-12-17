import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Refactor User Roles
 *
 * This migration refactors the users table to support multiple roles per user:
 * 1. Adds `roles` column (TEXT[] array) to support multiple roles
 * 2. Adds `email_verified` column (BOOLEAN) for email verification status
 * 3. Adds `is_active` column (BOOLEAN) for account status
 * 4. Migrates existing data: sets roles = ['BUSINESS_OWNER'] for all users
 * 5. Removes `businessId` column (moved to Business BC)
 * 6. Creates GIN index on roles column for efficient queries
 *
 * Related to: Auth BC Roles Refactor Spec
 */
export class RefactorUserRoles1734480000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns (nullable initially for data migration)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'roles',
        type: 'text',
        isArray: true,
        isNullable: true, // Temporarily nullable for migration
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email_verified',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
      }),
    );

    // Step 2: Migrate existing data - set roles = ['BUSINESS_OWNER'] for all users
    await queryRunner.query(`
      UPDATE users
      SET roles = ARRAY['BUSINESS_OWNER']::text[]
      WHERE roles IS NULL
    `);

    // Step 3: Make roles column NOT NULL after data migration
    await queryRunner.changeColumn(
      'users',
      'roles',
      new TableColumn({
        name: 'roles',
        type: 'text',
        isArray: true,
        isNullable: false,
      }),
    );

    // Step 4: Create GIN index on roles column for efficient queries
    await queryRunner.query(`
      CREATE INDEX "IDX_users_roles" ON "users" USING GIN ("roles")
    `);

    // Step 5: Drop businessId column (moved to Business BC)
    await queryRunner.dropColumn('users', 'businessId');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback in reverse order

    // Step 1: Add businessId column back
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'businessId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Step 2: Drop GIN index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_roles"`);

    // Step 3: Drop new columns
    await queryRunner.dropColumn('users', 'roles');
    await queryRunner.dropColumn('users', 'email_verified');
    await queryRunner.dropColumn('users', 'is_active');
  }
}
