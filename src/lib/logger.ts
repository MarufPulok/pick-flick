/**
 * Logger Utility
 * Environment-aware logging with log levels
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Detailed debug info', { data });  // Only in development
 *   logger.info('General info');                    // Dev + staging
 *   logger.warn('Warning message');                 // Always
 *   logger.error('Error occurred', error);          // Always
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  timestamps: boolean;
}

// Log level priority (lower = more verbose)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

// Default config based on environment
const getDefaultConfig = (): LoggerConfig => {
  const isDev = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    level: isDev ? 'debug' : isTest ? 'warn' : 'error',
    prefix: '[PickFlick]',
    timestamps: isDev,
  };
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...getDefaultConfig(), ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    if (this.config.timestamps) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    parts.push(this.config.prefix);
    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);
    
    return parts.join(' ');
  }

  /**
   * Debug level - only in development
   * Use for detailed debugging info
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  /**
   * Info level - development and staging
   * Use for general operational info
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  /**
   * Warn level - always logged except in 'none' mode
   * Use for recoverable issues
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  /**
   * Error level - always logged
   * Use for errors that need attention
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  /**
   * Create a child logger with a specific prefix
   * Useful for module-specific logging
   */
  child(name: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix}[${name}]`,
    });
  }

  /**
   * Temporarily set log level (useful for debugging specific issues)
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
}

// Global logger instance
export const logger = new Logger();

// Module-specific loggers (pre-created for common modules)
export const loggers = {
  recommendation: logger.child('Recommendation'),
  tmdb: logger.child('TMDB'),
  cache: logger.child('Cache'),
  auth: logger.child('Auth'),
  db: logger.child('DB'),
  api: logger.child('API'),
} as const;

// Export Logger class for custom instances
export { Logger };
export type { LogLevel, LoggerConfig };

