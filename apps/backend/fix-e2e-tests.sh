#!/bin/bash

# Fix RegisterUserCommand → RegisterCommand in all E2E tests
find src/account/app/__tests__ -name "*.e2e.spec.ts" -type f -exec sed -i '' 's/RegisterUserCommand/RegisterCommand/g' {} \;

# Fix SubscriptionPlan Value Object usage → string
find src/account/app/__tests__ -name "*.e2e.spec.ts" -type f -exec sed -i '' 's/SubscriptionPlan\.free()/'"'"'FREE'"'"'/g' {} \;
find src/account/app/__tests__ -name "*.e2e.spec.ts" -type f -exec sed -i '' 's/SubscriptionPlan\.basic()/'"'"'BASIC'"'"'/g' {} \;
find src/account/app/__tests__ -name "*.e2e.spec.ts" -type f -exec sed -i '' 's/SubscriptionPlan\.pro()/'"'"'PRO'"'"'/g' {} \;
find src/account/app/__tests__ -name "*.e2e.spec.ts" -type f -exec sed -i '' 's/SubscriptionPlan\.enterprise()/'"'"'ENTERPRISE'"'"'/g' {} \;

echo "E2E tests fixed!"
