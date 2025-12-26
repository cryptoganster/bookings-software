# Migration Guide - Frontend Enhancements

**Date:** December 24, 2024  
**Version:** 1.0  
**From:** WebSocket-based real-time updates  
**To:** REST API with TanStack Query

---

## Overview

This guide helps developers migrate from the old WebSocket-based implementation to the new REST API with TanStack Query for state management.

---

## Breaking Changes

### 1. WebSocket Removed ❌

**Old Implementation:**

```typescript
// ❌ REMOVED
import { connectWebSocket, disconnectWebSocket } from "@shared/api/websocket";
import { useWebSocketEvents } from "@shared/hooks/useWebSocketEvents";

// In App.tsx
useEffect(() => {
  connectWebSocket();
  return () => disconnectWebSocket();
}, []);

// In components
useWebSocketEvents("appointment:created", handleNewAppointment);
```

**New Implementation:**

```typescript
// ✅ USE THIS
import { useAppointments } from "@entities/appointment";

// TanStack Query automatically refetches and updates
const { data: appointments } = useAppointments();
```

**Migration Steps:**

1. Remove all `useWebSocketEvents` hooks
2. Remove `connectWebSocket` / `disconnectWebSocket` calls
3. Replace with appropriate TanStack Query hooks
4. Remove `socket.io-client` dependency: `pnpm remove socket.io-client`

---

### 2. API Services Restructured ✅

**Old Structure:**

```
src/shared/api/
├── client.ts
└── endpoints.ts
```

**New Structure:**

```
src/shared/api/
├── client.ts
├── endpoints.ts
└── services/
    ├── offerings.service.ts
    ├── schedules.service.ts
    ├── blockouts.service.ts
    ├── appointments.service.ts
    ├── account.service.ts
    ├── business.service.ts
    ├── conversations.service.ts
    └── customers.service.ts
```

**Migration Steps:**

1. Import services from `@shared/api/services/*`
2. Use services in TanStack Query hooks (not directly in components)
3. Services are already integrated in entity hooks

---

### 3. State Management Changed ✅

**Old Approach:**

```typescript
// ❌ REMOVED - Manual state management
const [appointments, setAppointments] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch("/api/appointments")
    .then((res) => res.json())
    .then((data) => setAppointments(data))
    .catch((err) => setError(err))
    .finally(() => setLoading(false));
}, []);
```

**New Approach:**

```typescript
// ✅ USE THIS - TanStack Query
import { useAppointments } from "@entities/appointment";

const { data: appointments, isLoading, error } = useAppointments();
```

**Benefits:**

- Automatic caching
- Automatic refetching
- Optimistic updates
- Loading and error states handled
- No manual state management

---

## New Features

### 1. TanStack Query Hooks

All entities now have dedicated hooks:

#### Offerings

```typescript
import {
  useOfferings,
  useActiveOfferings,
  useOffering,
  useCreateOffering,
  useUpdateOffering,
  useDeleteOffering,
  useToggleOfferingActive,
} from "@entities/offering";

// List all offerings
const { data: offerings } = useOfferings();

// Create offering
const createMutation = useCreateOffering();
createMutation.mutate({
  name: "Corte de Pelo",
  duration: 30,
  maxCapacityPerSlot: 2,
});
```

#### Schedules

```typescript
import {
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from "@entities/schedule";

// List schedules
const { data: schedules } = useSchedules();

// Create schedule
const createMutation = useCreateSchedule();
createMutation.mutate({
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "18:00",
});
```

#### Blockouts

```typescript
import {
  useBlockouts,
  useCreateBlockout,
  useDeleteBlockout,
} from "@entities/blockout";

// List blockouts
const { data: blockouts } = useBlockouts();

// Create blockout
const createMutation = useCreateBlockout();
createMutation.mutate({
  startDate: "2024-12-25",
  endDate: "2024-12-26",
  reason: "Christmas Holiday",
});
```

#### Appointments

```typescript
import {
  useAppointments,
  useAppointment,
  useTodayAppointments,
  useUpcomingAppointments,
  useCancelAppointment,
} from "@entities/appointment";

// List appointments
const { data: appointments } = useAppointments();

// Get today's appointments
const { data: todayAppointments } = useTodayAppointments();

// Cancel appointment
const cancelMutation = useCancelAppointment();
cancelMutation.mutate("appointment-id");
```

#### Account

```typescript
import {
  useProfile,
  useSubscription,
  useUpgradeSubscription,
  useCompleteOnboarding,
} from "@entities/account";

// Get profile
const { data: profile } = useProfile();

// Upgrade subscription
const upgradeMutation = useUpgradeSubscription();
upgradeMutation.mutate({ plan: "PRO" });
```

#### Conversations

```typescript
import {
  usePendingQueries,
  useConversation,
  useRespondToQuery,
} from "@entities/conversation";

// Get pending queries
const { data: pendingQueries } = usePendingQueries();

// Get conversation details
const { data: conversation } = useConversation("conversation-id");

// Respond to query
const respondMutation = useRespondToQuery();
respondMutation.mutate({
  conversationId: "conversation-id",
  message: "Hola, ¿en qué puedo ayudarte?",
});
```

---

### 2. New Pages

Four new pages have been added:

#### OfferingsPage

```typescript
import { OfferingsPage } from "@pages/OfferingsPage";

// Route: /offerings
// Features:
// - List all offerings
// - Create new offering
// - Edit offering
// - Delete offering
// - Toggle active status
```

#### SchedulesPage

```typescript
import { SchedulesPage } from "@pages/SchedulesPage";

// Route: /schedules
// Features:
// - List schedules grouped by day
// - Create new schedule
// - Edit schedule
// - Delete schedule
```

#### BlockoutsPage

```typescript
import { BlockoutsPage } from "@pages/BlockoutsPage";

// Route: /blockouts
// Features:
// - List all blockouts
// - Create new blockout
// - Delete blockout
```

#### ConversationsPage

```typescript
import { ConversationsPage } from "@pages/ConversationsPage";

// Route: /conversations
// Features:
// - List pending queries
// - View conversation history
// - Respond to customer queries
```

---

### 3. Optimistic Updates

Mutations now support optimistic updates for better UX:

```typescript
const cancelMutation = useCancelAppointment();

// When you call mutate, the UI updates immediately
cancelMutation.mutate("appointment-id");

// If the API call fails, the UI automatically rolls back
// If it succeeds, the cache is updated with the server response
```

**How it works:**

1. User clicks "Cancel"
2. UI immediately shows appointment as cancelled
3. API call is made in the background
4. If successful: cache is updated with server response
5. If failed: UI rolls back to previous state and shows error

---

## Migration Checklist

### Phase 1: Remove WebSocket

- [ ] Remove `useWebSocketEvents` hooks from all components
- [ ] Remove `connectWebSocket` / `disconnectWebSocket` from App.tsx
- [ ] Remove `socket.io-client` dependency
- [ ] Delete `src/shared/api/websocket.ts`
- [ ] Delete `src/shared/hooks/useWebSocketEvents.tsx`

### Phase 2: Update Components

- [ ] Replace manual state management with TanStack Query hooks
- [ ] Remove `useState`, `useEffect` for data fetching
- [ ] Use entity hooks (`useAppointments`, `useOfferings`, etc.)
- [ ] Update loading states to use `isLoading` from hooks
- [ ] Update error handling to use `error` from hooks

### Phase 3: Test

- [ ] Test all CRUD operations
- [ ] Test optimistic updates
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test cache invalidation

---

## Common Patterns

### Pattern 1: List with Filters

```typescript
// Old
const [appointments, setAppointments] = useState([]);
const [filters, setFilters] = useState({ status: "CONFIRMED" });

useEffect(() => {
  fetch(`/api/appointments?status=${filters.status}`)
    .then((res) => res.json())
    .then((data) => setAppointments(data));
}, [filters]);

// New
const [filters, setFilters] = useState({ status: "CONFIRMED" });
const { data: appointments } = useAppointments(filters);
```

### Pattern 2: Create with Success Notification

```typescript
// Old
const handleCreate = async (data) => {
  try {
    await fetch("/api/offerings", {
      method: "POST",
      body: JSON.stringify(data),
    });
    notifications.show({ message: "Created!" });
    refetch();
  } catch (error) {
    notifications.show({ message: "Error!", color: "red" });
  }
};

// New
const createMutation = useCreateOffering();

const handleCreate = (data) => {
  createMutation.mutate(data, {
    onSuccess: () => {
      notifications.show({ message: "Created!" });
    },
    onError: () => {
      notifications.show({ message: "Error!", color: "red" });
    },
  });
};
```

### Pattern 3: Optimistic Update

```typescript
const cancelMutation = useCancelAppointment();

const handleCancel = (id: string) => {
  cancelMutation.mutate(id);
  // UI updates immediately, no need to wait for API response
};
```

---

## Troubleshooting

### Issue: Data not updating after mutation

**Solution:** Check that query keys are properly invalidated in the mutation:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: offeringKeys.all });
};
```

### Issue: Stale data showing

**Solution:** Adjust `staleTime` in query options:

```typescript
const { data } = useOfferings({
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

### Issue: Too many API calls

**Solution:** Increase `staleTime` or use `refetchOnWindowFocus: false`:

```typescript
const { data } = useOfferings({
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
});
```

---

## Performance Tips

1. **Use query keys hierarchy** for granular invalidation
2. **Enable optimistic updates** for better UX
3. **Adjust staleTime** based on data freshness requirements
4. **Use prefetching** for predictable navigation
5. **Implement pagination** for large lists

---

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [API Documentation](./API_DOCUMENTATION.md)
- [Task Completion Summary](./tasks.md)

---

## Support

For questions or issues:

1. Check this migration guide
2. Review API documentation
3. Check TanStack Query docs
4. Ask in team Slack channel

---

**End of Migration Guide**
