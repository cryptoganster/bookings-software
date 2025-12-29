# Test Utilities Documentation

Comprehensive testing utilities for the backend application, organized by Bounded Context (BC) following Domain-Driven Design principles.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Helper Classes](#helper-classes)
- [Standalone Functions](#standalone-functions)
- [Database Utilities](#database-utilities)
- [Types Reference](#types-reference)
- [Testing Patterns](#testing-patterns)
- [Examples](#examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The test utilities are organized by Bounded Context to match the application's domain structure. Each BC has its own helper class and standalone functions for creating test data.

### Key Features

- **Organized by BC**: Helpers grouped by domain (Auth, Account, Business, Customer, etc.)
- **Helper Classes**: Object-oriented approach with cleanup methods
- **Standalone Functions**: Quick database insertion functions
- **Type Safety**: Full TypeScript support with exported types
- **Examples**: Comprehensive examples for all test types
- **Backward Compatible**: Old imports still work during migration

### Design Principles

1. **Separation of Concerns**: Each BC has its own helper file
2. **Composition over Inheritance**: Helpers use composition for complex scenarios
3. **Single Responsibility**: Each helper focuses on one BC
4. **DRY**: Shared utilities in database helper
5. **Testable**: Helpers themselves are unit tested

## Quick Start

### Installation

Test utilities are already part of the backend project. No installation needed.

### Basic Usage

```typescript
import { TestAuthHelper, TestBusinessHelper, TestDatabaseHelper } from '@test-utils/helpers';
import { DataSource } from 'typeorm';

describe('My Test Suite', () => {
  let dataSource: DataSource;
  let authHelper: TestAuthHelper;
  let businessHelper: TestBusinessHelper;

  beforeAll(async () => {
    // Initialize database
    dataSource = TestDatabaseHelper.createTestDataSource();
    await dataSource.initialize();

    // Initialize helpers
    authHelper = new TestAuthHelper(dataSource);
    businessHelper = new TestBusinessHelper(dataSource);
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    // Clean database before each test
    await TestDatabaseHelper.cleanDatabase(dataSource);
  });

  it('should create test user', async () => {
    const user = await authHelper.createTestUser('BUSINESS_OWNER');
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
  });
});
```

## Directory Structure

```
test-utils/
├── helpers/                    # New organized structure
│   ├── auth.ts                # Auth BC helpers
│   ├── account.ts             # Account BC helpers
│   ├── business.ts            # Business BC helpers
│   ├── customer.ts            # Customer BC helpers
│   ├── booking.ts             # Booking BC helpers
│   ├── conversation.ts        # Conversation BC helpers
│   ├── message.ts             # Message helpers
│   ├── database.ts            # Database utilities
│   ├── types.ts               # Type definitions
│   ├── index.ts               # Central exports
│   ├── availability/          # Availability BC helpers
│   │   ├── capacity.ts
│   │   ├── schedule.ts
│   │   └── blockout.ts
│   └── __tests__/             # Helper unit tests
│       ├── auth.spec.ts
│       ├── account.spec.ts
│       ├── business.spec.ts
│       ├── customer.spec.ts
│       ├── booking.spec.ts
│       ├── conversation.spec.ts
│       ├── message.spec.ts
│       ├── capacity.spec.ts
│       ├── schedule.spec.ts
│       └── blockout.spec.ts
├── examples/                   # Example test files
│   ├── pbt.spec.example.ts    # Property-based testing
│   ├── integration.spec.example.ts  # Integration testing
│   ├── e2e.spec.example.ts    # End-to-end testing
│   └── concurrency.spec.example.ts  # Concurrency testing
├── e2e-helpers/               # Deprecated (backward compatibility)
│   ├── auth.ts                # ⚠️ Use @test-utils/helpers instead
│   ├── capacity.ts            # ⚠️ Use @test-utils/helpers instead
│   ├── offering.ts            # ⚠️ Use @test-utils/helpers instead
│   ├── database.ts            # ⚠️ Use @test-utils/helpers instead
│   ├── types.ts               # ⚠️ Use @test-utils/helpers instead
│   └── index.ts               # Re-exports for backward compatibility
├── integration-test-helper.ts # ⚠️ Deprecated
└── README.md                  # This file
```

### Import Paths

**New (Recommended):**

```typescript
import { TestAuthHelper, TestBusinessHelper } from '@test-utils/helpers';
import { TestCapacityHelper } from '@test-utils/helpers/availability/capacity';
import { UserRole, TestUser } from '@test-utils/helpers';
```

**Old (Deprecated but still works):**

```typescript
import { E2EAuthHelper } from '@test-utils/e2e-helpers/auth';
import { createTestUser } from '@test-utils/integration-test-helper';
```

## Helper Classes

### Auth BC - TestAuthHelper

Handles user authentication and registration.

```typescript
import { TestAuthHelper, UserRole } from '@test-utils/helpers';

const authHelper = new TestAuthHelper(dataSource);

// Create test user with role
const user = await authHelper.createTestUser('BUSINESS_OWNER');

// Register new user
const registered = await authHelper.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
  initialRole: UserRole.BUSINESS_OWNER,
});

// Login
const loginResult = await authHelper.login('user@example.com', 'SecurePass123!');

// Cleanup
await authHelper.cleanupUsers();
```

**Methods:**

- `createTestUser(role: UserRole, options?: CreateTestUserOptions)` - Create complete test user with business
- `register(dto: RegisterDto)` - Register new user
- `login(email: string, password: string)` - Login user
- `refreshToken(refreshToken: string)` - Refresh JWT token
- `cleanupUsers()` - Delete all test users

### Account BC - TestAccountHelper

Handles business owner accounts and subscriptions.

```typescript
import { TestAccountHelper, SubscriptionPlan } from '@test-utils/helpers';

const accountHelper = new TestAccountHelper(dataSource);

// Create business owner
const owner = await accountHelper.createBusinessOwner({
  userId: 'user-123',
  subscriptionPlan: SubscriptionPlan.FREE,
});

// Upgrade subscription
await accountHelper.upgradeSubscription('owner-123', SubscriptionPlan.PRO);

// Cleanup
await accountHelper.cleanupBusinessOwners();
```

**Methods:**

- `createBusinessOwner(dto: CreateBusinessOwnerDto)` - Create business owner
- `upgradeSubscription(ownerId: string, plan: SubscriptionPlan)` - Upgrade plan
- `cleanupBusinessOwners()` - Delete all business owners

### Business BC - TestBusinessHelper

Handles business entities and configuration.

```typescript
import { TestBusinessHelper, generateUniqueWhatsAppNumber } from '@test-utils/helpers';

const businessHelper = new TestBusinessHelper(dataSource);

// Create business
const business = await businessHelper.createTestBusiness({
  ownerId: 'user-123',
  name: 'My Business',
  whatsappNumber: generateUniqueWhatsAppNumber(),
});

// Configure WhatsApp
await businessHelper.configureWhatsApp('business-123', '+18095551234');

// Cleanup
await businessHelper.cleanupBusinesses();
```

**Methods:**

- `createTestBusiness(dto: CreateBusinessDto)` - Create business
- `configureWhatsApp(businessId: string, whatsappNumber: string)` - Configure WhatsApp
- `cleanupBusinesses()` - Delete all businesses

### Customer BC - TestCustomerHelper

Handles customer profiles (anonymous and registered).

```typescript
import { TestCustomerHelper, generateUniqueWhatsAppPhone } from '@test-utils/helpers';

const customerHelper = new TestCustomerHelper(dataSource);

// Create anonymous customer
const anonymous = await customerHelper.createAnonymousCustomer(
  'business-123',
  generateUniqueWhatsAppPhone(),
);

// Create registered customer
const registered = await customerHelper.createRegisteredCustomer(
  'business-123',
  'user-123',
  '+18095551234',
);

// Link customer to user
await customerHelper.linkCustomerToUser('customer-123', 'user-123');

// Cleanup
await customerHelper.cleanupCustomers();
```

**Methods:**

- `createAnonymousCustomer(businessId: string, whatsappPhone: string, name?: string)` - Create anonymous customer
- `createRegisteredCustomer(businessId: string, userId: string, whatsappPhone: string, name?: string)` - Create registered customer
- `linkCustomerToUser(customerId: string, userId: string)` - Link customer to user
- `unlinkCustomerFromUser(customerId: string)` - Unlink customer from user
- `getCustomer(customerId: string)` - Get customer by ID
- `exportCustomerData(customerId: string)` - Export customer data (GDPR)
- `deleteCustomer(customerId: string)` - Delete customer (GDPR)
- `cleanupCustomers()` - Delete all customers

### Availability BC - TestCapacityHelper

Handles capacity management for offerings.

```typescript
import { TestCapacityHelper, createCapacityForTomorrow } from '@test-utils/helpers';

const capacityHelper = new TestCapacityHelper(dataSource);

// Create capacity for tomorrow
const capacity = await createCapacityForTomorrow('offering-123', 10);

// Create capacity for specific date
const capacityForDate = await capacityHelper.createCapacityForDate(
  'offering-123',
  new Date('2025-01-15'),
  10,
);

// Cleanup
await capacityHelper.cleanupCapacities();
```

**Methods:**

- `createCapacityForDate(offeringId: string, date: Date, availableSlots: number)` - Create capacity for date
- `cleanupCapacities()` - Delete all capacities

### Availability BC - TestScheduleHelper

Handles business schedules.

```typescript
import { TestScheduleHelper } from '@test-utils/helpers';

const scheduleHelper = new TestScheduleHelper(dataSource);

// Create schedule
const schedule = await scheduleHelper.createSchedule({
  businessId: 'business-123',
  dayOfWeek: 1, // Monday
  startTime: '09:00',
  endTime: '17:00',
});

// Create weekday schedule (Mon-Fri)
await scheduleHelper.createWeekdaySchedule('business-123', '09:00', '17:00');

// Cleanup
await scheduleHelper.cleanupSchedules();
```

**Methods:**

- `createSchedule(dto: CreateScheduleDto)` - Create schedule
- `createWeekdaySchedule(businessId: string, startTime: string, endTime: string)` - Create Mon-Fri schedule
- `cleanupSchedules()` - Delete all schedules

### Availability BC - TestBlockoutHelper

Handles date blockouts (vacations, holidays).

```typescript
import { TestBlockoutHelper } from '@test-utils/helpers';

const blockoutHelper = new TestBlockoutHelper(dataSource);

// Create blockout
const blockout = await blockoutHelper.createBlockout({
  businessId: 'business-123',
  startDate: new Date('2025-12-24'),
  endDate: new Date('2025-12-26'),
  reason: 'Christmas Holiday',
});

// Cleanup
await blockoutHelper.cleanupBlockouts();
```

**Methods:**

- `createBlockout(dto: CreateBlockoutDto)` - Create blockout
- `cleanupBlockouts()` - Delete all blockouts

### Booking BC - TestBookingHelper

Handles appointment bookings.

```typescript
import { TestBookingHelper } from '@test-utils/helpers';

const bookingHelper = new TestBookingHelper(dataSource);

// Create appointment
const appointment = await bookingHelper.createAppointment({
  businessId: 'business-123',
  customerId: 'customer-123',
  offeringId: 'offering-123',
  dateTime: new Date('2025-01-15T10:00:00Z'),
});

// Cancel appointment
await bookingHelper.cancelAppointment('appointment-123');

// Modify appointment
await bookingHelper.modifyAppointment('appointment-123', {
  dateTime: new Date('2025-01-15T14:00:00Z'),
});

// Cleanup
await bookingHelper.cleanupAppointments();
```

**Methods:**

- `createAppointment(dto: CreateAppointmentDto)` - Create appointment
- `cancelAppointment(appointmentId: string)` - Cancel appointment
- `modifyAppointment(appointmentId: string, dto: ModifyAppointmentDto)` - Modify appointment
- `cleanupAppointments()` - Delete all appointments

### Conversation BC - TestConversationHelper

Handles WhatsApp conversations.

```typescript
import { TestConversationHelper } from '@test-utils/helpers';

const conversationHelper = new TestConversationHelper(dataSource);

// Create conversation
const conversation = await conversationHelper.createConversation({
  businessId: 'business-123',
  customerId: 'customer-123',
  status: 'ACTIVE',
});

// Cleanup
await conversationHelper.cleanupConversations();
```

**Methods:**

- `createConversation(dto: CreateConversationDto)` - Create conversation
- `cleanupConversations()` - Delete all conversations

### Conversation BC - TestMessageHelper

Handles conversation messages.

```typescript
import { TestMessageHelper } from '@test-utils/helpers';

const messageHelper = new TestMessageHelper(dataSource);

// Create message
const message = await messageHelper.createMessage({
  conversationId: 'conversation-123',
  direction: 'INBOUND',
  content: 'Hello!',
  messageType: 'TEXT',
});

// Cleanup
await messageHelper.cleanupMessages();
```

**Methods:**

- `createMessage(dto: CreateMessageDto)` - Create message
- `cleanupMessages()` - Delete all messages

## Standalone Functions

Quick database insertion functions for simple test scenarios.

### Auth BC

```typescript
import { createTestUserInDb, generateTestEmail } from '@test-utils/helpers';

// Create user directly in database
await createTestUserInDb(dataSource, 'user-123', {
  email: generateTestEmail(),
  name: 'Test User',
  roles: ['BUSINESS_OWNER'],
});

// Generate unique test email
const email = generateTestEmail(); // test-{uuid}@example.com
const customEmail = generateTestEmail('admin'); // admin-{uuid}@example.com
```

**Functions:**

- `createTestUserInDb(dataSource, userId, options?)` - Insert user in database
- `generateTestEmail(prefix?)` - Generate unique test email

### Account BC

```typescript
import { createBusinessOwnerInDb } from '@test-utils/helpers';

// Create business owner directly in database
await createBusinessOwnerInDb(dataSource, 'owner-123', 'user-123', {
  subscriptionPlan: 'PRO',
});
```

**Functions:**

- `createBusinessOwnerInDb(dataSource, ownerId, userId, options?)` - Insert business owner

### Business BC

```typescript
import { createTestBusinessInDb, generateUniqueWhatsAppNumber } from '@test-utils/helpers';

// Create business directly in database
await createTestBusinessInDb(dataSource, 'business-123', 'user-123', {
  name: 'My Business',
  whatsappNumber: generateUniqueWhatsAppNumber(),
});

// Generate unique WhatsApp number
const phone = generateUniqueWhatsAppNumber(); // +1809555{random}
```

**Functions:**

- `createTestBusinessInDb(dataSource, businessId, ownerId, options?)` - Insert business
- `generateUniqueWhatsAppNumber()` - Generate unique WhatsApp number

### Customer BC

```typescript
import { createCustomerInDb, generateUniqueWhatsAppPhone } from '@test-utils/helpers';

// Create customer directly in database
await createCustomerInDb(dataSource, 'customer-123', 'business-123', {
  whatsappPhone: generateUniqueWhatsAppPhone(),
  name: 'Customer Name',
  userId: null, // Anonymous customer
});

// Generate unique WhatsApp phone
const phone = generateUniqueWhatsAppPhone(); // +1809555{random}
```

**Functions:**

- `createCustomerInDb(dataSource, customerId, businessId, options?)` - Insert customer
- `generateUniqueWhatsAppPhone()` - Generate unique WhatsApp phone

### Availability BC

```typescript
import {
  createCapacityForTomorrow,
  createCapacityForDate,
  createScheduleInDb,
  createBlockoutInDb,
} from '@test-utils/helpers';

// Create capacity for tomorrow
await createCapacityForTomorrow('offering-123', 10);

// Create capacity for specific date
await createCapacityForDate(dataSource, 'offering-123', new Date('2025-01-15'), 10);

// Create schedule
await createScheduleInDb(dataSource, 'schedule-123', 'business-123', {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '17:00',
});

// Create blockout
await createBlockoutInDb(dataSource, 'blockout-123', 'business-123', {
  startDate: new Date('2025-12-24'),
  endDate: new Date('2025-12-26'),
  reason: 'Holiday',
});
```

**Functions:**

- `createCapacityForTomorrow(offeringId, availableSlots)` - Create capacity for tomorrow
- `createCapacityForDate(dataSource, offeringId, date, availableSlots)` - Create capacity for date
- `createScheduleInDb(dataSource, scheduleId, businessId, options)` - Insert schedule
- `createBlockoutInDb(dataSource, blockoutId, businessId, options)` - Insert blockout

### Booking BC

```typescript
import { createAppointmentInDb } from '@test-utils/helpers';

// Create appointment directly in database
await createAppointmentInDb(dataSource, 'appointment-123', {
  businessId: 'business-123',
  customerId: 'customer-123',
  offeringId: 'offering-123',
  dateTime: new Date('2025-01-15T10:00:00Z'),
});
```

**Functions:**

- `createAppointmentInDb(dataSource, appointmentId, options)` - Insert appointment

### Conversation BC

```typescript
import { createConversationInDb, createMessageInDb } from '@test-utils/helpers';

// Create conversation
await createConversationInDb(dataSource, 'conversation-123', {
  businessId: 'business-123',
  customerId: 'customer-123',
  status: 'ACTIVE',
});

// Create message
await createMessageInDb(dataSource, 'message-123', {
  conversationId: 'conversation-123',
  direction: 'INBOUND',
  content: 'Hello!',
  messageType: 'TEXT',
});
```

**Functions:**

- `createConversationInDb(dataSource, conversationId, options)` - Insert conversation
- `createMessageInDb(dataSource, messageId, options)` - Insert message

## Database Utilities

### TestDatabaseHelper

Provides database management utilities for tests.

```typescript
import { TestDatabaseHelper } from '@test-utils/helpers';
import { DataSource } from 'typeorm';

// Create test DataSource
const dataSource = TestDatabaseHelper.createTestDataSource();
await dataSource.initialize();

// Clean all tables
await TestDatabaseHelper.cleanDatabase(dataSource);

// Setup test database (initialize + clean)
const ds = await TestDatabaseHelper.setupTestDatabase();

// Teardown test database (clean + destroy)
await TestDatabaseHelper.teardownTestDatabase(dataSource);

// Get TypeORM config
const config = TestDatabaseHelper.getTestTypeOrmConfig();

// Generate test ID
const id = TestDatabaseHelper.generateTestId(); // UUID v4
```

**Static Methods:**

- `createTestDataSource()` - Create TypeORM DataSource for tests
- `cleanDatabase(dataSource)` - Delete all data from all tables
- `setupTestDatabase()` - Initialize and clean database
- `teardownTestDatabase(dataSource)` - Clean and destroy database
- `getTestTypeOrmConfig()` - Get TypeORM configuration
- `generateTestId()` - Generate UUID v4

**Standalone Functions:**

```typescript
import { cleanDatabase, createTestDataSource, generateTestId } from '@test-utils/helpers';

// Same as static methods
await cleanDatabase(dataSource);
const ds = createTestDataSource();
const id = generateTestId();
```

### Database Cleanup Order

The `cleanDatabase` function deletes data in the correct order to respect foreign key constraints:

1. Messages
2. Conversations
3. Appointments (Bookings)
4. Blockouts
5. Schedules
6. Capacities
7. Offerings
8. Customers
9. Businesses
10. Business Owners
11. Users

This ensures no foreign key violations during cleanup.

## Types Reference

All types are exported from `@test-utils/helpers` for convenience.

### Auth BC Types

```typescript
import {
  UserRole,
  TestUser,
  RegisterDto,
  LoginResponse,
  RegisterResponse,
} from '@test-utils/helpers';

// User roles
enum UserRole {
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

// Test user (returned by createTestUser)
interface TestUser {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  token: string;
  businessId?: string;
}

// Registration DTO
interface RegisterDto {
  email: string;
  password: string;
  name: string;
  initialRole: UserRole;
}

// Login response
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
  };
}

// Register response
interface RegisterResponse {
  userId: string;
  token: string;
}
```

### Account BC Types

```typescript
import { SubscriptionPlan, CreateBusinessOwnerDto } from '@test-utils/helpers';

// Subscription plans
enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

// Create business owner DTO
interface CreateBusinessOwnerDto {
  userId: string;
  subscriptionPlan?: SubscriptionPlan;
  onboardingCompleted?: boolean;
}
```

### Business BC Types

```typescript
import { AddressDto, CreateBusinessDto, ConfigureWhatsAppDto } from '@test-utils/helpers';

// Address DTO
interface AddressDto {
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

// Create business DTO
interface CreateBusinessDto {
  ownerId: string;
  name: string;
  whatsappNumber?: string;
  address?: AddressDto;
  timezone?: string;
}

// Configure WhatsApp DTO
interface ConfigureWhatsAppDto {
  whatsappNumber: string;
}
```

### Customer BC Types

```typescript
import { CreateCustomerDto } from '@test-utils/helpers';

// Create customer DTO
interface CreateCustomerDto {
  businessId: string;
  userId?: string | null; // null = anonymous
  whatsappPhone: string;
  name?: string;
}
```

### Availability BC Types

```typescript
import { CreateCapacityDto, CreateScheduleDto, CreateBlockoutDto } from '@test-utils/helpers';

// Create capacity DTO
interface CreateCapacityDto {
  offeringId: string;
  date: Date;
  availableSlots: number;
}

// Create schedule DTO
interface CreateScheduleDto {
  businessId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

// Create blockout DTO
interface CreateBlockoutDto {
  businessId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}
```

### Booking BC Types

```typescript
import { CreateAppointmentDto, ModifyAppointmentDto } from '@test-utils/helpers';

// Create appointment DTO
interface CreateAppointmentDto {
  businessId: string;
  customerId: string;
  offeringId: string;
  dateTime: Date;
}

// Modify appointment DTO
interface ModifyAppointmentDto {
  dateTime: Date;
}
```

### Conversation BC Types

```typescript
import { CreateConversationDto, CreateMessageDto } from '@test-utils/helpers';

// Create conversation DTO
interface CreateConversationDto {
  businessId: string;
  customerId: string;
  status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED';
}

// Create message DTO
interface CreateMessageDto {
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  messageType: 'TEXT' | 'BUTTON' | 'LOCATION';
  isFromAdmin?: boolean;
}
```

### Composite Types

```typescript
import { CreateTestUserOptions } from '@test-utils/helpers';

// Options for createTestUser
interface CreateTestUserOptions {
  email?: string;
  password?: string;
  name?: string;
  businessData?: {
    name?: string;
    whatsappNumber?: string;
    address?: AddressDto;
    timezone?: string;
  };
}
```

## Testing Patterns

### Unit Tests

Test individual components in isolation.

```typescript
import { describe, it, expect } from 'vitest';
import { UUID } from '@shared/vo/uuid';

describe('UUID Value Object', () => {
  it('should generate valid UUID v4', () => {
    const uuid = UUID.generate();
    expect(uuid.getValue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should parse valid UUID string', () => {
    const uuidString = '123e4567-e89b-12d3-a456-426614174000';
    const uuid = UUID.fromString(uuidString);
    expect(uuid.getValue()).toBe(uuidString);
  });
});
```

**Best Practices:**

- Test one thing per test
- Use descriptive test names
- Arrange-Act-Assert pattern
- No database dependencies
- Fast execution (< 1ms per test)

### Integration Tests

Test interactions between components and database.

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DataSource } from 'typeorm';
import { TestDatabaseHelper, TestAuthHelper, TestBusinessHelper } from '@test-utils/helpers';

describe('Business Creation Flow', () => {
  let dataSource: DataSource;
  let authHelper: TestAuthHelper;
  let businessHelper: TestBusinessHelper;

  beforeAll(async () => {
    dataSource = TestDatabaseHelper.createTestDataSource();
    await dataSource.initialize();
    authHelper = new TestAuthHelper(dataSource);
    businessHelper = new TestBusinessHelper(dataSource);
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    await TestDatabaseHelper.cleanDatabase(dataSource);
  });

  it('should create business with valid owner', async () => {
    // Create user first
    const user = await authHelper.createTestUser('BUSINESS_OWNER');

    // Create business
    const business = await businessHelper.createTestBusiness({
      ownerId: user.id,
      name: 'Test Business',
    });

    expect(business).toBeDefined();
    expect(business.ownerId).toBe(user.id);
  });
});
```

**Best Practices:**

- Use real database
- Clean database before each test
- Test complete flows
- Verify foreign key relationships
- Test data persistence

### E2E Tests

Test complete user journeys through HTTP requests.

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { TestDatabaseHelper, TestAuthHelper } from '@test-utils/helpers';

describe('Business Owner Registration (E2E)', () => {
  let app: INestApplication;
  let authHelper: TestAuthHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authHelper = new TestAuthHelper(app);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    const dataSource = app.get(DataSource);
    await TestDatabaseHelper.cleanDatabase(dataSource);
  });

  it('should register, login, and create business', async () => {
    // Register
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'owner@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
        initialRole: 'BUSINESS_OWNER',
      })
      .expect(201);

    const { token } = registerResponse.body;

    // Create business
    await request(app.getHttpServer())
      .post('/api/business')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Business',
        whatsappNumber: '+18095551234',
      })
      .expect(201);
  });
});
```

**Best Practices:**

- Test complete user flows
- Use real HTTP requests
- Test authentication
- Verify response format
- Test error cases

### Property-Based Tests (PBT)

Test properties that should hold for many random inputs.

```typescript
import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { UUID } from '@shared/vo/uuid';

describe('UUID Properties', () => {
  test.prop([fc.constant(null)])('should always generate valid UUID v4 format', () => {
    const uuid = UUID.generate();
    const uuidString = uuid.getValue();

    // Property: UUID should match v4 format
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidString).toMatch(uuidV4Regex);
  });

  test.prop([fc.uuid()])('should correctly parse valid UUID strings', (uuidString) => {
    // Property: Any valid UUID string should be parseable
    const uuid = UUID.fromString(uuidString);
    expect(uuid.getValue()).toBe(uuidString);
  });
});
```

**Best Practices:**

- Think in properties, not examples
- Test invariants (things that always hold)
- Use appropriate arbitraries (fc.string(), fc.integer(), etc.)
- Run many iterations (default 100)
- Document what property you're testing

**Common Properties:**

- Idempotency: `f(f(x)) === f(x)`
- Inverse: `f(g(x)) === x`
- Commutativity: `f(x, y) === f(y, x)`
- Associativity: `f(f(x, y), z) === f(x, f(y, z))`

### Concurrency Tests

Test concurrent operations and optimistic locking.

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DataSource } from 'typeorm';
import { TestDatabaseHelper, TestCapacityHelper } from '@test-utils/helpers';

describe('Concurrent Capacity Updates', () => {
  let dataSource: DataSource;
  let capacityHelper: TestCapacityHelper;

  beforeAll(async () => {
    dataSource = TestDatabaseHelper.createTestDataSource();
    await dataSource.initialize();
    capacityHelper = new TestCapacityHelper(dataSource);
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    await TestDatabaseHelper.cleanDatabase(dataSource);
  });

  it('should handle concurrent slot decrements with optimistic locking', async () => {
    // Create capacity with 10 slots
    const capacity = await capacityHelper.createCapacityForDate(
      'offering-123',
      new Date('2025-01-15'),
      10,
    );

    // Simulate 5 concurrent users trying to book
    const concurrentBookings = Array.from({ length: 5 }, async () => {
      // Each user tries to decrement a slot
      // Optimistic locking will prevent lost updates
      // ... implementation
    });

    const results = await Promise.all(concurrentBookings);

    // Verify some succeeded and some failed due to concurrency
    const successful = results.filter((r) => r.success);
    expect(successful.length).toBeGreaterThan(0);
    expect(successful.length).toBeLessThan(5);
  });
});
```

**Best Practices:**

- Test real concurrent scenarios
- Use optimistic locking (version field)
- Implement retry logic with exponential backoff
- Verify data integrity after concurrent operations
- Test edge cases (last available slot)

## Examples

Comprehensive example files are available in `apps/backend/src/test-utils/examples/`:

### Command Handler Testing Example

**File:** `examples/command-handler.spec.example.ts`

Demonstrates:

- Testing command handlers with mocked dependencies
- Testing with Domain Services
- Testing retry logic for optimistic locking
- Validation testing
- Transaction rollback testing
- Error handling in command handlers

**Key Concepts:**

- Mocking repositories and services
- Verifying method calls and parameters
- Testing business logic orchestration
- Testing validation rules
- Testing transaction behavior

### Query Handler Testing Example

**File:** `examples/query-handler.spec.example.ts`

Demonstrates:

- Testing simple query handlers
- Testing with filters and pagination
- Testing data transformation
- Testing not found cases
- Testing empty results
- Testing denormalized data

**Key Concepts:**

- Mocking read repositories
- Verifying data retrieval
- Testing query parameters
- Testing Read Model structure
- No side effects in queries

### Event Handler Testing Example

**File:** `examples/event-handler.spec.example.ts`

Demonstrates:

- Testing simple event handlers
- Testing with multiple commands
- Testing with queries before commands
- Testing with external services
- Testing conditional logic
- Error handling (handlers fail silently)

**Key Concepts:**

- Mocking CommandBus and QueryBus
- Verifying side effects
- Testing async event processing
- Testing retry logic
- Testing idempotency

### Aggregate Testing Example

**File:** `examples/aggregate.spec.example.ts`

Demonstrates:

- Testing factory methods (create, fromPersistence)
- Testing business logic methods
- Testing invariants and validations
- Testing versioning (optimistic locking)
- Testing domain event publishing
- Testing state transitions

**Key Concepts:**

- Pure domain logic testing
- No mocking required
- Testing business rules
- Testing version increments
- Testing event accumulation

### Property-Based Testing Example

**File:** `examples/pbt.spec.example.ts`

Demonstrates:

- UUID generation properties
- Email generation properties
- WhatsApp number generation properties
- String validation properties
- Idempotency properties
- Inverse operation properties

**Key Concepts:**

- Using fast-check arbitraries
- Testing invariants
- Shrinking failing cases
- Running multiple iterations

### Integration Testing Example

**File:** `examples/integration.spec.example.ts`

Demonstrates:

- Complete business setup flow
- Database cleanup
- Foreign key relationships
- Using helper classes
- Data persistence verification

**Key Concepts:**

- Real database interactions
- Foreign key constraints
- Helper class usage
- Data verification

### E2E Testing Example

**File:** `examples/e2e.spec.example.ts`

Demonstrates:

- Business owner registration journey
- Authentication flow
- Protected route access
- Offering creation flow
- Error handling
- Response format validation

**Key Concepts:**

- HTTP requests with supertest
- JWT authentication
- Request/response validation
- Error case testing

### Concurrency Testing Example

**File:** `examples/concurrency.spec.example.ts`

Demonstrates:

- Concurrent capacity updates
- Optimistic locking verification
- Retry logic implementation
- Version field increment
- Preventing overbooking

**Key Concepts:**

- Race condition testing
- Optimistic locking
- Retry with exponential backoff
- Data integrity verification

### Running Examples

```bash
# Run all examples
pnpm test examples/

# Run specific example
pnpm test examples/command-handler.spec.example.ts
pnpm test examples/query-handler.spec.example.ts
pnpm test examples/event-handler.spec.example.ts
pnpm test examples/aggregate.spec.example.ts
pnpm test examples/pbt.spec.example.ts
pnpm test examples/integration.spec.example.ts
pnpm test examples/e2e.spec.example.ts
pnpm test examples/concurrency.spec.example.ts
```

## Migration Guide

### From Old Structure to New Structure

#### Old Imports (Deprecated)

```typescript
// ❌ Old way
import { E2EAuthHelper } from '@test-utils/e2e-helpers/auth';
import { createTestUser } from '@test-utils/integration-test-helper';
import { cleanDatabase } from '@test-utils/e2e-helpers/database';
import { E2EDatabaseHelper } from '@test-utils/e2e-helpers/database';
```

#### New Imports (Recommended)

```typescript
// ✅ New way
import { TestAuthHelper } from '@test-utils/helpers';
import { createTestUserInDb } from '@test-utils/helpers';
import { cleanDatabase } from '@test-utils/helpers';
import { TestDatabaseHelper } from '@test-utils/helpers';
```

### Migration Steps

1. **Update Imports**
   - Replace `@test-utils/e2e-helpers/*` with `@test-utils/helpers`
   - Replace `@test-utils/integration-test-helper` with `@test-utils/helpers`

2. **Update Class Names**
   - `E2EAuthHelper` → `TestAuthHelper`
   - `E2EDatabaseHelper` → `TestDatabaseHelper`

3. **Update Function Names**
   - `createTestUser` → `createTestUserInDb`
   - Other functions remain the same

4. **Update Helper Instantiation**

   ```typescript
   // Old
   const authHelper = new E2EAuthHelper(app);

   // New
   const authHelper = new TestAuthHelper(app);
   ```

### Backward Compatibility

Old imports still work during the migration period:

```typescript
// These still work (but are deprecated)
import { E2EAuthHelper } from '@test-utils/e2e-helpers/auth';
import { createTestUser } from '@test-utils/integration-test-helper';

// Internally, they re-export from the new structure
```

**Deprecation Timeline:**

- **Phase 1** (Current): Both old and new imports work
- **Phase 2** (Next release): Deprecation warnings added
- **Phase 3** (Future release): Old imports removed

### Migration Script

For bulk migration, use this find-and-replace pattern:

```bash
# Find old imports
grep -r "@test-utils/e2e-helpers" apps/backend/src/
grep -r "@test-utils/integration-test-helper" apps/backend/src/

# Replace with new imports (manual or with sed)
# Example:
sed -i 's/@test-utils\/e2e-helpers/@test-utils\/helpers/g' file.ts
sed -i 's/E2EAuthHelper/TestAuthHelper/g' file.ts
sed -i 's/E2EDatabaseHelper/TestDatabaseHelper/g' file.ts
sed -i 's/createTestUser/createTestUserInDb/g' file.ts
```

### Common Migration Issues

**Issue 1: Import not found**

```typescript
// Error: Cannot find module '@test-utils/helpers/auth'
import { TestAuthHelper } from '@test-utils/helpers/auth';

// Fix: Import from central index
import { TestAuthHelper } from '@test-utils/helpers';
```

**Issue 2: Function signature changed**

```typescript
// Old: createTestUser(app, role)
const user = await createTestUser(app, 'BUSINESS_OWNER');

// New: createTestUserInDb(dataSource, userId, options)
const user = await createTestUserInDb(dataSource, 'user-123', {
  roles: ['BUSINESS_OWNER'],
});

// Or use helper class
const authHelper = new TestAuthHelper(dataSource);
const user = await authHelper.createTestUser('BUSINESS_OWNER');
```

**Issue 3: Helper class constructor changed**

```typescript
// Old: E2EAuthHelper(app)
const authHelper = new E2EAuthHelper(app);

// New: TestAuthHelper(dataSource or app)
const authHelper = new TestAuthHelper(dataSource);
// or
const authHelper = new TestAuthHelper(app);
```

## Best Practices

### General Testing

1. **Clean Database Before Each Test**

   ```typescript
   beforeEach(async () => {
     await TestDatabaseHelper.cleanDatabase(dataSource);
   });
   ```

2. **Use Descriptive Test Names**

   ```typescript
   // ❌ Bad
   it('works', () => {});

   // ✅ Good
   it('should create business owner with FREE subscription plan', () => {});
   ```

3. **Follow Arrange-Act-Assert Pattern**

   ```typescript
   it('should create appointment', async () => {
     // Arrange
     const user = await authHelper.createTestUser('BUSINESS_OWNER');
     const customer = await customerHelper.createAnonymousCustomer(
       user.businessId!,
       '+18095551234',
     );

     // Act
     const appointment = await bookingHelper.createAppointment({
       businessId: user.businessId!,
       customerId: customer.id,
       offeringId: 'offering-123',
       dateTime: new Date('2025-01-15T10:00:00Z'),
     });

     // Assert
     expect(appointment).toBeDefined();
     expect(appointment.customerId).toBe(customer.id);
   });
   ```

4. **Test One Thing Per Test**

   ```typescript
   // ❌ Bad - Testing multiple things
   it('should create user and business and appointment', () => {});

   // ✅ Good - Separate tests
   it('should create user', () => {});
   it('should create business', () => {});
   it('should create appointment', () => {});
   ```

5. **Use Helper Classes for Complex Setup**

   ```typescript
   // ❌ Bad - Manual setup
   const userRepo = dataSource.getRepository(UserModel);
   const user = userRepo.create({ ... });
   await userRepo.save(user);
   const businessRepo = dataSource.getRepository(BusinessModel);
   const business = businessRepo.create({ ... });
   await businessRepo.save(business);

   // ✅ Good - Use helpers
   const user = await authHelper.createTestUser('BUSINESS_OWNER');
   ```

### Integration Tests

1. **Use Real Database**
   - Don't mock database interactions
   - Use test database (separate from development)

2. **Test Foreign Key Relationships**

   ```typescript
   it('should enforce foreign key constraint', async () => {
     // Attempt to create business without user should fail
     await expect(
       businessHelper.createTestBusiness({
         ownerId: 'non-existent-user',
         name: 'Test Business',
       }),
     ).rejects.toThrow();
   });
   ```

3. **Verify Data Persistence**

   ```typescript
   it('should persist business correctly', async () => {
     const created = await businessHelper.createTestBusiness({ ... });

     const retrieved = await businessRepo.findOne({ where: { id: created.id } });

     expect(retrieved).toBeDefined();
     expect(retrieved?.name).toBe(created.name);
   });
   ```

### E2E Tests

1. **Test Complete User Flows**

   ```typescript
   it('should complete business owner registration flow', async () => {
     // Register → Login → Create Business → Configure
   });
   ```

2. **Test Authentication**

   ```typescript
   it('should require authentication for protected routes', async () => {
     await request(app.getHttpServer()).get('/api/business').expect(401);
   });
   ```

3. **Test Error Cases**
   ```typescript
   it('should return 400 for invalid input', async () => {
     await request(app.getHttpServer())
       .post('/api/auth/register')
       .send({ email: 'invalid' })
       .expect(400);
   });
   ```

### Property-Based Tests

1. **Think in Properties**
   - Instead of: "UUID '123...' should be valid"
   - Think: "All generated UUIDs should match UUID v4 format"

2. **Use Appropriate Arbitraries**

   ```typescript
   fc.string(); // Random strings
   fc.integer(); // Random integers
   fc.uuid(); // Valid UUIDs
   fc.emailAddress(); // Valid emails
   fc.date(); // Random dates
   ```

3. **Run Many Iterations**
   ```typescript
   test.prop({ numRuns: 1000 })([fc.uuid()])('property holds', (uuid) => {
     // Test with 1000 random UUIDs
   });
   ```

### Concurrency Tests

1. **Test Real Scenarios**
   - Simulate actual concurrent user behavior
   - Use realistic timing and delays

2. **Use Optimistic Locking**

   ```typescript
   // Always include version field in updates
   .where('id = :id AND version = :version', { id, version })
   ```

3. **Implement Retry Logic**

   ```typescript
   const maxRetries = 3;
   let attempt = 0;

   while (attempt < maxRetries) {
     try {
       // Attempt update
       break; // Success
     } catch (error) {
       if (error instanceof ConcurrencyException) {
         attempt++;
         await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
       } else {
         throw error;
       }
     }
   }
   ```

### Performance

1. **Keep Tests Fast**
   - Unit tests: < 1ms
   - Integration tests: < 100ms
   - E2E tests: < 1s

2. **Use Parallel Execution**

   ```bash
   # Vitest runs tests in parallel by default
   pnpm test
   ```

3. **Minimize Database Operations**
   - Use standalone functions for simple inserts
   - Use helper classes for complex scenarios

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@test-utils/helpers'"

**Cause:** TypeScript path mapping not configured correctly.

**Solution:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@test-utils/*": ["src/test-utils/*"]
    }
  }
}
```

#### Issue: "DataSource not initialized"

**Cause:** Forgot to initialize DataSource before using helpers.

**Solution:**

```typescript
beforeAll(async () => {
  dataSource = TestDatabaseHelper.createTestDataSource();
  await dataSource.initialize(); // ← Don't forget this!
});
```

#### Issue: "Foreign key constraint violation"

**Cause:** Creating entity without required parent entity.

**Solution:**

```typescript
// ❌ Wrong order
await createCustomerInDb(dataSource, 'customer-123', 'business-123');
await createTestBusinessInDb(dataSource, 'business-123', 'user-123');

// ✅ Correct order
await createTestUserInDb(dataSource, 'user-123');
await createTestBusinessInDb(dataSource, 'business-123', 'user-123');
await createCustomerInDb(dataSource, 'customer-123', 'business-123');
```

#### Issue: "Tests fail intermittently"

**Cause:** Not cleaning database between tests or race conditions.

**Solution:**

```typescript
// Always clean before each test
beforeEach(async () => {
  await TestDatabaseHelper.cleanDatabase(dataSource);
});

// For concurrency tests, use proper locking
```

#### Issue: "Helper method not found"

**Cause:** Using old helper class name or method name.

**Solution:**

```typescript
// ❌ Old
const helper = new E2EAuthHelper(app);
await helper.createTestUser(app, 'BUSINESS_OWNER');

// ✅ New
const helper = new TestAuthHelper(app);
await helper.createTestUser('BUSINESS_OWNER');
```

#### Issue: "Type error with helper options"

**Cause:** Using wrong type or missing required fields.

**Solution:**

```typescript
// Check the type definition
import { CreateBusinessDto } from '@test-utils/helpers';

// Ensure all required fields are provided
const business = await businessHelper.createTestBusiness({
  ownerId: 'user-123', // Required
  name: 'My Business', // Required
  // Optional fields can be omitted
});
```

#### Issue: "Database cleanup takes too long"

**Cause:** Large amount of test data or missing indexes.

**Solution:**

```typescript
// Use cleanup methods instead of full database clean
await authHelper.cleanupUsers();
await businessHelper.cleanupBusinesses();

// Or use transactions for faster cleanup (if supported)
```

#### Issue: "Tests pass locally but fail in CI"

**Cause:** Different database state or timing issues.

**Solution:**

```typescript
// Ensure database is clean before tests
beforeAll(async () => {
  await TestDatabaseHelper.cleanDatabase(dataSource);
});

// Add proper waits for async operations
await new Promise((resolve) => setTimeout(resolve, 100));
```

### Debugging Tips

1. **Enable Verbose Logging**

   ```typescript
   // In test file
   console.log('User created:', user);
   console.log('Business created:', business);
   ```

2. **Check Database State**

   ```typescript
   // Query database directly
   const users = await dataSource.getRepository(UserModel).find();
   console.log('Users in database:', users);
   ```

3. **Use Vitest UI**

   ```bash
   pnpm test:ui
   ```

4. **Run Single Test**

   ```bash
   pnpm test path/to/test.spec.ts
   ```

5. **Use Test.only**
   ```typescript
   it.only('should test this specific case', () => {
     // Only this test will run
   });
   ```

### Getting Help

1. **Check Examples**
   - Review `examples/` directory for working examples
   - Compare your code with example patterns

2. **Check Documentation**
   - Review this README
   - Check JSDoc comments in helper files
   - Review type definitions

3. **Ask Team**
   - Post in #dev-help Slack channel
   - Create GitHub issue with `[test-utils]` tag
   - Ask in team standup

4. **Report Bugs**
   - Create GitHub issue with:
     - Description of problem
     - Code snippet
     - Expected vs actual behavior
     - Steps to reproduce

## Contributing

### Adding New Helpers

When adding a new Bounded Context or extending existing helpers:

1. **Create Helper File**

   ```bash
   # For new BC
   touch apps/backend/src/test-utils/helpers/new-bc.ts

   # For sub-module
   touch apps/backend/src/test-utils/helpers/existing-bc/new-module.ts
   ```

2. **Follow Naming Convention**

   ```typescript
   // Helper class: Test{BC}Helper
   export class TestNewBCHelper {
     constructor(private readonly dataSource: DataSource | INestApplication) {}

     async createEntity(dto: CreateEntityDto): Promise<Entity> {
       // Implementation
     }

     async cleanupEntities(): Promise<void> {
       // Implementation
     }
   }

   // Standalone function: create{Entity}InDb
   export async function createEntityInDb(
     dataSource: DataSource,
     entityId: string,
     options?: Partial<CreateEntityDto>,
   ): Promise<Entity> {
     // Implementation
   }
   ```

3. **Add Types**

   ```typescript
   // In helpers/types.ts
   export interface CreateEntityDto {
     // ... fields
   }
   ```

4. **Export from Index**

   ```typescript
   // In helpers/index.ts
   export { TestNewBCHelper, createEntityInDb } from './new-bc';
   export { CreateEntityDto } from './types';
   ```

5. **Add Unit Tests**

   ```typescript
   // In helpers/__tests__/new-bc.spec.ts
   describe('TestNewBCHelper', () => {
     it('should create entity', async () => {
       // Test implementation
     });
   });
   ```

6. **Update Documentation**
   - Add section to this README
   - Add JSDoc comments to helper class
   - Add usage examples

### Code Style

1. **Use TypeScript**
   - Full type safety
   - No `any` types
   - Export all types

2. **Follow Naming Conventions**
   - Classes: `TestXxxHelper`
   - Functions: `createXxxInDb`, `generateXxx`
   - Types: `CreateXxxDto`, `XxxReadModel`

3. **Add JSDoc Comments**

   ````typescript
   /**
    * Creates a test business in the database.
    *
    * @param dataSource - TypeORM DataSource
    * @param businessId - Unique business ID
    * @param ownerId - User ID of business owner
    * @param options - Optional business data
    * @returns Created business entity
    *
    * @example
    * ```typescript
    * const business = await createTestBusinessInDb(
    *   dataSource,
    *   'business-123',
    *   'user-123',
    *   { name: 'My Business' }
    * );
    * ```
    */
   export async function createTestBusinessInDb(
     dataSource: DataSource,
     businessId: string,
     ownerId: string,
     options?: Partial<CreateBusinessDto>,
   ): Promise<Business> {
     // Implementation
   }
   ````

4. **Handle Errors Gracefully**

   ```typescript
   try {
     // Operation
   } catch (error) {
     throw new Error(`Failed to create entity: ${error.message}`);
   }
   ```

5. **Use Async/Await**

   ```typescript
   // ✅ Good
   async function createEntity() {
     const result = await repository.save(entity);
     return result;
   }

   // ❌ Bad
   function createEntity() {
     return repository.save(entity).then((result) => result);
   }
   ```

### Testing Guidelines

1. **Test All Helper Methods**
   - Unit test each public method
   - Test success cases
   - Test error cases

2. **Use Real Database for Integration Tests**
   - Don't mock database
   - Clean database before each test

3. **Keep Tests Fast**
   - Unit tests: < 1ms
   - Integration tests: < 100ms

4. **Follow AAA Pattern**
   - Arrange: Setup test data
   - Act: Execute operation
   - Assert: Verify result

### Pull Request Checklist

Before submitting a PR:

- [ ] Helper class created with all methods
- [ ] Standalone functions created
- [ ] Types added to `types.ts`
- [ ] Exports added to `index.ts`
- [ ] Unit tests added and passing
- [ ] JSDoc comments added
- [ ] README updated with new helper
- [ ] Examples added (if applicable)
- [ ] No linting errors
- [ ] No type errors
- [ ] All tests passing

### Review Process

1. **Self-Review**
   - Check code style
   - Verify tests pass
   - Review documentation

2. **Peer Review**
   - Request review from team member
   - Address feedback
   - Update PR

3. **Merge**
   - Squash commits
   - Update changelog
   - Notify team

## License

This project is licensed under the MIT License.

## Changelog

### Version 2.0.0 (Current)

- Reorganized helpers by Bounded Context
- Added helper classes for all BCs
- Added standalone functions
- Added comprehensive examples
- Added backward compatibility layer
- Improved documentation

### Version 1.0.0 (Deprecated)

- Initial test utilities
- E2E helpers
- Integration test helper
- Basic database utilities

---

**Last Updated:** December 26, 2025  
**Version:** 2.0.0  
**Maintainers:** Backend Team

For questions or issues, please contact the backend team or create a GitHub issue.
