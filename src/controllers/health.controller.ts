import { Request, Response } from 'express';
import { Config } from '../config';

/**
 * Health check controller
 */
export class HealthController {
  /**
   * GET /health
   * Health check endpoint
   */
  public getHealth = (req: Request, res: Response): void => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: Config.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: healthData
    });
  };
}
