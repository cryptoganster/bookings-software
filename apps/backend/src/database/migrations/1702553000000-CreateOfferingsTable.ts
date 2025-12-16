import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOfferingsTable1702553000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'offerings',
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
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'duration',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'max_capacity_per_slot',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'max_daily_capacity',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'offerings',
      new TableIndex({
        name: 'IDX_OFFERINGS_BUSINESS_ID',
        columnNames: ['business_id'],
      }),
    );

    await queryRunner.createIndex(
      'offerings',
      new TableIndex({
        name: 'IDX_OFFERINGS_IS_ACTIVE',
        columnNames: ['is_active'],
      }),
    );

    // Índice único compuesto para business_id + name
    await queryRunner.createIndex(
      'offerings',
      new TableIndex({
        name: 'IDX_OFFERINGS_BUSINESS_ID_NAME_UNIQUE',
        columnNames: ['business_id', 'name'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('offerings', 'IDX_OFFERINGS_BUSINESS_ID_NAME_UNIQUE');
    await queryRunner.dropIndex('offerings', 'IDX_OFFERINGS_IS_ACTIVE');
    await queryRunner.dropIndex('offerings', 'IDX_OFFERINGS_BUSINESS_ID');
    await queryRunner.dropTable('offerings');
  }
}
