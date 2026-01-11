# DTO vs Read Model en TypeScript

La diferencia entre DTO y Read Model **no es sintáctica** (ambos son `interface` o `type`), sino **conceptual y de propósito arquitectural**.

Ambos transportan datos. Ambos son anémicos. La diferencia está en **por qué existen** y **qué problema resuelven**.

---

## 1. DTO (Data Transfer Object)

### Qué es

Un objeto diseñado específicamente para **transportar datos entre capas o procesos**, sin acoplar al dominio ni a vistas específicas.

### Propósito

Los DTOs permiten cambiar la forma de los datos que se envían al cliente, pudiendo quitar referencias circulares, ocultar propiedades particulares, omitir propiedades para reducir el tamaño de la carga, aplanar gráficos de objetos anidados, evitar vulnerabilidades de exceso de envíos y desacoplar el nivel de servicio de la capa de base de datos.

**En resumen, los DTOs sirven para:**

- **Cruzar fronteras arquitecturales:**
  - HTTP ↔ Application Layer
  - Microservicio A ↔ Microservicio B
  - Process ↔ Process
- **Seguridad**: evitar over-posting (envío excesivo de datos)
- **Performance**: reducir payload eliminando datos innecesarios
- **Desacoplamiento**: la API pública no expone estructura interna
- **Control**: decidir exactamente qué sale y qué entra
- Serialización/deserialización

### Características

- **Genérico y neutral**: no refleja casos de uso específicos
- **Técnico**: estructura diseñada para transporte, no para expresar intención de negocio
- Puede mapear 1:1 con payloads HTTP o respuestas JSON
- Sin lógica de negocio
- **Protege el dominio**: evita exponer entidades directamente

### Ejemplo básico

```typescript
// CreateUserDto.ts - Input DTO
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

// UserResponseDto.ts - Output DTO
export interface UserResponseDto {
  id: string;
  email: string;
  createdAt: string;
}
```

### Ejemplo avanzado: múltiples niveles de exposición

Inspirado en el enfoque de Microsoft, podemos crear DTOs con diferentes niveles de detalle:

```typescript
// BookDto.ts - Vista resumida (para listados)
export interface BookDto {
  id: string;
  title: string;
  authorName: string; // aplanado desde Author.name
}

// BookDetailDto.ts - Vista completa (para detalle)
export interface BookDetailDto {
  id: string;
  title: string;
  year: number;
  price: number;
  authorName: string; // aplanado
  genre: string;
  // Nota: NO expone authorId, password, internalNotes, etc.
}
```

**Contexto**: Estos DTOs viven en la **interface layer** y sirven para desacoplar el contrato HTTP del modelo interno.

### Razones para NO exponer entidades directamente

```typescript
// ❌ MAL: Exponer entidad de dominio directamente
class Book {
  id: string;
  title: string;
  authorId: string; // 🚨 Expone IDs internos
  author: Author; // 🚨 Referencias circulares posibles
  internalNotes: string; // 🚨 Datos privados expuestos
  cost: number; // 🚨 Información sensible
  password?: string; // 🚨 Over-posting vulnerability
}

// ✅ BIEN: DTO controlado
interface BookResponseDto {
  id: string;
  title: string;
  authorName: string; // Solo el nombre, no toda la entidad
}
```

### Protección contra Over-Posting

El over-posting ocurre cuando un cliente envía más datos de los esperados:

```typescript
// ❌ Vulnerabilidad: recibir entidad completa
@Post()
createUser(@Body() user: User) {
  // Si el cliente envía { email, password, isAdmin: true }
  // podría elevar privilegios
  return this.userService.create(user);
}

// ✅ Protección: usar DTO validado
@Post()
createUser(@Body() dto: CreateUserDto) {
  // Solo acepta los campos definidos en el DTO
  // isAdmin no existe en CreateUserDto
  return this.userService.create(dto);
}
```

### Dónde vive

```
src/
├── api/
│   └── http/
│       └── dtos/
│           ├── CreateUserDto.ts
│           ├── UserResponseDto.ts
│           ├── BookDto.ts
│           └── BookDetailDto.ts
```

---

## 2. Read Model

### Qué es

Una **vista optimizada del sistema** diseñada para responder queries específicas. Modela **cómo se consulta**, no cómo se escribe.

Viene de **CQRS** (Command Query Responsibility Segregation).

### Propósito

- Responder preguntas específicas del negocio
- Optimizar lectura (denormalización, agregación, precómputo)
- Reflejar necesidades del cliente/UI, no estructura del dominio
- Separar modelo de lectura del modelo de escritura
- **Performance**: evitar múltiples queries o joins complejos

### Características

- **Funcional y específico**: diseñado para un caso de uso concreto
- Puede combinar múltiples aggregates
- Frecuentemente denormalizado
- Puede tener campos derivados o calculados
- **No se usa para escritura** (solo lectura)
- Representa una **proyección del dominio**, no el dominio mismo
- Optimizado para queries específicas de la UI

### Ejemplo

```typescript
// UserProfileReadModel.ts
export interface UserProfileReadModel {
  id: string;
  email: string;
  fullName: string; // combinado de firstName + lastName
  postsCount: number; // precalculado
  lastLoginAt: Date | null;
  subscriptionStatus: "active" | "expired" | "trial";
  totalSpent: number; // agregado de múltiples órdenes
  recentPurchases: {
    // denormalizado
    productName: string;
    date: Date;
    amount: number;
  }[];
}
```

**Contexto**: Este Read Model existe porque **la UI necesita mostrar un perfil completo** sin hacer 5 queries separadas.

### Ejemplo inspirado en Microsoft: proyección con LINQ

```typescript
// OrderSummaryReadModel.ts
export interface OrderSummaryReadModel {
  orderId: string;
  customerName: string; // de Customer aggregate
  itemCount: number; // calculado
  totalAmount: number; // calculado
  status: string;
  shippingAddress: string;
}

// Query Handler
class GetOrderSummariesHandler {
  async execute(): Promise<OrderSummaryReadModel[]> {
    // Similar a LINQ Select en C#
    return this.orderRepository
      .createQueryBuilder("order")
      .leftJoin("order.customer", "customer")
      .leftJoin("order.items", "items")
      .select([
        "order.id as orderId",
        "customer.name as customerName",
        "COUNT(items.id) as itemCount",
        "SUM(items.price * items.quantity) as totalAmount",
        "order.status as status",
        "order.shippingAddress as shippingAddress",
      ])
      .groupBy("order.id")
      .getRawMany();
  }
}
```

### Dónde vive

```
src/
├── application/
│   └── queries/
│       ├── read-models/
│       │   └── UserProfileReadModel.ts
│       └── handlers/
│           └── GetUserProfileHandler.ts
└── infrastructure/
    └── projections/
        └── UserProfileProjection.ts
```

---

## 3. Diferencia clave (tabla ampliada)

| Aspecto             | DTO                               | Read Model                            |
| ------------------- | --------------------------------- | ------------------------------------- |
| **Propósito**       | Transportar datos entre capas     | Responder queries específicas         |
| **Diseño**          | Genérico, neutral                 | Optimizado para caso de uso           |
| **Intención**       | Técnica (desacoplamiento)         | Funcional (query del negocio)         |
| **Arquitectura**    | Layered, Clean Architecture       | CQRS (query side)                     |
| **Denormalización** | Puede o no estarlo                | Típicamente denormalizado             |
| **Combina fuentes** | Raramente                         | Frecuentemente                        |
| **Acoplamiento**    | A contratos externos (API)        | A necesidades de lectura (UI/Cliente) |
| **Vida útil**       | Cruza fronteras                   | Vive en el query side                 |
| **Protege contra**  | Over-posting, exposición de datos | Queries N+1, performance              |
| **Refleja**         | Contrato de transporte            | Caso de uso específico                |

---

## 4. Relación entre ambos: el flujo completo

**Pueden coexistir y colaborar:**

```typescript
// 1. Entidad de dominio (write side)
class Order {
  id: OrderId;
  customerId: CustomerId;
  items: OrderItem[];
  private internalNotes: string; // NO debe exponerse
  private cost: number; // NO debe exponerse
}

// 2. Read Model (query side) - vista optimizada
interface OrderDashboardReadModel {
  orderId: string;
  customerName: string; // desde Customer
  itemCount: number; // calculado
  totalAmount: number; // calculado desde items
  status: string;
  estimatedDelivery: Date;
  recentActivity: Activity[];
}

// 3. DTO (interface layer) - transporte seguro
interface OrderDashboardResponseDto {
  orderId: string;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  status: string;
  estimatedDelivery: string; // Date → string para JSON
  recentActivity: ActivityDto[];
  // NO incluye: cost, internalNotes, customerId
}

// 4. Query Handler
class GetOrderDashboardHandler {
  async execute(
    query: GetOrderDashboardQuery,
  ): Promise<OrderDashboardReadModel> {
    // Construye el Read Model optimizado
    const orders = await this.db
      .select({
        orderId: orders.id,
        customerName: customers.name,
        itemCount: sql`COUNT(${orderItems.id})`,
        totalAmount: sql`SUM(${orderItems.price} * ${orderItems.quantity})`,
        status: orders.status,
        estimatedDelivery: orders.estimatedDelivery,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .groupBy(orders.id);

    return orders[0];
  }
}

// 5. Controller
class OrderController {
  async getDashboard(orderId: string): Promise<OrderDashboardResponseDto> {
    // Query handler devuelve Read Model
    const readModel = await this.queryBus.execute(
      new GetOrderDashboardQuery(orderId),
    );

    // Mapper convierte Read Model → DTO para HTTP
    return this.orderMapper.toResponseDto(readModel);
  }
}
```

**Flujo completo:**

1. **Entidad de dominio** (write side): tiene datos sensibles, estructura interna
2. **Read Model** se construye en el query side con datos optimizados para lectura
3. **DTO** se crea en la interface layer para transportarlo de forma segura
4. El Read Model **puede viajar dentro de un DTO**, pero no son lo mismo

---

## 5. Patrones de uso según Microsoft

### Patrón 1: DTOs con diferentes niveles de detalle

```typescript
// Para listados (menos datos)
interface ProductDto {
  id: string;
  name: string;
  price: number;
}

// Para vista de detalle (más datos)
interface ProductDetailDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryName: string;
  ratings: number;
  reviews: ReviewDto[];
}

// Controller
@Get()
async getProducts(): Promise<ProductDto[]> {
  const products = await this.productRepo.find();
  return products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price
    // NO devuelve: cost, supplier, internalCode, etc.
  }));
}

@Get(':id')
async getProduct(@Param('id') id: string): Promise<ProductDetailDto> {
  const product = await this.productRepo.findOneWithRelations(id);
  return this.mapper.toDetailDto(product);
}
```

### Patrón 2: Aplanar objetos anidados

```typescript
// ❌ Entidad con relaciones anidadas
class Book {
  id: string;
  title: string;
  author: Author; // objeto completo
  publisher: Publisher; // objeto completo
}

// ✅ DTO aplanado
interface BookDto {
  id: string;
  title: string;
  authorName: string; // aplanado
  publisherName: string; // aplanado
}

// Conversión
function toDto(book: Book): BookDto {
  return {
    id: book.id,
    title: book.title,
    authorName: book.author.name,
    publisherName: book.publisher.name,
  };
}
```

### Patrón 3: Evitar referencias circulares

```typescript
// ❌ Referencias circulares en entidades
class Author {
  id: string;
  name: string;
  books: Book[]; // ← circular
}

class Book {
  id: string;
  title: string;
  author: Author; // ← circular
}

// Al serializar a JSON esto falla o genera JSON infinito

// ✅ DTOs sin referencias circulares
interface AuthorDto {
  id: string;
  name: string;
  bookTitles: string[]; // solo títulos, no objetos completos
}

interface BookDto {
  id: string;
  title: string;
  authorName: string; // solo nombre, no objeto completo
}
```

---

## 6. Errores comunes

### ❌ Error 1: Exponer entidades directamente en la API

```typescript
// ❌ NUNCA hagas esto
@Get(':id')
async getUser(@Param('id') id: string): Promise<User> {
  return this.userRepo.findOne(id);  // expone TODO
}

// Problemas:
// - Expone password, tokens, datos internos
// - Referencias circulares
// - Acopla API a estructura de BD
// - Over-posting vulnerability
```

### ❌ Error 2: Llamar "DTO" a un Read Model

```typescript
// ❌ Mal nombrado
export interface UserProfileDto {
  id: string;
  fullName: string;
  postsCount: number; // calculado
  totalRevenue: number; // agregado
  lastLoginAt: Date;
  subscriptionDaysLeft: number; // derivado
}
```

**Problema**: Esto combina datos, calcula campos, está optimizado para una vista específica → Es un **Read Model**, no un DTO genérico.

**✅ Correcto:**

```typescript
export interface UserProfileReadModel {
  /* ... */
}
```

### ❌ Error 3: No distinguir capas

```typescript
// ❌ En el dominio
class User {
  toDto(): UserDto {
    // El dominio no debería conocer DTOs
    return {
      /* ... */
    };
  }
}

// ✅ Correcto: Mapper en la capa de aplicación/interfaz
class UserMapper {
  toDto(user: User): UserDto {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name.value,
    };
  }
}
```

### ❌ Error 4: Confundir "anémico" con "mal diseño"

Tanto DTOs como Read Models son **anémicos por diseño** en TypeScript. Esto está bien:

```typescript
// ✅ Correcto: DTO anémico
interface CreateOrderDto {
  items: OrderItemDto[];
  shippingAddress: string;
}

// ✅ Correcto: Read Model anémico
interface OrderSummaryReadModel {
  orderId: string;
  totalItems: number;
  totalAmount: number;
}
```

**La riqueza del modelo está en:**

- **Write side**: Aggregates, Entities (con comportamiento)
- **Read side**: Query handlers, Projections (construyen Read Models)

---

## 7. Reglas de decisión

### ¿Cuándo crear un DTO?

✅ Necesitas **desacoplar** un contrato externo (HTTP, gRPC, event) del modelo interno

✅ Necesitas **proteger** datos sensibles o internos

✅ Necesitas **evitar over-posting** en escritura

✅ Necesitas **controlar exactamente** qué sale y qué entra

```typescript
// API expuesta públicamente → DTO
POST /api/users
{
  "email": "user@example.com",
  "name": "John Doe"
  // NO acepta: isAdmin, internalId, etc.
}
```

### ¿Cuándo crear un Read Model?

✅ Necesitas **responder una query específica** que requiere:

- Combinar datos de múltiples aggregates
- Denormalizar para performance
- Precalcular valores
- Optimizar para una vista particular
- Evitar queries N+1

```typescript
// Query específica → Read Model
Query: GetUserDashboard
→ UserDashboardReadModel (stats + activity + recommendations)
```

### ¿Cuándo usar ambos?

✅ En arquitecturas CQRS con APIs públicas:

```
Query → Read Model (optimizado) → DTO (seguro) → JSON (red)
```

---

## 8. En TypeScript: misma forma, distinto significado

TypeScript **no impone semántica**. La arquitectura sí.

```typescript
// Sintaxis idéntica
interface A {}
interface B {}
```

La diferencia está en:

- **Dónde viven** (carpeta/capa)
- **Quién los crea** (controller vs query handler)
- **Para qué existen** (transportar vs consultar)
- **Qué representan** (contrato vs vista)
- **Qué protegen** (dominio vs performance)

---

## 9. Ejemplo completo: CQRS + DTOs + Seguridad

```typescript
// 1. Entidad de dominio (write side)
class Order {
  private constructor(
    public readonly id: OrderId,
    private customerId: CustomerId,
    private items: OrderItem[],
    private internalCost: Money, // NO exponer
    private supplierNotes: string, // NO exponer
  ) {}

  static create(customerId: CustomerId, items: OrderItem[]): Order {
    // validaciones, lógica de negocio
    return new Order(OrderId.generate(), customerId, items, Money.zero(), "");
  }
}

// 2. Command (write side)
class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItemCommand[],
  ) {}
}

// 3. Input DTO (interface layer) - protege contra over-posting
interface CreateOrderDto {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
  // NO acepta: internalCost, supplierNotes, discount, etc.
}

// 4. Query (read side)
class GetOrderDetailsQuery {
  constructor(public readonly orderId: string) {}
}

// 5. Read Model (read side) - optimizado para lectura
interface OrderDetailsReadModel {
  orderId: string;
  customerName: string; // denormalizado de Customer
  customerEmail: string;
  items: {
    productName: string; // denormalizado de Product
    quantity: number;
    price: number;
  }[];
  totalAmount: number; // precalculado
  status: string;
  estimatedDelivery: Date;
  trackingNumber: string | null;
}

// 6. Output DTO (interface layer) - transporte seguro
interface OrderDetailsResponseDto {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemDto[];
  totalAmount: number;
  status: string;
  estimatedDelivery: string; // Date → string
  trackingNumber: string | null;
  // NO incluye: internalCost, supplierNotes, customerId
}

// 7. Query Handler
class GetOrderDetailsHandler {
  async execute(query: GetOrderDetailsQuery): Promise<OrderDetailsReadModel> {
    // Construye Read Model optimizado con JOIN único
    return this.orderRepository.getOrderDetails(query.orderId);
  }
}

// 8. Controller
class OrderController {
  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto, // ← DTO protege entrada
  ): Promise<OrderCreatedResponseDto> {
    // Validación
    const command = new CreateOrderCommand(this.getCurrentUserId(), dto.items);

    const result = await this.commandBus.execute(command);

    // Devuelve DTO, no entidad
    return {
      orderId: result.orderId,
      createdAt: result.createdAt.toISOString(),
    };
  }

  @Get(":id")
  async getOrderDetails(
    @Param("id") orderId: string,
  ): Promise<OrderDetailsResponseDto> {
    // Query handler devuelve Read Model
    const readModel = await this.queryBus.execute(
      new GetOrderDetailsQuery(orderId),
    );

    // Mapper convierte a DTO para HTTP
    return this.orderMapper.toResponseDto(readModel);
  }
}
```

**Flujo completo de seguridad:**

1. **Input DTO** valida y filtra datos de entrada (previene over-posting)
2. **Command** ejecuta lógica de negocio
3. **Query** recupera datos optimizados
4. **Read Model** denormaliza y calcula (performance)
5. **Output DTO** filtra datos sensibles antes de salir
6. **JSON** viaja por la red de forma segura

---

## 10. Conversión automática: librerías vs manual

### Opción 1: Manual (más control)

```typescript
class OrderMapper {
  toResponseDto(readModel: OrderDetailsReadModel): OrderDetailsResponseDto {
    return {
      orderId: readModel.orderId,
      customerName: readModel.customerName,
      customerEmail: readModel.customerEmail,
      items: readModel.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: readModel.totalAmount,
      status: readModel.status,
      estimatedDelivery: readModel.estimatedDelivery.toISOString(),
      trackingNumber: readModel.trackingNumber,
    };
  }
}
```

### Opción 2: AutoMapper (más rápido)

```typescript
import { Mapper, createMap, forMember, mapFrom } from "@automapper/core";

// Configuración
createMap(
  mapper,
  OrderDetailsReadModel,
  OrderDetailsResponseDto,
  forMember(
    (dest) => dest.estimatedDelivery,
    mapFrom((src) => src.estimatedDelivery.toISOString()),
  ),
);

// Uso
const dto = mapper.map(
  readModel,
  OrderDetailsReadModel,
  OrderDetailsResponseDto,
);
```

Microsoft recomienda evaluar el uso de bibliotecas como AutoMapper para manejar la conversión automática entre entidades y DTOs, aunque también es válido realizar la conversión manualmente en el código cuando se necesita más control.

---

## Resumen ejecutivo

|                     | DTO                                        | Read Model                        |
| ------------------- | ------------------------------------------ | --------------------------------- |
| **Pregunta clave**  | ¿Cómo cruzo esta frontera de forma segura? | ¿Qué necesita ver el cliente?     |
| **Vive en**         | Interface layer                            | Application/Query side            |
| **Optimizado para** | Transporte y seguridad                     | Consulta específica y performance |
| **Protege contra**  | Over-posting, exposición de datos          | Queries N+1, múltiples JOINs      |
| **Ejemplo**         | `CreateUserDto`, `UserResponseDto`         | `UserDashboardReadModel`          |

**La regla de oro:**

- Si existe solo para **mover datos de forma segura** → DTO
- Si existe para **responder una pregunta optimizada** → Read Model
- Si un Read Model sale del sistema → lo envuelves en un DTO
- **Nunca expongas entidades de dominio directamente**

**Principios fundamentales:**

1. **DTOs protegen** la integridad del sistema
2. **Read Models optimizan** la lectura
3. **Ambos desacoplan** capas arquitecturales
4. **La combinación** de ambos es la mejor práctica en sistemas complejos

# Ubicación de DTOs y Read Models en la arquitectura

La ubicación física (carpetas) refleja la **responsabilidad arquitectural** de cada componente. Aquí está la estructura completa con justificaciones.

---

## Estructura de carpetas completa

```
src/
├── domain/                           # ← Write side (núcleo del negocio)
│   ├── aggregates/
│   ├── entities/
│   ├── value-objects/
│   ├── interfaces/
│   ├── services/
│   └── events/
│
├── application/                      # ← Application layer (orquestación)
│   ├── commands/
│   │   └── create-order/
│   │       ├── Command.ts
│   │       ├── Result.ts
│   │       └── Handler.ts
│   │
│   ├── queries/                      # ← Read side (CQRS) - READ MODELS VIVEN AQUÍ
│   │   └── get-user-profile/
│   │       ├── Read-Model.ts
│   │       ├── Query.ts
│   │       └── Handler.ts
│   │
│   └── events/
│
├── infrastructure/                   # ← Persistencia y servicios externos
│   ├── persistence/
│   │   ├── repositories/
│   │   ├── projections/              # ← Implementaciones de Read Models
│   │   └── entities/                 # Entidades de ORM (TypeORM, Prisma)
│   │
│   └── external-services/
│
└── api/                       # ← API / Controllers / Presentation
    ├── http/                         # REST API
    │   ├── controllers/
    │   │
    │   ├── dtos/                     # ★ DTOs VIVEN AQUÍ
    │   │   ├── requests/             # Input DTOs
    │   │   └── responses/            # Output DTOs
    │   │
    │   └── mappers/                  # Conversores
    │
    ├── graphql/                      # GraphQL API (si aplica)
    │   ├── resolvers/
    │   └── types/                    # ★ DTOs para GraphQL
    │
    └── grpc/                         # gRPC API (si aplica)
        ├── services/
        └── messages/                 # ★ DTOs para gRPC
```

---

## Justificación de ubicaciones

### 1. Read Models → `application/queries/read-models/`

**Por qué aquí:**

- Son **modelos de aplicación**, no de dominio
- Viven en el **query side** de CQRS
- Representan **casos de uso de lectura**
- Son **independientes** de cómo se transportan (HTTP, GraphQL, gRPC)
- Pueden ser consumidos por múltiples API

```typescript
// application/queries/read-models/OrderDetailsReadModel.ts
export interface OrderDetailsReadModel {
  orderId: string;
  customerName: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: string;
  estimatedDelivery: Date;
}
```

**Responsabilidad:**

- Definir **qué datos necesita la aplicación para responder queries**
- No sabe nada sobre HTTP, JSON, o protocolos de transporte

---

### 2. DTOs → `api/http/dtos/`

**Por qué aquí:**

- Son **adaptadores de api**, no lógica de aplicación
- Específicos del **protocolo de transporte** (HTTP/REST)
- Manejan **serialización** (Date → string, validaciones de API)
- **Protegen** la aplicación de detalles externos

```typescript
// api/http/dtos/responses/OrderDetailsResponseDto.ts
export interface OrderDetailsResponseDto {
  orderId: string;
  customerName: string;
  items: OrderItemDto[];
  totalAmount: number;
  status: string;
  estimatedDelivery: string; // ← Date convertido a string para JSON
}
```

**Responsabilidad:**

- Definir **el contrato HTTP/JSON** exacto
- Manejar transformaciones específicas del protocolo

---

### 3. Projections → `infrastructure/projections/`

**Por qué aquí:**

- Son **implementaciones de infraestructura**
- Hacen queries reales a la base de datos
- Construyen los Read Models desde datos persistidos
- Manejan **cómo se materializa** un Read Model

```typescript
// infrastructure/projections/OrderDetailsProjection.ts
export class OrderDetailsProjection {
  constructor(private readonly db: Database) {}

  async getOrderDetails(orderId: string): Promise<OrderDetailsReadModel> {
    // Query SQL/ORM que construye el Read Model
    const result = await this.db
      .select({
        orderId: orders.id,
        customerName: customers.name,
        // ... JOINs y agregaciones
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, orderId));

    return result[0];
  }
}
```

**Responsabilidad:**

- **Cómo** construir un Read Model desde la base de datos
- Queries optimizadas, denormalizaciones, caching

---

## Flujo completo con ubicaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser/Mobile)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Request
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ api/http/controllers/OrderController.ts                   │
│                                                                   │
│ @Get(':id')                                                      │
│ async getOrderDetails(@Param('id') id: string)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 1. Recibe request
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ application/queries/handlers/GetOrderDetailsHandler.ts          │
│                                                                   │
│ execute(query: GetOrderDetailsQuery)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 2. Llama a Projection
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ infrastructure/projections/OrderDetailsProjection.ts            │
│                                                                   │
│ getOrderDetails(orderId): Promise<OrderDetailsReadModel>        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 3. Query a DB
                         ↓
                    [DATABASE]
                         │
                         │ 4. Retorna datos
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ application/queries/read-models/OrderDetailsReadModel.ts        │
│                                                                   │
│ interface OrderDetailsReadModel {                               │
│   orderId: string;                                              │
│   customerName: string;                                         │
│   items: {...}[];                                               │
│   totalAmount: number;                                          │
│   estimatedDelivery: Date;  ← Date nativo                      │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 5. Retorna Read Model al Controller
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ api/http/mappers/OrderMapper.ts                          │
│                                                                   │
│ toResponseDto(readModel: OrderDetailsReadModel)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 6. Convierte Read Model → DTO
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ api/http/dtos/responses/OrderDetailsResponseDto.ts       │
│                                                                   │
│ interface OrderDetailsResponseDto {                             │
│   orderId: string;                                              │
│   customerName: string;                                         │
│   items: OrderItemDto[];                                        │
│   totalAmount: number;                                          │
│   estimatedDelivery: string;  ← Date convertido a string       │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 7. Serializa a JSON y retorna
                         ↓
                    HTTP Response
```

---

## Ejemplos de archivos reales

### Read Model (Application Layer)

```typescript
// application/queries/read-models/UserDashboardReadModel.ts

/**
 * Read Model para el dashboard del usuario.
 * Define QUÉ datos necesita la aplicación.
 * NO conoce HTTP, JSON, ni protocolos de transporte.
 */
export interface UserDashboardReadModel {
  userId: string;
  fullName: string;
  email: string;

  // Estadísticas agregadas
  stats: {
    totalOrders: number;
    totalSpent: number;
    ordersThisMonth: number;
  };

  // Datos denormalizados
  recentOrders: {
    orderId: string;
    date: Date; // ← Date nativo
    total: number;
    status: string;
  }[];

  // Datos calculados
  membershipLevel: "bronze" | "silver" | "gold" | "platinum";
  nextRewardAt: number;

  // Recomendaciones (ML/algoritmo)
  recommendedProducts: {
    productId: string;
    name: string;
    price: number;
    score: number;
  }[];
}
```

### DTO (Interface Layer)

```typescript
// api/http/dtos/responses/UserDashboardResponseDto.ts

/**
 * DTO para transportar el dashboard por HTTP.
 * Define CÓMO se expone vía REST API.
 * Maneja serialización para JSON.
 */
export interface UserDashboardResponseDto {
  userId: string;
  fullName: string;
  email: string;

  stats: {
    totalOrders: number;
    totalSpent: number;
    ordersThisMonth: number;
  };

  recentOrders: {
    orderId: string;
    date: string; // ← Date convertido a ISO string
    total: number;
    status: string;
  }[];

  membershipLevel: string;
  nextRewardAt: number;

  recommendedProducts: {
    productId: string;
    name: string;
    price: number;
    // score NO se expone (interno)
  }[];
}
```

### Mapper (Interface Layer)

```typescript
// api/http/mappers/UserMapper.ts

import { UserDashboardReadModel } from "@/application/queries/read-models/UserDashboardReadModel";
import { UserDashboardResponseDto } from "../dtos/responses/UserDashboardResponseDto";

export class UserMapper {
  static toDashboardDto(
    readModel: UserDashboardReadModel,
  ): UserDashboardResponseDto {
    return {
      userId: readModel.userId,
      fullName: readModel.fullName,
      email: readModel.email,

      stats: readModel.stats,

      recentOrders: readModel.recentOrders.map((order) => ({
        orderId: order.orderId,
        date: order.date.toISOString(), // ← Conversión Date → string
        total: order.total,
        status: order.status,
      })),

      membershipLevel: readModel.membershipLevel,
      nextRewardAt: readModel.nextRewardAt,

      recommendedProducts: readModel.recommendedProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        price: p.price,
        // score se omite (interno)
      })),
    };
  }
}
```

---

## Casos especiales

### GraphQL: DTOs en `api/graphql/types/`

```typescript
// api/graphql/types/OrderType.ts

import { ObjectType, Field, Int } from "@nestjs/graphql";

@ObjectType()
export class OrderType {
  // ← DTO para GraphQL
  @Field()
  orderId: string;

  @Field()
  customerName: string;

  @Field(() => [OrderItemType])
  items: OrderItemType[];

  @Field(() => Int)
  totalAmount: number;

  @Field()
  status: string;

  @Field()
  estimatedDelivery: string;
}
```

### gRPC: DTOs en `api/grpc/messages/`

```typescript
// api/grpc/messages/order.proto (compilado a TS)

export interface OrderMessage {
  // ← DTO para gRPC
  orderId: string;
  customerName: string;
  items: OrderItemMessage[];
  totalAmount: number;
  status: string;
  estimatedDelivery: string;
}
```

### Eventos: DTOs en `api/events/`

```typescript
// api/events/OrderCreatedEventDto.ts

/**
 * DTO para eventos publicados a message broker (RabbitMQ, Kafka)
 */
export interface OrderCreatedEventDto {
  eventId: string;
  eventType: "OrderCreated";
  timestamp: string;

  payload: {
    orderId: string;
    customerId: string;
    totalAmount: number;
  };
}
```

---

## Resumen de ubicaciones

| Componente        | Ubicación                          | Responsabilidad                         |
| ----------------- | ---------------------------------- | --------------------------------------- |
| **Read Model**    | `application/queries/read-models/` | Define QUÉ datos necesita la aplicación |
| **Query Handler** | `application/queries/handlers/`    | Orquesta la obtención del Read Model    |
| **Projection**    | `infrastructure/projections/`      | CÓMO construir el Read Model (DB)       |
| **Input DTO**     | `api/http/dtos/requests/`          | Contrato de entrada HTTP                |
| **Output DTO**    | `api/http/dtos/responses/`         | Contrato de salida HTTP                 |
| **Mapper**        | `api/http/mappers/`                | Convierte Read Model ↔ DTO              |
| **Controller**    | `api/http/controllers/`            | Punto de entrada HTTP                   |

---

## Regla mnemotécnica

```
┌──────────────────────────────────────────────┐
│  PRESENTATION/API (DTOs)                           │
│  ↓ "Cómo se transporta"                     │
├──────────────────────────────────────────────┤
│  APPLICATION (Read Models)                   │
│  ↓ "Qué se necesita"                        │
├──────────────────────────────────────────────┤
│  INFRASTRUCTURE (Projections)                │
│  ↓ "Cómo se obtiene"                        │
├──────────────────────────────────────────────┤
│  DOMAIN (Aggregates)                         │
│  ↓ "Cómo se comporta"                       │
└──────────────────────────────────────────────┘
```

**Principio clave:**

- **Read Models** están más cerca del **dominio/aplicación** (lógica)
- **DTOs** están más cerca de la **api** (transporte)
- La separación permite **cambiar protocolos** (HTTP → gRPC) sin tocar Read Models
