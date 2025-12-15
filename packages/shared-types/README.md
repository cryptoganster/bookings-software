# @bookings/shared-types

Shared TypeScript types between backend and frontend applications.

## Installation

This package is part of the monorepo workspace and is automatically available to other packages.

## Usage

```typescript
import { User, AppointmentReadModel, LoginDto } from '@bookings/shared-types';
```

## Building

```bash
pnpm build
```

## Types Included

- **Authentication**: User, LoginDto, LoginResponse
- **Appointments**: AppointmentReadModel, AppointmentStatus, CreateAppointmentDto, AppointmentFilters
- **Offerings**: OfferingReadModel
- **Customers**: CustomerReadModel
- **Business**: BusinessReadModel
- **API**: ApiError, PaginatedResponse

## Development

After making changes to types, rebuild the package:

```bash
pnpm build
```

The compiled types will be available in the `dist/` directory.
