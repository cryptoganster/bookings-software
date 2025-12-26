# Documentation Maintenance Guidelines

This document provides guidelines for maintaining and updating the project documentation.

---

## Table of Contents

1. [When to Update Documentation](#when-to-update-documentation)
2. [Documentation Standards](#documentation-standards)
3. [Review Process](#review-process)
4. [Tools and Validation](#tools-and-validation)
5. [Common Scenarios](#common-scenarios)

---

## When to Update Documentation

### Adding New Endpoints

**When:** You add a new REST endpoint to a controller

**What to update:**

1. **API Documentation** (`docs/api/{bc-name}.md`)
   - Add endpoint section following template
   - Include method, path, authentication
   - Add request/response examples
   - Document error responses
   - Update table of contents
   - Update changelog

2. **Feature Documentation** (`docs/features/{bc-name}.md`) - If user-facing
   - Add or update feature description
   - Link to new API endpoint
   - Update related features section

3. **Index Files**
   - Update `docs/api/README.md` if first endpoint in BC
   - Update `docs/features/README.md` if new feature

**Example:**

```typescript
// Added new endpoint in controller
@Get('stats')
async getStats() { ... }

// Update docs/api/booking.md:
### 6. Get Appointment Statistics
...
```

---

### Modifying Endpoints

**When:** You change an existing endpoint's behavior, parameters, or response

**What to update:**

1. **API Documentation**
   - Update endpoint description if behavior changed
   - Update request body if parameters changed
   - Update response example if structure changed
   - Update error responses if new errors added
   - Add note in changelog

2. **Feature Documentation** - If user-facing change
   - Update feature description if capability changed
   - Update example use case if workflow changed

**Example:**

```typescript
// Changed from:
@Get()
async findAll() { ... }

// To:
@Get()
async findAll(@Query() filters: FiltersDto) { ... }

// Update docs/api/booking.md:
- Add query parameters section
- Update example request
- Update changelog: "Added filtering support"
```

---

### Adding New Features

**When:** You implement a new user-facing capability

**What to update:**

1. **Feature Documentation** (`docs/features/{bc-name}.md`)
   - Add new feature section
   - Include description, benefit, capabilities
   - Link to API endpoints
   - Add example use case
   - Update related features

2. **API Documentation** - If new endpoints
   - Document all new endpoints
   - Update changelog

3. **Index Files**
   - Add feature to `docs/features/README.md`
   - Update quick links if major feature

**Example:**

```typescript
// Implemented appointment statistics feature
// Add to docs/features/booking.md:

### Appointment Statistics

**Description:** Business owners can view statistics about their appointments...
**User Benefit:** Helps track business performance...
**Key Capabilities:**
- View total appointments
- See cancellation rate
- Track popular services
```

---

### Deprecating Features

**When:** You mark a feature or endpoint as deprecated

**What to update:**

1. **API Documentation**
   - Add deprecation notice at top of endpoint section
   - Suggest alternative endpoint
   - Update changelog

2. **Feature Documentation**
   - Add deprecation notice
   - Suggest alternative feature
   - Keep documentation until feature is removed

**Example:**

```markdown
### 3. Get Appointments (Deprecated)

> **⚠️ DEPRECATED:** This endpoint is deprecated as of v2.0. Use [Get Business Appointments](#4-get-business-appointments) instead.
```

---

### Removing Features

**When:** You remove a feature or endpoint completely

**What to update:**

1. **API Documentation**
   - Remove endpoint section
   - Update table of contents
   - Add removal note in changelog

2. **Feature Documentation**
   - Remove feature section
   - Update related features that referenced it
   - Add removal note in changelog

3. **Index Files**
   - Remove from `docs/api/README.md`
   - Remove from `docs/features/README.md`

---

## Documentation Standards

### Code Examples

**✅ Do:**

- Use valid TypeScript/JSON syntax
- Use consistent data formats (UUID v4, ISO 8601, E.164)
- Include realistic examples
- Show complete request/response
- Include authentication headers

**❌ Don't:**

- Use placeholder values like "xxx" or "123"
- Mix data formats
- Show incomplete examples
- Omit required fields

**Good Example:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Haircut",
  "durationMinutes": 30,
  "createdAt": "2025-01-25T10:30:00.000Z"
}
```

**Bad Example:**

```json
{
  "id": "123",
  "name": "Service",
  "duration": 30
}
```

---

### Writing Style

#### API Documentation

**✅ Do:**

- Be technical and precise
- Use present tense
- Use active voice
- Be concise
- Include all technical details

**❌ Don't:**

- Be vague or ambiguous
- Use future tense
- Use passive voice
- Write long paragraphs
- Omit error cases

**Good Example:**

> "Returns a list of appointments for the specified business. Supports filtering by status, date range, offering, and customer."

**Bad Example:**

> "This endpoint will get appointments. You can filter them if you want."

---

#### Feature Documentation

**✅ Do:**

- Use clear, simple language
- Focus on user benefits
- Use active voice
- Include examples
- Explain "why" not just "what"

**❌ Don't:**

- Use technical jargon
- Explain implementation
- Use passive voice
- Assume technical knowledge
- Write without context

**Good Example:**

> "Business owners can create services like 'Haircut' or 'Massage' by specifying the service name, duration, and capacity. This allows customers to book these services through WhatsApp."

**Bad Example:**

> "The CreateOffering command handler validates the OfferingDuration value object and persists the Offering aggregate."

---

### Format Requirements

#### Consistent Formatting

**Headers:**

```markdown
# Main Title (H1)

## Section (H2)

### Subsection (H3)
```

**Lists:**

```markdown
- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Another item
```

**Code Blocks:**

````markdown
```typescript
// TypeScript code
```

```json
// JSON data
```

```http
// HTTP request
```
````

**Tables:**

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Value 1  | Value 2  | Value 3  |
```

---

#### Data Formats

**UUIDs:** v4 format

```
123e4567-e89b-12d3-a456-426614174000
```

**Timestamps:** ISO 8601

```
2025-01-25T10:30:00.000Z
```

**Phone Numbers:** E.164

```
+18095551111
```

**Emails:** Valid format

```
user@example.com
```

---

### Cross-References

**Linking to API Endpoints:**

```markdown
[Create Appointment](../api/booking.md#1-create-appointment)
```

**Linking to Features:**

```markdown
[Appointment Management](./booking.md#appointment-management)
```

**Linking to External Docs:**

```markdown
[PRD](../.kiro/steering/PRD.md)
```

---

## Review Process

### PR Checklist

Before submitting a pull request with documentation changes:

- [ ] **Completeness**
  - [ ] All new endpoints are documented
  - [ ] All new features are documented
  - [ ] All examples are complete and valid
  - [ ] All error cases are documented

- [ ] **Accuracy**
  - [ ] Examples match actual implementation
  - [ ] Data formats are consistent
  - [ ] Links are valid (no 404s)
  - [ ] Technical details are correct

- [ ] **Quality**
  - [ ] Language is clear and concise
  - [ ] No spelling or grammar errors
  - [ ] Formatting is consistent
  - [ ] Code examples are properly formatted

- [ ] **Maintenance**
  - [ ] Changelog is updated
  - [ ] "Last Updated" date is current
  - [ ] Related docs are updated
  - [ ] Index files are updated

- [ ] **Testing**
  - [ ] Examples have been tested
  - [ ] Links have been verified
  - [ ] Markdown renders correctly

---

### Review Guidelines

**For Reviewers:**

1. **Check Completeness**
   - Are all endpoints/features documented?
   - Are examples complete?
   - Are error cases covered?

2. **Verify Accuracy**
   - Do examples match implementation?
   - Are data formats correct?
   - Do links work?

3. **Assess Quality**
   - Is language clear?
   - Is formatting consistent?
   - Are there errors?

4. **Test Examples**
   - Can you copy-paste and use examples?
   - Do HTTP requests work?
   - Are JSON examples valid?

---

## Tools and Validation

### Manual Validation

**Check Links:**

```bash
# Use markdown link checker (future)
npm run docs:check-links
```

**Preview Docs:**

```bash
# Use markdown preview in IDE
# Or generate HTML (future)
npm run docs:build
```

**Validate JSON:**

```bash
# Copy JSON examples and validate
# Use online JSON validator or IDE
```

---

### Automated Validation (Future)

**Planned Tools:**

1. **Link Checker**
   - Validates all internal links
   - Checks for broken references
   - Reports 404s

2. **Format Validator**
   - Checks UUID format (v4)
   - Validates ISO 8601 timestamps
   - Validates E.164 phone numbers
   - Validates email format

3. **Completeness Checker**
   - Compares controllers to docs
   - Reports undocumented endpoints
   - Checks for missing examples

4. **Markdown Linter**
   - Enforces consistent formatting
   - Checks for common errors
   - Validates table structure

---

## Common Scenarios

### Scenario 1: Adding a New Controller

**Steps:**

1. Implement controller with endpoints
2. Create API documentation file (`docs/api/{bc-name}.md`)
3. Document all endpoints following template
4. Create feature documentation file (`docs/features/{bc-name}.md`)
5. Document user-facing features
6. Update `docs/api/README.md`
7. Update `docs/features/README.md`
8. Submit PR with checklist

---

### Scenario 2: Modifying Request/Response

**Steps:**

1. Update controller code
2. Update API documentation:
   - Request body section
   - Response example
   - Changelog
3. Test examples
4. Submit PR

---

### Scenario 3: Adding Query Parameters

**Steps:**

1. Add query parameters to controller
2. Update API documentation:
   - Add "Query Parameters" table
   - Update example request
   - Update changelog
3. Update feature documentation if user-facing
4. Test examples
5. Submit PR

---

### Scenario 4: Deprecating an Endpoint

**Steps:**

1. Add deprecation notice in code
2. Update API documentation:
   - Add deprecation warning
   - Suggest alternative
   - Update changelog
3. Update feature documentation
4. Notify team
5. Submit PR

---

### Scenario 5: Fixing Documentation Errors

**Steps:**

1. Identify error (typo, broken link, wrong example)
2. Fix in documentation file
3. Update "Last Updated" date
4. Submit PR with description of fix

---

## Best Practices

### Documentation-Driven Development

**Ideal Workflow:**

1. Write feature documentation (what it should do)
2. Write API documentation (how it should work)
3. Implement feature
4. Update documentation with actual implementation
5. Review and refine

**Benefits:**

- Clarifies requirements before coding
- Catches design issues early
- Ensures documentation accuracy
- Improves code quality

---

### Keep Documentation Close to Code

**✅ Do:**

- Update docs in same PR as code changes
- Review docs with code reviews
- Test examples when testing code

**❌ Don't:**

- Defer documentation updates
- Update docs in separate PR
- Skip documentation in code reviews

---

### Write for Your Audience

**API Documentation:**

- **Audience:** Developers
- **Focus:** Technical details
- **Language:** Precise, technical

**Feature Documentation:**

- **Audience:** Business stakeholders
- **Focus:** User benefits
- **Language:** Clear, simple

---

## Getting Help

**Questions about documentation?**

- Check this guide first
- Review existing documentation as examples
- Ask in #dev-docs Slack channel
- Contact documentation maintainer

**Found a documentation bug?**

- Create issue with `[docs]` tag
- Include link to problematic doc
- Describe the issue clearly
- Suggest a fix if possible

**Want to improve documentation?**

- Submit PR with improvements
- Follow this guide
- Include clear description
- Request review from team

---

## Changelog

### Version 1.0 (2025-12-26)

- Initial documentation guidelines
- Added when to update documentation
- Added documentation standards
- Added review process
- Added common scenarios

---

**Last Updated:** December 26, 2025  
**Maintained By:** Development Team  
**Contact:** dev@example.com
