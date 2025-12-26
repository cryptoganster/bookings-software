# Account Features

**Bounded Context:** Account  
**Purpose:** Manages business owner profiles, subscription plans, and onboarding processes

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Business Owner Profile Management](#business-owner-profile-management)
   - [Subscription Management](#subscription-management)
   - [Onboarding Process](#onboarding-process)
3. [Related Features](#related-features)

---

## Overview

The Account Bounded Context manages the profiles and subscription plans for business owners who use the platform. It handles everything related to account management, from initial registration to subscription upgrades and profile updates.

**What it does:**

- Creates and manages business owner profiles
- Handles subscription plans and billing
- Guides new users through the onboarding process
- Tracks account status and limits

**Who uses it:**

- Business Owners (manage their own accounts)
- System Administrators (manage all accounts)

---

## Features

### Business Owner Profile Management

**Description:** Business owners can create and manage their profile information on the platform. Each profile is linked to a user account and contains subscription details, onboarding status, and account preferences. The profile determines what features and limits are available to the business owner.

**User Benefit:** Provides a centralized place to manage account information and track subscription status, making it easy to understand what features are available and how to upgrade.

**Key Capabilities:**

- Create business owner profile automatically upon user registration
- View current subscription plan and limits
- Track onboarding completion status
- Monitor account creation date and activity
- Link profile to user authentication account

**Related API Endpoints:**

- Currently managed through internal system processes
- Profile creation triggered by user registration events

**Related Features:**

- [User Registration](./auth.md#user-registration) - Creates the underlying user account
- [Business Profile Management](./business.md#business-profile-management) - Manages individual businesses owned by the account

**Example Use Case:**

> Juan registers as a business owner on the platform. The system automatically creates his business owner profile with a FREE subscription plan. He can see that his account allows him to create 1 business and handle up to 100 appointments per month. As his business grows, he can upgrade to a higher plan directly from his profile.

---

### Subscription Management

**Description:** Business owners can view and manage their subscription plans, which determine the features and limits available to them. Plans range from FREE (for testing) to ENTERPRISE (for large operations), with each plan offering different limits on number of businesses, appointments per month, and advanced features.

**User Benefit:** Provides flexibility to start small and grow, with clear visibility into current limits and easy upgrade paths as the business expands.

**Key Capabilities:**

- View current subscription plan details (FREE, BASIC, PRO, ENTERPRISE)
- See plan limits (max businesses, max appointments per month, price)
- Upgrade to higher-tier plans
- Track subscription status (ACTIVE, SUSPENDED, CANCELLED)
- Receive notifications when approaching plan limits
- Suspend or cancel subscription when needed

**Related API Endpoints:**

- Currently managed through internal system processes
- Subscription changes trigger business limit validations

**Related Features:**

- [Multi-Business Management](./business.md#multi-business-management) - Limited by subscription plan
- [Business Owner Profile Management](#business-owner-profile-management) - Displays subscription information

**Example Use Case:**

> Maria starts with a FREE plan that allows 1 business and 100 appointments per month. After three months, her salon is fully booked and she's approaching the 100-appointment limit. She upgrades to the BASIC plan ($29/month) which gives her 500 appointments per month. The upgrade is instant, and she can immediately accept more bookings.

---

### Onboarding Process

**Description:** New business owners are guided through a step-by-step onboarding process that helps them set up their first business. The process ensures they complete all necessary configuration steps before they can start accepting appointments, including business information, WhatsApp setup, services, and schedules.

**User Benefit:** Reduces confusion and errors by providing a clear, guided path to get started, ensuring all critical setup steps are completed before going live.

**Key Capabilities:**

- Track onboarding completion status
- Guide users through required setup steps
- Prevent appointment acceptance until onboarding is complete
- Mark onboarding as complete when all steps are done
- Provide clear next steps at each stage

**Related API Endpoints:**

- Currently managed through internal system processes
- Onboarding completion triggers business activation

**Related Features:**

- [Business Profile Management](./business.md#business-profile-management) - First step in onboarding
- [WhatsApp Configuration](./business.md#whatsapp-configuration) - Required onboarding step
- [Service Management](./offering.md#service-management) - Required onboarding step
- [Schedule Management](./availability.md#schedule-management) - Required onboarding step

**Example Use Case:**

> Carlos registers as a business owner and is immediately presented with an onboarding checklist: (1) Create your business profile, (2) Configure WhatsApp, (3) Add your services, (4) Set your schedule. He completes each step, and when finished, the system marks his onboarding as complete and activates his business for customer bookings.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Auth BC

**How they work together:**

- [User Registration](./auth.md#user-registration) creates the base user account
- Account BC automatically creates a business owner profile when a user registers with the BUSINESS_OWNER role
- [Multi-Role Management](./auth.md#multi-role-management) allows users to have both BUSINESS_OWNER and CUSTOMER roles

**Example Flow:**

1. User registers with email and password (Auth BC)
2. System creates user account with BUSINESS_OWNER role (Auth BC)
3. Event handler automatically creates business owner profile with FREE plan (Account BC)
4. User is directed to onboarding process (Account BC)

### Integration with Business BC

**How they work together:**

- [Subscription Management](#subscription-management) determines how many businesses can be created
- [Business Profile Management](./business.md#business-profile-management) is limited by subscription plan
- [Onboarding Process](#onboarding-process) guides creation of first business

**Example Flow:**

1. Business owner completes onboarding (Account BC)
2. System allows creation of first business (Business BC)
3. Subscription plan limits total number of businesses (Account BC validates)
4. Attempting to exceed limit prompts upgrade suggestion (Account BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
