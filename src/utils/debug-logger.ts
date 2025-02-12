type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;

  static debug(context: string, message: string, data?: any) {
    this.log('debug', context, message, data);
  }

  static info(context: string, message: string, data?: any) {
    this.log('info', context, message, data);
  }

  static warn(context: string, message: string, data?: any) {
    this.log('warn', context, message, data);
  }

  static error(context: string, message: string, data?: any) {
    this.log('error', context, message, data);
  }

  private static log(level: LogLevel, context: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data
    };

    console[level](`[${context}] ${message}`, data);
    
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  static getLogs(level?: LogLevel, context?: string): LogEntry[] {
    return this.logs.filter(log => 
      (!level || log.level === level) && 
      (!context || log.context === context)
    );
  }

  static clearLogs() {
    this.logs = [];
  }
}

export const DebugLogger = Logger; 