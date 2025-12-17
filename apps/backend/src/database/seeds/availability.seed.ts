import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';

export async function seedAvailability(
  dataSource: DataSource,
  offering1Id: string,
  offering2Id: string,
  offering3Id: string,
): Promise<void> {
  console.log('📅 Seeding Availability BC...');

  const today = new Date();
  const capacities = [];

  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Capacidad para offering 1 (Corte de pelo - 8 slots por día)
    capacities.push({
      id: uuidv4(),
      offeringId: offering1Id,
      date: dateStr,
      totalSlots: 8,
      availableSlots: 8,
    });

    // Capacidad para offering 2 (Lavado - 12 slots por día)
    capacities.push({
      id: uuidv4(),
      offeringId: offering2Id,
      date: dateStr,
      totalSlots: 12,
      availableSlots: 12,
    });

    // Capacidad para offering 3 (Tinte - 4 slots por día)
    capacities.push({
      id: uuidv4(),
      offeringId: offering3Id,
      date: dateStr,
      totalSlots: 4,
      availableSlots: 4,
    });
  }

  // Insertar capacidades en batch
  for (const capacity of capacities) {
    await dataSource.query(
      `INSERT INTO capacities (id, offering_id, date, total_slots, available_slots, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        capacity.id,
        capacity.offeringId,
        capacity.date,
        capacity.totalSlots,
        capacity.availableSlots,
        0,
      ],
    );
  }

  console.log(`✅ Availability BC seeded: ${capacities.length} capacity records (30 days)`);
}
