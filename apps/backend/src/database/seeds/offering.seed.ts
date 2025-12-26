import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Offering Seed Data - Enhanced Test Dataset
 *
 * Creates diverse offerings for testing:
 * - 6 active offerings with varied durations (15-120 min)
 * - 1 inactive offering (for testing filters)
 * - Different capacity configurations
 * - Realistic service names
 *
 * @see .kiro/specs/database-migrations-seeds-cleanup/design.md
 */
export async function seedOffering(
  dataSource: DataSource,
  businessId: string,
): Promise<{ offering1Id: string; offering2Id: string; offering3Id: string }> {
  console.log('💼 Seeding Offering BC...');

  // Main offerings (returned for use in other seeds)
  const offering1Id = uuidv4();
  const offering2Id = uuidv4();
  const offering3Id = uuidv4();

  // Additional offerings for variety
  const offering4Id = uuidv4();
  const offering5Id = uuidv4();
  const offering6Id = uuidv4();
  const offering7Id = uuidv4(); // Inactive

  const offerings = [
    // Quick services (15-30 min)
    {
      id: offering2Id,
      name: 'Lavado',
      duration: 15,
      maxCapacityPerSlot: 6,
      maxDailyCapacity: 30,
      isActive: true,
    },
    {
      id: offering1Id,
      name: 'Corte de Pelo',
      duration: 30,
      maxCapacityPerSlot: 4,
      maxDailyCapacity: 20,
      isActive: true,
    },
    {
      id: offering4Id,
      name: 'Barba',
      duration: 20,
      maxCapacityPerSlot: 3,
      maxDailyCapacity: 15,
      isActive: true,
    },
    // Medium services (45-60 min)
    {
      id: offering3Id,
      name: 'Tinte',
      duration: 60,
      maxCapacityPerSlot: 2,
      maxDailyCapacity: 8,
      isActive: true,
    },
    {
      id: offering5Id,
      name: 'Peinado',
      duration: 45,
      maxCapacityPerSlot: 3,
      maxDailyCapacity: 12,
      isActive: true,
    },
    // Long services (90-120 min)
    {
      id: offering6Id,
      name: 'Tratamiento Capilar',
      duration: 90,
      maxCapacityPerSlot: 2,
      maxDailyCapacity: 6,
      isActive: true,
    },
    // Inactive offering (for testing filters)
    {
      id: offering7Id,
      name: 'Manicure (Descontinuado)',
      duration: 30,
      maxCapacityPerSlot: 2,
      maxDailyCapacity: 10,
      isActive: false,
    },
  ];

  for (const offering of offerings) {
    await dataSource.query(
      `INSERT INTO offerings (id, business_id, name, duration, max_capacity_per_slot, max_daily_capacity, is_active, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        offering.id,
        businessId,
        offering.name,
        offering.duration,
        offering.maxCapacityPerSlot,
        offering.maxDailyCapacity,
        offering.isActive,
        0,
      ],
    );
  }

  console.log('✅ Offering BC seeded');
  console.log('   📊 Summary:');
  console.log('      - Total offerings: 7');
  console.log('      - Active: 6 offerings');
  console.log('      - Inactive: 1 offering');
  console.log('   ⏱️  Duration range: 15-90 minutes');
  console.log('   👥 Capacity range: 2-6 per slot');
  console.log('   📋 Services:');
  console.log('      - Quick: Lavado (15min), Barba (20min), Corte (30min)');
  console.log('      - Medium: Peinado (45min), Tinte (60min)');
  console.log('      - Long: Tratamiento Capilar (90min)');
  console.log('      - Inactive: Manicure (30min)');

  return { offering1Id, offering2Id, offering3Id };
}
