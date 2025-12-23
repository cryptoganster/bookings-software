import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreateConversationsTable
 *
 * Creates the conversations table for tracking WhatsApp conversations.
 *
 * @remarks
 * - Foreign keys to businesses and customers tables
 * - status: ACTIVE, AWAITING_ADMIN, RESOLVED
 * - Indexes on business_id and customer_id for query performance
 * - last_message_at for sorting conversations by recency
 */
export class CreateConversationsTable1734999000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'customer_phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'ACTIVE'",
          },
          {
            name: 'state',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'INITIAL'",
          },
          {
            name: 'selected_offering_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'selected_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'selected_time',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'created_appointment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Add CHECK constraint for status
    await queryRunner.query(`
      ALTER TABLE conversations
      ADD CONSTRAINT chk_conversations_status
      CHECK (status IN ('ACTIVE', 'AWAITING_ADMIN', 'RESOLVED'))
    `);

    // Create index on business_id for fast lookups
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'idx_conversations_business_id',
        columnNames: ['business_id'],
      }),
    );

    // Create index on customer_id for fast lookups
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'idx_conversations_customer_id',
        columnNames: ['customer_id'],
      }),
    );

    // Create index on last_message_at for sorting
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'idx_conversations_last_message_at',
        columnNames: ['last_message_at'],
      }),
    );

    // Add foreign key to businesses table
    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        name: 'fk_conversations_business',
        columnNames: ['business_id'],
        referencedTableName: 'businesses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key to customers table
    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        name: 'fk_conversations_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('conversations', 'fk_conversations_customer');
    await queryRunner.dropForeignKey('conversations', 'fk_conversations_business');

    // Drop indexes
    await queryRunner.dropIndex('conversations', 'idx_conversations_last_message_at');
    await queryRunner.dropIndex('conversations', 'idx_conversations_customer_id');
    await queryRunner.dropIndex('conversations', 'idx_conversations_business_id');

    // Drop table
    await queryRunner.dropTable('conversations');
  }
}
