import fs from 'fs';
import path from 'path';
import type { PropertyDto } from '../../dto';
import { Logger } from '../../utils/logger';
import { IExporter } from './exporter.interface';
import { Config } from '../../config';
import { ExporterType } from '../../utils/constants';

export class CsvExporter implements IExporter {
  private logger = new Logger(CsvExporter.name);

  async exportProperty(property: PropertyDto): Promise<string> {
    const properties = [property];
    const results = await this.exportProperties(properties);
    return results[0];
  }

  async exportProperties(properties: PropertyDto[]): Promise<string[]> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `properties-${timestamp}.csv`;
      const filePath = path.join(Config.PATHS.dataOutput, filename);

      // Ensure output directory exists
      await fs.promises.mkdir(Config.PATHS.dataOutput, { recursive: true });

      // Create CSV content
      const csvContent = this.propertiesToCsv(properties);

      // Write to file
      await fs.promises.writeFile(filePath, csvContent, 'utf8');


      
      // Return file paths as identifiers
      return properties.map(() => filePath);

    } catch (error) {
      this.logger.error('Failed to export properties to CSV:', error as Error);
      throw error;
    }
  }

  private propertiesToCsv(properties: PropertyDto[]): string {
    if (properties.length === 0) {
      return '';
    }

    // Define CSV headers for flattened structure
    const headers = [
      'id', 'title', 'description', 'price', 'priceUnit', 'currency', 'pricePerPerson', 'deposit',
      'parkingMotorcycleFee', 'parkingScooterFee', 'electricityRate',
      'regularRoomPrice', 'airConditionedRoomPrice',
      'address', 'city', 'district', 'ward', 'street', 'country',
      'cityCode', 'districtId', 'wardId', 'streetId', 'latitude', 'longitude',
      'area', 'bedrooms', 'bathrooms', 'direction', 'furnishing', 'propertyType', 'roomCapacity',
      'features', 'amenities', 'images', 'videos', 'virtualTour',
      'listingId', 'userId', 'postDate', 'expiryDate', 'listingType', 'vipType', 'verified', 'expired',
      'categoryId', 'productType', 'source', 'sourceUrl', 'scrapedAt',
      'nearbyLandmarks', 'transportationInfo', 'targetAudience'
    ];

    // Create CSV rows
    const rows = properties.map(property => [
      this.escapeCsvValue(property.id),
      this.escapeCsvValue(property.title),
      this.escapeCsvValue(property.description || ''),
      property.price?.toString() || '',
      this.escapeCsvValue(property.priceUnit || ''),
      this.escapeCsvValue(property.currency),
      property.pricePerPerson?.toString() || '',
      property.deposit?.toString() || '',
      property.parkingMotorcycleFee?.toString() || '',
      property.parkingScooterFee?.toString() || '',
      property.electricityRate?.toString() || '',
      property.regularRoomPrice?.toString() || '',
      property.airConditionedRoomPrice?.toString() || '',
      this.escapeCsvValue(property.address),
      this.escapeCsvValue(property.city),
      this.escapeCsvValue(property.district),
      this.escapeCsvValue(property.ward),
      this.escapeCsvValue(property.street),
      this.escapeCsvValue(property.country),
      this.escapeCsvValue(property.cityCode || ''),
      property.districtId?.toString() || '',
      property.wardId?.toString() || '',
      property.streetId?.toString() || '',
      property.latitude?.toString() || '',
      property.longitude?.toString() || '',
      property.area.toString(),
      property.bedrooms?.toString() || '',
      property.bathrooms?.toString() || '',
      this.escapeCsvValue(property.direction || ''),
      this.escapeCsvValue(property.furnishing || ''),
      this.escapeCsvValue(property.propertyType),
      property.roomCapacity?.toString() || '',
      this.escapeCsvValue(this.parseJsonArrayForCsv(property.features)),
      this.escapeCsvValue(this.parseJsonArrayForCsv(property.amenities)),
      this.escapeCsvValue(this.parseJsonArrayForCsv(property.images)),
      this.escapeCsvValue(this.parseJsonArrayForCsv(property.videos || '')),
      this.escapeCsvValue(property.virtualTour || ''),
      this.escapeCsvValue(property.listingId),
      this.escapeCsvValue(property.userId),
      property.postDate.toISOString(),
      property.expiryDate?.toISOString() || '',
      this.escapeCsvValue(property.listingType),
      property.vipType?.toString() || '',
      property.verified?.toString() || '',
      property.expired?.toString() || '',
      property.categoryId?.toString() || '',
      property.productType?.toString() || '',
      this.escapeCsvValue(property.source),
      this.escapeCsvValue(property.sourceUrl),
      property.scrapedAt.toISOString(),
      this.escapeCsvValue(this.parseJsonArrayForCsv(property.nearbyLandmarks || '')),
      this.escapeCsvValue(this.parseJsonArrayForCsv(property.transportationInfo || '')),
      this.escapeCsvValue(property.targetAudience || '')
    ]);

    // Combine headers and rows
    const csvLines = [headers.join(','), ...rows.map(row => row.join(','))];
    return csvLines.join('\n');
  }

  private parseJsonArrayForCsv(jsonString: string): string {
    if (!jsonString) return '';
    try {
      const array = JSON.parse(jsonString);
      return Array.isArray(array) ? array.join('; ') : jsonString;
    } catch {
      return jsonString;
    }
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  getExporterType(): ExporterType {
    return ExporterType.CSV;
  }
}
