-- CreateTable
CREATE TABLE `scraped_properties` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(50) NOT NULL,
    `zip_code` VARCHAR(20) NOT NULL,
    `country` VARCHAR(2) NOT NULL,
    `property_type` VARCHAR(50) NULL,
    `bedrooms` INTEGER NULL,
    `bathrooms` DOUBLE NULL,
    `square_feet` INTEGER NULL,
    `price` DOUBLE NULL,
    `currency` VARCHAR(3) NOT NULL,
    `price_type` VARCHAR(20) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `source_url` VARCHAR(255) NOT NULL,
    `source_name` VARCHAR(100) NOT NULL,
    `source_id` VARCHAR(100) NULL,
    `scraped_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `scraped_properties_source_url_key`(`source_url`),
    INDEX `scraped_properties_city_state_zip_code_idx`(`city`, `state`, `zip_code`),
    INDEX `scraped_properties_property_type_idx`(`property_type`),
    INDEX `scraped_properties_price_idx`(`price`),
    INDEX `scraped_properties_scraped_at_idx`(`scraped_at`),
    INDEX `scraped_properties_source_name_idx`(`source_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scraped_property_images` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `url` VARCHAR(255) NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `caption` VARCHAR(255) NULL,
    `order` INTEGER NOT NULL,
    `property_id` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `scraped_property_images_property_id_key`(`property_id`),
    INDEX `scraped_property_images_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scraping_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `source` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `config` JSON NULL,
    `items_found` INTEGER NOT NULL DEFAULT 0,
    `items_processed` INTEGER NOT NULL DEFAULT 0,
    `errors` JSON NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `duration` INTEGER NULL,

    INDEX `scraping_jobs_status_idx`(`status`),
    INDEX `scraping_jobs_source_idx`(`source`),
    INDEX `scraping_jobs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scraping_logs` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `level` VARCHAR(10) NOT NULL,
    `message` TEXT NOT NULL,
    `source` VARCHAR(100) NOT NULL,
    `metadata` JSON NULL,

    INDEX `scraping_logs_level_idx`(`level`),
    INDEX `scraping_logs_source_idx`(`source`),
    INDEX `scraping_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scraping_metrics` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `source` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `total_requests` INTEGER NOT NULL DEFAULT 0,
    `successful_requests` INTEGER NOT NULL DEFAULT 0,
    `failed_requests` INTEGER NOT NULL DEFAULT 0,
    `average_response_time` DOUBLE NULL,
    `properties_scraped` INTEGER NOT NULL DEFAULT 0,
    `duplicates_found` INTEGER NOT NULL DEFAULT 0,

    INDEX `scraping_metrics_source_idx`(`source`),
    INDEX `scraping_metrics_date_idx`(`date`),
    UNIQUE INDEX `scraping_metrics_source_date_key`(`source`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `scraped_property_images` ADD CONSTRAINT `scraped_property_images_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `scraped_properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
