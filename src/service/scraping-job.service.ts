import { PrismaClient } from '../generated/prisma';
import { ScraperFactory } from '../modules/scrapers';
import { ExporterFactory } from '../modules/exporters';
import { Logger } from '../utils/logger';
import { JobManagementService } from './job-management.service';
import { ScrapingLogService } from './scraping-log.service';

import type { WebsiteCode, ExporterType } from '../utils/constants';
import { ScrapingJobRequest } from '../dto/request/scraping-job.dto';

export interface JobListOptions {
  status?: string;
  limit?: number;
  offset?: number;
}

export class ScrapingJobService {
  private logger = new Logger(ScrapingJobService.name);
  private runningJobs = new Map<string, Promise<void>>();
  private jobManagementService: JobManagementService;
  private scrapingLogService: ScrapingLogService;

  constructor(prisma: PrismaClient) {
    this.jobManagementService = new JobManagementService(prisma);
    this.scrapingLogService = new ScrapingLogService(prisma);
  }

  async createScrapingJob(scrapingJob: ScrapingJobRequest): Promise<string> {
    try {
      // Create job record in database using the job management service
      const config = { url: scrapingJob.url, websiteCode: scrapingJob.websiteCode, exporters: scrapingJob.exporters, createdBy: 'api' };
      const jobId = await this.jobManagementService.createScrapingJob(
        scrapingJob.websiteCode,
        'pending',
        config
      );

      // Start background processing
      this.startBackgroundJob(jobId, scrapingJob);

      return jobId;
    } catch (error: any) {
      this.logger.error('Failed to create scraping job:', error as Error);
      throw error;
    }
  }

  private startBackgroundJob(jobId: string, scrapingJob: ScrapingJobRequest): void {
    // Create promise for background processing
    const jobPromise = this.processScrapingJob(jobId, scrapingJob);
    
    // Store running job
    this.runningJobs.set(jobId, jobPromise);
    
    // Clean up when job completes
    jobPromise.finally(() => {
      this.runningJobs.delete(jobId);
    });

    this.logger.info(`Started background job: ${jobId} for ${scrapingJob.websiteCode} URL: ${scrapingJob.url} with exporters: ${scrapingJob.exporters.join(', ')}`);
  }

  private async processScrapingJob(jobId: string, scrapingJob: ScrapingJobRequest): Promise<void> {
    // Get exporters for this specific job
    const exporters = ExporterFactory.getExporters(scrapingJob.exporters as ExporterType[]);
    
    // Get scraper
    const scraper = ScraperFactory.getScraper(scrapingJob.websiteCode as WebsiteCode);
    
    try {
      // Mark job as running
      await this.jobManagementService.updateScrapingJob(jobId, {
        status: 'running'
      });

      await this.scrapingLogService.logScrapingEvent(
        'info',
        'Starting scraping job',
        'job-service',
        { jobId, url: scrapingJob.url, websiteCode: scrapingJob.websiteCode, exporters: scrapingJob.exporters }
      );

      // Initialize scraper and scrape the URL
      await scraper.initialize();
      const scrapedProperties = await scraper.scrapeAllPropertiesFromFirstPage(scrapingJob.url, scrapingJob.start, scrapingJob.limit);

      for (const exporter of exporters) {
        try {
          await exporter.exportProperties(scrapedProperties);
          this.logger.info(`Successfully exported ${scrapedProperties.length} properties using ${exporter.getExporterType()}`);
        } catch (error) {
          this.logger.error(`${exporter.getExporterType()} export failed:`, error as Error);
          // Log the export error but don't fail the entire job
          await this.scrapingLogService.logScrapingEvent(
            'error',
            `Export failed for ${exporter.getExporterType()}`,
            'job-service',
            { 
              jobId, 
              url: scrapingJob.url, 
              websiteCode: scrapingJob.websiteCode,
              exporter: exporter.getExporterType(),
              error: error instanceof Error ? error.message : String(error) 
            }
          );
        }
      }

      // Mark job as completed with results
      await this.jobManagementService.updateScrapingJob(jobId, {
        status: 'completed',
        itemsFound: scrapedProperties.length,
        itemsProcessed: scrapedProperties.length
      });

      await this.scrapingLogService.logScrapingEvent(
        'info',
        'Scraping job completed successfully',
        'job-service',
        { jobId, url: scrapingJob.url, websiteCode: scrapingJob.websiteCode, exporters: scrapingJob.exporters }
      );

      this.logger.info(`Job ${jobId} for ${scrapingJob.websiteCode} completed successfully with exporters: ${scrapingJob.exporters.join(', ')}`);

    } catch (error: any) {
      this.logger.error(`Job ${jobId} for ${scrapingJob.websiteCode} failed:`, error as Error);

      // Mark job as failed
      await this.jobManagementService.updateScrapingJob(jobId, {
        status: 'failed',
        errors: {
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      });

      await this.scrapingLogService.logScrapingEvent(
        'error',
        'Scraping job failed',
        'job-service',
        { 
          jobId, 
          url: scrapingJob.url, 
          websiteCode: scrapingJob.websiteCode,
          exporters: scrapingJob.exporters,
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    } finally {
      // Cleanup scraper
      await scraper.cleanup();
      this.logger.debug(`Job ${jobId} for ${scrapingJob.websiteCode} processing completed`);
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      const job = await this.jobManagementService.getScrapingJob(jobId);

      if (!job) {
        return null;
      }

      // Add runtime status for running jobs
      const isRunning = this.runningJobs.has(jobId);
      
      return {
        ...job,
        isCurrentlyRunning: isRunning,
        config: job.config || {}
      };
    } catch (error: any) {
      this.logger.error('Failed to get job status:', error as Error);
      throw error;
    }
  }

  async listJobs(options: JobListOptions = {}): Promise<any[]> {
    try {
      const { status, limit = 50, offset = 0 } = options;

      const jobs = await this.jobManagementService.getScrapingJobs({
        status,
        limit,
        offset
      });

      // Add runtime status for running jobs
      return jobs.map((job: any) => ({
        ...job,
        isCurrentlyRunning: this.runningJobs.has(job.id),
        config: job.config || {}
      }));
    } catch (error: any) {
      this.logger.error('Failed to list jobs:', error as Error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    try {
      // Get database exporter for property statistics
      const dbExporter = ExporterFactory.getExporter('database' as ExporterType) as any;
      
      const [jobStats, propertyStats] = await Promise.all([
        this.jobManagementService.getJobStatistics(),
        dbExporter.getPropertyStatistics()
      ]);

      return {
        jobs: {
          total: jobStats.total,
          pending: jobStats.pending,
          running: jobStats.running + this.runningJobs.size, // Include in-memory running jobs
          completed: jobStats.completed,
          failed: jobStats.failed
        },
        properties: {
          total: propertyStats.totalProperties,
          recentlyScraped: propertyStats.recentProperties
        },
        system: {
          activeJobs: this.runningJobs.size,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to get statistics:', error as Error);
      throw error;
    }
  }
}
