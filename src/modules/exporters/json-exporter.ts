import fs from 'fs';
import path from 'path';
import type { PropertyDto } from '../../dto';
import { Logger } from '../../utils/logger';
import { IExporter } from './exporter.interface';
import { Config } from '../../config';
import { ExporterType } from '../../utils/constants';

export class JsonExporter implements IExporter {
  private logger = new Logger(JsonExporter.name);

  async exportProperty(property: PropertyDto): Promise<string> {
    const properties = [property];
    const results = await this.exportProperties(properties);
    return results[0];
  }

  async exportProperties(properties: PropertyDto[]): Promise<string[]> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `properties-${timestamp}.json`;
      const filePath = path.join(Config.PATHS.dataOutput, filename);

      // Ensure output directory exists
      await fs.promises.mkdir(Config.PATHS.dataOutput, { recursive: true });

      // Convert properties to JSON
      const jsonData = {
        exportedAt: new Date().toISOString(),
        totalProperties: properties.length,
        properties: properties.map(prop => ({
          ...prop,
          scrapedAt: prop.scrapedAt.toISOString(),
          postDate: prop.postDate.toISOString(),
          expiryDate: prop.expiryDate?.toISOString() || null,
          // Parse JSON string fields back to arrays for JSON export
          features: this.parseJsonField(prop.features),
          amenities: this.parseJsonField(prop.amenities),
          images: this.parseJsonField(prop.images),
          videos: prop.videos ? this.parseJsonField(prop.videos) : null,
          nearbyLandmarks: prop.nearbyLandmarks ? this.parseJsonField(prop.nearbyLandmarks) : null,
          transportationInfo: prop.transportationInfo ? this.parseJsonField(prop.transportationInfo) : null
        }))
      };

      // Write to file
      await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');


      
      // Return file paths as identifiers
      return properties.map(() => filePath);

    } catch (error) {
      this.logger.error('Failed to export properties to JSON:', error as Error);
      throw error;
    }
  }

  private parseJsonField(jsonString: string): any {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      // If parsing fails, return the original string
      return jsonString;
    }
  }

  getExporterType(): ExporterType {
    return ExporterType.JSON;
  }
}
