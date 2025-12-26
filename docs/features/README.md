# Feature Documentation

Welcome to the feature documentation for the Booking System. This documentation is designed for business stakeholders, product managers, and anyone who wants to understand what the system can do without diving into technical details.

---

## Table of Contents

1. [What is Feature Documentation?](#what-is-feature-documentation)
2. [How to Use This Documentation](#how-to-use-this-documentation)
3. [Bounded Contexts](#bounded-contexts)
   - [Account](#account)
   - [Auth](#auth)
   - [Availability](#availability)
   - [Booking](#booking)
   - [Business](#business)
   - [Conversation](#conversation)
   - [Customer](#customer)
   - [Offering](#offering)
4. [Quick Links](#quick-links)

---

## What is Feature Documentation?

Feature documentation explains **what users can do** with the system in clear, non-technical language. Each feature describes:

- **What it does** - The capability in simple terms
- **Why it matters** - The benefit to users
- **How to use it** - Key capabilities and workflows
- **Related features** - How it connects to other parts of the system

**This is NOT technical documentation.** For API details, see [API Documentation](../api/README.md).

---

## How to Use This Documentation

### For Business Stakeholders

- **Understand capabilities** - Learn what the system can do
- **Plan features** - Identify what's available and what's needed
- **Communicate with customers** - Explain features in simple terms

### For Product Managers

- **Feature planning** - Understand existing features before planning new ones
- **User stories** - Use feature descriptions as basis for user stories
- **Cross-BC dependencies** - See how features relate across the system

### For New Team Members

- **System overview** - Quickly understand what the system does
- **Business context** - Learn the business value of each feature
- **Feature relationships** - See how different parts work together

---

## Bounded Contexts

The system is organized into 8 Bounded Contexts, each responsible for a specific area of functionality.

### Account

**Purpose:** Manages business owner profiles and subscription plans

**Features:**

- [Business Owner Profile Management](./account.md#business-owner-profile-management)
- [Subscription Management](./account.md#subscription-management)
- [Onboarding Process](./account.md#onboarding-process)

**Who uses it:** Business Owners

[View Full Documentation →](./account.md)

---

### Auth

**Purpose:** Handles user authentication and authorization

**Features:**

- [User Registration](./auth.md#user-registration)
- [User Authentication](./auth.md#user-authentication)
- [Multi-Role Management](./auth.md#multi-role-management)
- [Email Verification](./auth.md#email-verification)
- [Account Activation/Deactivation](./auth.md#account-activation-deactivation)

**Who uses it:** All Users (Business Owners, Customers, Admins)

[View Full Documentation →](./auth.md)

---

### Availability

**Purpose:** Manages business schedules, blockouts, and capacity

**Features:**

- [Schedule Management](./availability.md#schedule-management)
- [Blockout Management](./availability.md#blockout-management)
- [Availability Checking](./availability.md#availability-checking)
- [Capacity Management](./availability.md#capacity-management)

**Who uses it:** Business Owners (manage), Customers (view)

[View Full Documentation →](./availability.md)

---

### Booking

**Purpose:** Handles appointment creation, management, and tracking

**Features:**

- [Appointment Creation](./booking.md#appointment-creation)
- [Appointment Management](./booking.md#appointment-management)
- [Appointment History](./booking.md#appointment-history)
- [Appointment Statistics](./booking.md#appointment-statistics)

**Who uses it:** Business Owners (manage), Customers (create/cancel)

[View Full Documentation →](./booking.md)

---

### Business

**Purpose:** Manages business profiles and configuration

**Features:**

- [Business Profile Management](./business.md#business-profile-management)
- [WhatsApp Configuration](./business.md#whatsapp-configuration)
- [Multi-Business Management](./business.md#multi-business-management)
- [Business Settings](./business.md#business-settings)

**Who uses it:** Business Owners

[View Full Documentation →](./business.md)

---

### Conversation

**Purpose:** Handles WhatsApp integration and customer communication

**Features:**

- [WhatsApp Integration](./conversation.md#whatsapp-integration)
- [Admin Query Management](./conversation.md#admin-query-management)
- [Conversation History](./conversation.md#conversation-history)
- [Automated Responses](./conversation.md#automated-responses)

**Who uses it:** Business Owners (respond), Customers (send messages)

[View Full Documentation →](./conversation.md)

---

### Customer

**Purpose:** Manages customer profiles and data

**Features:**

- [Customer Profile Management](./customer.md#customer-profile-management)
- [Anonymous vs Registered Customers](./customer.md#anonymous-vs-registered-customers)
- [Customer Search and Filtering](./customer.md#customer-search-and-filtering)
- [Customer Data Export](./customer.md#customer-data-export)
- [Duplicate Detection and Merging](./customer.md#duplicate-detection-and-merging)

**Who uses it:** Business Owners (manage), Customers (own profile)

[View Full Documentation →](./customer.md)

---

### Offering

**Purpose:** Manages services offered by businesses

**Features:**

- [Service Management](./offering.md#service-management)
- [Service Configuration](./offering.md#service-configuration)
- [Service Activation/Deactivation](./offering.md#service-activation-deactivation)
- [Service Catalog](./offering.md#service-catalog)

**Who uses it:** Business Owners (manage), Customers (view/select)

[View Full Documentation →](./offering.md)

---

## Quick Links

### By User Type

**Business Owners:**

- [Create and manage your business](./business.md#business-profile-management)
- [Set up services you offer](./offering.md#service-management)
- [Configure your schedule](./availability.md#schedule-management)
- [View and manage appointments](./booking.md#appointment-management)
- [Respond to customer queries](./conversation.md#admin-query-management)
- [Manage your subscription](./account.md#subscription-management)

**Customers:**

- [Book appointments](./booking.md#appointment-creation)
- [View appointment history](./booking.md#appointment-history)
- [Send messages to businesses](./conversation.md#whatsapp-integration)
- [Manage your profile](./customer.md#customer-profile-management)

**System Administrators:**

- [Manage user accounts](./auth.md#account-activation-deactivation)
- [View system-wide data](./customer.md#customer-search-and-filtering)

### By Workflow

**Setting Up a New Business:**

1. [Register as Business Owner](./auth.md#user-registration)
2. [Complete onboarding](./account.md#onboarding-process)
3. [Create business profile](./business.md#business-profile-management)
4. [Configure WhatsApp](./business.md#whatsapp-configuration)
5. [Add services](./offering.md#service-management)
6. [Set up schedule](./availability.md#schedule-management)

**Booking an Appointment (Customer):**

1. [Send WhatsApp message](./conversation.md#whatsapp-integration)
2. [Select service](./offering.md#service-catalog)
3. [Choose available time](./availability.md#availability-checking)
4. [Confirm appointment](./booking.md#appointment-creation)

**Managing Appointments (Business Owner):**

1. [View today's appointments](./booking.md#appointment-management)
2. [Check upcoming appointments](./booking.md#appointment-management)
3. [View appointment statistics](./booking.md#appointment-statistics)
4. [Respond to customer queries](./conversation.md#admin-query-management)

---

## Navigation Tips

### Finding Features

- **By BC** - Browse features organized by Bounded Context (above)
- **By User Type** - See "Quick Links" section for role-based navigation
- **By Workflow** - Follow common workflows in "Quick Links" section
- **Search** - Use your browser's search (Ctrl+F / Cmd+F)

### Understanding Relationships

Each feature document includes:

- **Related API Endpoints** - Links to technical documentation
- **Related Features** - Links to features in other BCs
- **Example Use Cases** - Real-world scenarios

### Getting More Details

- **Feature Documentation** (this section) - What users can do
- **API Documentation** ([../api/](../api/README.md)) - Technical details for developers
- **PRD** ([../.kiro/steering/PRD.md](../.kiro/steering/PRD.md)) - Product requirements and architecture

---

## Contributing

When adding new features or updating existing ones, please:

1. Update the relevant feature documentation file
2. Add links to new API endpoints
3. Update cross-references to related features
4. Add example use cases
5. Update this README if adding a new BC

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

---

## Support

**Questions about features?**

- Check the feature documentation for the relevant BC
- See [API Documentation](../api/README.md) for technical details
- Contact the development team

**Found an error?**

- Create an issue with the `[docs]` tag
- Submit a pull request with corrections

---

**Last Updated:** December 26, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
