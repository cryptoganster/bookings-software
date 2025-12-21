import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BusinessesSeed
 *
 * Seeds the businesses table with test data
 * Creates 2 businesses linked to existing users
 * Uses unique, valid WhatsApp phone numbers in E.164 format
 * Uses valid IANA timezones
 *
 * Requirements: 13.4-13.5
 */
export class BusinessesSeed implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get existing users to link businesses to
    const users = await queryRunner.query(`
      SELECT id FROM users LIMIT 2
    `);

    if (users.length < 2) {
      console.warn('Not enough users found to seed businesses. Skipping seed.');
      return;
    }

    const [user1, user2] = users;

    // Insert business 1
    await queryRunner.query(
      `
      INSERT INTO businesses (
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
      ) VALUES (
        gen_random_uuid(),
        $1,
        'Bufete López - Centro',
        '+18095551111',
        'Calle Principal 123',
        'Santo Domingo',
        'Distrito Nacional',
        'República Dominicana',
        '10101',
        'America/Santo_Domingo',
        true,
        0,
        now(),
        now()
      )
    `,
      [user1.id],
    );

    // Insert business 2
    await queryRunner.query(
      `
      INSERT INTO businesses (
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
      ) VALUES (
        gen_random_uuid(),
        $1,
        'Consultoría Legal Norte',
        '+18095552222',
        'Avenida 27 de Febrero 456',
        'Santiago',
        'Santiago',
        'República Dominicana',
        '51000',
        'America/Santo_Domingo',
        true,
        0,
        now(),
        now()
      )
    `,
      [user2.id],
    );

    console.log('✅ Businesses seeded successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete seeded businesses
    await queryRunner.query(`
      DELETE FROM businesses
      WHERE whatsapp_phone IN ('+18095551111', '+18095552222')
    `);

    console.log('✅ Businesses seed reverted');
  }
}
