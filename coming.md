Vamos a proceder a crear un spec donde se incluya la implementación backend-frontend de 

1. Offering Categories y Tags

¿Qué es? Sistema de categorización para agrupar servicios similares.

Ejemplo:

Categorías:

- Cabello (Corte, Lavado, Tinte, Peinado)

- Barba (Recorte, Afeitado, Diseño)

- Tratamientos (Hidratación, Keratina)

Tags:

- "Popular", "Nuevo", "Promoción", "Premium"

Beneficios:

✅ Mejor organización en el panel admin

✅ Filtrado más fácil para clientes en WhatsApp

✅ Menús más claros ("¿Qué servicio de cabello deseas?")

2. Pricing (Precios)

¿Qué es? Agregar campo de precio a cada offering.

Ejemplo:

Offering {

  name: "Corte de Pelo"

  duration: 30 min

  price: 150.00  // ← Nuevo campo

  currency: "MXN"

}

Beneficios:

✅ Cliente ve precio antes de reservar

✅ Confirmación incluye costo total

✅ Base para futura integración de pagos

✅ Reportes de ingresos proyectados

Images y Descriptions

¿Qué es? Agregar imagen y descripción detallada a cada offering.

Ejemplo:

Offering {

  name: "Corte de Pelo"

  description: "Corte profesional con lavado incluido. Incluye asesoría de estilo."

  imageUrl: "https://cdn.example.com/corte.jpg"

}

Beneficios:

✅ Mejor presentación visual

✅ Cliente entiende mejor el servicio

✅ Diferenciación entre servicios similares

✅ Más profesional en WhatsApp (si API lo soporta)

4. Availability Rules (Reglas de Disponibilidad)

¿Qué es? Restricciones específicas por offering sobre cuándo se puede reservar.

Ejemplos:

Offering {

  name: "Tinte"

  availabilityRules: {

    daysOfWeek: [1, 2, 3, 4, 5],  // Solo lunes a viernes

    timeRanges: ["09:00-13:00"],   // Solo mañanas

    minAdvanceBooking: 24,          // Mínimo 24h de anticipación

    maxAdvanceBooking: 30,          // Máximo 30 días adelante

    blackoutDates: ["2024-12-25"]   // Fechas específicas bloqueadas

  }

}

5. Booking Limits per Customer

¿Qué es? Límites de cuántas veces un cliente puede reservar un servicio específico.

Ejemplos:

Offering {

  name: "Consulta Inicial Gratis"

  bookingLimits: {

    maxPerCustomer: 1,              // Solo 1 vez por cliente

    maxPerMonth: 2,                 // Máximo 2 al mes

    cooldownDays: 30                // Esperar 30 días entre reservas

  }

}

Beneficios:

✅ Prevenir abuso de promociones

✅ Distribuir servicios populares equitativamente

✅ Forzar tiempo entre tratamientos (ej: tintes)

✅ Controlar servicios gratuitos/descuento

REST API + Frontend (necesario para usar el sistema)

Utiliza inteligentemente entre REST API y Websocket dependiendo el tipo de endpoint, busca actualmente como están nuestros endpoints, puedes hacer endpoints de stream de eventos en ws por ejemplo. Los test e2e estarán en apps/backend/test/e2e

Además, es suficiente con los BC actuales o será necesario antes que todo implementar el BC Customer por ejemplo que aún no está? 

Lee el PRD: 

.kiro/steering/PRD.md

.kiro/steering/frontend-PRD.md.kiro

Dame sugerencias de como debería proceder