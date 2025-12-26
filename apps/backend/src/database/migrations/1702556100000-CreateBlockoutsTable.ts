import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBlockoutsTable1702556100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blockouts',
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
            name: 'start_date',
            type: 'timestamp',
            isNullable: false,
            comment: 'Start date of blockout period (inclusive)',
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: false,
            comment: 'End date of blockout period (inclusive)',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Reason for blockout (e.g., vacation, holiday)',
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

    // Create index on business_id for faster lookups
    await queryRunner.createIndex(
      'blockouts',
      new TableIndex({
        name: 'IDX_BLOCKOUTS_BUSINESS_ID',
        columnNames: ['business_id'],
      }),
    );

    // Create index on start_date for date range queries
    await queryRunner.createIndex(
      'blockouts',
      new TableIndex({
        name: 'IDX_BLOCKOUTS_START_DATE',
        columnNames: ['start_date'],
      }),
    );

    // Create index on end_date for date range queries
    await queryRunner.createIndex(
      'blockouts',
      new TableIndex({
        name: 'IDX_BLOCKOUTS_END_DATE',
        columnNames: ['end_date'],
      }),
    );

    // Create composite index on business_id + start_date + end_date
    // for efficient date range queries per business
    await queryRunner.createIndex(
      'blockouts',
      new TableIndex({
        name: 'IDX_BLOCKOUTS_BUSINESS_DATE_RANGE',
        columnNames: ['business_id', 'start_date', 'end_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('blockouts', 'IDX_BLOCKOUTS_BUSINESS_DATE_RANGE');
    await queryRunner.dropIndex('blockouts', 'IDX_BLOCKOUTS_END_DATE');
    await queryRunner.dropIndex('blockouts', 'IDX_BLOCKOUTS_START_DATE');
    await queryRunner.dropIndex('blockouts', 'IDX_BLOCKOUTS_BUSINESS_ID');
    await queryRunner.dropTable('blockouts');
  }
}
