/**
 * Scraper Factory & Registry
 * Manages scraper templates and creates isolated instances for each job
 */

import { IScraper } from './scraper.interface';
import type { WebsiteCode } from '../../utils/constants';
import { Logger } from '../../utils/logger';

export class ScraperFactory {
  private static logger = new Logger(ScraperFactory.name);
  private static scrapers = new Map<WebsiteCode, IScraper>();

  /**
   * Register a scraper template for a website
   * The template will be used to create copies for each scraping job
   */
  static register(websiteCode: WebsiteCode, scraper: IScraper): void {
    this.scrapers.set(websiteCode, scraper);
    this.logger.info(`Registered scraper template for ${websiteCode}`);
  }

  /**
   * Get a scraper instance by website code
   * Returns a copy to avoid shared state between scraping jobs
   */
  static getScraper(websiteCode: WebsiteCode): IScraper {
    const scraperTemplate = this.scrapers.get(websiteCode);
    
    if (!scraperTemplate) {
      const error = `No scraper registered for website code: ${websiteCode}`;
      this.logger.error(error);
      throw new Error(error);
    }

    // Return a copy to avoid shared state between different scraping jobs
    const scraperCopy = scraperTemplate.copy();
    return scraperCopy;
  }

  /**
   * Clear all registrations (useful for testing)
   */
  static clear(): void {
    this.scrapers.clear();
  }
}
