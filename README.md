# SmartRent Scraper

A robust, production-ready web scraping service built with TypeScript, Puppeteer, and modern architecture patterns for collecting real estate and rental property data.

## 🚀 Features

- **Modern Architecture**: Clean separation with DTOs, Services, and Interfaces
- **Multiple Export Formats**: JSON, CSV, and MySQL database export
- **Interface-Based Design**: Extensible exporter and scraper interfaces
- **Data Validation**: Built-in DTO validation with comprehensive error handling
- **Rate Limiting**: Intelligent request throttling and retry logic
- **Database Integration**: MySQL with Prisma ORM and migrations
- **Comprehensive Logging**: Structured logging with job and event tracking
- **Configuration Management**: Environment-based configuration
- **TypeScript**: Full type safety throughout the application

## 📁 Project Structure

```
src/
├── config/                 # Configuration management
├── dto/                    # Data Transfer Objects with validation
│   ├── property/           # Property-related DTOs
│   ├── scraping/           # Scraping operation DTOs
│   └── common/             # Shared configuration DTOs
├── modules/                # Core business logic modules
│   ├── scrapers/           # Web scraping implementations
│   ├── exporters/          # Data export implementations
│   │   └── impl/           # Concrete exporter implementations
│   └── database/           # Database utilities and connection
├── service/                # Business logic services
├── utils/                  # Utility functions
└── main.ts                 # Application entry point

prisma/
├── schema.prisma           # Main Prisma schema (MySQL)
├── models/                 # Organized model definitions
│   ├── property.prisma     # Property models
│   └── scraping.prisma     # Scraping models
└── migrations/             # Database migrations (tracked in git)

scripts/
└── seed.ts                 # Database seeding script
```

## ⚡ Quick Start

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run db:generate

# Set up database
npm run db:push

# Seed database with sample data
npm run db:seed

# Build the project
npm run build

# Run the scraper
npm start
```

### Development

```bash
# Run in development mode
npm run dev

# Run with file watching
npm run dev:watch

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔧 Configuration

Configure the application through environment variables in `.env`:

```bash
# =============================================================================
# Application Environment
# =============================================================================
NODE_ENV=development
LOG_LEVEL=info

# =============================================================================
# Database Configuration
# =============================================================================
DATABASE_URL="mysql://username:password@localhost:3306/smartrent_scraper"

# =============================================================================
# Scraping Configuration
# =============================================================================
MAX_CONCURRENT_SCRAPERS=5
REQUEST_DELAY_MS=1000
RETRY_ATTEMPTS=3
TIMEOUT_MS=30000
HEADLESS=true
BROWSER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage

# =============================================================================
# Rate Limiting Configuration
# =============================================================================
RATE_LIMIT_REQUESTS_PER_MINUTE=60
BURST_LIMIT=10

# =============================================================================
# Export Configuration
# =============================================================================
EXPORT_FORMAT=json,csv,database  # or "all"
DATA_OUTPUT_DIR=./data
LOG_OUTPUT_DIR=./logs

# =============================================================================
# Proxy Configuration (Optional)
# =============================================================================
# PROXY_URL=http://proxy.example.com:8080
# PROXY_USERNAME=your_proxy_username
# PROXY_PASSWORD=your_proxy_password
```

## 🏗️ Architecture Overview

### Data Transfer Objects (DTOs)

DTOs provide structured data validation and type safety:

```typescript
import { PropertyDto, ContactInfoDto } from './dto';

const property = new PropertyDto({
  title: 'Modern Apartment',
  price: 3000,
  address: '123 Main St, San Francisco, CA',
  bedrooms: 2,
  bathrooms: 2,
  propertyType: 'apartment',
  source: 'example-site',
  sourceUrl: 'https://example.com/property/123'
});

// Validate data
const validation = property.validate();
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### Interface-Based Exporters

All exporters implement common interfaces for consistency:

```typescript
import { ExporterFactory } from './modules';

// Create exporters from configuration
const exporters = ExporterFactory.createFromConfig();

// Export using all configured exporters
for (const exporter of exporters) {
  const results = await exporter.exportProperties(properties);
  console.log(`${exporter.getExporterType()}: ${results.length} exported`);
}
```

### Service Layer

Business logic is encapsulated in services:

```typescript
import { ScrapingOrchestratorService } from './service';

const orchestrator = new ScrapingOrchestratorService();
await orchestrator.initialize();
await orchestrator.scrapeProperties([
  'https://example.com/listings',
  'https://example.com/property/123'
]);
await orchestrator.cleanup();
```

## 📊 Database Schema

The application uses MySQL with the following main entities:

### Properties
- **properties**: Main property data with location, pricing, and metadata
- **property_images**: Associated images for properties

### Scraping Operations
- **scraping_jobs**: Track scraping job execution and results
- **scraping_logs**: Store scraping logs and events
- **scraping_metrics**: Daily performance and data metrics

All database fields use snake_case naming while the application uses camelCase.

## 💾 Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Reset database
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## 🔄 Export Formats

### JSON Export
```typescript
import { JsonExporter } from './modules';

const jsonExporter = new JsonExporter();
const filePath = await jsonExporter.exportToFile(properties);
```

### CSV Export
```typescript
import { CsvExporter } from './modules';

const csvExporter = new CsvExporter();
const filePath = await csvExporter.exportToFile(properties);
```

### Database Export
```typescript
import { DatabaseExporter } from './modules';

const dbExporter = new DatabaseExporter();
const propertyIds = await dbExporter.exportProperties(properties);

// Log scraping job
const jobId = await dbExporter.logScrapingJob(
  'daily-scrape',
  'example-site',
  'completed',
  { maxPages: 10 },
  { itemsFound: 50, itemsProcessed: 48, duration: 120 }
);
```

## 🕷️ Creating Custom Scrapers

Extend the `BaseScraper` class to create custom scrapers:

```typescript
import { BaseScraper } from './modules';
import { PropertyDto } from './dto';

class CustomScraper extends BaseScraper {
  constructor() {
    super('Custom');
  }

  async scrapeProperty(url: string): Promise<PropertyDto | null> {
    const page = await this.createPage(this.browser!);
    
    try {
      await page.goto(url);
      
      // Extract property data
      const title = await page.$eval('h1', el => el.textContent?.trim() || '');
      const price = this.extractPrice(await page.$eval('.price', el => el.textContent || ''));
      const address = await page.$eval('.address', el => el.textContent?.trim() || '');
      
      return new PropertyDto({
        id: this.generateId(url, title),
        title,
        price,
        address,
        source: 'custom-site',
        sourceUrl: url,
        scrapedAt: new Date()
      });
    } finally {
      await page.close();
    }
  }

  async scrapePropertyList(url: string): Promise<PropertyDto[]> {
    // Implement list scraping logic
    return [];
  }
}
```

## 📝 Data Validation

All DTOs include comprehensive validation:

```typescript
const property = new PropertyDto(data);
const { isValid, errors } = property.validate();

if (!isValid) {
  console.error('Validation failed:', errors);
  // Handle validation errors
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- example.test.ts

# Run tests in watch mode
npm run test:watch
```

## 📋 Available Scripts

```bash
# Development
npm run dev              # Run in development mode
npm run dev:watch        # Run with file watching

# Building
npm run build            # Build for production
npm run clean            # Clean build directory

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Create and run migrations
npm run db:reset         # Reset database
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Run seed script

# Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm test                 # Run tests
```

## 🔍 Logging

Structured logging with multiple levels:

- **Console**: Colored output in development
- **Files**: `./logs/combined.log` and `./logs/error.log`
- **Database**: Scraping events stored in `scraping_logs` table

```typescript
import { Logger } from './utils';

const logger = new Logger('MyComponent');
logger.info('Operation completed');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

## 📈 Monitoring

The application includes comprehensive monitoring:

### Database Statistics
```typescript
import { DatabaseExporter } from './modules';

const dbExporter = new DatabaseExporter();
const stats = await dbExporter.getExportStatistics();
console.log(`Total properties: ${stats.totalProperties}`);
```

### Job Tracking
- Scraping jobs with status, timing, and results
- Error tracking and retry logic
- Performance metrics collection

### Data Cleanup
```typescript
// Clean up old data (default: 30 days)
const cleanup = await dbExporter.cleanupOldData(30);
console.log(`Cleaned up ${cleanup.deletedProperties} properties`);
```

## 🛡️ Best Practices

1. **Rate Limiting**: Always respect website rate limits and robots.txt
2. **Error Handling**: Implement comprehensive retry logic with exponential backoff
3. **Data Validation**: Use DTO validation before processing or storing data
4. **Resource Management**: Always clean up browser instances and database connections
5. **Legal Compliance**: Ensure compliance with website terms of service and applicable laws
6. **Performance**: Use concurrent scraping with appropriate limits
7. **Monitoring**: Log all operations for debugging and monitoring

## 🔧 Extending the Application

### Adding New Exporters

1. Implement the `IExporter` interface:
```typescript
export class XmlExporter implements IFileExporter {
  async exportProperties(properties: PropertyDto[]): Promise<string[]> {
    // Implementation
  }
  
  getExporterType(): string {
    return 'XML';
  }
}
```

2. Add to the factory:
```typescript
// In exporter-factory.ts
case 'xml':
  return new XmlExporter();
```

### Adding New Scrapers

1. Extend `BaseScraper`
2. Implement required abstract methods
3. Add to scraper factory or use directly

### Adding New DTOs

1. Create DTO class with validation
2. Add factory methods for common operations
3. Include serialization methods
4. Add comprehensive tests

## 🚨 Troubleshooting

### Common Issues

1. **Browser Launch Fails**
   - Check `BROWSER_ARGS` in environment
   - Ensure system has required dependencies
   - Try running in non-headless mode for debugging

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Ensure MySQL server is running
   - Check database permissions

3. **Rate Limiting**
   - Adjust `RATE_LIMIT_REQUESTS_PER_MINUTE`
   - Increase `REQUEST_DELAY_MS`
   - Monitor target website's rate limiting

4. **Memory Issues**
   - Reduce `MAX_CONCURRENT_SCRAPERS`
   - Implement page cleanup in scrapers
   - Monitor memory usage

## 📄 License

ISC

## 🤝 Contributing

1. Follow TypeScript and ESLint best practices
2. Add comprehensive tests for new features
3. Update documentation for changes
4. Ensure all tests pass and code is properly linted
5. Use conventional commit messages

---

Built with ❤️ using TypeScript, Puppeteer, Prisma, and modern development practices.