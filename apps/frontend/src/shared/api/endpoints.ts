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

  ACCOUNT: {
    PROFILE: "/account/profile",
    SUBSCRIPTION: "/account/subscription",
    UPGRADE_SUBSCRIPTION: "/account/subscription/upgrade",
    COMPLETE_ONBOARDING: "/account/onboarding/complete",
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
    ACTIVE: "/offerings/active",
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

  AVAILABILITY: {
    DATES: "/availability/dates",
    SLOTS: "/availability/slots",
  },

  BUSINESS: {
    LIST: "/businesses",
    DETAIL: (id: string) => `/businesses/${id}`,
    CREATE: "/businesses",
    UPDATE: (id: string) => `/businesses/${id}`,
    CONFIGURE_WHATSAPP: (id: string) => `/businesses/${id}/whatsapp`,
    DEACTIVATE: (id: string) => `/businesses/${id}`,
    ACTIVATE: (id: string) => `/businesses/${id}/activate`,
  },

  CONVERSATIONS: {
    PENDING: "/admin-queries/pending",
    DETAIL: (id: string) => `/admin-queries/${id}`,
    RESPOND: (id: string) => `/admin-queries/${id}/respond`,
  },

  ANALYTICS: {
    APPOINTMENTS: "/analytics/appointments",
    OFFERINGS: "/analytics/offerings",
  },

  CUSTOMERS: {
    LIST: "/customers",
    DETAIL: (id: string) => `/customers/${id}`,
    SEARCH: "/customers/search",
    BY_USER_ID: (userId: string) => `/customers/user/${userId}`,
    STATS: "/customers/stats",
    MERGE: "/customers/merge",
    DELETE: (id: string) => `/customers/${id}`,
    EXPORT: (id: string) => `/customers/${id}/export`,
    DUPLICATES: "/customers/duplicates",
  },
} as const;
