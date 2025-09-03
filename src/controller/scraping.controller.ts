import { Request, Response } from 'express';
import { ScrapingJobService } from '../service';
import { CreateScrapingJobRequestSchema, JobListQuerySchema } from '../dto';
import { Logger } from '../utils/logger';

/**
 * Scraping operations controller
 */
export class ScrapingController {
  private logger = new Logger(ScrapingController.name);

  constructor(private scrapingJobService: ScrapingJobService) {}

  /**
   * POST /api/scrape
   * Create a new scraping job
   */
  public createScrapingJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = CreateScrapingJobRequestSchema.safeParse(req.body);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: errors.join(', ')
        });
        return;
      }

      const { url, websiteCode, exporters } = validation.data;

      const jobId = await this.scrapingJobService.createScrapingJob(validation.data);

      this.logger.info(`Created scraping job: ${jobId} for ${websiteCode} URL: ${url}`);

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: {
          jobId,
          url,
          websiteCode,
          exporters,
          message: 'Scraping job created and started'
        }
      });
    } catch (error: any) {
      this.logger.error('Controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  };

  /**
   * GET /api/jobs/:jobId
   * Get job status by ID
   */
  public getJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Job ID is required'
        });
        return;
      }

      const job = await this.scrapingJobService.getJobStatus(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Job not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Job status retrieved successfully',
        data: { job }
      });
    } catch (error: any) {
      this.logger.error('Controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  };

  /**
   * GET /api/jobs
   * List all jobs with pagination and filtering
   */
  public listJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = JobListQuerySchema.safeParse(req.query);
      if (!validation.success) {
        const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: errors.join(', ')
        });
        return;
      }

      const { status, limit, offset } = validation.data;

      const jobs = await this.scrapingJobService.listJobs({
        status,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        message: 'Jobs retrieved successfully',
        data: {
          jobs,
          pagination: {
            limit,
            offset,
            total: jobs.length
          }
        }
      });
    } catch (error: any) {
      this.logger.error('Controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  };

  /**
   * GET /api/stats
   * Get scraping statistics
   */
  public getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.scrapingJobService.getStatistics();

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: { stats }
      });
    } catch (error: any) {
      this.logger.error('Controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  };

}
