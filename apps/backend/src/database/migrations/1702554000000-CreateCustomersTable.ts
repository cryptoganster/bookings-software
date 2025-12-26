import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * CreateCustomersTable Migration
 *
 * Creates the customers table for Customer BC
 *
 * Features:
 * - Multi-tenant: unique per (business_id, whatsapp_phone)
 * - Optional user_id: null = anonymous, UUID = registered
 * - Optimistic locking with version field
 * - Indexes for performance
 *
 * @see .kiro/steering/user-customer-businessowner-architecture.md
 */
export class CreateCustomersTable1702554000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Optional link to User (null = anonymous, UUID = registered)',
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Business this customer belongs to',
          },
          {
            name: 'whatsapp_phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'WhatsApp phone in E.164 format',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Customer name (can be null initially)',
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
            isNullable: false,
            comment: 'Optimistic locking version',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Unique index on (business_id, whatsapp_phone) for multi-tenant isolation
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_BUSINESS_WHATSAPP_UNIQUE',
        columnNames: ['business_id', 'whatsapp_phone'],
        isUnique: true,
      }),
    );

    // Index on business_id for queries by business
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_BUSINESS_ID',
        columnNames: ['business_id'],
      }),
    );

    // Index on user_id for queries by registered user (marketplace)
    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'IDX_CUSTOMERS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'customers',
      new TableForeignKey({
        name: 'fk_customers_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL', // Allow anonymous customers
      }),
    );

    await queryRunner.createForeignKey(
      'customers',
      new TableForeignKey({
        name: 'fk_customers_business',
        columnNames: ['business_id'],
        referencedTableName: 'businesses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('customers', 'fk_customers_business');
    await queryRunner.dropForeignKey('customers', 'fk_customers_user');

    // Drop indexes
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_USER_ID');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_BUSINESS_ID');
    await queryRunner.dropIndex('customers', 'IDX_CUSTOMERS_BUSINESS_WHATSAPP_UNIQUE');

    // Drop table
    await queryRunner.dropTable('customers');
  }
}
