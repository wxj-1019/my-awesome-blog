/* eslint-disable no-console */
const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(prefix: string = '') {
    this.prefix = prefix;
    this.enabled = isDevelopment;
  }

  private _log(level: LogLevel, ...args: unknown[]): void {
    if (!this.enabled) {return;}

    const timestamp = new Date().toISOString();
    const message = `[${timestamp}]${this.prefix ? ` [${this.prefix}]` : ''}`;

    switch (level) {
      case 'log':

        break;
      case 'info':
        console.info(message, ...args);
        break;
      case 'warn':
        console.warn(message, ...args);
        break;
      case 'error':
        console.error(message, ...args);
        break;
      case 'debug':
        console.debug(message, ...args);
        break;
    }
  }

  log(...args: unknown[]): void {
    this._log('log', ...args);
  }

  info(...args: unknown[]): void {
    this._log('info', ...args);
  }

  warn(...args: unknown[]): void {
    this._log('warn', ...args);
  }

  error(...args: unknown[]): void {
    this._log('error', ...args);
  }

  debug(...args: unknown[]): void {
    this._log('debug', ...args);
  }

  static create(prefix: string): Logger {
    return new Logger(prefix);
  }
}

export const logger = new Logger();

export default logger;
