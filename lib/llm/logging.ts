type LogLevel = 'info' | 'error' | 'debug' | 'warn';

export interface LLMLog {
  timestamp: string;
  provider: string;
  prompt: string;
  response?: any;
  error?: any;
  duration: number;
  success: boolean;
  level: LogLevel;
}

class LLMLogger {
  private static instance: LLMLogger;
  private logs: LLMLog[] = [];

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new LLMLogger();
    }
    return this.instance;
  }

  log(data: LLMLog) {
    this.logs.push(data);
    console.log(`[LLM ${data.provider}] ${data.level.toUpperCase()}: ${
      data.success ? 'Success' : 'Failed'
    } (${data.duration}ms)`);
    
    if (data.error) {
      console.error('[LLM Error]', data.error);
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('[LLM Prompt]', data.prompt);
      console.debug('[LLM Response]', data.response);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const llmLogger = LLMLogger.getInstance();
