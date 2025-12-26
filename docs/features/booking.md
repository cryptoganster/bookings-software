# Booking Features

**Bounded Context:** Booking  
**Purpose:** Manages appointment creation, modification, cancellation, and tracking for customers and businesses

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Appointment Creation](#appointment-creation)
   - [Appointment Management](#appointment-management)
   - [Appointment History](#appointment-history)
   - [Appointment Statistics](#appointment-statistics)
3. [Related Features](#related-features)

---

## Overview

The Booking Bounded Context is the heart of the appointment system. It handles everything related to creating, viewing, modifying, and cancelling appointments. It ensures appointments are valid, tracks their status throughout their lifecycle, and provides visibility to both customers and business owners.

**What it does:**

- Creates new appointments with validation
- Manages appointment status (confirmed, cancelled, completed)
- Tracks appointment history for customers and businesses
- Enforces business rules (cancellation policies, booking limits)
- Provides appointment statistics and insights

**Who uses it:**

- Customers (book, view, modify, and cancel their appointments)
- Business Owners (view, manage, and track all appointments)
- System (enforces rules and sends notifications)

---

## Features

### Appointment Creation

**Description:** Customers can create new appointments by selecting a service, date, and time. The system validates the request against business schedules, blockouts, and capacity limits before confirming the appointment. Each appointment is assigned a unique identifier and starts in CONFIRMED status. Customers receive immediate confirmation via WhatsApp.

**User Benefit:** Provides a simple, reliable way to book appointments with instant confirmation, eliminating phone calls and reducing booking errors.

**Key Capabilities:**

- Select service from available offerings
- Choose date and time from available slots
- Validate against business schedules and blockouts
- Check and reserve capacity automatically
- Enforce booking rules (no past dates, minimum notice period)
- Limit customers to 3 active appointments maximum
- Send instant confirmation via WhatsApp
- Generate unique appointment identifier

**Related API Endpoints:**

- [Create Appointment](../api/booking.md#1-create-appointment)
- [Get Available Slots](../api/availability.md#10-get-available-time-slots)

**Related Features:**

- [Availability Checking](./availability.md#availability-checking) - Validates time slot availability
- [Capacity Management](./availability.md#capacity-management) - Reserves capacity
- [Service Catalog](./offering.md#service-catalog) - Provides service options
- [WhatsApp Integration](./conversation.md#whatsapp-integration) - Sends confirmation

**Example Use Case:**

> Laura wants to book a massage at her local spa. She sends a WhatsApp message to the spa's number and selects "Massage" from the menu. The system shows available dates, and she picks Thursday, December 21. She then sees available times: 10 AM, 2 PM, and 4 PM. She selects 2 PM. The system validates that the spa is open, the time isn't blocked, and capacity is available. It creates the appointment and immediately sends Laura a confirmation: "✅ Appointment confirmed! Thursday, Dec 21 at 2:00 PM for Massage. See you then!"

---

### Appointment Management

**Description:** Both customers and business owners can view and manage appointments. Customers can cancel or modify their appointments (with restrictions), while business owners can view all appointments, mark them as completed, or cancel them if needed. The system enforces cancellation policies and updates capacity automatically when appointments change.

**User Benefit:** Provides flexibility to handle schedule changes while protecting businesses from last-minute cancellations and ensuring capacity is managed correctly.

**Key Capabilities:**

- View appointment details (service, date, time, customer, status)
- Cancel appointments (customers: up to 2 hours before, owners: anytime)
- Modify appointments (change date or time)
- Mark appointments as completed
- View appointment status (CONFIRMED, CANCELLED, COMPLETED)
- Automatically update capacity when appointments change
- Send notifications for all changes
- Track cancellation reasons and timestamps

**Related API Endpoints:**

- [Get Appointment](../api/booking.md#2-get-appointment)
- [Cancel Appointment](../api/booking.md#4-cancel-appointment)
- [Modify Appointment](../api/booking.md#5-modify-appointment)
- [Complete Appointment](../api/booking.md#6-complete-appointment)

**Related Features:**

- [Appointment Creation](#appointment-creation) - Creates appointments to manage
- [Capacity Management](./availability.md#capacity-management) - Updates on changes
- [WhatsApp Integration](./conversation.md#whatsapp-integration) - Sends change notifications
- [Appointment History](#appointment-history) - Records all changes

**Example Use Case:**

> Miguel has a haircut appointment scheduled for Saturday at 11 AM, but something came up. On Thursday evening (more than 2 hours before the appointment), he sends a WhatsApp message and selects "Cancel Appointment." The system confirms the cancellation, frees up the time slot for other customers, and sends him a confirmation: "Your appointment for Saturday, Dec 23 at 11:00 AM has been cancelled. Book again anytime!" The salon owner sees the cancellation in their dashboard and the 11 AM slot becomes available for other customers.

---

### Appointment History

**Description:** Customers and business owners can view past appointments with complete details including service, date, time, and status. The history includes all appointments regardless of status (confirmed, cancelled, or completed), providing a complete record of interactions. This helps track patterns, resolve disputes, and understand customer behavior.

**User Benefit:** Provides transparency and accountability with a complete record of all appointments, making it easy to reference past visits and track service history.

**Key Capabilities:**

- View all past appointments
- Filter by status (confirmed, cancelled, completed)
- Filter by date range
- Filter by service type
- Search by customer name or phone
- View cancellation reasons and timestamps
- Export appointment history
- Track appointment patterns and trends

**Related API Endpoints:**

- [List Appointments](../api/booking.md#3-list-appointments)
- [Get Customer Appointments](../api/booking.md#7-get-customer-appointments)
- [Get Business Appointments](../api/booking.md#8-get-business-appointments)

**Related Features:**

- [Appointment Creation](#appointment-creation) - Creates history entries
- [Appointment Management](#appointment-management) - Updates history
- [Customer Profile Management](./customer.md#customer-profile-management) - Links to customer
- [Appointment Statistics](#appointment-statistics) - Analyzes history data

**Example Use Case:**

> Sofia, a salon owner, wants to see how many appointments she had last month. She opens her dashboard and views the appointment history filtered for November 2024. She sees 87 completed appointments, 5 cancellations, and 2 no-shows. She can click on any appointment to see full details including which service was provided, who the customer was, and what time it occurred. This helps her understand her busiest days and plan staffing accordingly.

---

### Appointment Statistics

**Description:** Business owners can view statistics and insights about their appointments, including total bookings, cancellation rates, popular services, and busy time periods. The system automatically calculates these metrics from appointment history, providing valuable business intelligence without manual tracking.

**User Benefit:** Helps business owners understand their operations, identify trends, optimize schedules, and make data-driven decisions about staffing and services.

**Key Capabilities:**

- View total appointments by period (day, week, month)
- Calculate cancellation rate
- Identify most popular services
- Find busiest days and times
- Track appointment completion rate
- Compare periods (this month vs last month)
- View customer retention metrics
- Generate reports for business planning

**Related API Endpoints:**

- [Get Appointment Statistics](../api/booking.md#9-get-appointment-statistics)
- [Get Business Dashboard](../api/booking.md#10-get-business-dashboard)

**Related Features:**

- [Appointment History](#appointment-history) - Source of statistics data
- [Service Management](./offering.md#service-management) - Service popularity data
- [Schedule Management](./availability.md#schedule-management) - Optimize based on busy times
- [Customer Search](./customer.md#customer-search-and-filtering) - Customer behavior insights

**Example Use Case:**

> Ricardo owns a barbershop and wants to understand his business better. He opens the statistics dashboard and sees: This month he had 156 appointments (up 12% from last month), his cancellation rate is 8%, "Haircut" is his most popular service (65% of bookings), and Saturdays from 10 AM-2 PM are his busiest times. He decides to add an extra barber on Saturday mornings and considers promoting his less popular "Beard Trim" service with a discount.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Availability BC

**How they work together:**

- [Appointment Creation](#appointment-creation) validates against schedules and capacity
- [Appointment Management](#appointment-management) updates capacity on changes
- [Availability Checking](./availability.md#availability-checking) prevents invalid bookings
- [Capacity Management](./availability.md#capacity-management) tracks available slots

**Example Flow:**

1. Customer requests appointment for Tuesday at 3 PM (Booking BC)
2. System checks if Tuesday 3 PM is within business hours (Availability BC) ✓
3. System checks if date is blocked (Availability BC) ✓
4. System checks if capacity is available (Availability BC) ✓
5. System creates appointment (Booking BC) and decrements capacity (Availability BC)
6. Customer cancels appointment (Booking BC)
7. System increments capacity back (Availability BC)

### Integration with Customer BC

**How they work together:**

- [Appointment Creation](#appointment-creation) requires customer identification
- [Appointment History](#appointment-history) links to customer profiles
- [Customer Profile Management](./customer.md#customer-profile-management) shows appointment history
- [Anonymous vs Registered Customers](./customer.md#anonymous-vs-registered-customers) determines access level

**Example Flow:**

1. Anonymous customer books via WhatsApp (Booking BC)
2. System identifies customer by phone number (Customer BC)
3. If new, creates anonymous customer profile (Customer BC)
4. Creates appointment linked to customer (Booking BC)
5. Customer can view appointment via WhatsApp (Conversation BC)
6. If customer registers later, appointment history is preserved (Customer BC)

### Integration with Offering BC

**How they work together:**

- [Appointment Creation](#appointment-creation) requires service selection
- [Service Catalog](./offering.md#service-catalog) provides available services
- [Service Configuration](./offering.md#service-configuration) defines duration and capacity
- [Appointment Statistics](#appointment-statistics) shows service popularity

**Example Flow:**

1. Customer wants to book appointment (Booking BC)
2. System shows active services from catalog (Offering BC)
3. Customer selects "Haircut - 30 minutes" (Offering BC)
4. System uses service duration to calculate time slots (Availability BC)
5. System uses service capacity to limit bookings (Availability BC)
6. Appointment is created with service reference (Booking BC)

### Integration with Conversation BC

**How they work together:**

- [Appointment Creation](#appointment-creation) sends confirmation via WhatsApp
- [Appointment Management](#appointment-management) sends change notifications
- [WhatsApp Integration](./conversation.md#whatsapp-integration) handles all messages
- [Automated Responses](./conversation.md#automated-responses) guide booking process

**Example Flow:**

1. Customer sends WhatsApp message (Conversation BC)
2. Bot presents service options (Conversation BC)
3. Customer selects service and time (Conversation BC)
4. System creates appointment (Booking BC)
5. System sends confirmation message (Conversation BC)
6. System schedules reminder for 24 hours before (Notification BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
