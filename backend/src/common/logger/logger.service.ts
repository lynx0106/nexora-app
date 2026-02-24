import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

/**
 * Log levels in order of severity
 */
const LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

/**
 * Sanitizes sensitive data from log messages and objects
 * Removes or masks: passwords, tokens, API keys, emails (partially), credit cards
 */
export function sanitizeLogData(data: any): any {
  if (!data) return data;
  
  // If it's a string, apply regex replacements
  if (typeof data === 'string') {
    return data
      // Mask passwords
      .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[MASKED]"')
      .replace(/"passwordHash"\s*:\s*"[^"]*"/gi, '"passwordHash":"[MASKED]"')
      .replace(/"newPassword"\s*:\s*"[^"]*"/gi, '"newPassword":"[MASKED]"')
      // Mask tokens
      .replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"[MASKED]"')
      .replace(/"accessToken"\s*:\s*"[^"]*"/gi, '"accessToken":"[MASKED]"')
      .replace(/"refreshToken"\s*:\s*"[^"]*"/gi, '"refreshToken":"[MASKED]"')
      // Mask API keys
      .replace(/"apiKey"\s*:\s*"[^"]*"/gi, '"apiKey":"[MASKED]"')
      .replace(/"api_key"\s*:\s*"[^"]*"/gi, '"api_key":"[MASKED]"')
      // Mask authorization headers
      .replace(/Bearer\s+[a-zA-Z0-9\-_]+/gi, 'Bearer [MASKED]')
      // Partially mask emails (show first 2 chars and domain)
      .replace(/([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, '$1***$2');
  }
  
  // If it's an object, recursively sanitize
  if (typeof data === 'object') {
    const sensitiveKeys = [
      'password', 'passwordHash', 'newPassword', 'confirmPassword',
      'token', 'accessToken', 'refreshToken', 'authToken',
      'apiKey', 'api_key', 'apiSecret', 'secretKey',
      'creditCard', 'cardNumber', 'cvv', 'ssn'
    ];
    
    if (Array.isArray(data)) {
      return data.map(item => sanitizeLogData(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[MASKED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeLogData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Structured logger that outputs JSON for production
 * and human-readable format for development
 */
@Injectable()
export class StructuredLogger implements LoggerService {
  private context?: string;
  private static logLevel: LogLevel = process.env.LOG_LEVEL as LogLevel || 'log';
  private static isProduction = process.env.NODE_ENV === 'production';

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Set global log level
   */
  static setLogLevel(level: LogLevel) {
    StructuredLogger.logLevel = level;
  }

  /**
   * Check if the given log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const currentLevelIndex = LOG_LEVELS.indexOf(StructuredLogger.logLevel);
    const messageLevelIndex = LOG_LEVELS.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log output
   */
  private formatLog(
    level: LogLevel,
    message: any,
    optionalParams: any[],
  ): string {
    const timestamp = new Date().toISOString();
    const context = this.context || 'Application';
    
    // Sanitize all data
    const sanitizedMessage = sanitizeLogData(message);
    const sanitizedParams = optionalParams.map(p => sanitizeLogData(p));
    
    if (StructuredLogger.isProduction) {
      // JSON format for production (easier parsing by log aggregators)
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        context,
        message: sanitizedMessage,
        data: sanitizedParams.length > 0 ? sanitizedParams : undefined,
        environment: process.env.NODE_ENV,
        service: 'nexora-api',
      };
      return JSON.stringify(logEntry);
    } else {
      // Human-readable format for development
      const paramsStr = sanitizedParams.length > 0 
        ? ' ' + JSON.stringify(sanitizedParams)
        : '';
      return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${sanitizedMessage}${paramsStr}`;
    }
  }

  /**
   * Write log to stdout/stderr
   */
  private writeLog(level: LogLevel, formattedMessage: string) {
    const output = level === 'error' || level === 'fatal' 
      ? process.stderr 
      : process.stdout;
    output.write(formattedMessage + '\n');
  }

  log(message: any, ...optionalParams: any[]) {
    if (!this.shouldLog('log')) return;
    this.writeLog('log', this.formatLog('log', message, optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    if (!this.shouldLog('error')) return;
    this.writeLog('error', this.formatLog('error', message, optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    if (!this.shouldLog('warn')) return;
    this.writeLog('warn', this.formatLog('warn', message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    if (!this.shouldLog('debug')) return;
    this.writeLog('debug', this.formatLog('debug', message, optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (!this.shouldLog('verbose')) return;
    this.writeLog('verbose', this.formatLog('verbose', message, optionalParams));
  }

  fatal(message: any, ...optionalParams: any[]) {
    if (!this.shouldLog('fatal')) return;
    this.writeLog('fatal', this.formatLog('fatal', message, optionalParams));
  }
}

/**
 * Convenience function to create a logger instance
 */
export function createLogger(context: string): StructuredLogger {
  return new StructuredLogger(context);
}
