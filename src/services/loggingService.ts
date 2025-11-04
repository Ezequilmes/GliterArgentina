/**
 * Centralized Logging Service for Gliter Argentina
 * Provides structured logging with different levels and contexts
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
}

class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log a message with specified level and context
   */
  log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const timestamp = new Date().toISOString();
    
    const logEntry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      },
      timestamp,
      error,
    };

    // Add to memory logs
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      this.consoleLog(logEntry);
    }

    // In production, you might want to send logs to a service like Firebase Analytics
    // or another logging service
    if (!this.isDevelopment && level === 'error') {
      this.sendErrorToService(logEntry);
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by component
   */
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.context?.component === component);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Console logging with proper formatting
   */
  private consoleLog(entry: LogEntry): void {
    const { level, message, context, timestamp, error } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const contextStr = context ? ` [${context.component || 'Unknown'}]` : '';
    const fullMessage = `${prefix}${contextStr} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage, context, error);
        break;
      case 'info':
        console.info(fullMessage, context, error);
        break;
      case 'warn':
        console.warn(fullMessage, context, error);
        break;
      case 'error':
        console.error(fullMessage, context, error);
        break;
    }
  }

  /**
   * Send error logs to external service (placeholder)
   */
  private sendErrorToService(entry: LogEntry): void {
    // In a real application, you would send this to Firebase Analytics,
    // Sentry, LogRocket, or another error tracking service
    
    // For now, we'll just store it locally or send to Firebase Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: entry.message,
        fatal: entry.level === 'error',
        custom_map: entry.context,
      });
    }
  }

  /**
   * Create a logger for a specific component
   */
  createComponentLogger(component: string) {
    return {
      debug: (message: string, context?: Omit<LogContext, 'component'>) =>
        this.debug(message, { ...context, component }),
      info: (message: string, context?: Omit<LogContext, 'component'>) =>
        this.info(message, { ...context, component }),
      warn: (message: string, context?: Omit<LogContext, 'component'>) =>
        this.warn(message, { ...context, component }),
      error: (message: string, context?: Omit<LogContext, 'component'>, error?: Error) =>
        this.error(message, { ...context, component }, error),
    };
  }
}

// Export singleton instance
export const loggingService = new LoggingService();

// Export convenience functions
export const createLogger = (component: string) => 
  loggingService.createComponentLogger(component);

export default loggingService;