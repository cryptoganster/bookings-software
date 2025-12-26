# Business Features

**Bounded Context:** Business  
**Purpose:** Manages business profiles, configuration, and settings for business owners on the platform

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Business Profile Management](#business-profile-management)
   - [WhatsApp Configuration](#whatsapp-configuration)
   - [Multi-Business Management](#multi-business-management)
   - [Business Settings](#business-settings)
3. [Related Features](#related-features)

---

## Overview

The Business Bounded Context manages all information and configuration for businesses using the platform. Each business has its own profile, WhatsApp integration, timezone settings, and operational preferences. Business owners can manage one or multiple businesses depending on their subscription plan.

**What it does:**

- Creates and manages business profiles
- Configures WhatsApp Business API integration
- Manages business information (name, address, contact details)
- Handles timezone and localization settings
- Supports multiple businesses per owner

**Who uses it:**

- Business Owners (create and manage their businesses)
- System Administrators (oversee all businesses)
- Customers (view business information when booking)

---

## Features

### Business Profile Management

**Description:** Business owners can create and manage detailed profiles for their businesses. Each profile includes essential information like business name, address, contact details, and timezone. The profile serves as the foundation for all business operations on the platform and is visible to customers when they book appointments.

**User Benefit:** Provides a professional presence on the platform with complete business information, making it easy for customers to find and contact the business.

**Key Capabilities:**

- Create new business profiles
- Update business name and description
- Set business address and location
- Configure contact information
- Set timezone for appointment scheduling
- Upload business logo and photos
- Activate or deactivate business
- View business creation date and status

**Related API Endpoints:**

- [Create Business](../api/business.md#1-create-business)
- [Get Business](../api/business.md#2-get-business)
- [Update Business](../api/business.md#3-update-business)
- [List Businesses](../api/business.md#4-list-businesses)

**Related Features:**

- [Business Owner Profile Management](./account.md#business-owner-profile-management) - Links to owner account
- [Multi-Business Management](#multi-business-management) - Manage multiple profiles
- [WhatsApp Configuration](#whatsapp-configuration) - Required for operations
- [Service Management](./offering.md#service-management) - Services belong to business

**Example Use Case:**

> Elena opens a new beauty salon called "Bella Salon" in downtown Miami. She creates a business profile with the name, address (123 Ocean Drive, Miami, FL), phone number, and sets the timezone to "America/New_York." She uploads her salon's logo and adds a description: "Premium beauty services in the heart of Miami." Now when customers book appointments, they see her professional business profile with all the details they need.

---

### WhatsApp Configuration

**Description:** Business owners connect their WhatsApp Business account to the platform, enabling customers to book appointments directly through WhatsApp. The configuration includes the business's WhatsApp phone number and API credentials. Once configured, the business can receive booking requests, send confirmations, and communicate with customers via WhatsApp.

**User Benefit:** Enables seamless appointment booking through WhatsApp, the platform customers already use daily, eliminating the need for a separate booking app or website.

**Key Capabilities:**

- Configure WhatsApp Business phone number
- Validate phone number format (E.164)
- Ensure phone number uniqueness across platform
- Set up webhook for receiving messages
- Test WhatsApp connection
- View WhatsApp integration status
- Update WhatsApp configuration
- Disconnect WhatsApp if needed

**Related API Endpoints:**

- [Configure WhatsApp](../api/business.md#5-configure-whatsapp)
- [Test WhatsApp Connection](../api/business.md#6-test-whatsapp-connection)
- [Get WhatsApp Status](../api/business.md#7-get-whatsapp-status)

**Related Features:**

- [Business Profile Management](#business-profile-management) - WhatsApp linked to business
- [WhatsApp Integration](./conversation.md#whatsapp-integration) - Handles messages
- [Appointment Creation](./booking.md#appointment-creation) - Bookings via WhatsApp
- [Automated Responses](./conversation.md#automated-responses) - WhatsApp bot interactions

**Example Use Case:**

> Marco has created his barbershop profile and now wants to enable WhatsApp bookings. He goes to WhatsApp Configuration and enters his business WhatsApp number: +1-305-555-0123. The system validates the number format, checks that no other business is using it, and sets up the webhook. Marco sends a test message to verify the connection works. Within seconds, he receives an automated response confirming the integration is active. Now his customers can book haircuts by simply sending a WhatsApp message.

---

### Multi-Business Management

**Description:** Business owners with appropriate subscription plans can create and manage multiple businesses from a single account. Each business operates independently with its own services, schedules, and appointments, but all are managed from one dashboard. The number of businesses allowed depends on the owner's subscription plan (FREE: 1, BASIC: 1, PRO: 3, ENTERPRISE: 10).

**User Benefit:** Enables entrepreneurs to manage multiple locations or different business types from one account, simplifying operations and reducing administrative overhead.

**Key Capabilities:**

- Create multiple businesses (based on subscription plan)
- Switch between businesses in dashboard
- View all businesses in one list
- Manage each business independently
- Share owner account across businesses
- Track performance across all businesses
- Enforce subscription limits on business count
- Upgrade plan to add more businesses

**Related API Endpoints:**

- [List Businesses](../api/business.md#4-list-businesses)
- [Create Business](../api/business.md#1-create-business)
- [Switch Active Business](../api/business.md#8-switch-active-business)

**Related Features:**

- [Business Profile Management](#business-profile-management) - Each business has profile
- [Subscription Management](./account.md#subscription-management) - Limits business count
- [Service Management](./offering.md#service-management) - Services per business
- [Schedule Management](./availability.md#schedule-management) - Schedules per business

**Example Use Case:**

> Ana is a successful entrepreneur with a PRO subscription ($79/month) that allows up to 3 businesses. She manages: (1) "Ana's Yoga Studio" in downtown, (2) "Ana's Pilates Center" in the suburbs, and (3) "Ana's Wellness Spa" at the beach. From her dashboard, she can switch between businesses to view appointments, respond to messages, and manage schedules. Each business has its own WhatsApp number, services, and customer base, but she manages everything from one account.

---

### Business Settings

**Description:** Business owners can configure various operational settings for their business, including timezone, language preferences, notification settings, and booking policies. These settings affect how the business operates and how customers interact with it. Settings can be updated at any time to adapt to changing business needs.

**User Benefit:** Provides flexibility to customize business operations and customer experience according to specific needs and preferences.

**Key Capabilities:**

- Set business timezone for appointment scheduling
- Configure language preferences
- Set notification preferences (email, WhatsApp)
- Define booking policies (cancellation notice, advance booking limit)
- Set business hours display format (12h/24h)
- Configure automatic responses
- Set appointment reminder timing
- Enable or disable specific features

**Related API Endpoints:**

- [Update Business Settings](../api/business.md#9-update-business-settings)
- [Get Business Settings](../api/business.md#10-get-business-settings)

**Related Features:**

- [Business Profile Management](#business-profile-management) - Settings apply to business
- [Schedule Management](./availability.md#schedule-management) - Timezone affects schedules
- [Appointment Creation](./booking.md#appointment-creation) - Policies enforced during booking
- [Automated Responses](./conversation.md#automated-responses) - Uses configured messages

**Example Use Case:**

> Roberto owns a dental clinic in Los Angeles. He configures his business settings: timezone to "America/Los_Angeles" so appointments display in Pacific Time, language to English, and sets a cancellation policy requiring 24 hours notice. He enables email notifications for new appointments and sets appointment reminders to be sent 48 hours in advance instead of the default 24 hours. These settings ensure his business operates according to his preferences and local regulations.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Account BC

**How they work together:**

- [Business Profile Management](#business-profile-management) requires business owner account
- [Multi-Business Management](#multi-business-management) limited by subscription plan
- [Subscription Management](./account.md#subscription-management) determines business limits
- [Onboarding Process](./account.md#onboarding-process) guides first business creation

**Example Flow:**

1. User registers as business owner (Auth BC)
2. System creates business owner profile with FREE plan (Account BC)
3. User completes onboarding (Account BC)
4. User creates first business (Business BC)
5. FREE plan allows only 1 business (Account BC validates)
6. User upgrades to PRO plan (Account BC)
7. User can now create up to 3 businesses (Business BC)

### Integration with Offering BC

**How they work together:**

- [Business Profile Management](#business-profile-management) contains services
- [Service Management](./offering.md#service-management) belongs to specific business
- [Service Catalog](./offering.md#service-catalog) filtered by business
- [Multi-Business Management](#multi-business-management) separates service catalogs

**Example Flow:**

1. Business owner creates "Spa Relaxation" business (Business BC)
2. Owner adds services: "Massage", "Facial", "Manicure" (Offering BC)
3. Each service is linked to "Spa Relaxation" business (Offering BC)
4. Customers booking at "Spa Relaxation" see only those services (Offering BC)
5. Owner's other businesses have different service catalogs (Offering BC)

### Integration with Availability BC

**How they work together:**

- [Business Settings](#business-settings) includes timezone for schedules
- [Schedule Management](./availability.md#schedule-management) specific to each business
- [Blockout Management](./availability.md#blockout-management) applies to business
- [Multi-Business Management](#multi-business-management) separates schedules

**Example Flow:**

1. Business owner sets timezone to "America/Chicago" (Business BC)
2. Owner creates schedule: Monday-Friday 9 AM - 6 PM (Availability BC)
3. System interprets times in Central timezone (Business BC + Availability BC)
4. Customer in New York sees times converted to Eastern timezone (Booking BC)
5. All appointments stored in UTC but displayed in business timezone (Business BC)

### Integration with Conversation BC

**How they work together:**

- [WhatsApp Configuration](#whatsapp-configuration) enables messaging
- [WhatsApp Integration](./conversation.md#whatsapp-integration) uses business number
- [Business Settings](#business-settings) configures automated responses
- [Admin Query Management](./conversation.md#admin-query-management) routes to business owner

**Example Flow:**

1. Business owner configures WhatsApp number +1-555-0123 (Business BC)
2. Customer sends message to +1-555-0123 (Conversation BC)
3. System identifies business by phone number (Business BC)
4. System loads business settings and automated responses (Business BC)
5. Bot responds using configured messages (Conversation BC)
6. If customer asks for admin, query routes to business owner (Conversation BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
