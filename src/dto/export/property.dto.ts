/**
 * Property Data Transfer Objects
 * Flattened structure for MySQL storage
 */

export interface PropertyDto {
  // Core identification
  id: string;
  title: string;
  description?: string;
  
  // Pricing information (flattened)
  price: number; // main price in VND
  priceUnit: string; // e.g., "triệu/tháng"
  currency: string; // e.g., "VND"
  pricePerPerson?: number;
  deposit?: number;
  
  // Additional fees (flattened)
  parkingMotorcycleFee?: number;
  parkingScooterFee?: number;
  electricityRate?: number;
  electricityAllowanceAC?: number;
  electricityAllowanceFan?: number;
  
  // Price variations (flattened)
  regularRoomPrice?: number;
  airConditionedRoomPrice?: number;
  
  // Location details (flattened)
  address: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  country: string;
  
  // Vietnamese location IDs for precise mapping
  cityCode?: string;
  districtId?: number;
  wardId?: number;
  streetId?: number;
  
  // Coordinates
  latitude?: number;
  longitude?: number;
  
  // Property specifications (flattened)
  area: number; // in m²
  bedrooms?: number;
  bathrooms?: number;
  direction?: string; // e.g., "Đông" (East)
  furnishing?: string; // e.g., "Đầy đủ" (Fully furnished)
  propertyType: string;
  roomCapacity?: number; // beds per room
  
  // Features and amenities (JSON strings for MySQL storage)
  features: string; // JSON array as string
  amenities: string; // JSON array as string
  
  // Media (JSON strings for MySQL storage)
  images: string; // JSON array of image URLs as string
  videos?: string; // JSON array of video URLs as string
  virtualTour?: string;  
  
  // Listing metadata (flattened)
  listingId: string;
  userId: string;
  postDate: Date;
  expiryDate?: Date;
  listingType: string; // e.g., "Tin VIP Kim Cương"
  vipType?: number;
  verified?: boolean;
  expired?: boolean;
  categoryId?: number;
  productType?: number;
  
  // Scraping metadata
  source: string;
  sourceUrl: string;
  scrapedAt: Date;
  
  // Additional Vietnamese-specific fields
  nearbyLandmarks?: string; // JSON array as string
  transportationInfo?: string; // JSON array as string
  targetAudience?: string; // e.g., "sinh viên đại học" (university students)
}


