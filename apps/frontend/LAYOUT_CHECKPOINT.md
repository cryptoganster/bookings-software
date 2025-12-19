# Layout and Navigation Checkpoint

This document provides manual testing instructions for Task 23.5 - Verificar layout y navegación.

## Prerequisites

- Backend server running on http://localhost:3000
- Frontend server running on http://localhost:5173
- Test user credentials available (from previous checkpoint)

## Test Checklist

### ✅ 1. Login and Redirection

- [ ] Navigate to http://localhost:5173
- [ ] Should redirect to /login if not authenticated
- [ ] Enter valid credentials and login
- [ ] Should redirect to dashboard (/)
- [ ] Verify token is saved in localStorage

### ✅ 2. Header Component (Desktop)

- [ ] Header shows "Sistema de Reservas" text
- [ ] Burger menu is hidden on desktop (screen width > 768px)
- [ ] User avatar/icon is visible on the right
- [ ] Click on user icon opens Popover with user info
- [ ] Popover shows user name and email
- [ ] Popover contains "Cerrar Sesión" button
- [ ] Popover has radius="xl" (rounded corners)

### ✅ 3. Header Component (Mobile)

- [ ] Resize browser to mobile width (< 768px)
- [ ] Burger menu is visible on the left
- [ ] User icon is visible on the right
- [ ] Click user icon opens Popover with user info and logout button
- [ ] Popover has radius="xl"

### ✅ 4. Navbar Component (Desktop)

- [ ] Navbar is permanently visible on desktop
- [ ] Shows "Bienvenido al Sistema de Reservas" title
- [ ] Shows two navigation links: Dashboard and Appointments
- [ ] Dashboard link has IconHome2 icon
- [ ] Appointments link has IconCalendar icon
- [ ] Current page link is highlighted with brandGreen.6 background
- [ ] Current page link text is white
- [ ] Hover over inactive link shows brandGreen.1 background
- [ ] Links have radius="xl" (rounded corners)
- [ ] Transitions are smooth (cubic-bezier)

### ✅ 5. Navbar Component (Mobile)

- [ ] Resize to mobile width (< 768px)
- [ ] Navbar is collapsed by default
- [ ] Click burger menu to open navbar
- [ ] Navbar slides in from the left
- [ ] Navigation links work correctly
- [ ] Click burger menu again to close navbar

### ✅ 6. Navigation Between Pages

- [ ] Click "Dashboard" link
- [ ] URL changes to "/"
- [ ] Dashboard page shows "Dashboard - Coming Soon" message
- [ ] Dashboard link is highlighted in navbar
- [ ] Click "Appointments" link
- [ ] URL changes to "/appointments"
- [ ] Appointments page shows "Appointments - Coming Soon" message
- [ ] Appointments link is highlighted in navbar
- [ ] Navigate back to Dashboard
- [ ] Dashboard link is highlighted again

### ✅ 7. Logout Functionality

- [ ] Click user icon to open Popover
- [ ] Click "Cerrar Sesión" button
- [ ] Should redirect to /login
- [ ] localStorage should be cleared (no token)
- [ ] Try accessing "/" directly
- [ ] Should redirect to /login (protected route working)

### ✅ 8. Styling Verification

- [ ] All interactive elements use radius="xl"
- [ ] Active navlink uses brandGreen.6 (green background)
- [ ] Hover states use brandGreen.1 (light green)
- [ ] Main content area has light gray background (light mode)
- [ ] Header and Navbar have no borders
- [ ] Transitions are smooth on all interactions
- [ ] Layout is responsive and adapts to screen size

### ✅ 9. Browser Compatibility

- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari (if on Mac)
- [ ] All features work consistently

### ✅ 10. Responsive Breakpoints

- [ ] Test at 1920px width (large desktop)
- [ ] Test at 1280px width (desktop)
- [ ] Test at 768px width (tablet - breakpoint)
- [ ] Test at 375px width (mobile)
- [ ] Layout adapts correctly at all sizes

## Expected Results

All checkboxes should be checked (✅) for the checkpoint to pass.

## Issues Found

Document any issues here:

- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

## Screenshots

Consider taking screenshots of:

1. Desktop view with navbar expanded
2. Mobile view with navbar collapsed
3. Mobile view with navbar expanded
4. Active link highlighting
5. User popover menu

## Requirements Validated

This checkpoint validates the following requirements:

- 6.1: Layout principal con AppShell
- 6.2: Header con logo y user menu
- 6.3: Navbar con links de navegación
- 6.4: Navegación entre páginas
- 6.5: Highlight de item activo
- 6.6: Hover states
- 6.7: Radius="xl" en elementos interactivos
- 6.8: Logout desde Popover
- 6.9: Responsive en mobile
- 6.10: Navbar permanentemente visible en desktop
- 6.11: Transiciones suaves
- 6.12: Estilos adaptados del template
