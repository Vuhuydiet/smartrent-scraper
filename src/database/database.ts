import { PrismaClient } from "../generated/prisma";
import { Logger } from "../utils/logger";

export class DatabaseService {
  private _prisma: PrismaClient;
  private logger = new Logger(DatabaseService.name);

  constructor() {
    this._prisma = new PrismaClient({
      log: [
        { level: "query", emit: "event" },
        { level: "error", emit: "event" },
        { level: "info", emit: "event" },
        { level: "warn", emit: "event" },
      ],
    });
  }

  public get prisma(): PrismaClient {
    return this._prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this._prisma.$connect();
      this.logger.info("✅ Database connected successfully");
    } catch (error: any) {
      this.logger.error("❌ Failed to connect to database:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this._prisma.$disconnect();
      this.logger.info("📡 Database disconnected");
    } catch (error: any) {
      this.logger.error("❌ Error disconnecting from database:", error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this._prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      this.logger.error("❌ Database health check failed:", error);
      return false;
    }
  }

  public async getStats(): Promise<{
    propertiesCount: number;
    scrapingJobsCount: number;
    recentLogsCount: number;
  }> {
    try {
      const [propertiesCount, scrapingJobsCount, recentLogsCount] =
        await Promise.all([
          this._prisma.scrapedProperties.count(),
          this._prisma.scrapingJobs.count(),
          this._prisma.scrapingLogs.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          }),
        ]);

      return {
        propertiesCount,
        scrapingJobsCount,
        recentLogsCount,
      };
    } catch (error: any) {
      this.logger.error("❌ Failed to get database stats:", error);
      throw error;
    }
  }
}

// Create a default instance for convenience
export const db = new DatabaseService();
export const prisma = db.prisma;
