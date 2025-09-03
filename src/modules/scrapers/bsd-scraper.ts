import { Browser, Page } from 'puppeteer';
import { IScraper } from './scraper.interface';
import { PropertyDto } from '../../dto';
import { Logger, ScraperUtils } from '../../utils';
import { WebsiteCode } from '../../utils/constants';
import { URL } from 'url'

// Interface for listing metadata
interface ListingMetadata {
  listingId: string;
  userId: string;
  postDate: string;
  expiryDate?: string;
  listingType: string;
  vipType?: string;
  verified?: boolean;
  expired?: boolean;
  categoryId?: string | number;
  productType?: string;
}

// Interface for pricing details
interface PricingDetails {
  pricePerPerson?: number;
  deposit?: number;
  parkingMotorcycleFee?: number;
  parkingScooterFee?: number;
  electricityRate?: number;
  electricityAllowanceAC?: number;
  electricityAllowanceFan?: number;
  regularRoomPrice?: number;
  airConditionedRoomPrice?: number;
}

export class BSDScraper implements IScraper {
  private logger = new Logger(BSDScraper.name);
  private browser?: Browser;

  async initialize(): Promise<void> {
    this.browser = await ScraperUtils.createBrowser();
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }

  getScraperType(): WebsiteCode {
    return WebsiteCode.BSD;
  }

  copy(): IScraper {
    return new BSDScraper();
  }

  async scrapeAllPropertiesFromFirstPage(firstListUrl: string, start: number, limit: number): Promise<PropertyDto[]> {
    try {
      this.logger.info(`Starting to scrape all properties from: ${firstListUrl}`);
      
      // Get total number of pages
      const totalPages = await this.getTotalPages(firstListUrl);
      this.logger.info(`Found ${totalPages} pages to scrape`);
      
      const allProperties: PropertyDto[] = [];
      
      // Iterate through all pages
      for (let pageNum = start; pageNum <= totalPages && (pageNum - start + 1 <= limit); pageNum++) {
        try {
          // Construct URL for each page
          const pageUrl = `${firstListUrl}/p${pageNum}`;
          
          this.logger.info(`Scraping page ${pageNum}/${totalPages}: ${pageUrl}`);
          
          // Scrape properties from current page
          const pageProperties = await this.scrapePropertyList(pageUrl);
          allProperties.push(...pageProperties);
          
          this.logger.info(`Page ${pageNum} completed: ${pageProperties.length} properties found`);
          
          // Add delay between pages to be respectful
          if (pageNum < totalPages) {
            await ScraperUtils.sleep(3000); // 3 second delay between pages
          }
          
        } catch (pageError) {
          this.logger.error(`Failed to scrape page ${pageNum}`, pageError as Error);
          // Continue with next page instead of stopping completely
        }
      }
      
      this.logger.info(`Completed scraping all pages. Total properties found: ${allProperties.length}`);
      return allProperties;
      
    } catch (error) {
      this.logger.error('Failed to scrape all properties from first page', error as Error);
      // Fallback to scraping just the first page
      return this.scrapePropertyList(firstListUrl);
    }
  }

  getPageUrl(listUrl: string, page: number): string {
    const url = new URL(listUrl);
    url.pathname += '/p' + page;

    return url.toString();
  }

  async scrapePropertyList(url: string): Promise<PropertyDto[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await ScraperUtils.createPage(this.browser);
    const properties: PropertyDto[] = [];

    try {
      this.logger.info(`Scraping property list: ${url}`);
      
      // Use retry logic for page loading
      await ScraperUtils.withRetry(async () => {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Wait for the page to be properly loaded
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Give extra time for dynamic content to load
        await ScraperUtils.sleep(2000);
      }, 3, 'property list page loading');

      // Extract property URLs from listing page - try multiple selectors
      const propertyUrls = await page.evaluate(() => {
        const propertySelectors = [
          'a.js__product-link-for-product-id',
          'a[href*="/nha-tro-"]',
          'a[href*="/phong-tro-"]',
          '.product-item a',
          '.re__card-title a',
          'h3 a[href*="/"]'
        ];
        
        let urls: string[] = [];
        
        for (const selector of propertySelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            urls = Array.from(elements).map(el => {
              const href = (el as any).href;
              return href.startsWith('/') ? `https://batdongsan.com.vn${href}` : href;
            });
            console.log(`Found ${urls.length} property URLs using selector: ${selector}`);
            break;
          }
        }
        
        return urls;
      });

      this.logger.info(`Found ${propertyUrls.length} property URLs`);

      // Scrape each property with concurrency control
      const maxConcurrent = 3;
      for (let i = 0; i < propertyUrls.length; i += maxConcurrent) {
        const batch = propertyUrls.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(url => this.scrapeProperty(url));
        
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            properties.push(result.value);
          } else {
            this.logger.warn(`Failed to scrape property at index ${i + index}`);
          }
        });

        // Add delay between batches
        if (i + maxConcurrent < propertyUrls.length) {
          await ScraperUtils.sleep(2000);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to scrape property list ${url}`, error as Error);
    } finally {
      await page.close();
    }

    return properties;
  }

  async scrapeProperty(url: string): Promise<PropertyDto | null> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await ScraperUtils.createPage(this.browser);

    try {
      this.logger.info(`Scraping property: ${url}`);
      
      // Use retry logic for page loading
      await ScraperUtils.withRetry(async () => {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Wait for the page to be properly loaded
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Give extra time for dynamic content to load
        await ScraperUtils.sleep(1000);
      }, 3, 'property page loading');

      // Extract property data
      const propertyData = await this.extractPropertyData(page, url);
      
      if (propertyData) {
        this.logger.info(`Successfully scraped property: ${propertyData.title}`);
      }
      
      return propertyData;
    } catch (error) {
      this.logger.error(`Failed to scrape property ${url}`, error as Error);
      return null;
    } finally {
      await page.close();
    }
  }

  async getTotalPages(listUrl: string): Promise<number> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await ScraperUtils.createPage(this.browser);

    try {
      
      // Use retry logic for page loading
      await ScraperUtils.withRetry(async () => {
        await page.goto(listUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Wait for the page to be properly loaded
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Give extra time for dynamic content to load
        await ScraperUtils.sleep(2000);
      }, 3, 'page loading');
      
      // Extract total pages from pagination - try multiple selectors
      const totalPages = await page.evaluate(() => {
        // Try multiple pagination selectors
        const paginationNumbers = Array.from(document.querySelectorAll('.re__pagination-group a.re__pagination-number'));
        
        if (paginationNumbers.length > 0) {
          const lastPageElement = paginationNumbers[paginationNumbers.length - 1];
          const lastPageText = lastPageElement.textContent?.trim();
          if (lastPageText && !isNaN(Number(lastPageText))) {
            return parseInt(lastPageText);
          }
        }
        return 1;
      });

      return totalPages;

    } catch (error) {
      this.logger.error(`Failed to get total pages from ${listUrl}`, error as Error);
      return 1;
    } finally {
      await page.close();
    }
  }

  private async extractPropertyData(page: Page, url: string): Promise<PropertyDto | null> {
    try {
      // Extract basic property information
      const title = await this.extractText(page, '.re__pr-title, h1');
      const description = await this.extractText(page, '.re__detail-content, .js__pr-description');
      
      // Extract pricing information
      const priceText = await this.extractText(page, '.re__pr-specs-content-item-value, .value');
      const price = this.extractPriceNumber(priceText);
      const priceUnit = this.extractPriceUnit(priceText);
      
      // Extract location information
      const address = await this.extractText(page, '.re__pr-short-description, .js__pr-address');
      const locationData = this.parseAddress(address);
      
      // Extract coordinates from map iframe or JavaScript
      const coordinates = await this.extractCoordinates(page);
      
      // Extract property specifications
      const area = await this.extractArea(page);
      const bedrooms = await this.extractNumber(page, '[title*="phòng ngủ"], .re__pr-specs-content-item-value');
      const bathrooms = await this.extractNumber(page, '[title*="phòng tắm"], [title*="WC"]');
      
      // Extract additional property details
      const direction = await this.extractText(page, '[title*="hướng"], .direction');
      const furnishing = await this.extractText(page, '[title*="nội thất"], .furnishing');
      
      // Extract images
      const images = await this.extractImages(page);
      
      // Extract features and amenities from description
      const { features, amenities } = this.parseDescriptionFeatures(description);
      
      // Extract listing metadata
      const listingMetadata = await this.extractListingMetadata(page);
      
      // Extract JSON-LD structured data
      const structuredData = await this.extractStructuredData(page);
      
      // Extract pricing details from description
      const pricingDetails = this.extractPricingDetails(description);

      const property: PropertyDto = {
        // Core identification
        id: (structuredData?.identifier as string) || this.generatePropertyId(url, title),
        title: title || 'Untitled Property',
        description: description || undefined,
        
        // Pricing information (flattened)
        price: price,
        priceUnit: priceUnit || 'triệu/tháng',
        currency: 'VND',
        pricePerPerson: pricingDetails.pricePerPerson,
        deposit: pricingDetails.deposit,
        
        // Additional fees (flattened)
        parkingMotorcycleFee: pricingDetails.parkingMotorcycleFee,
        parkingScooterFee: pricingDetails.parkingScooterFee,
        electricityRate: pricingDetails.electricityRate,
        electricityAllowanceAC: pricingDetails.electricityAllowanceAC,
        electricityAllowanceFan: pricingDetails.electricityAllowanceFan,
        
        // Price variations (flattened)
        regularRoomPrice: pricingDetails.regularRoomPrice,
        airConditionedRoomPrice: pricingDetails.airConditionedRoomPrice,
        
        // Location details (flattened)
        address: locationData.address,
        city: locationData.city,
        district: locationData.district,
        ward: locationData.ward,
        street: locationData.street,
        country: 'Vietnam',
        
        // Vietnamese location IDs (extracted from page data)
        cityCode: await this.extractCityCode(page),
        districtId: await this.extractDistrictId(page),
        wardId: await this.extractWardId(page),
        streetId: await this.extractStreetId(page),
        
        // Coordinates
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        
        // Property specifications (flattened)
        area: area,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        direction: direction || undefined,
        furnishing: furnishing || undefined,
        propertyType: this.extractPropertyType(title, description),
        roomCapacity: this.extractRoomCapacity(description),
        
        // Features and amenities (JSON strings)
        features: JSON.stringify(features),
        amenities: JSON.stringify(amenities),
        
        // Media (JSON strings)
        images: JSON.stringify(images),
        videos: undefined,
        virtualTour: undefined,
        
        // Listing metadata (flattened)
        listingId: listingMetadata.listingId,
        userId: listingMetadata.userId,
        postDate: new Date(listingMetadata.postDate),
        expiryDate: listingMetadata.expiryDate ? new Date(listingMetadata.expiryDate) : undefined,
        listingType: listingMetadata.listingType,
        vipType: typeof listingMetadata.vipType === 'string' ? parseInt(listingMetadata.vipType) || undefined : listingMetadata.vipType,
        verified: listingMetadata.verified,
        expired: listingMetadata.expired,
        categoryId: typeof listingMetadata.categoryId === 'string' ? parseInt(listingMetadata.categoryId) || undefined : listingMetadata.categoryId,
        productType: typeof listingMetadata.productType === 'string' ? parseInt(listingMetadata.productType) || undefined : listingMetadata.productType,
        
        // Source information
        source: 'batdongsan.com.vn',
        sourceUrl: url,
        scrapedAt: new Date(),
        
        // Vietnamese-specific fields
        nearbyLandmarks: JSON.stringify(this.extractNearbyLandmarks(description)),
        transportationInfo: JSON.stringify(this.extractTransportationInfo(description)),
        targetAudience: this.extractTargetAudience(description),
      };

      return property;

    } catch (error) {
      this.logger.error('Failed to extract property data', error as Error);
            return null;
    }
  }

  // Helper methods for data extraction

  private async extractText(page: Page, selector: string): Promise<string> {
    try {
      return await page.$eval(selector, el => el.textContent?.trim() || '');
    } catch {
      return '';
    }
  }

  private async extractNumber(page: Page, selector: string): Promise<number | undefined> {
    try {
      const text = await this.extractText(page, selector);
      const number = ScraperUtils.extractNumber(text);
      return number > 0 ? number : undefined;
    } catch {
      return undefined;
    }
  }

  private extractPriceNumber(priceText: string): number {
    // Handle Vietnamese price format like "1,4 triệu/tháng"
    const match = priceText.match(/([\d,]+(?:\.\d+)?)/);
    if (match) {
      const numberStr = match[1].replace(/,/g, '');
      return parseFloat(numberStr);
    }
    return 0;
  }

  private extractPriceUnit(priceText: string): string {
    if (priceText.includes('triệu/tháng')) return 'triệu/tháng';
    if (priceText.includes('million/month')) return 'million/month';
    if (priceText.includes('/tháng')) return '/tháng';
    return 'triệu/tháng';
  }

  private parseAddress(address: string): {
    address: string;
    city: string;
    district: string;
    ward: string;
    street: string;
  } {
    // Parse Vietnamese address format: "60/18A, Đường Huỳnh Khương An, Phường 5, Gò Vấp, Hồ Chí Minh"
    const parts = address.split(',').map(part => part.trim());
    
    return {
      address: address,
      city: parts[parts.length - 1] || 'Hồ Chí Minh',
      district: parts[parts.length - 2] || '',
      ward: parts[parts.length - 3] || '',
      street: parts[1] || parts[0] || '',
    };
  }

  private async extractCoordinates(page: Page): Promise<{ latitude: number; longitude: number } | undefined> {
    try {
      // Extract from map iframe URL or JavaScript variables
      const coordinates = await page.evaluate(() => {
        // Check for coordinates in iframe src
        const iframe = document.querySelector('iframe[src*="maps"]') as any;
        if (iframe?.src) {
          const match = iframe.src.match(/q=([0-9.-]+),([0-9.-]+)/);
          if (match) {
            return {
              latitude: parseFloat(match[1]),
              longitude: parseFloat(match[2])
            };
          }
        }

        // Check for coordinates in JavaScript variables
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          if (script.textContent) {
            const latMatch = script.textContent.match(/latitude['":\s]+([0-9.-]+)/);
            const lngMatch = script.textContent.match(/longitude['":\s]+([0-9.-]+)/);
            if (latMatch && lngMatch) {
              return {
                latitude: parseFloat(latMatch[1]),
                longitude: parseFloat(lngMatch[1])
              };
            }
          }
        }

        return null;
      });

      return coordinates || undefined;
    } catch {
      return undefined;
    }
  }

  private async extractArea(page: Page): Promise<number> {
    try {
      const areaText = await this.extractText(page, '[title*="diện tích"], [title*="m²"], .re__pr-specs-content-item-value');
      const match = areaText.match(/(\d+(?:\.\d+)?)\s*m²?/);
      return match ? parseFloat(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  private async extractImages(page: Page): Promise<string[]> {
    try {
      return await page.$$eval(
        '.swiper-slide img.pr-img, .re__media-thumb-item img, img[src*="batdongsan.com.vn"]',
        images => images
          .map(img => (img as any).src)
          .filter(src => src && src.includes('batdongsan.com.vn'))
          .filter((src, index, arr) => arr.indexOf(src) === index) // Remove duplicates
      );
    } catch {
      return [];
    }
  }

  private parseDescriptionFeatures(description: string): { features: string[]; amenities: string[] } {
    const features: string[] = [];
    const amenities: string[] = [];

    if (!description) return { features, amenities };

    // Common Vietnamese property features
    const featureKeywords = [
      'wifi', 'máy giặt', 'thang máy', 'camera', 'an ninh', 'bảo vệ',
      'điều hòa', 'máy lạnh', 'quạt trần', 'WC riêng', 'bếp', 'tủ đồ',
      'giường', 'nệm', 'cửa sổ', 'ban công', 'chỗ để xe'
    ];

    featureKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        if (['wifi', 'máy giặt', 'thang máy', 'camera', 'an ninh'].includes(keyword)) {
          amenities.push(keyword);
        } else {
          features.push(keyword);
        }
      }
    });

    return { features, amenities };
  }

  private async extractListingMetadata(page: Page): Promise<ListingMetadata> {
    try {
      return await page.evaluate(() => {
        // Extract from page tracking data or other metadata
        const pageData = (window as any).pageTrackingData;
        if (pageData?.products?.[0]) {
          const product = pageData.products[0];
          return {
            listingId: product.productId?.toString() || '',
            userId: product.createByUser?.toString() || '',
            postDate: new Date().toISOString(), // Default to current date
            expiryDate: undefined,
            listingType: product.vipType ? 'VIP' : 'Regular',
            vipType: product.vipType,
            verified: product.verified,
            expired: product.expired,
            categoryId: product.cateId,
            productType: product.productType,
          };
        }

        // Fallback extraction from visible elements
        const listingIdEl = document.querySelector('[title*="Mã tin"], .re__pr-short-info-item .value');
        
        return {
          listingId: listingIdEl?.textContent?.trim() || '',
          userId: '',
          postDate: new Date().toISOString(),
          expiryDate: undefined,
          listingType: 'Regular',
          vipType: undefined,
          verified: undefined,
          expired: undefined,
          categoryId: undefined,
          productType: undefined,
        };
      });
    } catch {
      return {
        listingId: '',
        userId: '',
        postDate: new Date().toISOString(),
        expiryDate: undefined,
        listingType: 'Regular',
        vipType: undefined,
        verified: undefined,
        expired: undefined,
        categoryId: undefined,
        productType: undefined,
      };
    }
  }

  private async extractStructuredData(page: Page): Promise<Record<string, unknown> | null> {
    try {
      return await page.evaluate(() => {
        const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        if (jsonLdScript?.textContent) {
          return JSON.parse(jsonLdScript.textContent);
        }
        return null;
      });
    } catch {
      return null;
    }
  }

  private extractPricingDetails(description: string): PricingDetails {
    const details: PricingDetails = {};

    // Extract pricing information from description
    const regularRoomMatch = description.match(/phòng thường[^:]*:\s*từ\s*([\d,]+)/i);
    if (regularRoomMatch) {
      details.regularRoomPrice = parseFloat(regularRoomMatch[1].replace(/,/g, ''));
    }

    const acRoomMatch = description.match(/phòng máy lạnh[^:]*:\s*từ\s*([\d,]+)/i);
    if (acRoomMatch) {
      details.airConditionedRoomPrice = parseFloat(acRoomMatch[1].replace(/,/g, ''));
    }

    const depositMatch = description.match(/cọc[^:]*:\s*([\d,]+)/i);
    if (depositMatch) {
      details.deposit = parseFloat(depositMatch[1].replace(/,/g, ''));
    }

    const motorcycleMatch = description.match(/xe số[^:]*:\s*([\d,]+)/i);
    if (motorcycleMatch) {
      details.parkingMotorcycleFee = parseFloat(motorcycleMatch[1].replace(/,/g, ''));
    }

    const scooterMatch = description.match(/xe tay ga[^:]*:\s*([\d,]+)/i);
    if (scooterMatch) {
      details.parkingScooterFee = parseFloat(scooterMatch[1].replace(/,/g, ''));
    }

    return details;
  }

  private async extractCityCode(page: Page): Promise<string | undefined> {
    try {
      return await page.evaluate(() => {
        const pageData = (window as any).pageTrackingData;
        return pageData?.products?.[0]?.cityCode;
      });
    } catch {
      return undefined;
    }
  }

  private async extractDistrictId(page: Page): Promise<number | undefined> {
    try {
      return await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          if (script.textContent?.includes('districtId')) {
            const match = script.textContent.match(/districtId['":\s]+(\d+)/);
            if (match) return parseInt(match[1]);
          }
        }
        return undefined;
      });
    } catch {
      return undefined;
    }
  }

  private async extractWardId(page: Page): Promise<number | undefined> {
    try {
      return await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          if (script.textContent?.includes('wardId')) {
            const match = script.textContent.match(/wardId['":\s]+(\d+)/);
            if (match) return parseInt(match[1]);
          }
        }
        return undefined;
      });
    } catch {
      return undefined;
    }
  }

  private async extractStreetId(page: Page): Promise<number | undefined> {
    try {
      return await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          if (script.textContent?.includes('streetId')) {
            const match = script.textContent.match(/streetId['":\s]+(\d+)/);
            if (match) return parseInt(match[1]);
          }
        }
        return undefined;
      });
    } catch {
      return undefined;
    }
  }

  private extractPropertyType(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('nhà trọ') || text.includes('phòng trọ')) return 'Nhà trọ, phòng trọ';
    if (text.includes('ktx') || text.includes('ký túc xá')) return 'Ký túc xá';
    if (text.includes('chung cư')) return 'Chung cư';
    if (text.includes('nhà nguyên căn')) return 'Nhà nguyên căn';
    if (text.includes('văn phòng')) return 'Văn phòng';
    
    return 'Cho thuê nhà trọ, phòng trọ';
  }

  private extractRoomCapacity(description: string): number | undefined {
    const match = description.match(/(\d+)\s*giường/);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractNearbyLandmarks(description: string): string[] {
    const landmarks: string[] = [];
    const landmarkKeywords = ['đại học', 'trường', 'bệnh viện', 'chợ', 'siêu thị', 'công viên'];
    
    landmarkKeywords.forEach(keyword => {
      const regex = new RegExp(`(gần|cách)?\\s*([^.]*${keyword}[^.]*?)[\\.\\n]`, 'gi');
      let match;
      while ((match = regex.exec(description)) !== null) {
        landmarks.push(match[2].trim());
      }
    });

    return landmarks;
  }

  private extractTransportationInfo(description: string): string[] {
    const transport: string[] = [];
    const transportKeywords = ['xe buýt', 'metro', 'tàu điện', 'giao thông'];
    
    transportKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        transport.push(`Thuận tiện ${keyword}`);
      }
    });

    return transport;
  }

  private extractTargetAudience(description: string): string | undefined {
    if (description.toLowerCase().includes('sinh viên')) return 'Sinh viên';
    if (description.toLowerCase().includes('công nhân')) return 'Công nhân';
    if (description.toLowerCase().includes('gia đình')) return 'Gia đình';
    return undefined;
  }

  private generatePropertyId(url: string, title: string): string {
    return ScraperUtils.generateId(url, title);
  }
}
