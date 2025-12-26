# Offering Features

**Bounded Context:** Offering  
**Purpose:** Manages services offered by businesses, including configuration, pricing, duration, and capacity settings

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Service Management](#service-management)
   - [Service Configuration](#service-configuration)
   - [Service Activation/Deactivation](#service-activationdeactivation)
   - [Service Catalog](#service-catalog)
3. [Related Features](#related-features)

---

## Overview

The Offering Bounded Context manages all services (offerings) that businesses provide to their customers. Each offering has a name, duration, capacity limits, and availability settings. Business owners can create, configure, and manage multiple offerings, and customers select from these offerings when booking appointments.

**What it does:**

- Creates and manages service offerings
- Configures service duration and capacity
- Controls service availability (active/inactive)
- Presents service catalog to customers
- Validates service-specific booking rules

**Who uses it:**

- Business Owners (create and manage services)
- Customers (view and select services when booking)
- System (validates bookings against service rules)

---

## Features

### Service Management

**Description:** Business owners can create and manage the services they offer to customers. Each service has a unique name, description, duration, and capacity settings. Services can be added, updated, or removed at any time, giving business owners complete control over what they offer. Multiple services can be managed simultaneously, allowing businesses to offer diverse options to their customers.

**User Benefit:** Provides flexibility to define exactly what services are offered, making it easy to add new services, update existing ones, or remove services that are no longer provided.

**Key Capabilities:**

- Create new services with name and description
- Update service information at any time
- Delete services that are no longer offered
- Set unique names per business
- Organize services by category (optional)
- Set service visibility to customers
- Track service creation and modification dates
- View all services in one list

**Related API Endpoints:**

- [Create Offering](../api/offering.md#1-create-offering)
- [Get Offering](../api/offering.md#2-get-offering)
- [Update Offering](../api/offering.md#3-update-offering)
- [Delete Offering](../api/offering.md#4-delete-offering)
- [List Offerings](../api/offering.md#5-list-offerings)

**Related Features:**

- [Service Configuration](#service-configuration) - Configures service details
- [Service Catalog](#service-catalog) - Displays services to customers
- [Business Profile Management](./business.md#business-profile-management) - Services belong to business
- [Appointment Creation](./booking.md#appointment-creation) - Uses services for bookings

**Example Use Case:**

> Elena owns a beauty salon and wants to add a new service. She opens the service management page and creates a new offering called "Express Facial" with the description "Quick 30-minute facial treatment perfect for lunch breaks." She sets the duration to 30 minutes and capacity to 2 clients per time slot. The service is immediately available for customers to book. Later, she decides to rename it to "Power Facial" and updates the description—the change takes effect instantly.

---

### Service Configuration

**Description:** Each service can be configured with specific settings that control how it can be booked. The main settings are duration (how long the service takes) and capacity (how many customers can book the same time slot). Duration must be at least 15 minutes and is typically set in 15-minute increments. Capacity determines how many concurrent bookings are allowed, enabling businesses to serve multiple customers simultaneously.

**User Benefit:** Allows precise control over service delivery, ensuring appointments are scheduled with appropriate time and resources, preventing overbooking while maximizing utilization.

**Key Capabilities:**

- Set service duration (minimum 15 minutes)
- Configure duration in 15-minute increments
- Set maximum capacity per time slot (minimum 1)
- Set maximum daily capacity (optional)
- Define service-specific booking rules
- Configure advance booking limits
- Set cancellation policies per service
- Update configuration without affecting existing appointments

**Related API Endpoints:**

- [Update Offering](../api/offering.md#3-update-offering)
- [Get Offering Configuration](../api/offering.md#6-get-offering-configuration)

**Related Features:**

- [Service Management](#service-management) - Creates services to configure
- [Capacity Management](./availability.md#capacity-management) - Enforces capacity limits
- [Availability Checking](./availability.md#availability-checking) - Uses duration for slots
- [Appointment Creation](./booking.md#appointment-creation) - Validates against configuration

**Example Use Case:**

> Marco runs a barbershop and offers "Haircut" services. He configures the service with a 30-minute duration and capacity of 3 (he has 3 barber chairs). This means 3 customers can book haircuts at the same time slot, like 10:00 AM. He also offers "Beard Trim" with 15-minute duration and capacity of 2. When customers book, the system automatically blocks the appropriate time based on these settings. If all 3 haircut slots at 10:00 AM are booked, that time becomes unavailable for haircuts but beard trims can still be booked.

---

### Service Activation/Deactivation

**Description:** Business owners can activate or deactivate services without deleting them. Inactive services are hidden from customers and cannot be booked, but all historical data and configuration is preserved. This is useful for seasonal services, temporary unavailability, or services being updated. Services can be reactivated at any time, instantly making them available for booking again.

**User Benefit:** Provides flexibility to temporarily remove services from the booking menu without losing configuration or history, making it easy to manage seasonal offerings or services under maintenance.

**Key Capabilities:**

- Deactivate services to hide from customers
- Preserve all service configuration when inactive
- Preserve appointment history for inactive services
- Prevent new bookings for inactive services
- Allow existing appointments to proceed
- Reactivate services instantly
- Track activation status changes
- View both active and inactive services in management

**Related API Endpoints:**

- [Deactivate Offering](../api/offering.md#7-deactivate-offering)
- [Activate Offering](../api/offering.md#8-activate-offering)
- [List Active Offerings](../api/offering.md#9-list-active-offerings)

**Related Features:**

- [Service Management](#service-management) - Manages activation status
- [Service Catalog](#service-catalog) - Shows only active services
- [Appointment Creation](./booking.md#appointment-creation) - Blocks inactive services
- [Appointment History](./booking.md#appointment-history) - Preserves inactive service data

**Example Use Case:**

> Sofia owns a spa that offers "Outdoor Massage" during summer months only. In September, she deactivates the service for the winter season. Customers can no longer see or book outdoor massages, but all past appointments and the service configuration remain in the system. In May, she reactivates the service with one click, and it immediately appears in the booking menu again with all the same settings (60-minute duration, capacity of 2, etc.). She doesn't need to recreate or reconfigure anything.

---

### Service Catalog

**Description:** Customers see a catalog of all active services when booking appointments. The catalog displays service names, descriptions, durations, and any other relevant information. Services are presented in an easy-to-browse format, typically with interactive buttons in WhatsApp or a list view in the web portal. Only active services appear in the catalog, and it updates in real-time as business owners make changes.

**User Benefit:** Provides customers with clear, up-to-date information about available services, making it easy to choose the right service and understand what to expect.

**Key Capabilities:**

- Display all active services
- Show service names and descriptions
- Display service duration
- Present services with interactive buttons (WhatsApp)
- Show services in organized list (web portal)
- Update catalog in real-time
- Filter services by category (if configured)
- Hide inactive services automatically
- Show service availability status

**Related API Endpoints:**

- [List Active Offerings](../api/offering.md#9-list-active-offerings)
- [Get Offering Details](../api/offering.md#10-get-offering-details)

**Related Features:**

- [Service Management](#service-management) - Populates catalog
- [Service Activation/Deactivation](#service-activationdeactivation) - Controls visibility
- [WhatsApp Integration](./conversation.md#whatsapp-integration) - Displays catalog
- [Appointment Creation](./booking.md#appointment-creation) - Uses catalog for selection

**Example Use Case:**

> Ana wants to book an appointment at "Bella Salon" via WhatsApp. She sends a message and the bot responds: "What service would you like to book?" with buttons: [Haircut - 30 min] [Hair Color - 90 min] [Manicure - 45 min] [Pedicure - 60 min]. She taps "Haircut - 30 min" and the booking process continues. The salon owner had previously deactivated "Hair Extensions" for the month, so it doesn't appear in Ana's list. When the owner reactivates it next month, it will automatically appear for all customers.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Business BC

**How they work together:**

- [Service Management](#service-management) belongs to specific business
- [Business Profile Management](./business.md#business-profile-management) contains services
- [Multi-Business Management](./business.md#multi-business-management) separates service catalogs
- [Service Catalog](#service-catalog) filtered by business

**Example Flow:**

1. Business owner creates "Spa Relaxation" business (Business BC)
2. Owner adds services: "Massage", "Facial", "Sauna" (Offering BC)
3. Each service is linked to "Spa Relaxation" (Offering BC)
4. Customers booking at "Spa Relaxation" see only those services (Offering BC)
5. Owner's other businesses have different service catalogs (Offering BC)

### Integration with Availability BC

**How they work together:**

- [Service Configuration](#service-configuration) defines duration and capacity
- [Capacity Management](./availability.md#capacity-management) enforces limits
- [Availability Checking](./availability.md#availability-checking) uses duration
- [Schedule Management](./availability.md#schedule-management) applies to all services

**Example Flow:**

1. Business owner creates "Massage" service with 60-minute duration (Offering BC)
2. System uses duration to calculate time slots (Availability BC)
3. Owner sets capacity to 2 massages per slot (Offering BC)
4. System tracks available capacity (Availability BC)
5. Customer books massage at 2 PM (Booking BC)
6. System blocks 2:00-3:00 PM slot (Availability BC)
7. One more massage can still be booked at 2 PM (Availability BC)

### Integration with Booking BC

**How they work together:**

- [Service Catalog](#service-catalog) provides booking options
- [Appointment Creation](./booking.md#appointment-creation) requires service selection
- [Service Configuration](#service-configuration) validates bookings
- [Appointment History](./booking.md#appointment-history) references services

**Example Flow:**

1. Customer starts booking process (Booking BC)
2. System shows active services from catalog (Offering BC)
3. Customer selects "Haircut" service (Offering BC)
4. System validates service is active (Offering BC)
5. System uses service duration (30 min) to show time slots (Availability BC)
6. System uses service capacity (3) to check availability (Availability BC)
7. System creates appointment with service reference (Booking BC)
8. Appointment history shows "Haircut" service (Booking BC + Offering BC)

### Integration with Conversation BC

**How they work together:**

- [Service Catalog](#service-catalog) displayed in WhatsApp
- [WhatsApp Integration](./conversation.md#whatsapp-integration) presents services
- [Automated Responses](./conversation.md#automated-responses) guide service selection
- [Service Management](#service-management) updates WhatsApp menu

**Example Flow:**

1. Customer sends WhatsApp message "I want to book" (Conversation BC)
2. Bot asks "What service?" (Conversation BC)
3. System loads active services (Offering BC)
4. Bot presents services as interactive buttons (Conversation BC)
5. Customer taps "Massage" button (Conversation BC)
6. System validates service is active and bookable (Offering BC)
7. Booking process continues with selected service (Booking BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
