/*
  Warnings:

  - You are about to drop the `navigation-group` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `navigation_group_navigation` DROP FOREIGN KEY `navigation_group_navigation_group_id_fkey`;

-- DropIndex
DROP INDEX `navigation_group_navigation_group_id_fkey` ON `navigation_group_navigation`;

-- DropTable
DROP TABLE `navigation-group`;

-- CreateTable
CREATE TABLE `navigation_group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `status` INTEGER NULL DEFAULT 0,
    `is_deleted` BOOLEAN NULL DEFAULT false,
    `created_time` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `deleted_time` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `navigation_group_navigation` ADD CONSTRAINT `navigation_group_navigation_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `navigation_group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
