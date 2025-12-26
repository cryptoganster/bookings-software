# Auth Features

**Bounded Context:** Auth  
**Purpose:** Handles user authentication, authorization, and identity management across the platform

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [User Registration](#user-registration)
   - [User Authentication](#user-authentication)
   - [Multi-Role Management](#multi-role-management)
   - [Email Verification](#email-verification)
   - [Account Activation/Deactivation](#account-activationdeactivation)
3. [Related Features](#related-features)

---

## Overview

The Auth Bounded Context is the foundation of identity management in the platform. It handles user registration, login, and role-based access control. Every user in the system—whether a business owner, customer, or administrator—has their identity managed through this context.

**What it does:**

- Registers new users with secure password storage
- Authenticates users with email and password
- Manages multiple roles per user (BUSINESS_OWNER, CUSTOMER, ADMIN)
- Verifies email addresses
- Controls account activation and deactivation

**Who uses it:**

- Business Owners (register and login to manage businesses)
- Customers (register and login to view appointment history)
- System Administrators (manage all user accounts)

---

## Features

### User Registration

**Description:** New users can create an account by providing their email, password, and name. The system securely stores their credentials and assigns an initial role (typically BUSINESS_OWNER for business owners or CUSTOMER for end customers). Each user receives a unique identifier and can later add additional roles as needed.

**User Benefit:** Provides a secure, straightforward way to join the platform and start using its features, with the flexibility to expand roles over time.

**Key Capabilities:**

- Register with email, password, and name
- Automatic password hashing for security
- Assign initial role (BUSINESS_OWNER, CUSTOMER, or ADMIN)
- Generate unique user identifier
- Trigger automatic profile creation in other contexts
- Validate email format and password strength

**Related API Endpoints:**

- Currently managed through internal system processes
- Registration triggers events for profile creation

**Related Features:**

- [Business Owner Profile Management](./account.md#business-owner-profile-management) - Created automatically for BUSINESS_OWNER users
- [Customer Profile Management](./customer.md#customer-profile-management) - Created when CUSTOMER role is added
- [Email Verification](#email-verification) - Sent after registration

**Example Use Case:**

> Sofia wants to start using the platform to manage her beauty salon. She visits the registration page, enters her email (sofia@salon.com), creates a strong password, and provides her name. The system creates her user account with the BUSINESS_OWNER role, automatically creates her business owner profile with a FREE subscription, and sends her a verification email.

---

### User Authentication

**Description:** Registered users can securely log in to the platform using their email and password. The system validates their credentials and issues a secure token (JWT) that grants access to the platform for a limited time. Users can also refresh their tokens to maintain their session without re-entering credentials.

**User Benefit:** Provides secure access to the platform while maintaining a smooth user experience with automatic session management.

**Key Capabilities:**

- Login with email and password
- Secure password verification
- Issue JWT tokens for authenticated sessions
- Refresh tokens to extend sessions
- Logout to invalidate tokens
- Track login attempts and security events

**Related API Endpoints:**

- Currently managed through internal system processes
- Authentication required for all protected endpoints

**Related Features:**

- [User Registration](#user-registration) - Creates the account used for login
- [Multi-Role Management](#multi-role-management) - Determines available features after login
- [Account Activation/Deactivation](#account-activationdeactivation) - Prevents login for deactivated accounts

**Example Use Case:**

> Miguel, a business owner, opens the platform on his phone. He enters his email and password, and the system validates his credentials. He receives a secure token that allows him to access his business dashboard, view appointments, and respond to customer messages. The token automatically refreshes as he uses the app, so he doesn't need to log in again for 24 hours.

---

### Multi-Role Management

**Description:** Users can have multiple roles simultaneously, allowing them to use different parts of the platform. For example, a business owner can also be a customer of other businesses. The system manages these roles independently, allowing users to switch contexts and access features appropriate to each role.

**User Benefit:** Enables users to participate in the platform in multiple ways without needing separate accounts, providing a seamless experience whether they're managing their business or booking appointments elsewhere.

**Key Capabilities:**

- Assign multiple roles to a single user
- Add new roles to existing users
- Remove roles when no longer needed
- Prevent removal of the last role (users must have at least one)
- Track role changes for audit purposes
- Enable context switching in the user interface

**Related API Endpoints:**

- Currently managed through internal system processes
- Role changes trigger profile creation/updates

**Related Features:**

- [Business Owner Profile Management](./account.md#business-owner-profile-management) - Requires BUSINESS_OWNER role
- [Customer Profile Management](./customer.md#customer-profile-management) - Requires CUSTOMER role
- [User Registration](#user-registration) - Assigns initial role

**Example Use Case:**

> Ana owns a law office and uses the platform to manage her appointments (BUSINESS_OWNER role). One day, she needs to book a dental appointment at Dr. Martinez's clinic, which also uses the platform. The system adds the CUSTOMER role to her account, allowing her to book appointments as a customer while still managing her law office. In the app, she can switch between "My Business" and "My Appointments" views.

---

### Email Verification

**Description:** After registration, users receive an email with a verification link. Clicking the link confirms their email address is valid and active. Some features may be restricted until email verification is complete, ensuring users have provided a working contact method.

**User Benefit:** Protects accounts from unauthorized access and ensures users can receive important notifications about their appointments and business activities.

**Key Capabilities:**

- Send verification email after registration
- Generate secure verification tokens
- Verify email when user clicks link
- Track verification status
- Resend verification emails if needed
- Restrict certain features until verified

**Related API Endpoints:**

- Currently managed through internal system processes
- Verification status checked before sensitive operations

**Related Features:**

- [User Registration](#user-registration) - Triggers verification email
- [Account Activation/Deactivation](#account-activationdeactivation) - Verification may be required for activation

**Example Use Case:**

> Roberto registers for the platform and receives a welcome email with a verification link. He clicks the link, and the system marks his email as verified. Now he can configure his WhatsApp integration and start accepting appointments. If he hadn't verified his email, these features would have been locked with a reminder to check his inbox.

---

### Account Activation/Deactivation

**Description:** User accounts can be activated or deactivated by administrators or by the users themselves. Deactivated accounts cannot log in or access the platform, but their data is preserved. This is useful for temporarily suspending accounts, handling policy violations, or allowing users to take breaks without losing their information.

**User Benefit:** Provides flexibility to pause platform usage without losing data, and gives administrators tools to manage problematic accounts while preserving the ability to restore them later.

**Key Capabilities:**

- Activate new user accounts
- Deactivate accounts temporarily
- Prevent login for deactivated accounts
- Preserve all data when deactivated
- Reactivate accounts when needed
- Track activation status changes
- Notify users of status changes

**Related API Endpoints:**

- Currently managed through internal system processes
- Administrators can activate/deactivate any account

**Related Features:**

- [User Authentication](#user-authentication) - Blocked for deactivated accounts
- [Subscription Management](./account.md#subscription-management) - May trigger deactivation for non-payment

**Example Use Case:**

> Laura is going on a 3-month sabbatical and won't be managing her business during that time. She deactivates her account, which prevents anyone from logging in but preserves all her business data, appointments, and customer information. When she returns, she reactivates her account and everything is exactly as she left it.

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with Account BC

**How they work together:**

- [User Registration](#user-registration) triggers automatic creation of business owner profiles
- [Multi-Role Management](#multi-role-management) determines which profiles are created
- [Account Activation/Deactivation](#account-activationdeactivation) affects subscription status

**Example Flow:**

1. User registers with BUSINESS_OWNER role (Auth BC)
2. System creates business owner profile with FREE plan (Account BC)
3. User completes onboarding (Account BC)
4. User can now create businesses (Business BC)

### Integration with Customer BC

**How they work together:**

- [Multi-Role Management](#multi-role-management) adds CUSTOMER role when user books appointments
- [User Registration](#user-registration) can create customer-only accounts
- [Email Verification](#email-verification) enables customer web portal access

**Example Flow:**

1. Anonymous customer books appointment via WhatsApp (Customer BC)
2. Customer decides to register for web access (Auth BC)
3. System links existing customer profile to new user account (Customer BC)
4. User gains CUSTOMER role and web portal access (Auth BC)

### Integration with Business BC

**How they work together:**

- [User Authentication](#user-authentication) required to access business management
- [Account Activation/Deactivation](#account-activationdeactivation) affects business visibility
- [Multi-Role Management](#multi-role-management) determines business management permissions

**Example Flow:**

1. User logs in with BUSINESS_OWNER role (Auth BC)
2. System loads their businesses (Business BC)
3. User can manage business settings and view appointments (Business BC)
4. If account is deactivated, businesses become inaccessible (Auth BC)

---

**Last Updated:** December 26, 2025  
**Version:** 1.0  
**Maintained By:** Development Team
