/**
 * MSW Request Handlers
 *
 * Define mock handlers for API endpoints used in tests
 */

import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:3000/api";

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        businessId: "test-business-id",
      },
      token: "mock-jwt-token",
    });
  }),

  // Stats endpoint (must come before generic appointments/:id)
  http.get(`${API_URL}/appointments/stats`, () => {
    return HttpResponse.json({
      today: 5,
      thisWeek: 23,
      pendingQueries: 3,
      occupancyRate: 78,
    });
  }),

  // Appointments endpoints
  http.get(`${API_URL}/appointments`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Mock appointments data
    const mockAppointments = [
      {
        id: "appointment-1",
        businessId: "test-business-id",
        customerId: "customer-1",
        customerName: "Juan Pérez",
        customerPhone: "+18095551234",
        offeringId: "offering-1",
        offeringName: "Corte de Pelo",
        dateTime: new Date("2024-12-20T10:00:00Z").toISOString(),
        status: "CONFIRMED",
        createdAt: new Date("2024-12-15T10:00:00Z").toISOString(),
        cancelledAt: null,
      },
      {
        id: "appointment-2",
        businessId: "test-business-id",
        customerId: "customer-2",
        customerName: "María García",
        customerPhone: "+18095555678",
        offeringId: "offering-2",
        offeringName: "Lavado",
        dateTime: new Date("2024-12-21T14:00:00Z").toISOString(),
        status: "CONFIRMED",
        createdAt: new Date("2024-12-16T10:00:00Z").toISOString(),
        cancelledAt: null,
      },
      {
        id: "appointment-3",
        businessId: "test-business-id",
        customerId: "customer-3",
        customerName: "Carlos López",
        customerPhone: "+18095559012",
        offeringId: "offering-1",
        offeringName: "Corte de Pelo",
        dateTime: new Date("2024-12-18T09:00:00Z").toISOString(),
        status: "CANCELLED",
        createdAt: new Date("2024-12-14T10:00:00Z").toISOString(),
        cancelledAt: new Date("2024-12-17T10:00:00Z").toISOString(),
      },
    ];

    // Filter by status if provided
    let filtered = mockAppointments;
    if (status) {
      filtered = filtered.filter((apt) => apt.status === status);
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.dateTime);
        return aptDate >= start && aptDate <= end;
      });
    }

    return HttpResponse.json(filtered);
  }),

  http.get(`${API_URL}/appointments/:id`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      id,
      businessId: "test-business-id",
      customerId: "customer-1",
      customerName: "Juan Pérez",
      customerPhone: "+18095551234",
      offeringId: "offering-1",
      offeringName: "Corte de Pelo",
      dateTime: new Date("2024-12-20T10:00:00Z").toISOString(),
      status: "CONFIRMED",
      createdAt: new Date("2024-12-15T10:00:00Z").toISOString(),
      cancelledAt: null,
    });
  }),

  http.put(`${API_URL}/appointments/:id/cancel`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      id,
      businessId: "test-business-id",
      customerId: "customer-1",
      customerName: "Juan Pérez",
      customerPhone: "+18095551234",
      offeringId: "offering-1",
      offeringName: "Corte de Pelo",
      dateTime: new Date("2024-12-20T10:00:00Z").toISOString(),
      status: "CANCELLED",
      createdAt: new Date("2024-12-15T10:00:00Z").toISOString(),
      cancelledAt: new Date().toISOString(),
    });
  }),
];
