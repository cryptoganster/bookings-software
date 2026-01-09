# Customer Pagination Frontend Fix - Design

## Overview

This document describes the design for fixing the customer pagination bug in the frontend. The fix is simple: remove redundant local state and use the state already managed by `useSearchCustomers` hook.

## Current Architecture (Broken)

```
CustomersPage Component
├── Local State: page (useState)
├── useSearchCustomers({ page, limit }) ← Initial values only
│   └── Internal State: filters.page ← Always 1
└── handlePageChange(newPage)
    └── setPage(newPage) ← Updates local state only
    └── ❌ Doesn't update hook's filters.page
```

**Problem:** Two sources of truth for `page` state, and they get out of sync.

## New Architecture (Fixed)

```
CustomersPage Component
├── ❌ No local page state
├── useSearchCustomers({ page: 1, limit: 12 }) ← Initial values
│   └── Internal State: filters.page ← Single source of truth
│   └── updateFilters({ page }) ← Updates filters.page
└── handlePageChange(newPage)
    └── updateFilters({ page: newPage }) ← Updates hook's state
    └── ✅ Hook re-fetches with new page
```

**Solution:** Single source of truth for `page` state in the hook.

## Component Changes

### Before (Broken)

```tsx
export function CustomersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1); // ❌ Local state
  const limit = 12;

  const { data, isLoading, isError, error, filters, updateFilters } =
    useSearchCustomers({ page, limit }); // ❌ Initial value only

  const handlePageChange = (newPage: number) => {
    setPage(newPage); // ❌ Updates local state only
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    // ...
    <Pagination
      total={data.totalPages}
      value={page} // ❌ Uses local state
      onChange={handlePageChange}
    />
    // ...
    <Text>
      Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, data.total)}
      // ❌ Uses local state
    </Text>
  );
}
```

### After (Fixed)

```tsx
export function CustomersPage() {
  const navigate = useNavigate();
  const limit = 12;

  const { data, isLoading, isError, error, filters, updateFilters } =
    useSearchCustomers({ page: 1, limit }); // ✅ Initial values

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage }); // ✅ Updates hook's state
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    // ...
    <Pagination
      total={data.totalPages}
      value={filters.page} // ✅ Uses hook's state
      onChange={handlePageChange}
    />
    // ...
    <Text>
      Mostrando {(filters.page - 1) * limit + 1} -{" "}
      {Math.min(filters.page * limit, data.total)}
      // ✅ Uses hook's state
    </Text>
  );
}
```

## Data Flow

### Request Flow (After Fix)

```
1. User clicks "Page 2" button
   ↓
2. handlePageChange(2) called
   ↓
3. updateFilters({ page: 2 }) called
   ↓
4. useSearchCustomers updates filters.page to 2
   ↓
5. TanStack Query detects queryKey change
   ↓
6. searchCustomers({ ...filters, page: 2 }) called
   ↓
7. API request: GET /customers/search?page=2&limit=12&...
   ↓
8. Backend returns customers 13-24
   ↓
9. UI updates with new customers
```

### State Management

```
useSearchCustomers Hook
├── filters: CustomerFilters
│   ├── searchText: string
│   ├── type: 'all' | 'anonymous' | 'registered'
│   ├── page: number ← Single source of truth
│   ├── limit: number
│   ├── sortBy: string
│   └── sortOrder: 'asc' | 'desc'
├── updateFilters(newFilters) ← Updates filters state
└── TanStack Query
    ├── queryKey: customerKeys.list(filters) ← Includes page
    └── queryFn: searchCustomers(filters) ← Uses page from filters
```

## Why This Fix Works

1. **Single Source of Truth:** `filters.page` in the hook is the only place where page state is stored
2. **Reactive Updates:** When `updateFilters({ page })` is called, the hook's state updates
3. **Query Invalidation:** TanStack Query detects the queryKey change (includes page) and refetches
4. **Correct API Request:** The API request includes the updated page parameter

## Edge Cases Handled

### Case 1: Search Text Changes

- `updateFilters({ searchText: 'Juan' })` is called
- Hook resets page to 1 automatically (already implemented)
- ✅ Works correctly

### Case 2: Filter Type Changes

- `updateFilters({ type: 'registered' })` is called
- Hook resets page to 1 automatically (already implemented)
- ✅ Works correctly

### Case 3: Direct Page Change

- `updateFilters({ page: 3 })` is called
- Hook updates page to 3 without resetting
- ✅ Works correctly (this is what we're fixing)

## Testing Strategy

### Manual Testing Steps

1. **Test Basic Pagination:**
   - Navigate to /customers
   - Click page 2 → Verify different customers appear
   - Click page 3 → Verify different customers appear
   - Click page 1 → Verify original customers appear

2. **Test Network Requests:**
   - Open DevTools Network tab
   - Click page 2 → Verify request has `page=2`
   - Click page 3 → Verify request has `page=3`
   - Click page 1 → Verify request has `page=1`

3. **Test Search + Pagination:**
   - Type "Juan" in search
   - Verify page resets to 1
   - Click page 2 (if available)
   - Verify different customers appear

4. **Test Filter + Pagination:**
   - Select "Registrados" filter
   - Verify page resets to 1
   - Click page 2 (if available)
   - Verify different customers appear

### Automated Testing (Future)

```typescript
// apps/frontend/src/pages/CustomersPage/__tests__/CustomersPage.pagination.test.tsx

describe('CustomersPage Pagination', () => {
  it('should display different customers on different pages', async () => {
    render(<CustomersPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 1-12 de 25/)).toBeInTheDocument();
    });

    // Get first customer name on page 1
    const firstCustomerPage1 = screen.getAllByRole('heading')[0].textContent;

    // Click page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    // Wait for new data
    await waitFor(() => {
      expect(screen.getByText(/Mostrando 13-24 de 25/)).toBeInTheDocument();
    });

    // Get first customer name on page 2
    const firstCustomerPage2 = screen.getAllByRole('heading')[0].textContent;

    // Verify different customers
    expect(firstCustomerPage1).not.toBe(firstCustomerPage2);
  });

  it('should send correct page parameter in API request', async () => {
    const mockSearchCustomers = jest.fn();

    render(<CustomersPage />);

    // Click page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    // Verify API was called with page=2
    await waitFor(() => {
      expect(mockSearchCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
});
```

## Performance Considerations

### Before Fix

- ❌ Unnecessary re-renders when local state updates
- ❌ Hook doesn't know about page changes
- ❌ API always requests page 1

### After Fix

- ✅ Single state update triggers re-render
- ✅ Hook knows about page changes
- ✅ API requests correct page
- ✅ TanStack Query's `placeholderData` keeps previous data during fetch (smooth UX)

## Migration Path

1. Update `CustomersPage.tsx` (single file change)
2. Test manually in browser
3. Verify network requests
4. Deploy to production
5. Monitor for errors

No database migrations or backend changes needed.

## Rollback Plan

If issues arise:

1. Revert the single file change to `CustomersPage.tsx`
2. Redeploy frontend
3. No data loss or backend impact

## References

- TanStack Query docs: https://tanstack.com/query/latest/docs/react/guides/paginated-queries
- React useState docs: https://react.dev/reference/react/useState
- Mantine Pagination: https://mantine.dev/core/pagination/
