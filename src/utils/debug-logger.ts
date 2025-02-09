type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

class DebugLogger {
  private static instance: DebugLogger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    component: string,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      error
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleData = { ...entry };
      switch (entry.level) {
        case 'error':
          console.error(`[${entry.component}]`, entry.message, entry.data || '', entry.error || '');
          break;
        case 'warn':
          console.warn(`[${entry.component}]`, entry.message, entry.data || '');
          break;
        case 'debug':
          console.debug(`[${entry.component}]`, entry.message, entry.data || '');
          break;
        default:
          console.log(`[${entry.component}]`, entry.message, entry.data || '');
      }
    }
  }

  info(component: string, message: string, data?: any) {
    this.addLog(this.createLogEntry('info', component, message, data));
  }

  warn(component: string, message: string, data?: any) {
    this.addLog(this.createLogEntry('warn', component, message, data));
  }

  error(component: string, message: string, error?: Error, data?: any) {
    this.addLog(this.createLogEntry('error', component, message, data, error));
  }

  debug(component: string, message: string, data?: any) {
    this.addLog(this.createLogEntry('debug', component, message, data));
  }

  getLogs(level?: LogLevel, component?: string): LogEntry[] {
    return this.logs.filter(log => 
      (!level || log.level === level) && 
      (!component || log.component === component)
    );
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = DebugLogger.getInstance(); 