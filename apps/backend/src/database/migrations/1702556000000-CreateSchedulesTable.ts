import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSchedulesTable1702556000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'schedules',
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
            name: 'day_of_week',
            type: 'int',
            isNullable: false,
            comment: 'Day of week: 0 (Sunday) to 6 (Saturday)',
          },
          {
            name: 'start_time',
            type: 'time',
            isNullable: false,
            comment: 'Start time in HH:mm format',
          },
          {
            name: 'end_time',
            type: 'time',
            isNullable: false,
            comment: 'End time in HH:mm format',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
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
      'schedules',
      new TableIndex({
        name: 'IDX_SCHEDULES_BUSINESS_ID',
        columnNames: ['business_id'],
      }),
    );

    // Create index on day_of_week for faster filtering
    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'IDX_SCHEDULES_DAY_OF_WEEK',
        columnNames: ['day_of_week'],
      }),
    );

    // Create unique constraint on business_id + day_of_week
    // A business can only have one schedule per day of week
    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'IDX_SCHEDULES_BUSINESS_DAY_UNIQUE',
        columnNames: ['business_id', 'day_of_week'],
        isUnique: true,
      }),
    );

    // Create index on is_active for filtering active schedules
    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'IDX_SCHEDULES_IS_ACTIVE',
        columnNames: ['is_active'],
      }),
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'schedules',
      new TableForeignKey({
        name: 'fk_schedules_business',
        columnNames: ['business_id'],
        referencedTableName: 'businesses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('schedules', 'fk_schedules_business');

    // Drop indexes
    await queryRunner.dropIndex('schedules', 'IDX_SCHEDULES_IS_ACTIVE');
    await queryRunner.dropIndex('schedules', 'IDX_SCHEDULES_BUSINESS_DAY_UNIQUE');
    await queryRunner.dropIndex('schedules', 'IDX_SCHEDULES_DAY_OF_WEEK');
    await queryRunner.dropIndex('schedules', 'IDX_SCHEDULES_BUSINESS_ID');

    // Drop table
    await queryRunner.dropTable('schedules');
  }
}
