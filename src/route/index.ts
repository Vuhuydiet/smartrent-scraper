import { Router } from 'express';
import { createHealthRoutes } from './health.routes';
import { createApiRoutes } from './api.routes';
import { ScrapingJobService } from '../service';

/**
 * Main routes configuration
 */
export function createRoutes(scrapingJobService: ScrapingJobService): Router {
  const router = Router();

  // Health routes (no /api prefix)
  router.use('/', createHealthRoutes());

  // API routes (with /api prefix)
  router.use('/api', createApiRoutes(scrapingJobService));

  return router;
}

// Individual route creators are only used internally
// External consumers should use the main createRoutes function
