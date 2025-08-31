/*
  Warnings:

  - You are about to drop the column `price_type` on the `scraped_properties` table. All the data in the column will be lost.
  - You are about to drop the column `source_id` on the `scraped_properties` table. All the data in the column will be lost.
  - You are about to drop the column `source_name` on the `scraped_properties` table. All the data in the column will be lost.
  - You are about to drop the column `square_feet` on the `scraped_properties` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `scraped_properties` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `scraped_properties` table. All the data in the column will be lost.
  - You are about to drop the `scraped_property_images` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amenities` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `area` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `features` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `images` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listing_id` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listing_type` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `post_date` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ward` to the `scraped_properties` table without a default value. This is not possible if the table is not empty.
  - Made the column `property_type` on table `scraped_properties` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `scraped_property_images` DROP FOREIGN KEY `scraped_property_images_property_id_fkey`;

-- DropIndex
DROP INDEX `scraped_properties_city_state_zip_code_idx` ON `scraped_properties`;

-- DropIndex
DROP INDEX `scraped_properties_source_name_idx` ON `scraped_properties`;

-- AlterTable
ALTER TABLE `scraped_properties` DROP COLUMN `price_type`,
    DROP COLUMN `source_id`,
    DROP COLUMN `source_name`,
    DROP COLUMN `square_feet`,
    DROP COLUMN `state`,
    DROP COLUMN `zip_code`,
    ADD COLUMN `air_conditioned_room_price` DOUBLE NULL,
    ADD COLUMN `amenities` TEXT NOT NULL,
    ADD COLUMN `area` DOUBLE NOT NULL,
    ADD COLUMN `category_id` INTEGER NULL,
    ADD COLUMN `city_code` VARCHAR(10) NULL,
    ADD COLUMN `deposit` DOUBLE NULL,
    ADD COLUMN `direction` VARCHAR(50) NULL,
    ADD COLUMN `district` VARCHAR(100) NOT NULL,
    ADD COLUMN `district_id` INTEGER NULL,
    ADD COLUMN `electricity_allowance_ac` DOUBLE NULL,
    ADD COLUMN `electricity_allowance_fan` DOUBLE NULL,
    ADD COLUMN `electricity_rate` DOUBLE NULL,
    ADD COLUMN `expired` BOOLEAN NULL,
    ADD COLUMN `expiry_date` DATETIME(3) NULL,
    ADD COLUMN `features` TEXT NOT NULL,
    ADD COLUMN `furnishing` VARCHAR(100) NULL,
    ADD COLUMN `images` TEXT NOT NULL,
    ADD COLUMN `listing_id` VARCHAR(100) NOT NULL,
    ADD COLUMN `listing_type` VARCHAR(100) NOT NULL,
    ADD COLUMN `nearby_landmarks` TEXT NULL,
    ADD COLUMN `parking_motorcycle_fee` DOUBLE NULL,
    ADD COLUMN `parking_scooter_fee` DOUBLE NULL,
    ADD COLUMN `post_date` DATETIME(3) NOT NULL,
    ADD COLUMN `price_per_person` DOUBLE NULL,
    ADD COLUMN `price_unit` VARCHAR(50) NULL,
    ADD COLUMN `product_type` INTEGER NULL,
    ADD COLUMN `regular_room_price` DOUBLE NULL,
    ADD COLUMN `room_capacity` INTEGER NULL,
    ADD COLUMN `source` VARCHAR(100) NOT NULL,
    ADD COLUMN `street` VARCHAR(200) NOT NULL,
    ADD COLUMN `street_id` INTEGER NULL,
    ADD COLUMN `target_audience` VARCHAR(200) NULL,
    ADD COLUMN `transportation_info` TEXT NULL,
    ADD COLUMN `user_id` VARCHAR(100) NOT NULL,
    ADD COLUMN `verified` BOOLEAN NULL,
    ADD COLUMN `videos` TEXT NULL,
    ADD COLUMN `vip_type` INTEGER NULL,
    ADD COLUMN `virtual_tour` VARCHAR(500) NULL,
    ADD COLUMN `ward` VARCHAR(100) NOT NULL,
    ADD COLUMN `ward_id` INTEGER NULL,
    MODIFY `title` VARCHAR(500) NOT NULL,
    MODIFY `address` VARCHAR(500) NOT NULL,
    MODIFY `country` VARCHAR(100) NOT NULL,
    MODIFY `property_type` VARCHAR(100) NOT NULL,
    MODIFY `bathrooms` INTEGER NULL,
    MODIFY `currency` VARCHAR(10) NOT NULL,
    MODIFY `source_url` VARCHAR(500) NOT NULL,
    ALTER COLUMN `scraped_at` DROP DEFAULT;

-- DropTable
DROP TABLE `scraped_property_images`;

-- CreateIndex
CREATE INDEX `scraped_properties_city_district_ward_idx` ON `scraped_properties`(`city`, `district`, `ward`);

-- CreateIndex
CREATE INDEX `scraped_properties_area_idx` ON `scraped_properties`(`area`);

-- CreateIndex
CREATE INDEX `scraped_properties_source_idx` ON `scraped_properties`(`source`);

-- CreateIndex
CREATE INDEX `scraped_properties_listing_id_idx` ON `scraped_properties`(`listing_id`);

-- CreateIndex
CREATE INDEX `scraped_properties_post_date_idx` ON `scraped_properties`(`post_date`);
