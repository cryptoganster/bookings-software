/**
 * Environment configuration
 * Centralizes access to environment variables
 */

export const env = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
} as const;
