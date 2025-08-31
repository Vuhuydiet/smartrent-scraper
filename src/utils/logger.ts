import winston from 'winston';
import { Config } from '../config';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
  })
);

const logger = winston.createLogger({
  level: Config.LOG_LEVEL,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(Config.PATHS.logOutput, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(Config.PATHS.logOutput, 'combined.log')
    })
  ]
});

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  error(message: string, error?: Error): void {
    logger.error(`[${this.context}] ${message}`, error);
  }

  warn(message: string): void {
    logger.warn(`[${this.context}] ${message}`);
  }

  info(message: string): void {
    logger.info(`[${this.context}] ${message}`);
  }

  debug(message: string): void {
    logger.debug(`[${this.context}] ${message}`);
  }
}
