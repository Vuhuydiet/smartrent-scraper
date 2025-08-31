import { ExpressApp } from './app';
import { DatabaseService } from './modules';
import { ScrapingJobService } from './service';
import { Logger } from './utils/logger';
import { Config } from './config';
import { ScraperFactory } from './modules/scrapers';
import { ExporterFactory, DatabaseExporter, JsonExporter, CsvExporter } from './modules/exporters';
import { WebsiteCode, ExporterType } from './utils/constants';
import { BSDScraper } from './modules/scrapers/bsd-scraper';

function registerComponents(databaseService: DatabaseService): void {
  // Register scrapers
  ScraperFactory.register(WebsiteCode.BSD, new BSDScraper());

  // Register exporters
  ExporterFactory.register(ExporterType.DATABASE, new DatabaseExporter(databaseService.prisma));
  ExporterFactory.register(ExporterType.JSON, new JsonExporter());
  ExporterFactory.register(ExporterType.CSV, new CsvExporter());
}

// Main application entry point
async function main(): Promise<void> {
  const logger = new Logger('MainApplication');
  
  try {
    const databaseService = new DatabaseService();
    await databaseService.connect();
    logger.info('Database connected successfully');
    
    registerComponents(databaseService);

    const scrapingJobService = new ScrapingJobService(databaseService.prisma);

    const app = new ExpressApp(scrapingJobService);
    const port = Config.PORT;
    
    await app.start(port);
    
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await databaseService.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error: any) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error: any) => {
    const logger = new Logger('MainApplication');
    logger.error('Application startup failed:', error);
    process.exit(1);
  });
}

