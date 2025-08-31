import express, { Application, Request, Response } from 'express';
import { Logger } from './utils/logger';
import { ScrapingJobService } from './service';
import { Config } from './config';
import { createRoutes } from './routes';

export class ExpressApp {
  private app: Application;
  private logger = new Logger(ExpressApp.name);

  constructor(private scrapingJobService: ScrapingJobService) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    
    this.app.use(express.urlencoded({ extended: true }));
    
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      this.logger.error('Express error:', error as Error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: Config.isDevelopment() ? error.message : 'Something went wrong'
        });
      }
    });
  }

  private setupRoutes(): void {
    this.app.use('/', createRoutes(this.scrapingJobService));
  }

  public getApp(): Application {
    return this.app;
  }

  public async start(port: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        this.logger.info(`🚀 Server started on port ${port}`);
        this.logger.info(`📊 Health check: http://localhost:${port}/health`);
        this.logger.info(`🔗 API docs: http://localhost:${port}/api`);
        resolve();
      });
    });
  }
}
