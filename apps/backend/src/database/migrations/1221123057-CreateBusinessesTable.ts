import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * CreateBusinessesTable Migration
 *
 * Creates the businesses table with:
 * - All required columns for Business aggregate
 * - Unique index on whatsapp_phone (global uniqueness)
 * - Index on owner_id for efficient queries
 * - Foreign key to users(id)
 *
 * Requirements: 13.1-13.3
 */
export class CreateBusinessesTable1221123057 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create businesses table
    await queryRunner.createTable(
      new Table({
        name: 'businesses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'owner_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'whatsapp_phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'address_street',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'address_city',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'address_state',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'address_country',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'address_postal_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'version',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create unique index on whatsapp_phone
    await queryRunner.createIndex(
      'businesses',
      new TableIndex({
        name: 'idx_businesses_whatsapp_phone',
        columnNames: ['whatsapp_phone'],
        isUnique: true,
      }),
    );

    // Create index on owner_id for efficient queries
    await queryRunner.createIndex(
      'businesses',
      new TableIndex({
        name: 'idx_businesses_owner_id',
        columnNames: ['owner_id'],
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'businesses',
      new TableForeignKey({
        name: 'fk_businesses_owner_id',
        columnNames: ['owner_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('businesses', 'fk_businesses_owner_id');

    // Drop indexes
    await queryRunner.dropIndex('businesses', 'idx_businesses_owner_id');
    await queryRunner.dropIndex('businesses', 'idx_businesses_whatsapp_phone');

    // Drop table
    await queryRunner.dropTable('businesses');
  }
}
