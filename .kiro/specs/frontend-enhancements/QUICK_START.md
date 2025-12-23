# Frontend Enhancements - Quick Start Guide

**Branch:** `feat/frontend-enhancements`  
**Last Updated:** December 23, 2024

---

## Current Status

✅ **Completed:** Offering BC Controllers (Task 1.1)  
🟡 **Partially Done:** Booking BC Controllers (Task 1.3), Business BC Controllers (Task 1.5)  
⏳ **Next:** Availability BC Controllers (Task 1.2)

---

## Quick Commands

### Setup

```bash
# Switch to branch
git checkout feat/frontend-enhancements

# Install dependencies
pnpm install

# Start backend
pnpm dev:backend

# Start frontend
pnpm dev:frontend
```

### Testing

```bash
# Run all tests
pnpm test

# Run backend tests
pnpm --filter backend test

# Run backend E2E tests
pnpm --filter backend test:e2e

# Run frontend tests
pnpm --filter frontend test

# Run linter
pnpm lint

# Run formatter
pnpm format

# Type check
pnpm typecheck
```

### Git Workflow

```bash
# Create feature branch from current
git checkout -b feat/task-name

# Commit with conventional message
git commit -m "feat: description"

# Push to remote
git push origin feat/task-name

# Create PR to feat/frontend-enhancements
```

---

## Task 1.2: Availability BC Controllers (NEXT)

**Priority:** HIGH  
**Estimated Time:** 6 hours  
**Files to Create:** 8 files

### Step 1: Create DTOs (30 min)

```bash
mkdir -p apps/backend/src/availability/presentation/dtos
```

Create these files:

1. **create-schedule.dto.ts**

   ```typescript
   import { IsInt, IsString, Min, Max } from "class-validator";

   export class CreateScheduleDto {
     @IsInt()
     @Min(0)
     @Max(6)
     dayOfWeek: number; // 0 = Sunday, 6 = Saturday

     @IsString()
     startTime: string; // HH:mm format

     @IsString()
     endTime: string; // HH:mm format
   }
   ```

2. **update-schedule.dto.ts**

   ```typescript
   import { IsInt, IsString, IsOptional, Min, Max } from "class-validator";

   export class UpdateScheduleDto {
     @IsOptional()
     @IsString()
     startTime?: string;

     @IsOptional()
     @IsString()
     endTime?: string;
   }
   ```

3. **create-blockout.dto.ts**

   ```typescript
   import { IsDate, IsString, Type } from "class-validator";

   export class CreateBlockoutDto {
     @IsDate()
     @Type(() => Date)
     startDate: Date;

     @IsDate()
     @Type(() => Date)
     endDate: Date;

     @IsString()
     reason: string;
   }
   ```

4. **get-available-dates.dto.ts**

   ```typescript
   import { IsUUID, IsDate, Type } from "class-validator";

   export class GetAvailableDatesDto {
     @IsUUID()
     offeringId: string;

     @IsDate()
     @Type(() => Date)
     startDate: Date;

     @IsDate()
     @Type(() => Date)
     endDate: Date;
   }
   ```

5. **get-available-slots.dto.ts**

   ```typescript
   import { IsUUID, IsDate, Type } from "class-validator";

   export class GetAvailableSlotsDto {
     @IsUUID()
     offeringId: string;

     @IsDate()
     @Type(() => Date)
     date: Date;
   }
   ```

### Step 2: Create Controllers (2 hours)

```bash
mkdir -p apps/backend/src/availability/presentation/controllers
```

Create these files:

1. **schedule-crud.controller.ts**

   ```typescript
   import {
     Controller,
     Get,
     Post,
     Put,
     Delete,
     Body,
     Param,
     UseGuards,
   } from "@nestjs/common";
   import { CommandBus, QueryBus } from "@nestjs/cqrs";
   import { JwtAuthGuard } from "@auth/infra/guards/jwt-auth";
   import {
     CurrentUser,
     UserPayload,
   } from "@auth/presentation/decorators/current-user";
   import { CreateScheduleDto } from "../dtos/create-schedule.dto";
   import { UpdateScheduleDto } from "../dtos/update-schedule.dto";

   @Controller("schedules")
   @UseGuards(JwtAuthGuard)
   export class ScheduleCrudController {
     constructor(
       private readonly commandBus: CommandBus,
       private readonly queryBus: QueryBus,
     ) {}

     @Get()
     async findAll(@CurrentUser() user: UserPayload) {
       // TODO: Implement GetSchedulesQuery
       return [];
     }

     @Post()
     async create(
       @Body() dto: CreateScheduleDto,
       @CurrentUser() user: UserPayload,
     ) {
       // TODO: Implement CreateScheduleCommand
       return { id: "uuid" };
     }

     @Put(":id")
     async update(
       @Param("id") id: string,
       @Body() dto: UpdateScheduleDto,
       @CurrentUser() user: UserPayload,
     ) {
       // TODO: Implement UpdateScheduleCommand
       return { id };
     }

     @Delete(":id")
     async delete(@Param("id") id: string, @CurrentUser() user: UserPayload) {
       // TODO: Implement DeleteScheduleCommand
       return { message: "Schedule deleted" };
     }
   }
   ```

2. **blockout-crud.controller.ts**

   ```typescript
   import {
     Controller,
     Get,
     Post,
     Delete,
     Body,
     Param,
     UseGuards,
   } from "@nestjs/common";
   import { CommandBus, QueryBus } from "@nestjs/cqrs";
   import { JwtAuthGuard } from "@auth/infra/guards/jwt-auth";
   import {
     CurrentUser,
     UserPayload,
   } from "@auth/presentation/decorators/current-user";
   import { CreateBlockoutDto } from "../dtos/create-blockout.dto";

   @Controller("blockouts")
   @UseGuards(JwtAuthGuard)
   export class BlockoutCrudController {
     constructor(
       private readonly commandBus: CommandBus,
       private readonly queryBus: QueryBus,
     ) {}

     @Get()
     async findAll(@CurrentUser() user: UserPayload) {
       // TODO: Implement GetBlockoutsQuery
       return [];
     }

     @Post()
     async create(
       @Body() dto: CreateBlockoutDto,
       @CurrentUser() user: UserPayload,
     ) {
       // TODO: Implement CreateBlockoutCommand
       return { id: "uuid" };
     }

     @Delete(":id")
     async delete(@Param("id") id: string, @CurrentUser() user: UserPayload) {
       // TODO: Implement DeleteBlockoutCommand
       return { message: "Blockout deleted" };
     }
   }
   ```

3. **availability-query.controller.ts**

   ```typescript
   import { Controller, Get, Query, UseGuards } from "@nestjs/common";
   import { QueryBus } from "@nestjs/cqrs";
   import { JwtAuthGuard } from "@auth/infra/guards/jwt-auth";
   import {
     CurrentUser,
     UserPayload,
   } from "@auth/presentation/decorators/current-user";
   import { GetAvailableDatesDto } from "../dtos/get-available-dates.dto";
   import { GetAvailableSlotsDto } from "../dtos/get-available-slots.dto";

   @Controller("availability")
   @UseGuards(JwtAuthGuard)
   export class AvailabilityQueryController {
     constructor(private readonly queryBus: QueryBus) {}

     @Get("dates")
     async getAvailableDates(@Query() dto: GetAvailableDatesDto) {
       // TODO: Implement GetAvailableDatesQuery
       return [];
     }

     @Get("slots")
     async getAvailableSlots(@Query() dto: GetAvailableSlotsDto) {
       // TODO: Implement GetAvailableSlotsQuery
       return [];
     }
   }
   ```

### Step 3: Register Controllers in Module (30 min)

Edit `apps/backend/src/availability/availability.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleCrudController } from './presentation/controllers/schedule-crud.controller';
import { BlockoutCrudController } from './presentation/controllers/blockout-crud.controller';
import { AvailabilityQueryController } from './presentation/controllers/availability-query.controller';
// ... other imports

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([...])],
  controllers: [
    ScheduleCrudController,
    BlockoutCrudController,
    AvailabilityQueryController,
  ],
  providers: [
    // ... existing providers
  ],
  exports: [
    // ... existing exports
  ],
})
export class AvailabilityModule {}
```

### Step 4: Create E2E Tests (2 hours)

```bash
mkdir -p apps/backend/src/availability/app/__tests__
```

Create test files:

- `schedule-crud.e2e.spec.ts`
- `blockout-crud.e2e.spec.ts`
- `availability-query.e2e.spec.ts`

Reference: `apps/backend/src/offering/app/__tests__/offering-crud.e2e.spec.ts`

### Step 5: Verify

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm --filter backend test:e2e
```

---

## Task 1.3: Complete Booking Controllers (QUICK)

**Priority:** HIGH  
**Estimated Time:** 30 minutes

### Add GetTodayAppointmentsQuery

1. Create `apps/backend/src/booking/app/queries/get-today-appointments/query.ts`
2. Create `apps/backend/src/booking/app/queries/get-today-appointments/handler.ts`
3. Add endpoint to `appointment.controller.ts`:
   ```typescript
   @Get('today')
   async findToday(@CurrentUser() user: UserPayload) {
     const businessId = user.businessId || '489b4d38-5146-4760-ae5f-d1910c3308bb';
     return this.queryBus.execute(new GetTodayAppointmentsQuery(businessId));
   }
   ```

---

## Common Patterns

### Controller Template

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "@auth/infra/guards/jwt-auth";
import {
  CurrentUser,
  UserPayload,
} from "@auth/presentation/decorators/current-user";

@Controller("resource")
@UseGuards(JwtAuthGuard)
export class ResourceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(new GetResourcesQuery(user.businessId));
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.queryBus.execute(new GetResourceQuery(id));
  }

  @Post()
  async create(
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commandBus.execute(
      new CreateResourceCommand(user.businessId, dto),
    );
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.commandBus.execute(new UpdateResourceCommand(id, dto));
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @CurrentUser() user: UserPayload) {
    return this.commandBus.execute(new DeleteResourceCommand(id));
  }
}
```

### DTO Template

```typescript
import { IsString, IsUUID, IsOptional, IsDate, Type } from "class-validator";

export class CreateResourceDto {
  @IsString()
  name: string;

  @IsUUID()
  businessId: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;
}
```

---

## Useful References

### Architecture

- `.kiro/steering/architecture.md` - System architecture
- `.kiro/steering/nestjs-patterns.md` - NestJS patterns
- `.kiro/steering/ddd-patterns.md` - DDD patterns
- `.kiro/steering/cqrs.md` - CQRS patterns

### Code Examples

- `apps/backend/src/offering/presentation/controllers/offering-crud.controller.ts` - Reference controller
- `apps/backend/src/booking/presentation/controllers/appointment.controller.ts` - Reference controller
- `apps/backend/src/offering/presentation/dtos/` - Reference DTOs

### Testing

- `apps/backend/src/offering/app/__tests__/offering-crud.e2e.spec.ts` - Reference E2E test
- `apps/backend/src/test-utils/` - Test utilities

---

## Troubleshooting

### Import Errors

If you get import errors, check:

1. Path aliases in `tsconfig.json`
2. Module exports in `*.module.ts`
3. Correct use of `@` prefixes

### Type Errors

If you get type errors:

1. Run `pnpm typecheck`
2. Check DTO decorators
3. Verify Query/Command types

### Test Failures

If tests fail:

1. Check database is running
2. Run migrations: `pnpm --filter backend migration:run`
3. Check test setup in `test-utils/`

---

## Next Steps After Task 1.2

1. ✅ Complete Task 1.3 (30 min)
2. ✅ Complete Task 1.4 (4 hours)
3. ✅ Complete Task 1.5 (2 hours)
4. ✅ Complete Task 1.6 (3 hours)
5. 🔄 Start Phase 2: Frontend Integration (16 hours)

**Total Remaining:** ~25 hours (3-4 days)

---

**Happy coding! 🚀**
