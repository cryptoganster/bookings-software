# Frontend Enhancements - Design

**Date:** December 22, 2024  
**Status:** Planning  
**Priority:** HIGH

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Pages    │  │  Widgets   │  │  Features  │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                   │
│        └────────────────┴────────────────┘                   │
│                         │                                    │
│                  ┌──────▼──────┐                             │
│                  │   Entities  │                             │
│                  │   (Hooks)   │                             │
│                  └──────┬──────┘                             │
│                         │                                    │
│                  ┌──────▼──────┐                             │
│                  │ API Services│                             │
│                  └──────┬──────┘                             │
│                         │                                    │
│                  ┌──────▼──────┐                             │
│                  │ API Client  │                             │
│                  │  (Axios)    │                             │
│                  └──────┬──────┘                             │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼────────────────────────────────────┐
│                    Backend (NestJS)                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth BC  │  │Account BC│  │Business BC│  │Booking BC│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Customer  │  │Offering  │  │Availab.  │  │Convers.  │   │
│  │    BC    │  │    BC    │  │    BC    │  │    BC    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Backend API Design

### 1. Offering BC Controllers

#### OfferingCrudController

```typescript
// apps/backend/src/offering/presentation/controllers/offering-crud.controller.ts

@Controller("offerings")
@UseGuards(JwtAuthGuard)
export class OfferingCrudController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
  ): Promise<OfferingReadModel[]> {
    return this.queryBus.execute(
      new GetOfferingsByBusinessQuery(user.businessId),
    );
  }

  @Get("active")
  async findActive(
    @CurrentUser() user: UserPayload,
  ): Promise<OfferingReadModel[]> {
    return this.queryBus.execute(new GetActiveOfferingsQuery(user.businessId));
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<OfferingReadModel> {
    return this.queryBus.execute(new GetOfferingQuery(id, user.businessId));
  }

  @Post()
  async create(
    @Body() dto: CreateOfferingDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ offeringId: string }> {
    return this.commandBus.execute(
      new CreateOfferingCommand(
        user.businessId,
        dto.name,
        dto.duration,
        dto.maxCapacityPerSlot,
        dto.maxDailyCapacity,
      ),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateOfferingDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateOfferingCommand(id, user.businessId, dto),
    );
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeactivateOfferingCommand(id, user.businessId),
    );
  }

  @Patch(":id/active")
  async toggleActive(
    @Param("id") id: string,
    @Body() dto: ToggleActiveDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    if (dto.isActive) {
      await this.commandBus.execute(
        new ActivateOfferingCommand(id, user.businessId),
      );
    } else {
      await this.commandBus.execute(
        new DeactivateOfferingCommand(id, user.businessId),
      );
    }
  }
}
```

### 2. Availability BC Controllers

#### ScheduleCrudController

```typescript
// apps/backend/src/availability/presentation/controllers/schedule-crud.controller.ts

@Controller("schedules")
@UseGuards(JwtAuthGuard)
export class ScheduleCrudController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
  ): Promise<ScheduleReadModel[]> {
    return this.queryBus.execute(
      new GetSchedulesByBusinessQuery(user.businessId),
    );
  }

  @Post()
  async create(
    @Body() dto: CreateScheduleDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ scheduleId: string }> {
    return this.commandBus.execute(
      new ConfigureScheduleCommand(
        user.businessId,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
      ),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateScheduleCommand(id, user.businessId, dto),
    );
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteScheduleCommand(id, user.businessId),
    );
  }
}
```

#### BlockoutCrudController

```typescript
// apps/backend/src/availability/presentation/controllers/blockout-crud.controller.ts

@Controller("blockouts")
@UseGuards(JwtAuthGuard)
export class BlockoutCrudController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
  ): Promise<BlockoutReadModel[]> {
    return this.queryBus.execute(
      new GetBlockoutsByBusinessQuery(user.businessId),
    );
  }

  @Post()
  async create(
    @Body() dto: CreateBlockoutDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ blockoutId: string }> {
    return this.commandBus.execute(
      new CreateBlockoutCommand(
        user.businessId,
        dto.startDate,
        dto.endDate,
        dto.reason,
      ),
    );
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new RemoveBlockoutCommand(id, user.businessId),
    );
  }
}
```

### 3. Booking BC Controllers (Extend)

#### AppointmentManagementController

```typescript
// apps/backend/src/booking/presentation/controllers/appointment-management.controller.ts

@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentManagementController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
  ): Promise<AppointmentReadModel[]> {
    return this.queryBus.execute(
      new GetBusinessAppointmentsQuery(user.businessId),
    );
  }

  @Get("today")
  async findToday(
    @CurrentUser() user: UserPayload,
  ): Promise<AppointmentReadModel[]> {
    return this.queryBus.execute(
      new GetTodayAppointmentsQuery(user.businessId),
    );
  }

  @Get("upcoming")
  async findUpcoming(
    @CurrentUser() user: UserPayload,
  ): Promise<AppointmentReadModel[]> {
    return this.queryBus.execute(
      new GetUpcomingAppointmentsQuery(user.businessId),
    );
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<AppointmentReadModel> {
    return this.queryBus.execute(new GetAppointmentQuery(id, user.businessId));
  }

  @Put(":id/cancel")
  async cancel(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new CancelAppointmentCommand(id, user.userId),
    );
  }
}
```

### 4. Account BC Controllers

#### BusinessOwnerProfileController

```typescript
// apps/backend/src/account/presentation/controllers/business-owner-profile.controller.ts

@Controller("account")
@UseGuards(JwtAuthGuard)
export class BusinessOwnerProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("profile")
  async getProfile(
    @CurrentUser() user: UserPayload,
  ): Promise<BusinessOwnerReadModel> {
    return this.queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(user.userId),
    );
  }

  @Get("subscription")
  async getSubscription(
    @CurrentUser() user: UserPayload,
  ): Promise<SubscriptionReadModel> {
    const owner = await this.queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(user.userId),
    );
    return {
      plan: owner.subscriptionPlan,
      status: owner.subscriptionStatus,
      maxBusinesses: owner.maxBusinesses,
      currentBusinessCount: owner.currentBusinessCount,
    };
  }

  @Put("subscription/upgrade")
  async upgradeSubscription(
    @Body() dto: UpgradeSubscriptionDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    const owner = await this.queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(user.userId),
    );
    await this.commandBus.execute(
      new UpgradeSubscriptionCommand(owner.id, dto.newPlan),
    );
  }

  @Post("onboarding/complete")
  async completeOnboarding(@CurrentUser() user: UserPayload): Promise<void> {
    const owner = await this.queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(user.userId),
    );
    await this.commandBus.execute(new CompleteOnboardingCommand(owner.id));
  }
}
```

### 5. Conversation BC Controllers

#### AdminQueryController

```typescript
// apps/backend/src/conversation/presentation/controllers/admin-query.controller.ts

@Controller("admin-queries")
@UseGuards(JwtAuthGuard)
export class AdminQueryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get("pending")
  async findPending(
    @CurrentUser() user: UserPayload,
  ): Promise<ConversationReadModel[]> {
    return this.queryBus.execute(
      new GetPendingAdminQueriesQuery(user.businessId),
    );
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<ConversationReadModel> {
    return this.queryBus.execute(new GetConversationQuery(id, user.businessId));
  }

  @Post(":id/respond")
  async respond(
    @Param("id") id: string,
    @Body() dto: RespondToQueryDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new SendAdminResponseCommand(id, user.userId, dto.message),
    );
  }
}
```

---

## Frontend API Design

### 1. API Services Structure

```
apps/frontend/src/shared/api/services/
├── auth.service.ts          ✅ (exists)
├── appointments.service.ts  ⚠️ (extend)
├── offerings.service.ts     ❌ (create)
├── schedules.service.ts     ❌ (create)
├── blockouts.service.ts     ❌ (create)
├── account.service.ts       ❌ (create)
├── business.service.ts      ⚠️ (extend)
├── customers.service.ts     ✅ (exists)
└── conversations.service.ts ❌ (create)
```

### 2. Offerings Service

```typescript
// apps/frontend/src/shared/api/services/offerings.service.ts

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  OfferingDto,
  CreateOfferingDto,
  UpdateOfferingDto,
} from "@packages/shared-types";

export const offeringsService = {
  /**
   * Get all offerings for current business
   */
  async getAll(): Promise<OfferingDto[]> {
    const { data } = await apiClient.get(ENDPOINTS.OFFERINGS.LIST);
    return data;
  },

  /**
   * Get active offerings only
   */
  async getActive(): Promise<OfferingDto[]> {
    const { data } = await apiClient.get(`${ENDPOINTS.OFFERINGS.LIST}/active`);
    return data;
  },

  /**
   * Get offering by ID
   */
  async getById(id: string): Promise<OfferingDto> {
    const { data } = await apiClient.get(ENDPOINTS.OFFERINGS.DETAIL(id));
    return data;
  },

  /**
   * Create new offering
   */
  async create(dto: CreateOfferingDto): Promise<{ offeringId: string }> {
    const { data } = await apiClient.post(ENDPOINTS.OFFERINGS.CREATE, dto);
    return data;
  },

  /**
   * Update offering
   */
  async update(id: string, dto: UpdateOfferingDto): Promise<void> {
    await apiClient.put(ENDPOINTS.OFFERINGS.UPDATE(id), dto);
  },

  /**
   * Delete offering (soft delete - deactivate)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.OFFERINGS.DELETE(id));
  },

  /**
   * Toggle offering active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await apiClient.patch(ENDPOINTS.OFFERINGS.TOGGLE_ACTIVE(id), { isActive });
  },
};
```

### 3. React Query Hooks

```typescript
// apps/frontend/src/entities/offering/model/useOfferings.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offeringsService } from "@shared/api/services/offerings.service";
import type {
  CreateOfferingDto,
  UpdateOfferingDto,
} from "@packages/shared-types";

// Query keys
export const offeringKeys = {
  all: ["offerings"] as const,
  lists: () => [...offeringKeys.all, "list"] as const,
  list: (filters?: unknown) => [...offeringKeys.lists(), filters] as const,
  active: () => [...offeringKeys.all, "active"] as const,
  detail: (id: string) => [...offeringKeys.all, "detail", id] as const,
};

/**
 * Get all offerings
 */
export function useOfferings() {
  return useQuery({
    queryKey: offeringKeys.list(),
    queryFn: () => offeringsService.getAll(),
  });
}

/**
 * Get active offerings only
 */
export function useActiveOfferings() {
  return useQuery({
    queryKey: offeringKeys.active(),
    queryFn: () => offeringsService.getActive(),
  });
}

/**
 * Get offering by ID
 */
export function useOffering(id: string) {
  return useQuery({
    queryKey: offeringKeys.detail(id),
    queryFn: () => offeringsService.getById(id),
    enabled: !!id,
  });
}

/**
 * Create offering mutation
 */
export function useCreateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOfferingDto) => offeringsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
}

/**
 * Update offering mutation
 */
export function useUpdateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOfferingDto }) =>
      offeringsService.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
}

/**
 * Delete offering mutation
 */
export function useDeleteOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offeringsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
}

/**
 * Toggle offering active status
 */
export function useToggleOfferingActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      offeringsService.toggleActive(id, isActive),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
}
```

---

## WebSocket Removal Plan

### Files to Delete

```
apps/frontend/src/shared/api/websocket.ts
apps/frontend/src/shared/hooks/useWebSocketEvents.tsx
apps/frontend/src/shared/hooks/__tests__/useWebSocketEvents.test.tsx
```

### Files to Modify

#### 1. Remove from App.tsx

```typescript
// apps/frontend/src/App.tsx

// ❌ Remove these imports
import { connectWebSocket, disconnectWebSocket } from "@shared/api/websocket";

// ❌ Remove this useEffect
useEffect(() => {
  const socket = connectWebSocket();
  return () => {
    disconnectWebSocket();
  };
}, []);
```

#### 2. Remove from package.json

```json
// apps/frontend/package.json

// ❌ Remove this dependency
"socket.io-client": "^4.x.x"
```

#### 3. Update imports in other files

```bash
# Search for any remaining WebSocket imports
grep -r "websocket" apps/frontend/src/
grep -r "socket.io" apps/frontend/src/
grep -r "useWebSocketEvents" apps/frontend/src/
```

---

## Test Data Seed Script

### Create Appointments for Current Week

```sql
-- apps/backend/src/database/seeds/002-appointments-current-week.sql

-- Delete future appointments (2025)
DELETE FROM appointments WHERE date_time > '2025-01-01';

-- Create appointments for next 7 days
DO $$
DECLARE
  business_id UUID := '95163c50-2b1f-4760-8a02-278eb531363a';
  customer_id UUID := 'd0db0d5d-3121-401a-bbdf-a2bcc2f83820';
  offering_id UUID := '026d1b90-3996-4865-91d1-2a4fcd278e7d';
BEGIN
  -- Today + 2 hours
  INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
  VALUES (gen_random_uuid(), business_id, customer_id, offering_id, NOW() + INTERVAL '2 hours', 'CONFIRMED', 1, NOW(), NOW());

  -- Tomorrow + 10 AM
  INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
  VALUES (gen_random_uuid(), business_id, customer_id, offering_id, (NOW() + INTERVAL '1 day')::date + TIME '10:00:00', 'CONFIRMED', 1, NOW(), NOW());

  -- Day after tomorrow + 2 PM
  INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
  VALUES (gen_random_uuid(), business_id, customer_id, offering_id, (NOW() + INTERVAL '2 days')::date + TIME '14:00:00', 'CONFIRMED', 1, NOW(), NOW());

  -- 3 days from now + 9 AM
  INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
  VALUES (gen_random_uuid(), business_id, customer_id, offering_id, (NOW() + INTERVAL '3 days')::date + TIME '09:00:00', 'CONFIRMED', 1, NOW(), NOW());

  -- 4 days from now + 3 PM
  INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
  VALUES (gen_random_uuid(), business_id, customer_id, offering_id, (NOW() + INTERVAL '4 days')::date + TIME '15:00:00', 'CONFIRMED', 1, NOW(), NOW());

  -- 5 days from now + 11 AM
  INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
  VALUES (gen_random_uuid(), business_id, customer_id, offering_id, (NOW() + INTERVAL '5 days')::date + TIME '11:00:00', 'CONFIRMED', 1, NOW(), NOW());

  -- 6 days from now + 4 PM
  INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
  VALUES (gen_random_uuid(), business_id, customer_id, offering_id, (NOW() + INTERVAL '6 days')::date + TIME '16:00:00', 'CONFIRMED', 1, NOW(), NOW());

  RAISE NOTICE 'Created 7 appointments for the next week';
END $$;

-- Verify
SELECT
  id,
  date_time,
  status,
  DATE_PART('day', date_time - NOW()) as days_from_now
FROM appointments
WHERE business_id = '95163c50-2b1f-4760-8a02-278eb531363a'
ORDER BY date_time;
```

---

## Error Handling Strategy

### Backend

```typescript
// Global exception filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Frontend

```typescript
// API client error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout
      useAuthStore.getState().logout();
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      // Forbidden - show error
      toast.error("No tienes permisos para realizar esta acción");
    } else if (error.response?.status === 404) {
      // Not found
      toast.error("Recurso no encontrado");
    } else if (error.response?.status >= 500) {
      // Server error
      toast.error("Error del servidor. Por favor intenta de nuevo.");
    }
    return Promise.reject(error);
  },
);
```

---

## Testing Strategy

### Backend E2E Tests

```typescript
// apps/backend/src/offering/app/__tests__/offering-crud.e2e.spec.ts

describe("Offering CRUD E2E", () => {
  it("should create offering", async () => {
    const response = await request(app.getHttpServer())
      .post("/offerings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Offering",
        duration: 60,
        maxCapacityPerSlot: 5,
      })
      .expect(201);

    expect(response.body.offeringId).toBeDefined();
  });

  it("should list offerings", async () => {
    const response = await request(app.getHttpServer())
      .get("/offerings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### Frontend Unit Tests

```typescript
// apps/frontend/src/shared/api/services/__tests__/offerings.service.test.ts

describe("offeringsService", () => {
  it("should fetch all offerings", async () => {
    const offerings = await offeringsService.getAll();
    expect(Array.isArray(offerings)).toBe(true);
  });

  it("should create offering", async () => {
    const result = await offeringsService.create({
      name: "Test",
      duration: 60,
      maxCapacityPerSlot: 5,
    });
    expect(result.offeringId).toBeDefined();
  });
});
```

---

## Migration Plan

### Phase 1: Backend (Days 1-3)

1. Create all missing controllers
2. Implement missing commands/queries
3. Add E2E tests
4. Test with Postman/Insomnia

### Phase 2: Frontend (Days 4-5)

1. Remove WebSocket code
2. Create API services
3. Update React Query hooks
4. Connect pages to real APIs

### Phase 3: Testing & Polish (Days 6-7)

1. Run seed script for test data
2. Manual testing with Playwright
3. Fix any issues
4. Update documentation

---

**End of Design Document**
