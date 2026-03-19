/**
 * Simple structured logger with level control.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level]! >= LOG_LEVELS[currentLevel]!;
}

function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string): void {
    if (shouldLog("debug")) {
      process.stderr.write(formatMessage("debug", message) + "\n");
    }
  },

  info(message: string): void {
    if (shouldLog("info")) {
      process.stderr.write(formatMessage("info", message) + "\n");
    }
  },

  warn(message: string): void {
    if (shouldLog("warn")) {
      process.stderr.write(formatMessage("warn", message) + "\n");
    }
  },

  error(message: string): void {
    if (shouldLog("error")) {
      process.stderr.write(formatMessage("error", message) + "\n");
    }
  },
};
