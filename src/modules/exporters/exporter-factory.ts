/**
 * Exporter Factory & Registry
 * Manages exporter instances with dynamic registration
 */

import { IExporter } from './exporter.interface';
import type { ExporterType } from '../../utils/constants';
import { Logger } from '../../utils/logger';

export class ExporterFactory {
  private static logger = new Logger(ExporterFactory.name);
  private static exporters = new Map<ExporterType, IExporter>();

  /**
   * Register an exporter instance for a type
   */
  static register(exporterType: ExporterType, exporter: IExporter): void {
    this.exporters.set(exporterType, exporter);
  }

  /**
   * Get an exporter instance by type
   */
  static getExporter(exporterType: ExporterType): IExporter {
    const exporter = this.exporters.get(exporterType);
    
    if (!exporter) {
      const error = `No exporter registered for type: ${exporterType}`;
      this.logger.error(error);
      throw new Error(error);
    }

    return exporter;
  }

  /**
   * Get multiple exporter instances
   */
  static getExporters(exporterTypes: ExporterType[]): IExporter[] {
    return exporterTypes.map(type => this.getExporter(type));
  }

  /**
   * Clear all registrations (useful for testing)
   */
  static clear(): void {
    this.exporters.clear();
  }
}