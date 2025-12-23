/**
 * Frontend Logger Utility
 *
 * Provides structured logging with log levels and context.
 * Automatically disabled in production (except errors).
 *
 * Usage:
 * ```ts
 * import { logger } from '@shared/lib/logger';
 *
 * logger.debug('Debug message', { userId: '123' });
 * logger.info('Info message', { action: 'login' });
 * logger.warn('Warning message', { reason: 'timeout' });
 * logger.error('Error message', { error: err });
 * ```
 */

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Debug level - Only in development
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Info level - Only in development
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || "");
    }
  }

  /**
   * Warning level - Always logged
   * Use for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || "");
  }

  /**
   * Error level - Always logged
   * Use for error events
   */
  error(message: string, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, context || "");
  }

  /**
   * Group logs together (development only)
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  /**
   * End log group (development only)
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
