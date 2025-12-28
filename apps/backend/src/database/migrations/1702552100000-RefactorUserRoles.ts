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
export class RefactorUserRoles1702552100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns (nullable initially for data migration)
    // Check if roles column exists before adding
    const hasRoles = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'roles'
    `);

    if (hasRoles.length === 0) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'roles',
          type: 'text',
          isArray: true,
          isNullable: true, // Temporarily nullable for migration
        }),
      );
    }

    // Check if email_verified column exists before adding
    const hasEmailVerified = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email_verified'
    `);

    if (hasEmailVerified.length === 0) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'email_verified',
          type: 'boolean',
          default: false,
        }),
      );
    }

    // Check if is_active column exists before adding
    const hasIsActive = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_active'
    `);

    if (hasIsActive.length === 0) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'is_active',
          type: 'boolean',
          default: true,
        }),
      );
    }

    // Step 2: Migrate existing data - set roles = ['BUSINESS_OWNER'] for all users
    await queryRunner.query(`
      UPDATE users
      SET roles = ARRAY['BUSINESS_OWNER']::text[]
      WHERE roles IS NULL
    `);

    // Step 3: Make roles column NOT NULL after data migration
    // Check if column is already NOT NULL
    const rolesNullable = await queryRunner.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'roles'
    `);

    if (rolesNullable.length > 0 && rolesNullable[0].is_nullable === 'YES') {
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
    }

    // Step 4: Create GIN index on roles column for efficient queries
    // Check if index exists before creating
    const hasIndex = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname = 'IDX_users_roles'
    `);

    if (hasIndex.length === 0) {
      await queryRunner.query(`
        CREATE INDEX "IDX_users_roles" ON "users" USING GIN ("roles")
      `);
    }

    // Step 5: Drop businessId column (moved to Business BC)
    // Check if column exists before dropping
    const hasBusinessId = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'businessId'
    `);

    if (hasBusinessId.length > 0) {
      await queryRunner.dropColumn('users', 'businessId');
    }
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
