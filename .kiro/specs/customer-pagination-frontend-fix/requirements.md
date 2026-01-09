# Customer Pagination Frontend Fix - Requirements

## Problem Statement

The customer pagination on the frontend is broken. When clicking through pages (1, 2, 3), the same customers are displayed on all pages. The pagination text updates correctly ("Mostrando 1-12 de 25", "Mostrando 13-24 de 25"), but the actual customer data does not change.

### Root Cause

In `apps/frontend/src/pages/CustomersPage/ui/CustomersPage.tsx`:

1. There's a local `page` state that's managed separately from the `filters` state in `useSearchCustomers`
2. The `page` is passed to `useSearchCustomers({ page, limit })` as **initial filters only**
3. When pagination buttons are clicked, `handlePageChange` updates the local `page` state
4. BUT it doesn't call `updateFilters({ page: newPage })` to update the hook's filters
5. So the hook continues using `page: 1` from its internal state
6. The API request always shows `page=1` regardless of which page button is clicked

### Evidence

Network request shows: `GET http://127.0.0.1:3005/api/customers/search?searchText=&page=1&limit=12&sortBy=createdAt&sortOrder=desc`

The `page=1` parameter never changes when clicking pagination buttons.

## User Stories

### US-1: Pagination Should Display Different Customers

**As a** business owner  
**I want** to see different customers when I click through pagination pages  
**So that** I can browse all my customers efficiently

**Acceptance Criteria:**

- ✅ When I click page 2, I see customers 13-24
- ✅ When I click page 3, I see customers 25-25 (last page)
- ✅ When I click page 1, I see customers 1-12
- ✅ The network request shows the correct page parameter (page=1, page=2, page=3)
- ✅ The pagination text matches the displayed customers

## Technical Requirements

### TR-1: Fix CustomersPage Component

**File:** `apps/frontend/src/pages/CustomersPage/ui/CustomersPage.tsx`

**Changes Required:**

1. Remove the local `page` state - it's redundant since `useSearchCustomers` already manages it
2. Use `filters.page` from the hook instead of local state
3. Update `handlePageChange` to call `updateFilters({ page: newPage })`
4. Update the Pagination component to use `filters.page` instead of local `page`
5. Update the results summary to use `filters.page` instead of local `page`

### TR-2: Verify useSearchCustomers Hook

**File:** `apps/frontend/src/features/customer/search/model/useSearchCustomers.ts`

**Verification:**

- ✅ The hook already manages `page` in its filters state
- ✅ The hook already passes `page` to the API request
- ✅ The `updateFilters` function already handles page updates correctly
- ✅ No changes needed in this file

### TR-3: Verify API Layer

**Files:**

- `apps/frontend/src/shared/api/customers.ts`
- `apps/backend/src/customer/infra/persistence/repositories/customer-read.repository.ts`

**Verification:**

- ✅ Backend pagination is already fixed (29 tests passing)
- ✅ API layer correctly passes `page` parameter
- ✅ No changes needed in these files

## Testing Requirements

### Manual Testing

1. Navigate to http://localhost:5173/customers
2. Verify page 1 shows customers 1-12
3. Click page 2 button
4. Verify page 2 shows customers 13-24 (different customers)
5. Click page 3 button
6. Verify page 3 shows customers 25-25 (last page)
7. Click page 1 button
8. Verify page 1 shows customers 1-12 again
9. Open browser DevTools Network tab
10. Verify the API request shows correct page parameter (page=1, page=2, page=3)

### Automated Testing (Future)

- Add Playwright E2E test for pagination
- Verify different customers appear on different pages
- Verify network requests have correct page parameter

## Success Criteria

- ✅ Clicking pagination buttons displays different customers
- ✅ Network requests show correct page parameter
- ✅ Pagination text matches displayed customers
- ✅ No console errors
- ✅ Smooth scrolling to top on page change (already implemented)

## Out of Scope

- Backend changes (already completed in previous spec)
- Pagination UI design changes
- Performance optimizations
- Additional filtering features

## References

- Previous spec: `.kiro/specs/customer-pagination-fix/` (backend fix)
- Frontend architecture: `.kiro/steering/frontend-PRD.md`
- Testing conventions: `.kiro/steering/frontend-testing-conventions.md`
