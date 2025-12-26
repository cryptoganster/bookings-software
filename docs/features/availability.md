# Availability Features

**Bounded Context:** Availability  
**Purpose:** Manages business schedules, blockouts, capacity limits, and availability checking for appointments

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Schedule Management](#schedule-management)
   - [Blockout Management](#blockout-management)
   - [Availability Checking](#availability-checking)
   - [Capacity Management](#capacity-management)
3. [Related Features](#related-features)

---

## Overview

The Availability Bounded Context controls when and how many appointments can be booked. It manages business operating hours, special closures, and capacity limits for each service. This ensures customers can only book appointments during valid times and that businesses don't get overbooked.

**What it does:**

- Defines business operating hours by day of week
- Blocks specific dates for holidays or special events
- Tracks available capacity for each service and time slot
- Validates appointment requests against schedules and capacity
- Prevents overbooking through real-time capacity tracking

**Who uses it:**

- Business Owners (configure schedules, blockouts, and capacity)
- Customers (view available times when booking)
- System (validates all appointment requests)

---

## Features

### Schedule Management

**Description:** Business owners can define their operating hours for each day of the week. Each schedule specifies opening and closing times, and multiple schedules can be created for different days. For example, a business might be open 9 AM to 6 PM Monday through Friday, and 10 AM to 4 PM on Saturday. Schedules determine when customers can book appointments.

**User Benefit:** Provides complete control over business hours, ensuring customers can only book during times when the business is actually open, reducing confusion and no-shows.

**Key Capabilities:**

- Create schedules for each day of the week (Monday=0 to Sunday=6)
- Set opening and closing times for each day
- Create multiple schedules for different time ranges
- Activate or deactivate schedules without deleting them
- Prevent overlapping schedules for the same day
- View all schedules in a weekly calendar format

**Related API Endpoints:**

- [Create Schedule](../api/availability.md#1-create-schedule)
- [Get Schedules](../api/availability.md#2-get-schedules)
- [Update Schedule](../api/availability.md#3-update-schedule)
- [Delete Schedule](../api/availability.md#4-delete-schedule)

**Related Features:**

- [Blockout Management](#blockout-management) - Overrides schedules for specific dates
- [Availability Checking](#availability-checking) - Uses schedules to determine valid times
- [Appointment Creation](./booking.md#appointment-creation) - Validates against schedules

**Example Use Case:**

> Maria owns a hair salon that's open Monday to Friday from 9 AM to 7 PM, and Saturday from 10 AM to 4 PM. She creates five schedules (one for each weekday) with 9:00-19:00 hours, and one schedule for Saturday with 10:00-16:00 hours. Now when customers try to book appointments, they can only select times within these hours. Sunday is automatically unavailable since there's no schedule for it.

---

### Blockout Management

**Description:** Business owners can block specific dates or date ranges when they won't be available, such as holidays, vacations, or special events. Blockouts override regular schedules and prevent any appointments from being booked during those periods. Each blockout can include a reason for reference.

**User Benefit:** Prevents customers from booking appointments during planned closures, eliminating the need to manually cancel appointments and reducing customer frustration.

**Key Capabilities:**

- Create blockouts for single dates or date ranges
- Specify reason for blockout (vacation, holiday, maintenance)
- Override regular schedules for blocked dates
- View all upcoming blockouts in a calendar
- Delete blockouts if plans change
- Automatically prevent bookings during blockout periods

**Related API Endpoints:**

- [Create Blockout](../api/availability.md#5-create-blockout)
- [Get Blockouts](../api/availability.md#6-get-blockouts)
- [Delete Blockout](../api/availability.md#7-delete-blockout)

**Related Features:**

- [Schedule Management](#schedule-management) - Blockouts override schedules
- [Availability Checking](#availability-checking) - Checks blockouts before showing available times
- [Appointment Creation](./booking.md#appointment-creation) - Rejects bookings during blockouts

**Example Use Case:**

> Carlos is taking a vacation from December 20-27. He creates a blockout for those dates with the reason "Christmas Vacation." Even though his regular schedule shows he's open during that week, customers cannot book appointments for any of those days. When he returns on December 28, appointments are automatically available again according to his regular schedule.

---

### Availability Checking

**Description:** The system checks availability in real-time when customers are booking appointments. It considers business schedules, blockouts, and current capacity to show only valid time slots. This prevents customers from attempting to book unavailable times and provides a smooth booking experience with accurate information.

**User Benefit:** Customers see only times that are actually available, reducing booking errors and frustration. Business owners don't have to manually manage availability or reject invalid booking requests.

**Key Capabilities:**

- Check if specific date and time is available
- Get list of available dates for a service
- Get available time slots for a specific date
- Consider schedules, blockouts, and capacity simultaneously
- Return only bookable times to customers
- Update availability in real-time as appointments are booked

**Related API Endpoints:**

- [Check Availability](../api/availability.md#8-check-availability)
- [Get Available Dates](../api/availability.md#9-get-available-dates)
- [Get Available Time Slots](../api/availability.md#10-get-available-time-slots)

**Related Features:**

- [Schedule Management](#schedule-management) - Defines valid operating hours
- [Blockout Management](#blockout-management) - Excludes blocked dates
- [Capacity Management](#capacity-management) - Limits bookings per time slot
- [Appointment Creation](./booking.md#appointment-creation) - Uses availability data

**Example Use Case:**

> Ana wants to book a haircut appointment. She opens the booking interface and selects "Haircut" as the service. The system checks the salon's schedule (open 9 AM-7 PM), blockouts (closed Dec 25), and capacity (4 clients per hour). It shows her a calendar with available dates highlighted. When she selects Tuesday, December 19, she sees available time slots: 9:00 AM, 10:30 AM, 2:00 PM, and 4:00 PM. The 11:00 AM slot is missing because it's already fully booked.

---

### Capacity Management

**Description:** The system tracks how many appointments can be accepted for each service at each time slot. Business owners configure maximum capacity per service (e.g., 4 haircuts per hour), and the system automatically decrements available slots as appointments are booked. This prevents overbooking and ensures businesses don't accept more appointments than they can handle.

**User Benefit:** Protects businesses from overbooking while maximizing utilization. Customers can book with confidence knowing their appointment time is truly available.

**Key Capabilities:**

- Set maximum capacity per service per time slot
- Track available slots in real-time
- Automatically decrement capacity when appointments are booked
- Automatically increment capacity when appointments are cancelled
- Prevent bookings when capacity is full
- Handle concurrent booking attempts safely
- View capacity utilization reports

**Related API Endpoints:**

- Currently managed through internal system processes
- Capacity checked automatically during booking

**Related Features:**

- [Service Configuration](./offering.md#service-configuration) - Defines max capacity per service
- [Availability Checking](#availability-checking) - Uses capacity data
- [Appointment Creation](./booking.md#appointment-creation) - Decrements capacity
- [Appointment Management](./booking.md#appointment-management) - Increments capacity on cancellation

**Example Use Case:**

> Roberto's barbershop offers haircuts with a capacity of 3 clients per 30-minute slot. At 10:00 AM, the system shows 3 available slots. Customer A books at 10:00 AM (2 slots remaining). Customer B books at 10:00 AM (1 slot remaining). Customer C books at 10:00 AM (0 slots remaining). When Customer D tries to book the same time, the system shows "This time is no longer available" and suggests the next available slot at 10:30 AM.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Booking BC

**How they work together:**

- [Availability Checking](#availability-checking) validates all appointment requests
- [Capacity Management](#capacity-management) prevents overbooking
- [Appointment Creation](./booking.md#appointment-creation) decrements capacity
- [Appointment Management](./booking.md#appointment-management) updates capacity on changes

**Example Flow:**

1. Customer requests appointment for Tuesday at 2 PM (Booking BC)
2. System checks schedule (Availability BC) - Tuesday 2 PM is within operating hours ✓
3. System checks blockouts (Availability BC) - No blockouts for that date ✓
4. System checks capacity (Availability BC) - 1 slot available ✓
5. System creates appointment (Booking BC) and decrements capacity (Availability BC)

### Integration with Offering BC

**How they work together:**

- [Service Configuration](./offering.md#service-configuration) defines capacity limits
- [Capacity Management](#capacity-management) enforces those limits
- [Availability Checking](#availability-checking) considers service duration

**Example Flow:**

1. Business owner creates "Massage" service with 60-minute duration and capacity of 2 (Offering BC)
2. System creates capacity tracking for massage service (Availability BC)
3. Customer books massage for 3 PM (Booking BC)
4. System blocks 3:00-4:00 PM slot for that service (Availability BC)
5. Only 1 more massage can be booked at 3 PM (Availability BC)

### Integration with Business BC

**How they work together:**

- [Schedule Management](#schedule-management) is specific to each business
- [Blockout Management](#blockout-management) applies to entire business
- [Business Settings](./business.md#business-settings) includes timezone for schedule interpretation

**Example Flow:**

1. Business owner sets timezone to "America/New_York" (Business BC)
2. Business owner creates schedule: Monday 9 AM - 5 PM (Availability BC)
3. System interprets all times in Eastern timezone (Availability BC)
4. Customer in California sees available times converted to Pacific timezone (Booking BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
