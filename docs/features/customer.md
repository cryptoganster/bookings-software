# Customer Features

**Bounded Context:** Customer  
**Purpose:** Manages customer profiles, data, and relationships with businesses for both anonymous and registered customers

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Customer Profile Management](#customer-profile-management)
   - [Anonymous vs Registered Customers](#anonymous-vs-registered-customers)
   - [Customer Search and Filtering](#customer-search-and-filtering)
   - [Customer Data Export](#customer-data-export)
   - [Duplicate Detection and Merging](#duplicate-detection-and-merging)
3. [Related Features](#related-features)

---

## Overview

The Customer Bounded Context manages all customer information and profiles. It supports both anonymous customers (who book via WhatsApp without registering) and registered customers (who have full platform accounts). Each customer profile is specific to a business, allowing the same person to be a customer at multiple businesses independently.

**What it does:**

- Creates and manages customer profiles
- Identifies customers by WhatsApp phone number
- Links anonymous customers to registered user accounts
- Tracks customer appointment history
- Manages customer data and privacy
- Handles customer search and filtering

**Who uses it:**

- Customers (own their profile data)
- Business Owners (view and manage their customers)
- System (identifies customers for bookings)

---

## Features

### Customer Profile Management

**Description:** Each customer has a profile containing their contact information, preferences, and relationship with the business. Profiles can be created automatically when a customer first books an appointment or manually by business owners. The profile stores the customer's WhatsApp phone number, name, and booking history, providing a complete view of the customer relationship.

**User Benefit:** Enables personalized service by maintaining customer information and history, making repeat bookings faster and allowing businesses to recognize and serve their customers better.

**Key Capabilities:**

- Create customer profiles automatically or manually
- Store WhatsApp phone number (required)
- Store customer name (optional, can be collected over time)
- Link to user account (optional, for registered customers)
- Track customer creation date
- View customer appointment history
- Update customer information
- Mark customers as inactive
- Export customer data (GDPR compliance)

**Related API Endpoints:**

- Currently managed through internal system processes
- Customer creation triggered by first appointment

**Related Features:**

- [Anonymous vs Registered Customers](#anonymous-vs-registered-customers) - Two customer types
- [Appointment Creation](./booking.md#appointment-creation) - Creates customer if needed
- [WhatsApp Integration](./conversation.md#whatsapp-integration) - Identifies by phone
- [User Registration](./auth.md#user-registration) - Links to user account

**Example Use Case:**

> Maria sends a WhatsApp message to book a haircut at "Bella Salon." Since it's her first time, the system automatically creates a customer profile with her phone number (+1-555-0123). During the conversation, the bot asks "What's your name?" and she responds "Maria." The system updates her profile with her name. Now when she books again, the system recognizes her immediately: "Welcome back, Maria! Would you like to book another appointment?"

---

### Anonymous vs Registered Customers

**Description:** The platform supports two types of customers: anonymous (WhatsApp-only) and registered (full platform access). Anonymous customers can book appointments via WhatsApp without creating an account, while registered customers have a user account that gives them access to the web portal, email notifications, and appointment history. Anonymous customers can upgrade to registered status at any time, preserving their booking history.

**User Benefit:** Provides flexibility for customers to start using the service immediately without registration, while offering the option to upgrade for enhanced features when they're ready.

**Key Capabilities:**

- Create anonymous customers (userId = null)
- Book appointments without registration
- Identify anonymous customers by phone number
- Upgrade anonymous to registered customers
- Link existing bookings to new user account
- Preserve appointment history during upgrade
- Access web portal (registered customers only)
- Receive email notifications (registered customers only)
- View full appointment history (registered customers only)

**Related API Endpoints:**

- Currently managed through internal system processes
- Customer linking triggered by user registration

**Related Features:**

- [Customer Profile Management](#customer-profile-management) - Manages both types
- [User Registration](./auth.md#user-registration) - Creates registered customers
- [WhatsApp Integration](./conversation.md#whatsapp-integration) - Serves anonymous customers
- [Appointment History](./booking.md#appointment-history) - Available to both types

**Example Use Case:**

> **Anonymous Customer:** Carlos books a massage via WhatsApp. He provides his phone number but doesn't create an account. He can book appointments, receive confirmations, and get reminders—all via WhatsApp. He cannot access the web portal or see his appointment history online.
>
> **Upgrade to Registered:** After three visits, Carlos decides he wants to see his appointment history online. He registers on the web portal with his email and the same phone number. The system links his existing customer profile (with all 3 past appointments) to his new user account. Now he can log in to the web portal, see his complete history, and receive email notifications in addition to WhatsApp messages.

---

### Customer Search and Filtering

**Description:** Business owners can search and filter their customer list to find specific customers or analyze customer segments. Search works by name, phone number, or appointment history. Filters allow viewing customers by activity status, registration status, or booking frequency. This helps business owners understand their customer base and provide better service.

**User Benefit:** Makes it easy to find specific customers quickly and understand customer patterns, enabling better customer service and targeted marketing.

**Key Capabilities:**

- Search customers by name
- Search customers by phone number
- Filter by registration status (anonymous vs registered)
- Filter by activity status (active vs inactive)
- Filter by booking frequency (new, regular, VIP)
- Sort by last appointment date
- Sort by total appointments
- View customer statistics
- Export filtered customer lists

**Related API Endpoints:**

- Currently managed through internal system processes
- Search and filter available in business dashboard

**Related Features:**

- [Customer Profile Management](#customer-profile-management) - Provides searchable data
- [Appointment History](./booking.md#appointment-history) - Used for filtering
- [Customer Data Export](#customer-data-export) - Exports search results
- [Duplicate Detection and Merging](#duplicate-detection-and-merging) - Cleans search results

**Example Use Case:**

> Sofia, a salon owner, wants to send a special promotion to her most loyal customers. She opens the customer list and filters for "customers with 5+ appointments in the last 6 months." The system shows 23 customers who meet this criteria. She can see each customer's name, phone number, total appointments, and last visit date. She exports this list and sends them a personalized WhatsApp message offering 20% off their next visit.

---

### Customer Data Export

**Description:** Business owners can export customer data in standard formats (CSV, Excel) for backup, analysis, or compliance purposes. The export includes customer contact information, appointment history, and relevant metadata. This feature supports GDPR compliance by allowing customers to request their data, and helps business owners maintain records outside the platform.

**User Benefit:** Provides data portability and backup, ensures compliance with privacy regulations, and enables external analysis of customer data.

**Key Capabilities:**

- Export all customers or filtered subset
- Export in CSV or Excel format
- Include appointment history in export
- Include customer metadata (creation date, status)
- Schedule automatic exports
- Export specific customer data (GDPR requests)
- Anonymize data for analysis
- Secure export with encryption

**Related API Endpoints:**

- Currently managed through internal system processes
- Export available in business dashboard

**Related Features:**

- [Customer Profile Management](#customer-profile-management) - Source of export data
- [Customer Search and Filtering](#customer-search-and-filtering) - Filters export data
- [Appointment History](./booking.md#appointment-history) - Included in export
- [Business Settings](./business.md#business-settings) - Configures export preferences

**Example Use Case:**

> A customer named Laura requests a copy of all her data under GDPR regulations. The business owner, Marco, goes to Laura's customer profile and clicks "Export Customer Data." The system generates a CSV file containing Laura's contact information, all her appointments (dates, services, statuses), and conversation history. Marco sends this file to Laura via email, fulfilling the GDPR request within 24 hours.

---

### Duplicate Detection and Merging

**Description:** The system can detect potential duplicate customer profiles (same person with multiple profiles) and help business owners merge them. Duplicates might occur if a customer uses different phone numbers or if data is imported from external systems. The merge process combines appointment history and preserves all data while eliminating the duplicate profile.

**User Benefit:** Maintains clean, accurate customer data by eliminating duplicates, ensuring each customer has a single complete profile with their full history.

**Key Capabilities:**

- Detect potential duplicates by name similarity
- Detect duplicates by phone number variations
- Flag suspicious duplicate profiles
- Preview merge before executing
- Merge appointment histories
- Preserve all conversation history
- Choose primary profile during merge
- Undo merge if needed
- Track merge history for audit

**Related API Endpoints:**

- Currently managed through internal system processes
- Duplicate detection available in business dashboard

**Related Features:**

- [Customer Profile Management](#customer-profile-management) - Manages merged profiles
- [Customer Search and Filtering](#customer-search-and-filtering) - Finds duplicates
- [Appointment History](./booking.md#appointment-history) - Merged during process
- [Conversation History](./conversation.md#conversation-history) - Merged during process

**Example Use Case:**

> The system detects two customer profiles that might be the same person: "John Smith" (+1-555-0123) with 3 appointments, and "J. Smith" (+1-555-0124) with 2 appointments. The business owner reviews both profiles and confirms they're the same person (John got a new phone number). She merges them, choosing the first profile as primary. The system combines all 5 appointments into one profile, updates the phone number to the current one, and marks the duplicate as merged. Now John has a single profile with his complete history.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Auth BC

**How they work together:**

- [Anonymous vs Registered Customers](#anonymous-vs-registered-customers) links to user accounts
- [User Registration](./auth.md#user-registration) creates registered customers
- [Multi-Role Management](./auth.md#multi-role-management) adds CUSTOMER role
- [Customer Profile Management](#customer-profile-management) requires user account for registration

**Example Flow:**

1. Anonymous customer books appointments via WhatsApp (Customer BC)
2. Customer decides to register for web access (Auth BC)
3. System creates user account with CUSTOMER role (Auth BC)
4. System links existing customer profile to user account (Customer BC)
5. Customer can now log in to web portal (Auth BC)
6. Customer sees full appointment history (Customer BC + Booking BC)

### Integration with Booking BC

**How they work together:**

- [Customer Profile Management](#customer-profile-management) required for appointments
- [Appointment Creation](./booking.md#appointment-creation) creates customer if needed
- [Appointment History](./booking.md#appointment-history) linked to customer
- [Customer Search and Filtering](#customer-search-and-filtering) uses booking data

**Example Flow:**

1. Customer sends WhatsApp message to book (Conversation BC)
2. System identifies customer by phone number (Customer BC)
3. If new customer, creates profile automatically (Customer BC)
4. System creates appointment linked to customer (Booking BC)
5. Customer's appointment history updates (Customer BC + Booking BC)
6. Business owner can view customer's past appointments (Customer BC)

### Integration with Conversation BC

**How they work together:**

- [Customer Profile Management](#customer-profile-management) identified by phone
- [WhatsApp Integration](./conversation.md#whatsapp-integration) uses phone number
- [Conversation History](./conversation.md#conversation-history) linked to customer
- [Anonymous vs Registered Customers](#anonymous-vs-registered-customers) determines communication channels

**Example Flow:**

1. Customer sends WhatsApp message from +1-555-0123 (Conversation BC)
2. System looks up customer by phone number (Customer BC)
3. If found, loads customer profile and history (Customer BC)
4. Bot personalizes greeting: "Welcome back, Maria!" (Conversation BC)
5. All messages link to customer profile (Conversation BC + Customer BC)
6. Business owner can view customer's conversation history (Customer BC)

### Integration with Business BC

**How they work together:**

- [Customer Profile Management](#customer-profile-management) specific to each business
- [Multi-Business Management](./business.md#multi-business-management) separates customer lists
- [Customer Search and Filtering](#customer-search-and-filtering) filtered by business
- [Customer Data Export](#customer-data-export) exports per business

**Example Flow:**

1. Customer books at "Salon A" (Booking BC)
2. System creates customer profile for "Salon A" (Customer BC)
3. Same customer books at "Salon B" (Booking BC)
4. System creates separate customer profile for "Salon B" (Customer BC)
5. Each business sees only their own customer list (Business BC + Customer BC)
6. Customer has independent profiles at each business (Customer BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
