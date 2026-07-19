import { redactObject } from './redact';
import { serializeError } from './errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LoggerOptions = {
  service: string;
  environment?: string;
  level?: LogLevel;
  correlationId?: string;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  private readonly service: string;
  private readonly environment: string;
  private readonly level: LogLevel;
  private readonly correlationId?: string;

  constructor(options: LoggerOptions) {
    this.service = options.service;
    this.environment = options.environment ?? process.env.ARMZ_ENVIRONMENT ?? 'development';
    this.level = options.level ?? 'info';
    this.correlationId = options.correlationId;
  }

  child(extra: Partial<LoggerOptions>): Logger {
    return new Logger({
      service: extra.service ?? this.service,
      environment: extra.environment ?? this.environment,
      level: extra.level ?? this.level,
      correlationId: extra.correlationId ?? this.correlationId,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.level];
  }

  private write(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const payload = {
      level,
      message,
      service: this.service,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      ...redactObject(fields ?? {}),
    };

    const line = JSON.stringify(payload);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  debug(message: string, fields?: Record<string, unknown>): void {
    this.write('debug', message, fields);
  }

  info(message: string, fields?: Record<string, unknown>): void {
    this.write('info', message, fields);
  }

  warn(message: string, fields?: Record<string, unknown>): void {
    this.write('warn', message, fields);
  }

  error(message: string, fields?: Record<string, unknown>, error?: unknown): void {
    this.write('error', message, {
      ...fields,
      error: error ? serializeError(error) : undefined,
    });
  }
}

export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}
