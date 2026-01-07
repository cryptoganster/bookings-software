import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Seed Data
 *
 * Creates 1 business for testing linked to the first user
 *
 * @see .kiro/specs/database-migrations-seeds-cleanup/design.md
 */
export async function seedBusiness(
  dataSource: DataSource,
  userId: string,
): Promise<{ businessId: string }> {
  console.log('🏢 Seeding Business BC...');

  const businessId = uuidv4();

  await dataSource.query(
    `INSERT INTO businesses (
      id,
      owner_id,
      name,
      whatsapp_phone,
      address_street,
      address_city,
      address_state,
      address_country,
      address_postal_code,
      timezone,
      is_active,
      version,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
    [
      businessId,
      userId,
      'Peluquería El Estilo',
      '+18097982896', // ← Real WhatsApp number configured in system
      'Calle Principal 123',
      'Santo Domingo',
      'Distrito Nacional',
      'República Dominicana',
      '10101',
      'America/Santo_Domingo',
      true,
      0,
    ],
  );

  console.log('✅ Business BC seeded');
  console.log(`   Business ID: ${businessId}`);
  console.log('   Name: Peluquería El Estilo');
  console.log('   WhatsApp: +18097982896 (REAL NUMBER)');
  console.log('   Location: Santo Domingo, República Dominicana');

  return { businessId };
}
