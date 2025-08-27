/*
  Warnings:

  - You are about to drop the `Navigation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NavigationGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `Navigation`;

-- DropTable
DROP TABLE `NavigationGroup`;

-- CreateTable
CREATE TABLE `navigation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `group_id` INTEGER NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `status` INTEGER NULL DEFAULT 0,
    `is_deleted` BOOLEAN NULL DEFAULT false,
    `created_time` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `deleted_time` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
