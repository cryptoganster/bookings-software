import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export async function seedOffering(
  dataSource: DataSource,
  businessId: string,
): Promise<{ offering1Id: string; offering2Id: string; offering3Id: string }> {
  console.log('💼 Seeding Offering BC...');

  const offering1Id = uuidv4();
  const offering2Id = uuidv4();
  const offering3Id = uuidv4();

  await dataSource.query(
    `INSERT INTO offerings (id, business_id, name, duration, max_capacity_per_slot, max_daily_capacity, is_active, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [offering1Id, businessId, 'Corte de Pelo', 30, 4, 20, true, 0],
  );

  await dataSource.query(
    `INSERT INTO offerings (id, business_id, name, duration, max_capacity_per_slot, max_daily_capacity, is_active, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [offering2Id, businessId, 'Lavado', 15, 6, 30, true, 0],
  );

  await dataSource.query(
    `INSERT INTO offerings (id, business_id, name, duration, max_capacity_per_slot, max_daily_capacity, is_active, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [offering3Id, businessId, 'Tinte', 60, 2, 8, true, 0],
  );

  console.log('✅ Offering BC seeded: Corte de Pelo, Lavado, Tinte');

  return { offering1Id, offering2Id, offering3Id };
}
