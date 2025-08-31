import type { RateLimitConfig } from '../config';
import { Logger } from './logger';

export class RateLimiter {
  private requests: number[] = [];
  private logger = new Logger(RateLimiter.name);
  
  constructor(private config: RateLimitConfig) {}

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    
    if (this.requests.length >= this.config.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = oldestRequest + 60000 - now;
      
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
    
    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRequestCount(): number {
    const oneMinuteAgo = Date.now() - 60000;
    return this.requests.filter(timestamp => timestamp > oneMinuteAgo).length;
  }
}
