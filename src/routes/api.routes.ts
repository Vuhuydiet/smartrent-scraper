import { Router } from 'express';
import { ScrapingController } from '../controllers/scraping.controller';
import { ScrapingJobService } from '../service';

/**
 * API routes factory
 */
export function createApiRoutes(scrapingJobService: ScrapingJobService): Router {
  const router = Router();
  const scrapingController = new ScrapingController(scrapingJobService);

  // Scraping routes
  router.post('/scrape', scrapingController.createScrapingJob);
  router.get('/jobs/:jobId', scrapingController.getJobStatus);
  router.get('/jobs', scrapingController.listJobs);
  router.get('/stats', scrapingController.getStatistics);

  return router;
}
