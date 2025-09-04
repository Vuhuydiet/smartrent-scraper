/**
 * Common scraper utilities
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { Config } from '../config';
import { Logger } from './logger';

export class ScraperUtils {
  private static logger = new Logger(ScraperUtils.name);

  /**
   * Create and configure a browser instance
   */
  static async createBrowser(): Promise<Browser> {
    try {
      const browser = await puppeteer.launch({
        headless: Config.SCRAPING_CONFIG.headless,
        args: [
          ...Config.SCRAPING_CONFIG.browserArgs,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      return browser;
    } catch (error) {
      this.logger.error('Failed to launch browser', error as Error);
      throw error;
    }
  }

  /**
   * Create and configure a page with optimizations
   */
  static async createPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    
    // Set default timeout
    page.setDefaultTimeout(Config.SCRAPING_CONFIG.timeoutMs);
    
    // Set realistic user agent and headers to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Set viewport to mimic real browser
    await page.setViewport({ width: 1366, height: 768 });
    
    // Hide webdriver property and other automation indicators
    await page.evaluateOnNewDocument(() => {
      // Hide webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock chrome runtime
      (window as any).chrome = {
        runtime: {}
      };
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          // eslint-disable-next-line no-undef
          Promise.resolve({ state: Notification.permission } as any) :
          originalQuery(parameters)
      );
    });
    
    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    return page;
  }

  /**
   * Execute operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = Config.SCRAPING_CONFIG.retryAttempts,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
  }

  /**
   * Sleep for specified milliseconds
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract clean text from element
   */
  static extractText(element: any): string {
    if (!element) return '';
    return typeof element === 'string' ? element.trim() : '';
  }

  /**
   * Extract number from text
   */
  static extractNumber(text: string): number {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  }

  static generateId(url: string, title: string): string {
    const hash = require('crypto').createHash('md5').update(url + title).digest('hex');
    return hash.substring(0, 8);
  }

}
