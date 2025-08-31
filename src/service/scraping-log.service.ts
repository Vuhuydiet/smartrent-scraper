import { PrismaClient } from '../generated/prisma';
import { Logger } from '../utils/logger';

export class ScrapingLogService {
  private logger = new Logger(ScrapingLogService.name);

  constructor(private prisma: PrismaClient) {}

  /**
   * Log a scraping event to the database
   */
  async logScrapingEvent(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    source: string,
    metadata?: any
  ): Promise<void> {
    try {
      await this.prisma.scrapingLogs.create({
        data: {
          level,
          message,
          source,
          metadata: metadata || null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log scraping event', error as Error);
      // Don't throw here to avoid disrupting the main scraping process
    }
  }

  /**
   * Get recent logs with optional filtering
   */
  async getLogs(options: {
    level?: 'info' | 'warn' | 'error' | 'debug';
    source?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      const { level, source, limit = 100, offset = 0 } = options;

      const logs = await this.prisma.scrapingLogs.findMany({
        where: {
          ...(level && { level }),
          ...(source && { source }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return logs;
    } catch (error) {
      this.logger.error('Failed to get logs', error as Error);
      throw error;
    }
  }

  /**
   * Get log statistics
   */
  async getLogStatistics(): Promise<{
    totalLogs: number;
    logsByLevel: Record<string, number>;
    recentLogs: number;
  }> {
    try {
      const [totalLogs, logsByLevel, recentLogs] = await Promise.all([
        this.prisma.scrapingLogs.count(),
        this.prisma.scrapingLogs.groupBy({
          by: ['level'],
          _count: { level: true },
        }),
        this.prisma.scrapingLogs.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      const logsByLevelMap = logsByLevel.reduce((acc, item) => {
        acc[item.level] = item._count.level;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalLogs,
        logsByLevel: logsByLevelMap,
        recentLogs,
      };
    } catch (error) {
      this.logger.error('Failed to get log statistics', error as Error);
      throw error;
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = await this.prisma.scrapingLogs.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.info(`Cleaned up ${result.count} old log entries`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup old logs', error as Error);
      throw error;
    }
  }
}
