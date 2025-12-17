/**
 * MSW Browser Setup
 *
 * Configure MSW for browser environment (development/debugging)
 * Not used in tests, but useful for manual testing
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Setup worker with default handlers
export const worker = setupWorker(...handlers);
