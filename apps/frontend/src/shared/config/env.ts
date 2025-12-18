/**
 * Environment configuration
 * Centralizes access to environment variables
 */

// Detect the API URL based on the current host
// This allows the app to work on localhost and network IP
const getApiUrl = (): string => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Otherwise, use the same host as the frontend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = 3000; // Backend port

  return `${protocol}//${hostname}:${port}/api`;
};

export const env = {
  apiUrl: getApiUrl(),
} as const;
