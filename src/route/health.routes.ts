import { Router } from 'express';
import { HealthController } from '../controller/health.controller';

/**
 * Health routes
 */
export function createHealthRoutes(): Router {
  const router = Router();
  const healthController = new HealthController();

  // GET /health - Health check
  router.get('/health', healthController.getHealth);

  return router;
}
