# Conversation Features

**Bounded Context:** Conversation  
**Purpose:** Manages WhatsApp integration, customer communication, and message handling for appointment booking and support

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [WhatsApp Integration](#whatsapp-integration)
   - [Admin Query Management](#admin-query-management)
   - [Conversation History](#conversation-history)
   - [Automated Responses](#automated-responses)
3. [Related Features](#related-features)

---

## Overview

The Conversation Bounded Context handles all communication between businesses and customers through WhatsApp. It manages message sending and receiving, automated booking flows, admin queries, and conversation history. This enables customers to book appointments and get support entirely through WhatsApp without needing a separate app.

**What it does:**

- Integrates with WhatsApp Business API
- Receives and processes customer messages
- Sends automated responses and confirmations
- Routes complex queries to business owners
- Maintains conversation history
- Handles interactive buttons and menus

**Who uses it:**

- Customers (send messages, book appointments, ask questions)
- Business Owners (respond to customer queries, view conversations)
- System (automates booking flow and sends notifications)

---

## Features

### WhatsApp Integration

**Description:** The platform integrates directly with WhatsApp Business API, allowing customers to interact with businesses through WhatsApp messages. Customers can book appointments, cancel bookings, ask questions, and receive confirmations all within WhatsApp. The integration uses interactive buttons and menus to guide customers through the booking process, making it simple and intuitive.

**User Benefit:** Customers can book appointments using an app they already have and use daily, without downloading anything new or visiting a website. Business owners reach customers on their preferred communication channel.

**Key Capabilities:**

- Send and receive WhatsApp messages in real-time
- Use interactive buttons for easy navigation
- Send appointment confirmations with details
- Send appointment reminders automatically
- Handle text messages and button responses
- Send location information for business address
- Support multimedia messages (images, documents)
- Validate message authenticity with webhook signatures

**Related API Endpoints:**

- [WhatsApp Webhook](../api/conversation.md#1-whatsapp-webhook)
- [Send WhatsApp Message](../api/conversation.md#2-send-whatsapp-message)

**Related Features:**

- [WhatsApp Configuration](./business.md#whatsapp-configuration) - Sets up integration
- [Appointment Creation](./booking.md#appointment-creation) - Bookings via WhatsApp
- [Automated Responses](#automated-responses) - Guides booking flow
- [Admin Query Management](#admin-query-management) - Handles complex questions

**Example Use Case:**

> Maria wants to book a haircut at her local salon. She sends a WhatsApp message to the salon's number: "Hi, I'd like to book an appointment." The system immediately responds with interactive buttons: [Book Appointment] [View My Appointments] [Contact Admin]. She taps "Book Appointment" and is guided through selecting a service, date, and time using buttons. Once confirmed, she receives a message: "✅ Appointment confirmed! Tuesday, Dec 19 at 2:00 PM for Haircut. We'll send you a reminder 24 hours before."

---

### Admin Query Management

**Description:** When customers have questions that can't be answered automatically, they can request to speak with the business owner or admin. These queries are marked as "pending" and appear in the business owner's dashboard. Owners can respond directly from the web panel, and their responses are sent to the customer via WhatsApp. This provides a seamless way to handle customer support without leaving the platform.

**User Benefit:** Customers get personalized help when needed, while business owners can efficiently manage all customer queries from one place without switching between multiple apps.

**Key Capabilities:**

- Request admin assistance from WhatsApp
- Mark conversations as "awaiting admin response"
- Notify business owners of pending queries
- View all pending queries in dashboard
- Respond to queries from web panel
- Send responses via WhatsApp automatically
- Mark queries as resolved
- Track response times
- View conversation context when responding

**Related API Endpoints:**

- [Get Pending Admin Queries](../api/conversation.md#3-get-pending-admin-queries)
- [Respond to Admin Query](../api/conversation.md#4-respond-to-admin-query)
- [Mark Query as Resolved](../api/conversation.md#5-mark-query-as-resolved)

**Related Features:**

- [WhatsApp Integration](#whatsapp-integration) - Delivers messages
- [Conversation History](#conversation-history) - Shows full context
- [Business Profile Management](./business.md#business-profile-management) - Routes to correct owner
- [Customer Profile Management](./customer.md#customer-profile-management) - Identifies customer

**Example Use Case:**

> Carlos sends a WhatsApp message asking: "Do you offer group discounts for parties of 10 or more?" The automated system doesn't have an answer for this, so it responds: "Let me connect you with our team. Your question has been forwarded to our admin." The salon owner, Sofia, sees a notification in her dashboard: "New admin query from Carlos: 'Do you offer group discounts...'" She responds: "Yes! We offer 15% off for groups of 10+. Would you like to book?" Her response is instantly sent to Carlos via WhatsApp, and the conversation continues naturally.

---

### Conversation History

**Description:** The system maintains a complete history of all messages exchanged between customers and businesses. Business owners can view past conversations to understand context, resolve disputes, or reference previous interactions. The history includes message content, timestamps, direction (inbound/outbound), and whether messages were from the automated system or admin.

**User Benefit:** Provides complete transparency and context for all customer interactions, making it easy to reference past conversations and maintain continuity in customer relationships.

**Key Capabilities:**

- View complete message history per customer
- See message timestamps and direction
- Identify automated vs admin messages
- Search conversations by customer or content
- Filter by date range
- Export conversation history
- View conversation status (active, resolved)
- Track conversation duration and response times

**Related API Endpoints:**

- [Get Conversation History](../api/conversation.md#6-get-conversation-history)
- [Get Customer Conversations](../api/conversation.md#7-get-customer-conversations)
- [Search Conversations](../api/conversation.md#8-search-conversations)

**Related Features:**

- [WhatsApp Integration](#whatsapp-integration) - Creates history entries
- [Admin Query Management](#admin-query-management) - Includes admin responses
- [Customer Profile Management](./customer.md#customer-profile-management) - Links to customer
- [Appointment History](./booking.md#appointment-history) - Related to bookings

**Example Use Case:**

> A customer calls the salon saying they never received their appointment confirmation. The owner, Elena, opens the conversation history for that customer's phone number. She sees the complete WhatsApp conversation from two days ago: customer requested appointment, selected service and time, received confirmation message at 3:47 PM. She can show the customer the exact timestamp and message content, resolving the confusion. The customer realizes they may have missed the notification and apologizes.

---

### Automated Responses

**Description:** The system uses intelligent automated responses to guide customers through the booking process without human intervention. It presents options using interactive buttons, validates selections, checks availability, and confirms appointments—all automatically. The automated flow handles 90%+ of booking requests, freeing business owners to focus on their work while still providing excellent customer service.

**User Benefit:** Customers get instant responses 24/7 without waiting for business hours, while business owners save time by not manually handling every booking request.

**Key Capabilities:**

- Greet customers automatically
- Present service options with buttons
- Show available dates and times
- Validate customer selections
- Confirm appointment details
- Send booking confirmations
- Handle cancellation requests
- Provide business information (address, hours)
- Escalate to admin when needed
- Customize automated messages per business

**Related API Endpoints:**

- Currently managed through internal system processes
- Automated responses triggered by message events

**Related Features:**

- [WhatsApp Integration](#whatsapp-integration) - Delivers automated messages
- [Appointment Creation](./booking.md#appointment-creation) - Automated booking flow
- [Availability Checking](./availability.md#availability-checking) - Shows available times
- [Business Settings](./business.md#business-settings) - Customizes messages

**Example Use Case:**

> At 11 PM on a Saturday night, Laura decides she wants to book a massage for next week. She sends a WhatsApp message to the spa. Even though the spa is closed, she immediately receives an automated response: "Hi Laura! 👋 Welcome to Serenity Spa. What would you like to do today?" with buttons: [Book Appointment] [View My Appointments] [Contact Us]. She taps "Book Appointment" and is guided through the entire booking process with instant responses at each step. By 11:05 PM, she has a confirmed appointment for Tuesday at 2 PM—all without any human involvement.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Booking BC

**How they work together:**

- [WhatsApp Integration](#whatsapp-integration) enables appointment booking
- [Automated Responses](#automated-responses) guide booking process
- [Appointment Creation](./booking.md#appointment-creation) triggered by WhatsApp
- [Appointment Management](./booking.md#appointment-management) sends notifications

**Example Flow:**

1. Customer sends WhatsApp message "I want to book" (Conversation BC)
2. Bot presents service options (Conversation BC)
3. Customer selects "Haircut" (Conversation BC)
4. Bot shows available dates (Availability BC via Conversation BC)
5. Customer selects date and time (Conversation BC)
6. System creates appointment (Booking BC)
7. Bot sends confirmation via WhatsApp (Conversation BC)

### Integration with Customer BC

**How they work together:**

- [WhatsApp Integration](#whatsapp-integration) identifies customers by phone
- [Conversation History](#conversation-history) links to customer profile
- [Customer Profile Management](./customer.md#customer-profile-management) stores phone number
- [Anonymous vs Registered Customers](./customer.md#anonymous-vs-registered-customers) determines features

**Example Flow:**

1. Customer sends WhatsApp message from +1-555-0123 (Conversation BC)
2. System looks up customer by phone number (Customer BC)
3. If not found, creates anonymous customer profile (Customer BC)
4. Links conversation to customer profile (Conversation BC + Customer BC)
5. All future messages from that number link to same customer (Customer BC)

### Integration with Business BC

**How they work together:**

- [WhatsApp Configuration](./business.md#whatsapp-configuration) enables messaging
- [WhatsApp Integration](#whatsapp-integration) uses business phone number
- [Business Settings](./business.md#business-settings) customizes automated messages
- [Admin Query Management](#admin-query-management) routes to business owner

**Example Flow:**

1. Business owner configures WhatsApp number (Business BC)
2. Customer sends message to that number (Conversation BC)
3. System identifies business by phone number (Business BC)
4. System loads business settings and custom messages (Business BC)
5. Bot uses configured messages in responses (Conversation BC)
6. Admin queries route to correct business owner (Business BC + Conversation BC)

### Integration with Availability BC

**How they work together:**

- [Automated Responses](#automated-responses) show available times
- [WhatsApp Integration](#whatsapp-integration) presents availability to customers
- [Availability Checking](./availability.md#availability-checking) validates selections
- [Schedule Management](./availability.md#schedule-management) determines available times

**Example Flow:**

1. Customer requests appointment via WhatsApp (Conversation BC)
2. Bot asks for preferred date (Conversation BC)
3. System checks available dates (Availability BC)
4. Bot presents available dates as buttons (Conversation BC)
5. Customer selects date (Conversation BC)
6. System checks available time slots (Availability BC)
7. Bot presents available times (Conversation BC)
8. Customer confirms selection (Conversation BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
