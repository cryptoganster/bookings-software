# Appointments Calendar View - Requirements

## Introduction

This specification defines the requirements for implementing a full calendar view for appointments in the frontend application. The calendar will provide business owners with a visual, time-based representation of their appointments, complementing the existing list view.

## Glossary

- **Appointment**: A scheduled booking for a service at a specific date and time
- **Calendar_View**: Visual representation of appointments organized by date and time
- **Week_View**: Calendar display showing 7 consecutive days
- **Day_View**: Calendar display showing a single day with hourly time slots
- **Time_Slot**: A specific time period (e.g., 10:00 AM - 11:00 AM)
- **Offering**: A service provided by the business (e.g., "Corte de Pelo")
- **Business_Owner**: The user who manages appointments through the web panel

## Requirements

### Requirement 1: Calendar View Toggle

**User Story:** As a business owner, I want to switch between list view and calendar view, so that I can choose the most convenient way to visualize my appointments.

#### Acceptance Criteria

1. WHEN a user is on the appointments page, THE System SHALL display a toggle control to switch between "List" and "Calendar" views
2. WHEN a user selects "Calendar" view, THE System SHALL display appointments in a calendar format
3. WHEN a user selects "List" view, THE System SHALL display appointments in the existing table format
4. THE System SHALL persist the selected view preference in browser local storage
5. WHEN a user returns to the appointments page, THE System SHALL restore their last selected view

### Requirement 2: Week Calendar View

**User Story:** As a business owner, I want to see my appointments in a weekly calendar format, so that I can quickly understand my schedule for the week.

#### Acceptance Criteria

1. WHEN the calendar view is active, THE System SHALL display a week view by default showing 7 consecutive days
2. THE System SHALL display the current week on initial load
3. FOR each day, THE System SHALL display the day name (e.g., "MONDAY"), date (e.g., "Mar 31"), and all appointments for that day
4. THE System SHALL organize appointments chronologically within each day
5. WHEN an appointment exists, THE System SHALL display the time (e.g., "10 AM"), offering name (e.g., "Corte de Pelo"), and customer name
6. THE System SHALL display appointments in time slots aligned to their scheduled time
7. THE System SHALL use visual indicators (colors, borders) to distinguish appointment statuses (CONFIRMED, CANCELLED, COMPLETED)

### Requirement 3: Calendar Navigation

**User Story:** As a business owner, I want to navigate between different weeks and months, so that I can view appointments in the past or future.

#### Acceptance Criteria

1. THE System SHALL provide "Previous Week" and "Next Week" navigation buttons
2. THE System SHALL provide a "Today" button to quickly return to the current week
3. WHEN a user clicks "Previous Week", THE System SHALL display the previous 7 days
4. WHEN a user clicks "Next Week", THE System SHALL display the next 7 days
5. WHEN a user clicks "Today", THE System SHALL display the current week
6. THE System SHALL display the current date range in the calendar header (e.g., "Dec 25 - Dec 31, 2024")
7. THE System SHALL highlight the current day with a visual indicator

### Requirement 4: Appointment Details in Calendar

**User Story:** As a business owner, I want to see key appointment information directly in the calendar, so that I can quickly understand each booking without clicking.

#### Acceptance Criteria

1. FOR each appointment in the calendar, THE System SHALL display the start time in 12-hour format (e.g., "10 AM", "2:30 PM")
2. FOR each appointment, THE System SHALL display the offering name
3. FOR each appointment, THE System SHALL display the customer name
4. WHEN an appointment duration is 60 minutes or more, THE System SHALL display the end time
5. THE System SHALL truncate long text with ellipsis if space is limited
6. THE System SHALL use different background colors for different appointment statuses:
   - CONFIRMED: Blue/Primary color
   - CANCELLED: Red/Error color
   - COMPLETED: Green/Success color

### Requirement 5: Appointment Interaction in Calendar

**User Story:** As a business owner, I want to interact with appointments in the calendar, so that I can view details or take actions.

#### Acceptance Criteria

1. WHEN a user clicks on an appointment in the calendar, THE System SHALL open a modal or drawer with full appointment details
2. THE appointment details modal SHALL display: customer name, phone, offering name, date, time, status, and creation date
3. THE appointment details modal SHALL provide action buttons: "Cancel Appointment" (if status is CONFIRMED)
4. WHEN a user cancels an appointment from the modal, THE System SHALL update the calendar view immediately
5. THE System SHALL display a loading state while fetching appointment details
6. WHEN an appointment action fails, THE System SHALL display an error message

### Requirement 6: Empty States and Loading

**User Story:** As a business owner, I want clear feedback when there are no appointments or when data is loading, so that I understand the system state.

#### Acceptance Criteria

1. WHEN there are no appointments for a day, THE System SHALL display an empty state message for that day (e.g., "No appointments")
2. WHEN there are no appointments for the entire week, THE System SHALL display a centered empty state with an illustration and message
3. WHEN appointment data is loading, THE System SHALL display skeleton loaders in the calendar grid
4. WHEN an error occurs fetching appointments, THE System SHALL display an error message with a retry button
5. THE System SHALL maintain the calendar structure (days and time slots) even when empty

### Requirement 7: Responsive Calendar Design

**User Story:** As a business owner, I want the calendar to work well on different screen sizes, so that I can manage appointments from any device.

#### Acceptance Criteria

1. WHEN viewed on desktop (≥1024px), THE System SHALL display the full week view with all 7 days visible
2. WHEN viewed on tablet (768px - 1023px), THE System SHALL display 5 days at a time with horizontal scroll
3. WHEN viewed on mobile (<768px), THE System SHALL display 1 day at a time with swipe navigation
4. THE System SHALL maintain appointment readability at all screen sizes
5. THE System SHALL adjust font sizes and spacing for mobile devices

### Requirement 8: Calendar Filters Integration

**User Story:** As a business owner, I want to filter appointments in the calendar view, so that I can focus on specific types of appointments.

#### Acceptance Criteria

1. THE existing appointment filters (status, date range) SHALL apply to the calendar view
2. WHEN a user selects a status filter (e.g., "CONFIRMED"), THE System SHALL display only appointments with that status in the calendar
3. WHEN a user clears filters, THE System SHALL display all appointments in the calendar
4. THE System SHALL display a count of filtered appointments in the calendar header
5. THE filter state SHALL persist when switching between list and calendar views

### Requirement 9: Time Zone Handling

**User Story:** As a business owner, I want appointments to display in my business's time zone, so that times are accurate for my location.

#### Acceptance Criteria

1. THE System SHALL display all appointment times in the business's configured time zone
2. THE System SHALL format times according to the user's locale (12-hour or 24-hour format)
3. WHEN the business time zone changes, THE System SHALL update all displayed times in the calendar
4. THE System SHALL handle daylight saving time transitions correctly

### Requirement 10: Performance and Optimization

**User Story:** As a business owner, I want the calendar to load quickly and respond smoothly, so that I can work efficiently.

#### Acceptance Criteria

1. THE System SHALL load and render the calendar view in less than 2 seconds
2. THE System SHALL fetch only appointments for the visible date range (current week ± 1 week)
3. WHEN navigating between weeks, THE System SHALL cache previously loaded data
4. THE System SHALL use optimistic updates when canceling appointments
5. THE System SHALL debounce filter changes to avoid excessive API requests

## Technical Constraints

- Must use Mantine UI components for consistency with existing design
- Must integrate with existing `useAppointments` hook from `@entities/appointment`
- Must follow Feature-Sliced Design (FSD) architecture
- Must use TanStack Query for data fetching and caching
- Must support the existing appointment statuses: CONFIRMED, CANCELLED, COMPLETED
- Calendar library recommendation: `@mantine/dates` with `dayjs` or custom implementation

## Out of Scope

- Drag-and-drop appointment rescheduling (future enhancement)
- Creating new appointments directly from the calendar (future enhancement)
- Month view (focus on week view for MVP)
- Printing calendar view
- Exporting calendar to external formats (iCal, Google Calendar)
- Multi-business calendar view
- Appointment conflicts detection in calendar UI

## Success Criteria

- Business owners can switch between list and calendar views seamlessly
- Calendar displays appointments accurately with correct times and details
- Navigation between weeks is smooth and intuitive
- Appointment interactions (view details, cancel) work correctly from calendar
- Calendar is responsive and works on mobile, tablet, and desktop
- Performance meets the <2 second load time requirement
- No console errors or warnings
- Calendar integrates with existing filters without breaking functionality

## References

- Frontend PRD: `.kiro/steering/frontend-PRD.md`
- Frontend Testing Conventions: `.kiro/steering/frontend-testing-conventions.md`
- Existing AppointmentsPage: `apps/frontend/src/pages/AppointmentsPage/ui/AppointmentsPage.tsx`
- Appointment Entity: `apps/frontend/src/entities/appointment/`
- Mantine Dates: https://mantine.dev/dates/getting-started/
