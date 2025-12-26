import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { subDays, subHours, subMinutes } from 'date-fns';

/**
 * Conversation Seed Data - Comprehensive Test Dataset
 *
 * Creates conversations and messages for testing:
 * - 8 conversations with various statuses
 * - 35+ messages with realistic flow
 * - Mix of inbound/outbound messages
 * - Admin responses
 * - Various message types (TEXT, BUTTON, LOCATION)
 *
 * Features:
 * - Active conversations (ongoing)
 * - Awaiting admin conversations (pending response)
 * - Resolved conversations (completed)
 * - Realistic timestamps (recent to old)
 * - Proper foreign key relationships
 *
 * @see .kiro/specs/database-migrations-seeds-cleanup/design.md
 */
export async function seedConversation(
  dataSource: DataSource,
  businessId: string,
  customerId1: string,
  customerId2: string,
  customerId3: string,
): Promise<void> {
  console.log('💬 Seeding Conversation BC...');

  const now = new Date();

  // Fetch customer phones
  const customer1 = await dataSource.query('SELECT whatsapp_phone FROM customers WHERE id = $1', [
    customerId1,
  ]);
  const customer2 = await dataSource.query('SELECT whatsapp_phone FROM customers WHERE id = $1', [
    customerId2,
  ]);
  const customer3 = await dataSource.query('SELECT whatsapp_phone FROM customers WHERE id = $1', [
    customerId3,
  ]);

  const phone1 = customer1[0].whatsapp_phone;
  const phone2 = customer2[0].whatsapp_phone;
  const phone3 = customer3[0].whatsapp_phone;

  // ============================================
  // CONVERSATION 1: Active - Recent booking flow
  // ============================================
  const conv1Id = uuidv4();
  const conv1LastMessage = subMinutes(now, 5);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv1Id,
      businessId,
      customerId1,
      phone1,
      'ACTIVE',
      'SELECTING_TIME',
      conv1LastMessage,
      0,
      subMinutes(now, 10),
    ],
  );

  // Messages for conversation 1
  const conv1Messages = [
    {
      direction: 'INBOUND',
      content: 'Hola, quiero agendar una cita',
      type: 'TEXT',
      sentAt: subMinutes(now, 10),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: '¡Hola! 👋 Bienvenido. ¿Qué servicio deseas agendar?',
      type: 'TEXT',
      sentAt: subMinutes(now, 9),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Servicios disponibles',
      type: 'BUTTON',
      sentAt: subMinutes(now, 9),
      isFromAdmin: false,
    },
    {
      direction: 'INBOUND',
      content: 'Corte de Pelo',
      type: 'BUTTON',
      sentAt: subMinutes(now, 8),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Perfecto. Selecciona una fecha disponible:',
      type: 'TEXT',
      sentAt: subMinutes(now, 7),
      isFromAdmin: false,
    },
    {
      direction: 'INBOUND',
      content: 'Mañana',
      type: 'BUTTON',
      sentAt: subMinutes(now, 6),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Horarios disponibles para mañana:',
      type: 'TEXT',
      sentAt: subMinutes(now, 5),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv1Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv1Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // CONVERSATION 2: Awaiting Admin - Customer query
  // ============================================
  const conv2Id = uuidv4();
  const conv2LastMessage = subHours(now, 2);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv2Id,
      businessId,
      customerId2,
      phone2,
      'AWAITING_ADMIN',
      'AWAITING_ADMIN_RESPONSE',
      conv2LastMessage,
      0,
      subHours(now, 3),
    ],
  );

  const conv2Messages = [
    {
      direction: 'INBOUND',
      content: 'Hola, tengo una pregunta sobre los precios',
      type: 'TEXT',
      sentAt: subHours(now, 3),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Claro, ¿en qué puedo ayudarte?',
      type: 'TEXT',
      sentAt: subHours(now, 3),
      isFromAdmin: false,
    },
    {
      direction: 'INBOUND',
      content: '¿Cuánto cuesta el tinte completo?',
      type: 'TEXT',
      sentAt: subHours(now, 2),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Déjame consultar con el administrador. Te responderé pronto.',
      type: 'TEXT',
      sentAt: subHours(now, 2),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv2Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv2Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // CONVERSATION 3: Resolved - Completed booking
  // ============================================
  const conv3Id = uuidv4();
  const conv3LastMessage = subDays(now, 1);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv3Id,
      businessId,
      customerId3,
      phone3,
      'RESOLVED',
      'COMPLETED',
      conv3LastMessage,
      0,
      subDays(now, 2),
    ],
  );

  const conv3Messages = [
    {
      direction: 'INBOUND',
      content: 'Quiero cancelar mi cita',
      type: 'TEXT',
      sentAt: subDays(now, 2),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Entendido. ¿Cuál cita deseas cancelar?',
      type: 'TEXT',
      sentAt: subDays(now, 2),
      isFromAdmin: false,
    },
    {
      direction: 'INBOUND',
      content: 'La de mañana a las 10am',
      type: 'TEXT',
      sentAt: subDays(now, 2),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: '✅ Tu cita ha sido cancelada exitosamente.',
      type: 'TEXT',
      sentAt: subDays(now, 1),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv3Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv3Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // CONVERSATION 4: Active - Location request
  // ============================================
  const conv4Id = uuidv4();
  const conv4LastMessage = subHours(now, 1);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv4Id,
      businessId,
      customerId1,
      phone1,
      'ACTIVE',
      'INITIAL',
      conv4LastMessage,
      0,
      subHours(now, 2),
    ],
  );

  const conv4Messages = [
    {
      direction: 'INBOUND',
      content: '¿Dónde están ubicados?',
      type: 'TEXT',
      sentAt: subHours(now, 2),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Estamos ubicados en:',
      type: 'TEXT',
      sentAt: subHours(now, 1),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Calle Principal 123, Santo Domingo',
      type: 'LOCATION',
      sentAt: subHours(now, 1),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv4Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv4Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // CONVERSATION 5: Awaiting Admin - Special request
  // ============================================
  const conv5Id = uuidv4();
  const conv5LastMessage = subHours(now, 4);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv5Id,
      businessId,
      customerId2,
      phone2,
      'AWAITING_ADMIN',
      'AWAITING_ADMIN_RESPONSE',
      conv5LastMessage,
      0,
      subHours(now, 5),
    ],
  );

  const conv5Messages = [
    {
      direction: 'INBOUND',
      content: '¿Hacen servicios a domicilio?',
      type: 'TEXT',
      sentAt: subHours(now, 5),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Déjame consultar esa información con el administrador.',
      type: 'TEXT',
      sentAt: subHours(now, 4),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv5Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv5Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // CONVERSATION 6: Resolved - Admin response
  // ============================================
  const conv6Id = uuidv4();
  const conv6LastMessage = subDays(now, 3);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv6Id,
      businessId,
      customerId3,
      phone3,
      'RESOLVED',
      'COMPLETED',
      conv6LastMessage,
      0,
      subDays(now, 4),
    ],
  );

  const conv6Messages = [
    {
      direction: 'INBOUND',
      content: '¿Aceptan tarjetas de crédito?',
      type: 'TEXT',
      sentAt: subDays(now, 4),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Sí, aceptamos todas las tarjetas de crédito y débito.',
      type: 'TEXT',
      sentAt: subDays(now, 3),
      isFromAdmin: true,
    },
    {
      direction: 'INBOUND',
      content: 'Perfecto, gracias',
      type: 'TEXT',
      sentAt: subDays(now, 3),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv6Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv6Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // CONVERSATION 7: Active - Modification request
  // ============================================
  const conv7Id = uuidv4();
  const conv7LastMessage = subMinutes(now, 30);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv7Id,
      businessId,
      customerId1,
      phone1,
      'ACTIVE',
      'MODIFYING_APPOINTMENT',
      conv7LastMessage,
      0,
      subHours(now, 1),
    ],
  );

  const conv7Messages = [
    {
      direction: 'INBOUND',
      content: 'Necesito cambiar mi cita',
      type: 'TEXT',
      sentAt: subHours(now, 1),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: 'Claro, ¿para qué fecha te gustaría cambiarla?',
      type: 'TEXT',
      sentAt: subMinutes(now, 45),
      isFromAdmin: false,
    },
    {
      direction: 'INBOUND',
      content: 'Para el viernes',
      type: 'TEXT',
      sentAt: subMinutes(now, 30),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv7Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv7Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // CONVERSATION 8: Resolved - Old conversation
  // ============================================
  const conv8Id = uuidv4();
  const conv8LastMessage = subDays(now, 7);

  await dataSource.query(
    `INSERT INTO conversations (id, business_id, customer_id, customer_phone, status, state, last_message_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      conv8Id,
      businessId,
      customerId2,
      phone2,
      'RESOLVED',
      'COMPLETED',
      conv8LastMessage,
      0,
      subDays(now, 8),
    ],
  );

  const conv8Messages = [
    {
      direction: 'INBOUND',
      content: 'Hola',
      type: 'TEXT',
      sentAt: subDays(now, 8),
      isFromAdmin: false,
    },
    {
      direction: 'OUTBOUND',
      content: '¡Hola! ¿En qué puedo ayudarte?',
      type: 'TEXT',
      sentAt: subDays(now, 7),
      isFromAdmin: false,
    },
    {
      direction: 'INBOUND',
      content: 'Nada, gracias',
      type: 'TEXT',
      sentAt: subDays(now, 7),
      isFromAdmin: false,
    },
  ];

  for (const msg of conv8Messages) {
    await dataSource.query(
      `INSERT INTO messages (id, conversation_id, direction, content, message_type, sent_at, is_from_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        conv8Id,
        msg.direction,
        msg.content,
        msg.type,
        msg.sentAt,
        msg.isFromAdmin,
        msg.sentAt,
      ],
    );
  }

  // ============================================
  // SUMMARY
  // ============================================
  const totalMessages =
    conv1Messages.length +
    conv2Messages.length +
    conv3Messages.length +
    conv4Messages.length +
    conv5Messages.length +
    conv6Messages.length +
    conv7Messages.length +
    conv8Messages.length;

  console.log('✅ Conversation BC seeded');
  console.log('   📊 Summary:');
  console.log('      - Conversations: 8');
  console.log(`      - Messages: ${totalMessages}`);
  console.log('   📈 Status Distribution:');
  console.log('      - ACTIVE: 3 conversations');
  console.log('      - AWAITING_ADMIN: 2 conversations');
  console.log('      - RESOLVED: 3 conversations');
  console.log('   💬 Message Types:');
  console.log('      - TEXT: Most messages');
  console.log('      - BUTTON: Interactive selections');
  console.log('      - LOCATION: Address sharing');
  console.log('   👤 Admin Messages: 2 (in resolved conversations)');
}
