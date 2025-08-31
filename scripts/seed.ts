import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample scraping job
  const sampleJob = await prisma.scrapingJobs.create({
    data: {
      source: 'system',
      status: 'completed',
      config: {
        description: 'Initial database setup and verification',
        version: '1.0.0',
      },
      itemsFound: 0,
      itemsProcessed: 0,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 1,
    },
  });

  console.log('✅ Created sample scraping job:', sampleJob.id);

  // Create sample property
  const sampleProperty = await prisma.scrapedProperties.create({
    data: {
      title: 'Sample Downtown Apartment',
      description: 'Beautiful 2-bedroom apartment in the heart of downtown',
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 2.0,
      squareFeet: 1200,
      price: 3500.00,
      currency: 'USD',
      priceType: 'rent',
      latitude: 37.7749,
      longitude: -122.4194,
      sourceUrl: 'https://example.com/property/123',
      sourceName: 'example-site',
      sourceId: 'prop-123',
      scrapedAt: new Date(),
      isActive: true,
      country: 'USA',
      images: {
        create: [
          {
            url: 'https://example.com/images/property-1.jpg',
            altText: 'Living room view',
            order: 1,
          },
          {
            url: 'https://example.com/images/property-2.jpg',
            altText: 'Kitchen view',
            order: 2,
          },
        ],
      },
    },
    include: {
      images: true,
    },
  });

  console.log('✅ Created sample property:', sampleProperty.id);

  // Create sample log entry
  const sampleLog = await prisma.scrapingLogs.create({
    data: {
      level: 'info',
      message: 'Database seeded successfully with sample data',
      source: 'seed-script',
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        propertiesCreated: 1,
        jobsCreated: 1,
      },
    },
  });

  console.log('✅ Created sample log entry:', sampleLog.id);

  // Create sample metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  const sampleMetrics = await prisma.scrapingMetrics.create({
    data: {
      source: 'example-site',
      date: today,
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
      averageResponseTime: 250.5,
      propertiesScraped: 50,
      duplicatesFound: 5,
    },
  });

  console.log('✅ Created sample metrics:', sampleMetrics.id);

  console.log('🎉 Database seed completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Properties: 1`);
  console.log(`   - Property Images: 2`);
  console.log(`   - Scraping Jobs: 1`);
  console.log(`   - Scraping Logs: 1`);
  console.log(`   - Scraping Metrics: 1`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
