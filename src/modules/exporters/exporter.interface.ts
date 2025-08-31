import { PropertyDto } from '../../dto';
import { ExporterType } from '../../utils/constants';

/**
 * Interface for data exporters
 * Focused on exporting scraped property data
 */
export interface IExporter {
  /**
   * Export a single property
   * @param property - The property to export
   * @returns Promise resolving to export result identifier (database ID, etc.)
   */
  exportProperty(property: PropertyDto): Promise<string>;

  /**
   * Export multiple properties
   * @param properties - Array of properties to export
   * @returns Promise resolving to array of export result identifiers
   */
  exportProperties(properties: PropertyDto[]): Promise<string[]>;

  /**
   * Get the exporter type/name
   * @returns String identifying the exporter type
   */
  getExporterType(): ExporterType;
}
