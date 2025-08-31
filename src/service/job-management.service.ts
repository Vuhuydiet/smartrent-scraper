import { PrismaClient } from '../generated/prisma';
import { Logger } from '../utils/logger';

export interface JobResult {
  itemsFound?: number;
  itemsProcessed?: number;
  errors?: any;
  duration?: number;
}

export interface JobUpdateData {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  itemsFound?: number;
  itemsProcessed?: number;
  errors?: any;
  duration?: number;
}

export class JobManagementService {
  private logger = new Logger(JobManagementService.name);

  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new scraping job
   */
  async createScrapingJob(
    source: string,
    status: 'pending' | 'running' | 'completed' | 'failed' = 'pending',
    config?: any,
    results?: JobResult
  ): Promise<string> {
    try {
      const job = await this.prisma.scrapingJobs.create({
        data: {
          source,
          status,
          config: config || null,
          itemsFound: results?.itemsFound || 0,
          itemsProcessed: results?.itemsProcessed || 0,
          errors: results?.errors || null,
          startedAt: status === 'running' ? new Date() : null,
          completedAt: ['completed', 'failed'].includes(status) ? new Date() : null,
          duration: results?.duration || null,
        },
      });

      this.logger.info(`Created scraping job ${job.id} for source: ${source}`);
      return job.id;
    } catch (error) {
      this.logger.error('Failed to create scraping job', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing scraping job
   */
  async updateScrapingJob(jobId: string, updates: JobUpdateData): Promise<void> {
    try {
      const updateData: any = { ...updates };
      
      // Set timestamps based on status
      if (updates.status === 'running' && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }
      
      if (['completed', 'failed'].includes(updates.status || '')) {
        updateData.completedAt = new Date();
      }

      await this.prisma.scrapingJobs.update({
        where: { id: jobId },
        data: updateData,
      });

      this.logger.info(`Updated scraping job ${jobId} with status: ${updates.status}`);
    } catch (error) {
      this.logger.error(`Failed to update scraping job ${jobId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get a scraping job by ID
   */
  async getScrapingJob(jobId: string): Promise<any | null> {
    try {
      const job = await this.prisma.scrapingJobs.findUnique({
        where: { id: jobId },
      });

      return job;
    } catch (error) {
      this.logger.error(`Failed to get scraping job ${jobId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get multiple scraping jobs with filtering
   */
  async getScrapingJobs(options: {
    status?: string;
    source?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      const { status, source, limit = 50, offset = 0 } = options;

      const jobs = await this.prisma.scrapingJobs.findMany({
        where: {
          ...(status && { status }),
          ...(source && { source }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return jobs;
    } catch (error) {
      this.logger.error('Failed to get scraping jobs', error as Error);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getJobStatistics(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    try {
      const [total, pending, running, completed, failed] = await Promise.all([
        this.prisma.scrapingJobs.count(),
        this.prisma.scrapingJobs.count({ where: { status: 'pending' } }),
        this.prisma.scrapingJobs.count({ where: { status: 'running' } }),
        this.prisma.scrapingJobs.count({ where: { status: 'completed' } }),
        this.prisma.scrapingJobs.count({ where: { status: 'failed' } }),
      ]);

      return {
        total,
        pending,
        running,
        completed,
        failed,
      };
    } catch (error) {
      this.logger.error('Failed to get job statistics', error as Error);
      throw error;
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await this.prisma.scrapingJobs.deleteMany({
        where: {
          status: { in: ['completed', 'failed'] },
          completedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.info(`Cleaned up ${result.count} old job records`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup old jobs', error as Error);
      throw error;
    }
  }
}
