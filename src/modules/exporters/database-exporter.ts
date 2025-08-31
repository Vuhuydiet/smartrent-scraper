import { PrismaClient } from '../../generated/prisma';
import type { PropertyDto } from '../../dto';
import { Logger } from '../../utils/logger';
import { IExporter } from './exporter.interface';
import { ExporterType } from '../../utils/constants';

export class DatabaseExporter implements IExporter {
  private logger = new Logger(DatabaseExporter.name);

  constructor(private prisma: PrismaClient) {}

  async exportProperty(propertyData: PropertyDto): Promise<string> {
    // Basic validation for required fields
    if (!propertyData.title || !propertyData.address || !propertyData.sourceUrl) {
      const errorMessage = 'Property missing required fields: title, address, or sourceUrl';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    try {
      const property = await this.prisma.scrapedProperties.upsert({
        where: { sourceUrl: propertyData.sourceUrl },
        update: {
          // Core identification
          title: propertyData.title,
          description: propertyData.description || null,
          
          // Pricing information (flattened)
          price: propertyData.price || null,
          priceUnit: propertyData.priceUnit || null,
          currency: propertyData.currency || 'VND',
          pricePerPerson: propertyData.pricePerPerson || null,
          deposit: propertyData.deposit || null,
          
          // Additional fees (flattened)
          parkingMotorcycleFee: propertyData.parkingMotorcycleFee || null,
          parkingScooterFee: propertyData.parkingScooterFee || null,
          electricityRate: propertyData.electricityRate || null,
          electricityAllowanceAC: propertyData.electricityAllowanceAC || null,
          electricityAllowanceFan: propertyData.electricityAllowanceFan || null,
          
          // Price variations (flattened)
          regularRoomPrice: propertyData.regularRoomPrice || null,
          airConditionedRoomPrice: propertyData.airConditionedRoomPrice || null,
          
          // Location details (flattened)
          address: propertyData.address,
          city: propertyData.city,
          district: propertyData.district,
          ward: propertyData.ward,
          street: propertyData.street,
          country: propertyData.country,
          
          // Vietnamese location IDs
          cityCode: propertyData.cityCode || null,
          districtId: propertyData.districtId || null,
          wardId: propertyData.wardId || null,
          streetId: propertyData.streetId || null,
          
          // Coordinates
          latitude: propertyData.latitude || null,
          longitude: propertyData.longitude || null,
          
          // Property specifications (flattened)
          area: propertyData.area,
          bedrooms: propertyData.bedrooms || null,
          bathrooms: propertyData.bathrooms || null,
          direction: propertyData.direction || null,
          furnishing: propertyData.furnishing || null,
          propertyType: propertyData.propertyType,
          roomCapacity: propertyData.roomCapacity || null,
          
          // Features and amenities (JSON strings)
          features: propertyData.features,
          amenities: propertyData.amenities,
          
          // Media (JSON strings)
          images: propertyData.images,
          videos: propertyData.videos || null,
          virtualTour: propertyData.virtualTour || null,
          
          // Listing metadata (flattened)
          listingId: propertyData.listingId,
          userId: propertyData.userId,
          postDate: propertyData.postDate,
          expiryDate: propertyData.expiryDate || null,
          listingType: propertyData.listingType,
          vipType: propertyData.vipType || null,
          verified: propertyData.verified || null,
          expired: propertyData.expired || null,
          categoryId: propertyData.categoryId || null,
          productType: propertyData.productType || null,
          
          // Source information
          source: propertyData.source,
          scrapedAt: propertyData.scrapedAt,
          
          // Vietnamese-specific fields
          nearbyLandmarks: propertyData.nearbyLandmarks || null,
          transportationInfo: propertyData.transportationInfo || null,
          targetAudience: propertyData.targetAudience || null,
          
          // Scraping metadata
          isActive: true,
        },
        create: {
          // Core identification
          title: propertyData.title,
          description: propertyData.description || null,
          
          // Pricing information (flattened)
          price: propertyData.price || null,
          priceUnit: propertyData.priceUnit || null,
          currency: propertyData.currency || 'VND',
          pricePerPerson: propertyData.pricePerPerson || null,
          deposit: propertyData.deposit || null,
          
          // Additional fees (flattened)
          parkingMotorcycleFee: propertyData.parkingMotorcycleFee || null,
          parkingScooterFee: propertyData.parkingScooterFee || null,
          electricityRate: propertyData.electricityRate || null,
          electricityAllowanceAC: propertyData.electricityAllowanceAC || null,
          electricityAllowanceFan: propertyData.electricityAllowanceFan || null,
          
          // Price variations (flattened)
          regularRoomPrice: propertyData.regularRoomPrice || null,
          airConditionedRoomPrice: propertyData.airConditionedRoomPrice || null,
          
          // Location details (flattened)
          address: propertyData.address,
          city: propertyData.city,
          district: propertyData.district,
          ward: propertyData.ward,
          street: propertyData.street,
          country: propertyData.country,
          
          // Vietnamese location IDs
          cityCode: propertyData.cityCode || null,
          districtId: propertyData.districtId || null,
          wardId: propertyData.wardId || null,
          streetId: propertyData.streetId || null,
          
          // Coordinates
          latitude: propertyData.latitude || null,
          longitude: propertyData.longitude || null,
          
          // Property specifications (flattened)
          area: propertyData.area,
          bedrooms: propertyData.bedrooms || null,
          bathrooms: propertyData.bathrooms || null,
          direction: propertyData.direction || null,
          furnishing: propertyData.furnishing || null,
          propertyType: propertyData.propertyType,
          roomCapacity: propertyData.roomCapacity || null,
          
          // Features and amenities (JSON strings)
          features: propertyData.features,
          amenities: propertyData.amenities,
          
          // Media (JSON strings)
          images: propertyData.images,
          videos: propertyData.videos || null,
          virtualTour: propertyData.virtualTour || null,
          
          // Listing metadata (flattened)
          listingId: propertyData.listingId,
          userId: propertyData.userId,
          postDate: propertyData.postDate,
          expiryDate: propertyData.expiryDate || null,
          listingType: propertyData.listingType,
          vipType: propertyData.vipType || null,
          verified: propertyData.verified || null,
          expired: propertyData.expired || null,
          categoryId: propertyData.categoryId || null,
          productType: propertyData.productType || null,
          
          // Source information
          source: propertyData.source,
          sourceUrl: propertyData.sourceUrl,
          scrapedAt: propertyData.scrapedAt,
          
          // Vietnamese-specific fields
          nearbyLandmarks: propertyData.nearbyLandmarks || null,
          transportationInfo: propertyData.transportationInfo || null,
          targetAudience: propertyData.targetAudience || null,
          
          // Scraping metadata
          isActive: true,
        },
      });

      return property.id;
    } catch (error) {
      this.logger.error('Failed to export property to database', error as Error);
      throw error;
    }
  }

  async exportProperties(properties: PropertyDto[]): Promise<string[]> {
    const propertyIds: string[] = [];
    
    for (const property of properties) {
      try {
        const id = await this.exportProperty(property);
        propertyIds.push(id);
      } catch (error) {
        this.logger.error(`Failed to export property ${property.id}`, error as Error);
        // Continue with other properties
      }
    }


    return propertyIds;
  }

  getExporterType(): ExporterType {
    return ExporterType.DATABASE;
  }

}
