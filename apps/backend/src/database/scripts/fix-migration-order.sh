#!/bin/bash

# Script to fix migration order
# Migrations must be executed in dependency order

cd "$(dirname "$0")/../migrations"

# Rename migrations to correct order
mv 1766334699000-CreateBusinessesTable.ts 1702553500000-CreateBusinessesTable.ts
mv 1766345898000-CreateBusinessOwnersTable.ts 1702553600000-CreateBusinessOwnersTable.ts
mv 1734482000000-CreateCustomersTable.ts 1702554000000-CreateCustomersTable.ts
mv 1702553000000-CreateOfferingsTable.ts 1702555000000-CreateOfferingsTable.ts
mv 1734650000000-CreateSchedulesTable.ts 1702556000000-CreateSchedulesTable.ts
mv 1734650100000-CreateBlockoutsTable.ts 1702556100000-CreateBlockoutsTable.ts
mv 1702551100000-CreateCapacitiesTable.ts 1702557000000-CreateCapacitiesTable.ts
mv 1702551000000-CreateAppointmentsTable.ts 1702558000000-CreateAppointmentsTable.ts
mv 1734999000000-CreateConversationsTable.ts 1702559000000-CreateConversationsTable.ts
mv 1735000000000-CreateMessagesTable.ts 1702560000000-CreateMessagesTable.ts
mv 1766128110000-add-merged-into-to-customers.ts 1702561000000-add-merged-into-to-customers.ts
mv 1766345899000-AddSearchIndexesToCustomers.ts 1702562000000-AddSearchIndexesToCustomers.ts

echo "✅ Migrations renamed to correct order"
