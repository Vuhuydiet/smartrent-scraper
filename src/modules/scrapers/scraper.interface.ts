import type { PropertyDto } from '../../dto';
import { WebsiteCode } from '../../utils/constants';

/**
 * Interface for website scrapers
 */
export interface IScraper {
  /**
   * Initialize the scraper (setup browser, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Scrape a single property from URL
   */
  scrapeProperty(url: string): Promise<PropertyDto | null>;

  /**
   * Scrape multiple properties from a listing page
   */
  scrapePropertyList(url: string): Promise<PropertyDto[]>;

  /**
   * Scrape all properties from the first page
   */
  scrapeAllPropertiesFromFirstPage(firstListUrl: string, start: number, limit: number): Promise<PropertyDto[]>;

  getPageUrl(listUrl: string, page: number): string;

  getTotalPages(listUrl: string): Promise<number>;
  
  /**
   * Clean up resources (close browser, etc.)
   */
  cleanup(): Promise<void>;

  /**
   * Get the scraper name/type
   */
  getScraperType(): WebsiteCode;

  /**
   * Create a copy of this scraper instance
   * Used by factory to avoid shared state between scraping jobs
   */
  copy(): IScraper;
}
