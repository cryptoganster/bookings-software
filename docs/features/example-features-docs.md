# Feature Documentation Template

**Bounded Context:** [BC Name]  
**Purpose:** [Brief description of what this BC does]

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Feature 1 Name](#feature-1-name)
   - [Feature 2 Name](#feature-2-name)
   - [Feature 3 Name](#feature-3-name)
3. [Related Features](#related-features)

---

## Overview

[2-3 paragraph overview of the Bounded Context in non-technical language]

**What it does:**

- Key capability 1
- Key capability 2
- Key capability 3

**Who uses it:**

- User type 1 (e.g., Business Owners)
- User type 2 (e.g., Customers)

---

## Features

### Feature 1 Name

**Description:** [2-3 sentences explaining what this feature does in clear, non-technical language. Focus on what the user can accomplish, not how it works technically.]

**User Benefit:** [One sentence explaining what problem this solves or what value it provides to the user.]

**Key Capabilities:**

- Capability 1 - Brief description
- Capability 2 - Brief description
- Capability 3 - Brief description
- Capability 4 - Brief description (if applicable)

**Related API Endpoints:**

- [Endpoint Name](../api/bc-name.md#endpoint-anchor) - Brief description
- [Another Endpoint](../api/bc-name.md#another-anchor) - Brief description

**Related Features:**

- [Feature in Another BC](./other-bc.md#feature-anchor) - How they relate

**Example Use Case:**

> [Brief scenario showing how a user would use this feature in practice]
>
> Example: "Maria, a salon owner, wants to offer haircut services. She creates a new offering called 'Haircut' with a 30-minute duration and capacity for 4 clients per hour. This allows her customers to book haircut appointments through WhatsApp."

---

### Feature 2 Name

[Repeat the same structure as Feature 1]

---

### Feature 3 Name

[Repeat the same structure as Feature 1]

---

## Related Features

This section shows how features in this BC relate to features in other BCs.

### Integration with [Other BC Name]

**How they work together:**

- [Feature in this BC] enables [Feature in other BC]
- [Feature in other BC] depends on [Feature in this BC]

**Example Flow:**

1. User performs action in [this BC]
2. System triggers [action in other BC]
3. Result is [outcome]

---

## Writing Guidelines

### Language Style

**✅ Do:**

- Use clear, simple language
- Focus on user benefits
- Explain what users can accomplish
- Use active voice
- Be concise (2-3 sentences per description)
- Use real-world examples

**❌ Don't:**

- Use technical jargon (aggregates, commands, handlers)
- Explain implementation details
- Use passive voice
- Write long paragraphs
- Assume technical knowledge

### Good vs Bad Examples

**❌ Bad (Too Technical):**

> "The CreateOffering command handler validates the OfferingDuration value object and persists the Offering aggregate to the write repository using optimistic locking."

**✅ Good (Clear and User-Focused):**

> "Business owners can create new services (like 'Haircut' or 'Massage') by specifying the service name, duration, and how many clients can be served at once. This allows customers to book these services through WhatsApp."

---

**❌ Bad (Vague):**

> "This feature manages offerings."

**✅ Good (Specific):**

> "Business owners can create, edit, and deactivate services they offer. Each service has a name, duration, and capacity limit. Deactivated services are hidden from customers but can be reactivated later."

---

### Feature Identification

Features typically correspond to:

- **User-facing capabilities** - What can users actually do?
- **Business processes** - What business workflows are supported?
- **Value propositions** - What problems are solved?

**Not features:**

- Technical implementations (repositories, mappers)
- Infrastructure concerns (databases, APIs)
- Internal system processes (event handlers, sagas)

### Cross-References

When linking to other features or API endpoints:

**API Endpoints:**

```markdown
[Create Offering](../api/offering.md#1-create-offering)
```

**Features in Same BC:**

```markdown
[Service Management](#service-management)
```

**Features in Other BC:**

```markdown
[Appointment Creation](./booking.md#appointment-creation)
```

---

## Template Checklist

When creating feature documentation, ensure:

- [ ] BC overview is clear and non-technical
- [ ] Each feature has a clear description (2-3 sentences)
- [ ] User benefits are explicit
- [ ] Key capabilities are listed (3-5 bullet points)
- [ ] API endpoint links are valid
- [ ] Related features are cross-referenced
- [ ] Example use cases are realistic
- [ ] Language is accessible to business stakeholders
- [ ] No technical jargon without explanation
- [ ] Active voice is used throughout
- [ ] Formatting is consistent

---

**Last Updated:** December 26, 2025  
**Template Version:** 1.0  
**Maintained By:** Development Team
