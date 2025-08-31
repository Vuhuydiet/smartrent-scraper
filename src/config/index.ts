import dotenv from 'dotenv';
dotenv.config();

// Enum must be declared before usage
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export class Config {
  public static readonly NODE_ENV = process.env.NODE_ENV || 'development';
  public static readonly LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  public static readonly PORT = parseInt(process.env.PORT || '3000');
  
  public static readonly SCRAPING_CONFIG: ScrapingConfig = {
    maxConcurrentScrapers: parseInt(process.env.MAX_CONCURRENT_SCRAPERS || '5'),
    requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || '1000'),
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '30000'),
    headless: process.env.HEADLESS !== 'false',
    browserArgs: process.env.BROWSER_ARGS?.split(',').filter(arg => arg.trim()) || [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  };
  
  public static readonly RATE_LIMIT_CONFIG: RateLimitConfig = {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    burstLimit: parseInt(process.env.BURST_LIMIT || '10')
  };

  public static readonly PATHS = {
    dataOutput: process.env.DATA_OUTPUT_DIR || './data',
    logOutput: process.env.LOG_OUTPUT_DIR || './logs'
  };

  public static isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  public static isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }
}


// Application configuration interfaces
export interface ScrapingConfig {
  maxConcurrentScrapers: number;
  requestDelayMs: number;
  retryAttempts: number;
  timeoutMs: number;
  headless: boolean;
  browserArgs: string[];
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
}
