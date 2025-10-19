/**
 * Environment-aware logging utility
 * Logs are suppressed in production to reduce console noise
 * Errors are always logged regardless of environment
 */

type LogLevel = "log" | "warn" | "error" | "info" | "debug";

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment =
      import.meta.env.DEV || import.meta.env.MODE === "development";
  }

  /**
   * Log general information (only in development)
   */
  log(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log("[LOG]", ...args);
    }
  }

  /**
   * Log informational messages (only in development)
   */
  info(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info("[INFO]", ...args);
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug("[DEBUG]", ...args);
    }
  }

  /**
   * Log warnings (only in development)
   */
  warn(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.warn("[WARN]", ...args);
    }
  }

  /**
   * Log errors (always logged, even in production)
   * Errors should be tracked for debugging production issues
   */
  error(...args: unknown[]): void {
    console.error("[ERROR]", ...args);
  }

  /**
   * Safely log auth-related information
   * Sanitizes tokens and sensitive data
   */
  logAuth(message: string, data?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      const sanitized = data ? this.sanitizeSensitiveData(data) : {};
      console.log("[AUTH]", message, sanitized);
    }
  }

  /**
   * Remove sensitive fields from log data
   */
  private sanitizeSensitiveData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitiveKeys = [
      "access_token",
      "refresh_token",
      "password",
      "token",
      "secret",
      "api_key",
      "apiKey",
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeSensitiveData(
          value as Record<string, unknown>,
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log with custom level
   */
  withLevel(level: LogLevel, ...args: unknown[]): void {
    switch (level) {
      case "log":
        this.log(...args);
        break;
      case "info":
        this.info(...args);
        break;
      case "debug":
        this.debug(...args);
        break;
      case "warn":
        this.warn(...args);
        break;
      case "error":
        this.error(...args);
        break;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
