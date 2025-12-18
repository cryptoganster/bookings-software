#!/bin/bash

# Fix useLogin.test.tsx - Replace all occurrences of businessId with proper UserDto
sed -i '' 's/businessId: null,/roles: ["BUSINESS_OWNER"],\
        isActive: true,\
        emailVerified: true,/g' apps/frontend/src/features/auth/login/__tests__/useLogin.test.tsx

# Fix LoginForm.test.tsx
sed -i '' 's/businessId: null,/roles: ["BUSINESS_OWNER"],\
        isActive: true,\
        emailVerified: true,/g' apps/frontend/src/features/auth/login/__tests__/LoginForm.test.tsx

# Fix LogoutButton.test.tsx
sed -i '' 's/businessId: "business-1",/roles: ["BUSINESS_OWNER"],\
        isActive: true,\
        emailVerified: true,/g' apps/frontend/src/features/auth/logout/__tests__/LogoutButton.test.tsx

# Fix websocket.test.ts - Replace all occurrences
sed -i '' 's/businessId: null,/roles: ["BUSINESS_OWNER"],\
          isActive: true,\
          emailVerified: true,/g' apps/frontend/src/shared/api/__tests__/websocket.test.ts

sed -i '' 's/businessId: "business-123",/roles: ["BUSINESS_OWNER"],\
          isActive: true,\
          emailVerified: true,/g' apps/frontend/src/shared/api/__tests__/websocket.test.ts

echo "✅ Frontend tests fixed"
