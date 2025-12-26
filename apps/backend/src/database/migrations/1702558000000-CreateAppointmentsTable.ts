import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppointmentsTable1702558000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
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
            name: 'offering_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date_time',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
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
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_APPOINTMENTS_BUSINESS_ID',
        columnNames: ['business_id'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_APPOINTMENTS_CUSTOMER_ID',
        columnNames: ['customer_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('appointments', 'IDX_APPOINTMENTS_CUSTOMER_ID');
    await queryRunner.dropIndex('appointments', 'IDX_APPOINTMENTS_BUSINESS_ID');
    await queryRunner.dropTable('appointments');
  }
}
