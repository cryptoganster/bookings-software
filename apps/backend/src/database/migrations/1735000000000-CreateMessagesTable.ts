import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreateMessagesTable
 *
 * Creates the messages table for storing conversation messages.
 *
 * @remarks
 * - Foreign key to conversations table with CASCADE delete
 * - Indexes on conversation_id and sent_at for query performance
 * - direction: INBOUND (from customer) or OUTBOUND (to customer)
 * - message_type: TEXT, BUTTON, LOCATION
 * - is_from_admin: true if sent by admin from panel
 */
export class CreateMessagesTable1735000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'direction',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'is_from_admin',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Add CHECK constraint for direction
    await queryRunner.query(`
      ALTER TABLE messages
      ADD CONSTRAINT chk_messages_direction
      CHECK (direction IN ('INBOUND', 'OUTBOUND'))
    `);

    // Add CHECK constraint for message_type
    await queryRunner.query(`
      ALTER TABLE messages
      ADD CONSTRAINT chk_messages_message_type
      CHECK (message_type IN ('TEXT', 'BUTTON', 'LOCATION'))
    `);

    // Create index on conversation_id for fast lookups
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'idx_messages_conversation_id',
        columnNames: ['conversation_id'],
      }),
    );

    // Create index on sent_at for ordering
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'idx_messages_sent_at',
        columnNames: ['sent_at'],
      }),
    );

    // Add foreign key to conversations table with CASCADE delete
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'fk_messages_conversation',
        columnNames: ['conversation_id'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('messages', 'fk_messages_conversation');

    // Drop indexes
    await queryRunner.dropIndex('messages', 'idx_messages_sent_at');
    await queryRunner.dropIndex('messages', 'idx_messages_conversation_id');

    // Drop table
    await queryRunner.dropTable('messages');
  }
}
