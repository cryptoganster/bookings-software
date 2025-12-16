/**
 * API Endpoints
 * Centralized definition of all API endpoint URLs
 */

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },

  APPOINTMENTS: {
    LIST: "/appointments",
    DETAIL: (id: string) => `/appointments/${id}`,
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    TODAY: "/appointments/today",
    UPCOMING: "/appointments/upcoming",
  },

  OFFERINGS: {
    LIST: "/offerings",
    DETAIL: (id: string) => `/offerings/${id}`,
    CREATE: "/offerings",
    UPDATE: (id: string) => `/offerings/${id}`,
    DELETE: (id: string) => `/offerings/${id}`,
    TOGGLE_ACTIVE: (id: string) => `/offerings/${id}/active`,
  },

  SCHEDULES: {
    LIST: "/schedules",
    CREATE: "/schedules",
    UPDATE: (id: string) => `/schedules/${id}`,
    DELETE: (id: string) => `/schedules/${id}`,
  },

  BLOCKOUTS: {
    LIST: "/blockouts",
    CREATE: "/blockouts",
    DELETE: (id: string) => `/blockouts/${id}`,
  },

  BUSINESS: {
    GET: "/business",
    UPDATE: "/business",
    CONFIGURE_WHATSAPP: "/business/whatsapp",
  },

  ADMIN_QUERIES: {
    PENDING: "/admin-queries/pending",
    RESPOND: (id: string) => `/admin-queries/${id}/respond`,
  },

  ANALYTICS: {
    APPOINTMENTS: "/analytics/appointments",
    OFFERINGS: "/analytics/offerings",
  },
} as const;
