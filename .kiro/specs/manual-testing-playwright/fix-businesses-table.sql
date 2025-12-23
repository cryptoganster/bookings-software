-- Fix for Issue #1: Missing businesses table
-- This script creates the businesses table and seeds test data
-- Run this in the bookings-software database

-- ============================================
-- 1. Create businesses table
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Santo_Domingo',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT businesses_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT businesses_whatsapp_format CHECK (whatsapp_number ~ '^\+[1-9]\d{1,14}$')
);

-- ============================================
-- 2. Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_whatsapp_number ON businesses(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);

-- ============================================
-- 3. Add comments
-- ============================================
COMMENT ON TABLE businesses IS 'Business information for multi-tenant system';
COMMENT ON COLUMN businesses.id IS 'Unique business identifier';
COMMENT ON COLUMN businesses.owner_id IS 'Reference to user who owns this business (BUSINESS_OWNER role)';
COMMENT ON COLUMN businesses.name IS 'Business name (commercial name)';
COMMENT ON COLUMN businesses.whatsapp_number IS 'WhatsApp Business number (E.164 format)';
COMMENT ON COLUMN businesses.address IS 'Business physical address';
COMMENT ON COLUMN businesses.timezone IS 'IANA timezone (e.g., America/Santo_Domingo)';
COMMENT ON COLUMN businesses.is_active IS 'Whether business is active (can receive appointments)';
COMMENT ON COLUMN businesses.version IS 'Optimistic locking version';

-- ============================================
-- 4. Seed test business for test@example.com
-- ============================================
-- This matches the business_id used in the existing appointment
INSERT INTO businesses (
  id,
  owner_id,
  name,
  whatsapp_number,
  address,
  timezone,
  is_active,
  created_at,
  updated_at,
  version
) VALUES (
  '95163c50-2b1f-4760-8a02-278eb531363a', -- Matches appointment.business_id
  '923228f3-34ee-49ca-a211-4a5ee8ce068d', -- test@example.com user_id
  'Test Business',
  '+18095551234',
  'Calle Principal #123, Santo Domingo, República Dominicana',
  'America/Santo_Domingo',
  true,
  NOW(),
  NOW(),
  1
)
ON CONFLICT (id) DO NOTHING; -- Don't fail if already exists

-- ============================================
-- 5. Verify data
-- ============================================
-- Check that business was created
SELECT 
  b.id,
  b.name,
  b.whatsapp_number,
  u.email as owner_email,
  b.is_active,
  b.created_at
FROM businesses b
JOIN users u ON u.id = b.owner_id
WHERE u.email = 'test@example.com';

-- Expected output:
-- id                                   | name          | whatsapp_number | owner_email       | is_active | created_at
-- 95163c50-2b1f-4760-8a02-278eb531363a | Test Business | +18095551234    | test@example.com  | t         | [timestamp]

-- ============================================
-- 6. Verify appointment relationship
-- ============================================
-- Check that existing appointment now has valid business reference
SELECT 
  a.id as appointment_id,
  b.name as business_name,
  c.whatsapp_phone as customer_phone,
  a.date_time,
  a.status
FROM appointments a
JOIN businesses b ON b.id = a.business_id
JOIN customers c ON c.id = a.customer_id
WHERE b.owner_id = '923228f3-34ee-49ca-a211-4a5ee8ce068d';

-- Expected output:
-- appointment_id                       | business_name | customer_phone | date_time           | status
-- 57431fe3-a891-4a7f-ac40-e77295def434 | Test Business | [phone]        | 2025-12-22 05:00:00 | CONFIRMED

-- ============================================
-- DONE!
-- ============================================
-- After running this script:
-- 1. Re-login to get new JWT with businessId
-- 2. Customers page should load (no more 403)
-- 3. Dashboard should show appointment data
-- 4. Appointments page should show the appointment
